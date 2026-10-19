/**
 * Pipeline de dados de jogo: Lunaris → JSON tipado e validado em src/data/generated/.
 *
 * Uso:
 *   npm run sync:data                       # usa a versão mais recente e o cache em data/raw/lunaris
 *   npm run sync:data -- --refresh          # ignora o cache e volta a pedir tudo
 *   npm run sync:data -- --version=7.1.53   # fixa uma versão
 *
 * Falha (exit 1) se algum dado não passar na validação Zod. Linhas de talento de dano que o parser
 * não reconhece NÃO derrubam o sync: são listadas no relatório final para revisão.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import {
  ArtifactSetSchema,
  CharacterSchema,
  ElementSchema,
  MoveSchema,
  SyncMetaSchema,
  TALENT_LEVELS,
  WeaponSchema,
  type ArtifactSet,
  type Character,
  type Move,
  type Scale,
  type Talent,
  type Weapon,
} from '../src/data/schema';
import { fetchJson, fetchVersion, mapLimit, type FetchOptions } from './lib/lunaris';
import {
  hitTypeFor,
  isDamageLabel,
  isNonDamageLabel,
  normalizeStat,
  parseDamageValue,
  parsePlainNumber,
  parseSeconds,
  type ParsedValue,
} from './lib/parse';

// ---------- Tipos dos dados brutos (só o que usamos) ----------

type AscensionStats = Record<string, number>;
interface RawCharListEntry {
  enName: string;
  ptName: string;
  element: string;
  weaponType: string;
  qualityType: string;
  CardImg?: string;
  GachaImg?: string;
  ascensionStats: AscensionStats;
}
interface RawWeaponListEntry {
  enName: string;
  ptName: string;
  weaponIcon?: string;
  weaponType: string;
  qualityType: string;
  ascensionStats: AscensionStats;
}
interface RawArtifactListEntry {
  enName: string;
  ptName: string;
  qualityType: string;
}
interface RawSkill {
  name?: string;
  multipliers?: Record<string, string[]>;
}
interface RawCharDetail {
  skills: { normalattack?: RawSkill; elementalskill?: RawSkill; elementalburst?: RawSkill };
  constellations?: Record<string, { name?: string; description?: string }>;
  energy?: { source: string; particles: string; chance: string; cd: string }[];
}
interface RawWeaponDetail {
  passive?: { name: string; refinements: Record<string, { description: string; params?: number[] }> };
}
interface RawArtifactDetail {
  info: { setBonuses?: Record<string, { description: string; params?: number[] }> };
}

// ---------- Utilidades ----------

const LANG = 'en';
const CONCURRENCY = 3;
const OUT_DIR = path.resolve('src/data/generated');

const WEAPON_TYPES: Record<string, Weapon['type']> = {
  WEAPON_SWORD_ONE_HAND: 'Sword',
  WEAPON_CLAYMORE: 'Claymore',
  WEAPON_POLE: 'Polearm',
  WEAPON_CATALYST: 'Catalyst',
  WEAPON_BOW: 'Bow',
};
const QUALITY: Record<string, number> = {
  QUALITY_ORANGE: 5, QUALITY_ORANGE_SP: 5, QUALITY_PURPLE: 4, QUALITY_BLUE: 3, QUALITY_GREEN: 2, QUALITY_WHITE: 1,
};
const TALENTS: [keyof RawCharDetail['skills'], Talent][] = [
  ['normalattack', 'normal'],
  ['elementalskill', 'skill'],
  ['elementalburst', 'burst'],
];

/** Entradas do charlist que não são personagens jogáveis (manequins de teste do jogo). */
const NOT_PLAYABLE = new Set(['Manekin', 'Manekina']);

/** O Viajante aparece por gênero e elemento sob o mesmo nome; distingue pelo ícone (PlayerBoy = Aether). */
function displayName(entry: RawCharListEntry): string {
  if (entry.enName !== 'Traveler') return entry.enName;
  const who = /PlayerBoy/i.test(entry.CardImg ?? '') ? 'Aether' : /PlayerGirl/i.test(entry.CardImg ?? '') ? 'Lumine' : 'Traveler';
  return `${who} (${entry.element})`;
}

const round = (n: number) => Math.round(n * 1e8) / 1e8;

/** Separa o stat secundário (qualquer chave que não seja hp/atk/def) dos stats base. */
function splitAscension(stats: AscensionStats) {
  const { hp, atk, def, ...rest } = stats;
  const [key, value] = Object.entries(rest)[0] ?? [];
  // Alguns personagens recentes trazem o valor como texto ("315"); converte e recusa o que não for numérico.
  const numeric = key !== undefined ? Number(value) : NaN;
  if (key !== undefined && !Number.isFinite(numeric)) throw new Error(`Valor de ascensão inválido: ${key}=${JSON.stringify(value)}`);
  const ascension = key !== undefined ? normalizeStat(key, numeric) : null;
  if (key !== undefined && !ascension) throw new Error(`Stat de ascensão desconhecido: "${key}"`);
  return { hp, atk, def, ascension };
}

/** Um JSON por linha dentro do array: diffs pequenos e arquivos compactos. */
function toJsonLines(items: unknown[]): string {
  return '[\n' + items.map((i) => '  ' + JSON.stringify(i)).join(',\n') + '\n]\n';
}

// ---------- Golpes ----------

interface Unparsed {
  character: string;
  talent: Talent;
  label: string;
  sample: string;
}

function buildMoves(char: Character, detail: RawCharDetail, detailPt: RawCharDetail | null, unparsed: Unparsed[], candidates: Unparsed[]): Move[] {
  const moves: Move[] = [];
  const seen = new Set<string>();

  for (const [skillKey, talent] of TALENTS) {
    const mult = detail.skills[skillKey]?.multipliers ?? {};
    // Os rótulos em português vêm na MESMA ordem dos em inglês; só usados se as listas têm o mesmo tamanho.
    const ptKeys = Object.keys(detailPt?.skills[skillKey]?.multipliers ?? {});
    const ptAligned = ptKeys.length === Object.keys(mult).length;
    for (const [label, levels] of Object.entries(mult)) {
      const labelPt = ptAligned ? ptKeys[Object.keys(mult).indexOf(label)] : undefined;
      const record = { character: char.name, talent, label, sample: String(levels[0]) };

      if (!isDamageLabel(label)) {
        // Linhas que parecem dano mas o rótulo não diz "DMG": só para revisão manual.
        if (/%/.test(record.sample) && !isNonDamageLabel(label) && parseDamageValue(record.sample)) candidates.push(record);
        continue;
      }

      const parsed: (ParsedValue | null)[] = levels.map(parseDamageValue);
      const first = parsed[0];
      const consistent =
        levels.length === TALENT_LEVELS &&
        first !== null &&
        parsed.every(
          (p) =>
            p !== null &&
            p.variants.length === first.variants.length &&
            p.variants.every((v, i) => v.hits === first.variants[i].hits),
        );
      if (!consistent || !first) {
        unparsed.push(record);
        continue;
      }

      const variants = first.variants.length;
      for (let v = 0; v < variants; v++) {
        const scale: Scale = {};
        for (const stat of ['atk', 'hp', 'def', 'em', 'flat'] as const) {
          const arr = parsed.map((p) => round(p!.variants[v].scale[stat]));
          if (arr.some((x) => x !== 0)) scale[stat] = arr;
        }
        let id = `${char.id}:${talent}:${label}${variants > 1 ? `#${v}` : ''}`;
        for (let n = 2; seen.has(id); n++) id = `${char.id}:${talent}:${label}${variants > 1 ? `#${v}` : ''}~${n}`;
        seen.add(id);

        moves.push({
          id,
          characterId: char.id,
          character: char.name,
          talent,
          hitType: hitTypeFor(label, talent),
          label,
          ...(labelPt ? { labelPt } : {}),
          variant: v,
          variants,
          hits: first.variants[v].hits,
          ...(first.qualifier ? { qualifier: first.qualifier } : {}),
          scale,
        });
      }
    }
  }
  return moves;
}

/**
 * C3 e C5 aumentam em 3 o nível de um talento. O texto diz qual de dois jeitos: pelo NOME do talento ("Increases the
 * Level of Kamisato Art: Soumetsu by 3") ou pelo TIPO ("Increases the Level of the Elemental Skill X by 3",
 * "Elemental Burst X increases by 3 Levels"). Tenta o nome e, se não casar, o tipo.
 */
function constellationBoosts(detail: RawCharDetail): { c3: Talent | null; c5: Talent | null } {
  const strip = (t: string) =>
    t
      .replace(/<[^>]*>/g, '')
      .replace(/\{\/?LINK[^}]*\}/g, '')
      .replace(/^\s*(normal attack|elemental skill|elemental burst):?\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  const talentOf = (name: string): Talent | null => {
    for (const [key, talent] of TALENTS) {
      const skillName = (detail.skills[key] as { name?: string } | undefined)?.name;
      if (skillName && strip(skillName) === name) return talent;
    }
    return null;
  };
  const byKind = (description: string): Talent | null => {
    const text = description.replace(/<[^>]*>/g, '').replace(/\{\/?LINK[^}]*\}/g, '').replace(/\s+/g, ' ');
    if (!/\bLevels?\b/i.test(text) || !/\bby 3\b/i.test(text)) return null;
    const m = /(Normal Attack|Elemental Skill|Elemental Burst)/i.exec(text);
    if (!m) return null;
    const kind = m[1].toLowerCase();
    return kind === 'normal attack' ? 'normal' : kind === 'elemental skill' ? 'skill' : 'burst';
  };
  const of = (key: string): Talent | null => {
    const description = detail.constellations?.[key]?.description ?? '';
    const m = description.match(/Increases? the Level of (.*?) by 3/i);
    return (m ? talentOf(strip(m[1])) : null) ?? byKind(description);
  };
  return { c3: of('const3'), c5: of('const5') };
}

function burstInfo(detail: RawCharDetail) {
  const m = detail.skills.elementalburst?.multipliers ?? {};
  return {
    energyCost: m['Energy Cost'] ? parsePlainNumber(m['Energy Cost'][0]) : null,
    cooldown: m['CD'] ? parseSeconds(m['CD'][0]) : null,
  };
}

// ---------- Main ----------

async function main() {
  const args = process.argv.slice(2);
  const refresh = args.includes('--refresh');
  const versionArg = args.find((a) => a.startsWith('--version='))?.split('=')[1];

  const opts: FetchOptions = { cacheDir: path.resolve('data/raw/lunaris'), refresh };
  const meta = await fetchVersion({ cacheDir: opts.cacheDir });
  const version = versionArg ?? meta.version;
  console.log(`Lunaris ${version} (última publicada: ${meta.version})`);

  const [charList, weaponList, artifactList] = await Promise.all([
    fetchJson<Record<string, RawCharListEntry>>(`${version}/charlist.json`, opts),
    fetchJson<Record<string, RawWeaponListEntry>>(`${version}/weaponlist.json`, opts),
    fetchJson<Record<string, RawArtifactListEntry>>(`${version}/artifactlist.json`, opts),
  ]);

  const warnings: string[] = [];
  let done = 0;
  const total = Object.keys(charList).length + Object.keys(weaponList).length + Object.keys(artifactList).length;
  const tick = () => {
    done++;
    if (done % 100 === 0 || done === total) console.log(`  baixados/lidos ${done}/${total}`);
  };

  // --- Personagens + golpes ---
  const unparsed: Unparsed[] = [];
  const candidates: Unparsed[] = [];
  const characters: Character[] = [];
  const moves: Move[] = [];

  const charIds = Object.keys(charList).sort((a, b) => Number(a) - Number(b));
  const charDetails = await mapLimit(charIds, CONCURRENCY, async (id) => {
    try {
      return await fetchJson<RawCharDetail>(`${version}/${LANG}/char/${id}.json`, opts);
    } catch {
      return null;
    } finally {
      tick();
    }
  });

  const charDetailsPt = await mapLimit(charIds, CONCURRENCY, async (id) => {
    try {
      return await fetchJson<RawCharDetail>(`${version}/pt/char/${id}.json`, opts);
    } catch {
      return null;
    }
  });

  charIds.forEach((id, i) => {
    const entry = charList[id];
    const detail = charDetails[i];
    const parsedElement = ElementSchema.safeParse(entry.element);
    if (NOT_PLAYABLE.has(entry.enName)) {
      warnings.push(`Ignorado (não jogável): ${entry.enName} (${id})`);
      return;
    }
    if (!detail || !parsedElement.success) {
      warnings.push(`Personagem ignorado: ${entry.enName} (${id}) — ${!detail ? 'sem detalhe' : `elemento "${entry.element}"`}`);
      return;
    }
    const { hp, atk, def, ascension } = splitAscension(entry.ascensionStats);
    const char = CharacterSchema.parse({
      id,
      name: displayName(entry),
      namePt: entry.enName === 'Traveler' ? displayName(entry) : entry.ptName,
      element: parsedElement.data,
      weapon: WEAPON_TYPES[entry.weaponType],
      rarity: QUALITY[entry.qualityType],
      icon: entry.CardImg || undefined,
      splash: entry.GachaImg || undefined,
      baseHp: hp,
      baseAtk: atk,
      baseDef: def,
      ascension,
      burst: burstInfo(detail),
      constellationBoosts: constellationBoosts(detail),
      particles: (detail.energy ?? []).map((e) => ({
        source: e.source,
        particles: e.particles,
        chance: e.chance,
        cooldown: e.cd,
      })),
    });
    characters.push(char);
    moves.push(...buildMoves(char, detail, charDetailsPt[i], unparsed, candidates));
  });

  // --- Armas ---
  const weaponIds = Object.keys(weaponList).sort((a, b) => Number(a) - Number(b));
  const weaponDetails = await mapLimit(weaponIds, CONCURRENCY, async (id) => {
    try {
      return await fetchJson<RawWeaponDetail>(`${version}/${LANG}/weapon/${id}.json`, opts);
    } catch {
      return null;
    } finally {
      tick();
    }
  });
  const weaponDetailsPt = await mapLimit(weaponIds, CONCURRENCY, async (id) => {
    try {
      return await fetchJson<RawWeaponDetail>(`${version}/pt/weapon/${id}.json`, opts);
    } catch {
      return null;
    }
  });
  const weapons: Weapon[] = weaponIds.flatMap((id, i) => {
    const e = weaponList[id];
    const detail = weaponDetails[i];
    const pt = weaponDetailsPt[i]?.passive;
    if (!detail) {
      warnings.push(`Arma ignorada (sem detalhe): ${e.enName} (${id})`);
      return [];
    }
    const { atk, ascension } = splitAscension({ hp: 0, def: 0, ...e.ascensionStats });
    const p = detail.passive;
    return [
      WeaponSchema.parse({
        id: Number(id),
        name: e.enName,
        namePt: e.ptName,
        type: WEAPON_TYPES[e.weaponType],
        rarity: QUALITY[e.qualityType],
        baseAtk: atk,
        substat: ascension,
        ...(e.weaponIcon ? { icon: e.weaponIcon } : {}),
        passive:
          p && Object.keys(p.refinements).length === 5
            ? {
                name: p.name,
                ...(pt?.name ? { namePt: pt.name } : {}),
                refinements: ['1', '2', '3', '4', '5'].map((r) => ({
                  description: p.refinements[r].description,
                  ...(pt?.refinements?.[r]?.description ? { descriptionPt: pt.refinements[r].description } : {}),
                  params: p.refinements[r].params ?? [],
                })),
              }
            : null,
      }),
    ];
  });

  // --- Sets de artefatos ---
  const setIds = Object.keys(artifactList).sort((a, b) => Number(a) - Number(b));
  const setDetails = await mapLimit(setIds, CONCURRENCY, async (id) => {
    try {
      return await fetchJson<RawArtifactDetail>(`${version}/${LANG}/artifact/${id}.json`, opts);
    } catch {
      return null;
    } finally {
      tick();
    }
  });
  const setDetailsPt = await mapLimit(setIds, CONCURRENCY, async (id) => {
    try {
      return await fetchJson<RawArtifactDetail>(`${version}/pt/artifact/${id}.json`, opts);
    } catch {
      return null;
    }
  });
  const artifactSets: ArtifactSet[] = setIds.flatMap((id, i) => {
    const e = artifactList[id];
    const b = setDetails[i]?.info.setBonuses;
    const bPt = setDetailsPt[i]?.info.setBonuses;
    if (!b) {
      warnings.push(`Set ignorado (sem bônus): ${e.enName} (${id})`);
      return [];
    }
    const bonus = (k: string) => (b[k] ? { description: b[k].description, ...(bPt?.[k]?.description ? { descriptionPt: bPt[k].description } : {}), params: b[k].params ?? [] } : undefined);
    return [
      ArtifactSetSchema.parse({
        id: Number(id),
        name: e.enName,
        namePt: e.ptName,
        rarity: QUALITY[e.qualityType],
        bonuses: { onePiece: bonus('1pc'), twoPiece: bonus('2pc'), fourPiece: bonus('4pc') },
      }),
    ];
  });

  // --- Validação final e escrita ---
  const validMoves = z.array(MoveSchema).parse(moves);
  const syncMeta = SyncMetaSchema.parse({
    source: 'lunaris',
    gameVersion: version,
    fetchedAt: new Date().toISOString(),
    counts: {
      characters: characters.length,
      moves: validMoves.length,
      weapons: weapons.length,
      artifactSets: artifactSets.length,
    },
  });

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, 'characters.json'), toJsonLines(characters));
  await writeFile(path.join(OUT_DIR, 'moves.json'), toJsonLines(validMoves));
  await writeFile(path.join(OUT_DIR, 'weapons.json'), toJsonLines(weapons));
  await writeFile(path.join(OUT_DIR, 'artifacts.json'), toJsonLines(artifactSets));
  await writeFile(path.join(OUT_DIR, 'meta.json'), JSON.stringify(syncMeta, null, 2) + '\n');

  // --- Relatório ---
  console.log('\nGerado em src/data/generated/:');
  console.log(`  ${characters.length} personagens · ${validMoves.length} golpes · ${weapons.length} armas · ${artifactSets.length} sets`);
  if (warnings.length) {
    console.log(`\nAvisos (${warnings.length}):`);
    warnings.forEach((w) => console.log('  - ' + w));
  }
  if (unparsed.length) {
    console.log(`\nGolpes de dano NÃO reconhecidos (${unparsed.length}) — revisar o parser ou ignorar:`);
    unparsed.slice(0, 40).forEach((u) => console.log(`  - ${u.character} / ${u.talent} / ${u.label} = ${u.sample}`));
  }
  if (candidates.length) {
    console.log(`\nPossíveis golpes sem "DMG" no rótulo (${candidates.length}) — conferir se faltam:`);
    candidates.slice(0, 120).forEach((u) => console.log(`  - ${u.character} / ${u.talent} / ${u.label} = ${u.sample}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

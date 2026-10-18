/**
 * Gera os efeitos de sets (e, em outra seção, de armas) a partir dos textos e parâmetros do Lunaris
 * (`src/data/generated/`), seguindo uma tabela de curadoria escrita à mão em `scripts/curation/`.
 *
 *   npx tsx scripts/curate-effects.ts
 *
 * Regras (as do projeto: nunca inventar número de jogo):
 *  - todo valor vem de um parâmetro do Lunaris ({ p: índice, x: multiplicador }) ou, quando o número só aparece
 *    na descrição, de um literal declarado com `lit`;
 *  - o bônus de 2 peças dos sets é lido da própria descrição ("ATK +18%.") por um conjunto fechado de padrões;
 *  - cada efeito diz o que assumiu (stacks, condições) e o que NÃO entra em `note`;
 *  - entradas que já existem em `sets.json`/`weapons.json` (vindas da planilha de referência) são preservadas.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CharacterEffectSchema, SetEffectSchema, WeaponEffectSchema, type CharacterEffect, type SetEffect, type WeaponEffect, type WeaponStats } from '../src/effects/schema';
import { FOUR_PIECE, type Val } from './curation/sets';
import { parseTwoPiece } from './lib/twoPiece';
import { WEAPONS, type Sum } from './curation/weapons';
import { CHARACTERS as CHARACTER_BUFFS } from './curation/characters';

const root = process.cwd();
const read = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const write = (rel: string, data: unknown) => writeFileSync(path.join(root, rel), JSON.stringify(data, null, 2) + '\n', 'utf8');

interface Bonus { description: string; params: number[] }
interface RawSet { name: string; bonuses: { twoPiece?: Bonus; fourPiece?: Bonus } }
const meta = read<{ gameVersion: string }>('src/data/generated/meta.json');

/** Entradas feitas à mão (planilha de referência); as geradas por este script são refeitas a cada execução. */
const handMade = <T extends { fonte_info: string }>(list: T[]): T[] => list.filter((e) => !e.fonte_info.includes('scripts/curation/'));

const round = (n: number) => Math.round(n * 1e6) / 1e6;
const valueOf = (v: Val, params: number[], where: string): number => {
  if (typeof v === 'number') return v;
  if ('lit' in v) return v.lit;
  const raw = params[v.p];
  if (raw === undefined) throw new Error(`${where}: parâmetro ${v.p} não existe`);
  return round(raw * (v.x ?? 1));
};

function buildSets(): SetEffect[] {
  const raw = read<RawSet[]>('src/data/generated/artifacts.json');
  const existing = handMade(read<SetEffect[]>('src/effects/sets.json'));
  const keep = new Map(existing.map((e) => [e.set, e]));
  const out: SetEffect[] = [];
  const source = `Lunaris ${meta.gameVersion} (descrição e parâmetros)`;

  for (const set of raw) {
    if (!set.bonuses.twoPiece || !set.bonuses.fourPiece) continue; // sets de 1 peça ou sem bônus
    const old = keep.get(set.name);
    if (old) {
      out.push(old);
      continue;
    }
    const two = parseTwoPiece(set.bonuses.twoPiece.description);
    const cur = FOUR_PIECE[set.name];
    const params = set.bonuses.fourPiece.params;
    const notes: string[] = [];
    if (!two) notes.push(`2 peças ("${set.bonuses.twoPiece.description.trim()}") não entra: sem efeito em dano.`);

    let fourPiece: SetEffect['fourPiece'];
    if (cur) {
      const v = (x: Val | undefined) => (x === undefined ? 0 : valueOf(x, params, set.name));
      fourPiece = {
        atkPct: v(cur.atkPct), dmgPct: v(cur.dmgPct), critRate: v(cur.critRate), critDmg: v(cur.critDmg), em: v(cur.em),
        dmgPctByType: Object.fromEntries(Object.entries(cur.byType ?? {}).map(([k, x]) => [k, v(x)])),
        meltBonus: v(cur.meltBonus), vaporizeBonus: 0, er: 0, hpPct: v(cur.hpPct), defPct: v(cur.defPct),
        ...(cur.resShred ? { resShred: { value: v(cur.resShred.value), elements: cur.resShred.elements } } : {}),
        ...(cur.team ? { team: { atkPct: v(cur.team.atkPct), dmgPct: v(cur.team.dmgPct), em: v(cur.team.em) } } : {}),
      };
      notes.push(cur.note);
    } else {
      notes.push('4 peças ainda não cadastrado: só o bônus de 2 peças conta.');
    }

    const entry: SetEffect = {
      set: set.name,
      ...(two ? { twoPiece: two[0], twoPieceMore: two.slice(1) } : { twoPieceMore: [] }),
      ...(fourPiece ? { fourPiece } : {}),
      note: notes.join(' '),
      fonte_info: `${source}; curadoria em scripts/curation/sets.ts.`,
    };
    out.push(SetEffectSchema.parse(entry));
  }
  const unknown = Object.keys(FOUR_PIECE).filter((n) => !raw.some((r) => r.name === n));
  if (unknown.length) throw new Error(`Curadoria com sets que não existem no Lunaris: ${unknown.join(', ')}`);
  return out;
}

const sets = buildSets();
write('src/effects/sets.json', sets);
console.log(`sets.json: ${sets.length} sets (${sets.filter((s) => s.fourPiece).length} com 4 peças, ${sets.filter((s) => s.twoPiece).length} com 2 peças)`);

// ---------- Armas ----------

interface RawWeapon {
  name: string;
  rarity: number;
  passive: { refinements: Bonus[] } | null;
}

const sumOf = (v: Sum | undefined, params: number[], where: string): number =>
  v === undefined ? 0 : round(((Array.isArray(v) ? v : [v]) as Val[]).reduce((acc: number, x: Val) => acc + valueOf(x, params, where), 0));

function buildWeapons(): WeaponEffect[] {
  const raw = read<RawWeapon[]>('src/data/generated/weapons.json');
  const existing = handMade(read<WeaponEffect[]>('src/effects/weapons.json'));
  const keep = new Map(existing.map((e) => [e.weapon, e]));
  const out: WeaponEffect[] = [...existing];
  const errors: string[] = [];
  const source = `Lunaris ${meta.gameVersion} (descrição e parâmetros por refinamento)`;

  for (const [name, cur] of Object.entries(WEAPONS)) {
    if (keep.has(name)) continue; // já veio da planilha de referência: não sobrescrever
    const w = raw.find((x) => x.name === name);
    if (!w?.passive || w.passive.refinements.length !== 5) {
      errors.push(`${name}: arma ou passiva não existe no Lunaris`);
      continue;
    }
    if (!w.passive.refinements[0].description.includes(cur.expect)) {
      errors.push(`${name}: a descrição do R1 não contém "${cur.expect}" (o Lunaris mudou?)`);
      continue;
    }
    const at = (r: number): WeaponStats => {
      const params = w.passive!.refinements[r].params;
      const where = `${name} R${r + 1}`;
      const t = cur.team;
      return {
        atkPct: sumOf(cur.atkPct, params, where), dmgPct: sumOf(cur.dmgPct, params, where),
        critRate: sumOf(cur.critRate, params, where), critDmg: sumOf(cur.critDmg, params, where),
        em: sumOf(cur.em, params, where), er: sumOf(cur.er, params, where),
        hpPct: sumOf(cur.hpPct, params, where), defPct: sumOf(cur.defPct, params, where),
        dmgPctByType: Object.fromEntries(Object.entries(cur.byType ?? {}).map(([k, x]) => [k, sumOf(x, params, where)])),
        ...(t ? { team: { atkPct: sumOf(t.atkPct, params, where), dmgPct: sumOf(t.dmgPct, params, where), em: sumOf(t.em, params, where) } } : {}),
      };
    };
    const refinements = [0, 1, 2, 3, 4].map(at);
    out.push(WeaponEffectSchema.parse({
      weapon: name,
      ...refinements[0],
      refinements,
      note: cur.note,
      fonte_info: `${source}; curadoria em scripts/curation/weapons.ts.`,
    }));
  }
  if (errors.length) throw new Error(['Curadoria de armas com problemas:', ...errors].join('\n  '));
  return out;
}

const weapons = buildWeapons();
write('src/effects/weapons.json', weapons);
console.log(`weapons.json: ${weapons.length} armas (${weapons.filter((w) => w.refinements).length} com tabela por refinamento)`);

// ---------- Personagens (passivas e constelações) ----------

interface RawChar {
  passives?: Record<string, { description: string; params: number[] }>;
  constellations?: Record<string, { description: string; params: number[] }>;
}

function buildCharacters(): CharacterEffect[] {
  const existing = handMade(read<CharacterEffect[]>('src/effects/characters.json'));
  const chars = read<{ id: string; name: string }[]>('src/data/generated/characters.json');
  const out: CharacterEffect[] = [...existing];
  const errors: string[] = [];
  const source = `Lunaris ${meta.gameVersion} (passivas e constelações)`;
  const strip = (t: string) => t.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ');

  for (const [name, list] of Object.entries(CHARACTER_BUFFS)) {
    if (existing.some((e) => e.character === name)) {
      errors.push(`${name}: já tem efeito da planilha (some as passivas à mão ou remova da curadoria)`);
      continue;
    }
    const c = chars.find((x) => x.name === name);
    if (!c) {
      errors.push(`${name}: não existe nos dados do jogo`);
      continue;
    }
    let raw: RawChar;
    try {
      raw = read<RawChar>(`data/raw/lunaris/${meta.gameVersion}/en/char/${c.id}.json`);
    } catch {
      errors.push(`${name}: sem o JSON bruto em data/raw (rode npm run sync:data)`);
      continue;
    }
    const buffs = list.map((b) => {
      const isConst = b.src.startsWith('const');
      const node = (isConst ? raw.constellations : raw.passives)?.[b.src];
      if (!node) throw new Error(`${name} ${b.id}: ${b.src} não existe`);
      if (!strip(node.description).includes(b.expect)) {
        errors.push(`${name} ${b.id}: a descrição de ${b.src} não contém "${b.expect}" (o Lunaris mudou?)`);
      }
      const v = (x: Val | undefined) => (x === undefined ? 0 : valueOf(x, node.params, `${name} ${b.id}`));
      const s = b.stats;
      return {
        id: b.id,
        label: b.label,
        minConstellation: isConst ? Number(b.src.slice(5)) : 0,
        scope: b.scope,
        timed: b.timed,
        ...(b.forElements ? { forElements: b.forElements } : {}),
        ...(s
          ? {
              stats: {
                atkPct: v(s.atkPct), dmgPct: v(s.dmgPct), critRate: v(s.critRate), critDmg: v(s.critDmg), em: v(s.em),
                er: 0, hpPct: v(s.hpPct), defPct: v(s.defPct),
                dmgPctByType: Object.fromEntries(Object.entries(s.byType ?? {}).map(([k, x]) => [k, v(x)])),
              },
            }
          : {}),
        ...(b.resShred ? { resShred: { value: v(b.resShred.value), elements: b.resShred.elements } } : {}),
        note: b.note,
      };
    });
    out.push(CharacterEffectSchema.parse({
      character: name,
      atkPct: 0, dmgPct: 0, critRate: 0, critDmg: 0, em: 0,
      buffs,
      fonte_info: `${source}; curadoria em scripts/curation/characters.ts.`,
    }));
  }
  if (errors.length) throw new Error(['Curadoria de personagens com problemas:', ...errors].join('\n  '));
  return out;
}

const characters = buildCharacters();
write('src/effects/characters.json', characters);
console.log(`characters.json: ${characters.length} personagens (${characters.filter((c) => c.buffs?.length).length} com passivas/constelações)`);

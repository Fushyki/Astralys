/**
 * Importação do inventário no formato GOOD (Genshin Optimizer Object Description), o mesmo que o Genshin Optimizer
 * exporta. Dali sai o build REAL de um personagem: arma, sets, main stats e a soma exata dos substats das peças
 * equipadas, convertida em "rolls" fracionários (valor ÷ valor médio do roll), que o motor aceita como rolls manuais.
 *
 * Limites desta importação (anotados nas notas devolvidas ao usuário): o nível das peças e da arma não entra (o motor
 * assume peças no nível máximo), o refinamento e as constelações não entram nos números, e os níveis de talento do
 * GOOD não incluem o bônus de constelação.
 */
import { z } from 'zod';
import type { Character } from '../../data/schema';
import { SUBSTATS, rollValues, type MemberRef, type PieceSlot, type Substat } from '../../engine';
import type { GameData } from '../../engine';

const SlotKey = z.enum(['flower', 'plume', 'sands', 'goblet', 'circlet']);

const GoodArtifactSchema = z.object({
  setKey: z.string(),
  slotKey: SlotKey,
  rarity: z.number(),
  mainStatKey: z.string(),
  substats: z.array(z.object({ key: z.string(), value: z.number() })).default([]),
  location: z.string().default(''),
  level: z.number().optional(),
});

const GoodCharacterSchema = z.object({
  key: z.string(),
  level: z.number().optional(),
  constellation: z.number().optional(),
  talent: z.object({ auto: z.number(), skill: z.number(), burst: z.number() }).partial().optional(),
});

const GoodWeaponSchema = z.object({
  key: z.string(),
  level: z.number().optional(),
  refinement: z.number().optional(),
  location: z.string().default(''),
});

export const GoodSchema = z.object({
  format: z.literal('GOOD'),
  source: z.string().optional(),
  characters: z.array(GoodCharacterSchema).default([]),
  weapons: z.array(GoodWeaponSchema).default([]),
  artifacts: z.array(GoodArtifactSchema).default([]),
});
export type Good = z.infer<typeof GoodSchema>;

export function parseGood(raw: unknown): Good {
  const r = GoodSchema.safeParse(raw);
  if (!r.success) {
    const first = r.error.issues[0];
    if (typeof raw === 'object' && raw && (raw as { format?: unknown }).format !== 'GOOD') {
      throw new Error('O arquivo não é um inventário GOOD (falta "format": "GOOD"). Exporte do Genshin Optimizer em Configurações > Baixar dados.');
    }
    throw new Error(`Inventário GOOD inválido: ${first.path.join('.') || 'raiz'}: ${first.message}`);
  }
  return r.data;
}

/** "Kamisato Ayaka", "KamisatoAyaka" e "Wolf's Gravestone"/"WolfsGravestone" comparam iguais. */
export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const SUBSTAT_OF: Record<string, Substat> = {
  hp: 'HP', hp_: 'HP%', atk: 'ATK', atk_: 'ATK%', def: 'DEF', def_: 'DEF%', eleMas: 'EM', enerRech_: 'ER', critRate_: 'CR', critDMG_: 'CD',
};
/** Substats em % chegam em unidades de percentual (10,5 = 10,5%). */
const PERCENT = new Set(['hp_', 'atk_', 'def_', 'enerRech_', 'critRate_', 'critDMG_']);

const MAIN_OF: Record<'sands' | 'goblet' | 'circlet', Record<string, string>> = {
  sands: { hp_: 'HP%', atk_: 'ATK%', def_: 'DEF%', eleMas: 'EM', enerRech_: 'ER' },
  goblet: { hp_: 'HP%', atk_: 'ATK%', def_: 'DEF%', eleMas: 'EM' },
  circlet: { hp_: 'HP%', atk_: 'ATK%', def_: 'DEF%', eleMas: 'EM', critRate_: 'CR', critDMG_: 'CD', heal_: 'Healing' },
};
const isDmgKey = (k: string) => /_dmg_$/.test(k);

export interface GoodBuild {
  /** Campos do membro que o import preenche. */
  patch: Pick<MemberRef, 'artifacts' | 'talents' | 'manualRolls'> & Partial<Pick<MemberRef, 'weapon' | 'primarySet' | 'secondarySet' | 'fourPiece'>>;
  /** Avisos e limites desta importação, em português. */
  notes: string[];
  /** Refinamento da arma no GOOD (1 a 5), informativo. */
  refinement?: number;
}

/** Personagens do GOOD que existem nos dados do jogo (para listar o que dá para importar). */
export function goodCharacterNames(good: Good, characters: readonly Character[]): string[] {
  const byNorm = new Map(characters.map((c) => [norm(c.name), c.name]));
  return good.characters.map((c) => byNorm.get(norm(c.key))).filter((n): n is string => !!n);
}

export function buildFromGood(good: Good, characterName: string, game: Pick<GameData, 'characters' | 'weapons' | 'artifacts'>): GoodBuild {
  const character = game.characters.find((c) => c.name === characterName);
  if (!character) throw new Error(`"${characterName}" não existe nos dados do jogo.`);
  const gc = good.characters.find((c) => norm(c.key) === norm(characterName));
  if (!gc) throw new Error(`${characterName} não está neste inventário.`);
  const notes: string[] = [];

  // ---- Arma ----
  const gw = good.weapons.find((w) => norm(w.location) === norm(gc.key));
  let weapon: string | undefined;
  if (gw) {
    const w = game.weapons.find((x) => norm(x.name) === norm(gw.key));
    if (w && w.type === character.weapon) weapon = w.name;
    else notes.push(w ? `A arma ${w.name} não é do tipo de ${characterName}; mantive a arma atual.` : `Arma "${gw.key}" não encontrada nos dados do jogo; mantive a arma atual.`);
  } else notes.push('O personagem não tem arma equipada no inventário; mantive a arma atual.');

  // ---- Peças equipadas ----
  const equipped = good.artifacts.filter((a) => norm(a.location) === norm(gc.key));
  const bySlot = new Map<PieceSlot, (typeof equipped)[number]>();
  for (const a of equipped) bySlot.set(a.slotKey, a);
  const missing = (['flower', 'plume', 'sands', 'goblet', 'circlet'] as const).filter((s) => !bySlot.has(s));
  if (missing.length) notes.push(`Faltam peças equipadas: ${missing.join(', ')}. As que faltam contam como 5★ sem substats.`);

  const rarityOf = (slot: PieceSlot): 4 | 5 => {
    const r = bySlot.get(slot)?.rarity ?? 5;
    if (r < 4) notes.push(`A peça ${slot} é ${r}★; tratada como 4★ (o motor só conhece 4★ e 5★).`);
    return r >= 5 ? 5 : 4;
  };
  const rarity = { flower: rarityOf('flower'), plume: rarityOf('plume'), sands: rarityOf('sands'), goblet: rarityOf('goblet'), circlet: rarityOf('circlet') };

  const mainFor = (slot: 'sands' | 'goblet' | 'circlet', fallback: string): string => {
    const key = bySlot.get(slot)?.mainStatKey;
    if (!key) return fallback;
    if (slot === 'goblet' && isDmgKey(key)) return 'DMG%';
    const mapped = MAIN_OF[slot][key];
    if (!mapped) {
      notes.push(`Main stat "${key}" da peça ${slot} não é suportado; usei ${fallback}.`);
      return fallback;
    }
    return mapped;
  };
  const artifacts = { rarity, sands: mainFor('sands', 'ATK%'), goblet: mainFor('goblet', 'DMG%'), circlet: mainFor('circlet', 'CR') };

  // ---- Sets ----
  const counts = new Map<string, number>();
  for (const a of equipped) counts.set(a.setKey, (counts.get(a.setKey) ?? 0) + 1);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const setName = (key: string) => {
    const s = game.artifacts.find((x) => norm(x.name) === norm(key));
    if (!s) notes.push(`Set "${key}" não encontrado nos dados do jogo.`);
    return s?.name;
  };
  let primarySet: string | undefined;
  let secondarySet: string | undefined;
  let fourPiece: boolean | undefined;
  if (ranked[0] && ranked[0][1] >= 4) {
    primarySet = setName(ranked[0][0]);
  } else if (ranked[0] && ranked[0][1] >= 2 && ranked[1] && ranked[1][1] >= 2) {
    primarySet = setName(ranked[0][0]);
    secondarySet = setName(ranked[1][0]);
  } else if (ranked[0] && ranked[0][1] >= 2) {
    primarySet = setName(ranked[0][0]);
    fourPiece = false;
    notes.push(`Só 2 peças de ${primarySet ?? ranked[0][0]}: apenas o bônus de 2 peças conta.`);
  } else if (equipped.length) {
    notes.push('Nenhum bônus de set (menos de 2 peças do mesmo set).');
  }

  // ---- Substats reais → rolls fracionários ----
  const sums = Object.fromEntries(SUBSTATS.map((s) => [s, 0])) as Record<Substat, number>;
  for (const a of equipped) {
    for (const sub of a.substats) {
      const s = SUBSTAT_OF[sub.key];
      if (!s) continue;
      sums[s] += PERCENT.has(sub.key) ? sub.value / 100 : sub.value;
    }
  }
  const perRoll = rollValues(artifacts as never);
  const manualRolls = Object.fromEntries(SUBSTATS.map((s) => [s, Math.round((sums[s] / perRoll[s]) * 1000) / 1000])) as Record<Substat, number>;

  const tal = gc.talent ?? {};
  const clamp = (v: number | undefined) => Math.min(15, Math.max(1, Math.round(v ?? 10)));
  const talents = { normal: clamp(tal.auto), skill: clamp(tal.skill), burst: clamp(tal.burst) };
  if ((gc.constellation ?? 0) >= 3) notes.push('O GOOD não inclui o +3 de nível de talento das constelações; ajuste os níveis à mão se precisar.');
  notes.push('Rolls calculados pela soma exata dos substats das peças (fracionários). O nível da arma e das peças não entra: o motor usa o nível máximo.');

  return {
    patch: { ...(weapon ? { weapon } : {}), primarySet, secondarySet, fourPiece, artifacts, talents, manualRolls },
    notes,
    refinement: gw?.refinement,
  };
}

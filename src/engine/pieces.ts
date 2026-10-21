/**
 * Cada artefato vira um vetor de 11 números: a contribuição EXATA dele aos stats do personagem (main stat, ATK e HP
 * fixos de flor e pluma, substats reais). Somar as 5 peças dá o `externalStats` que o motor avalia, e como o dano é
 * monótono em todos esses números, o máximo de cada posição vira um limite superior válido para a busca.
 */
import { z } from 'zod';
import type { Element } from '../data/schema';
import { ARTIFACT_MAIN_STAT, type MainStatKey } from './constants/artifactMainStat';
import type { StatDelta } from './stats';

/** Um artefato real (formato do GOOD): o que o personagem guarda quando você coloca peças do inventário nele. */
export const RealPieceSchema = z.object({
  setKey: z.string().min(1),
  slotKey: z.enum(['flower', 'plume', 'sands', 'goblet', 'circlet']),
  rarity: z.number().min(1).max(5),
  level: z.number().min(0).max(20).optional(),
  mainStatKey: z.string().min(1),
  substats: z.array(z.object({ key: z.string(), value: z.number() })).max(4),
  /** De quem era no inventário (informativo). */
  location: z.string().optional(),
});
export type RealPiece = z.infer<typeof RealPieceSchema>;
type GoodArtifact = RealPiece;

export const DIM = { hpFlat: 0, hpPct: 1, atkFlat: 2, atkPct: 3, defFlat: 4, defPct: 5, em: 6, er: 7, cr: 8, cd: 9, dmg: 10 } as const;
export const DIMS = 11;
export type Vec = Float64Array;

export const SLOT_ORDER = ['flower', 'plume', 'sands', 'goblet', 'circlet'] as const;
export type SlotKey = (typeof SLOT_ORDER)[number];

const SUB_DIM: Record<string, number> = {
  hp: DIM.hpFlat, hp_: DIM.hpPct, atk: DIM.atkFlat, atk_: DIM.atkPct, def: DIM.defFlat, def_: DIM.defPct,
  eleMas: DIM.em, enerRech_: DIM.er, critRate_: DIM.cr, critDMG_: DIM.cd,
};
/** Substats em % chegam em unidades de percentual (10,5 = 10,5%). */
const PERCENT = new Set(['hp_', 'atk_', 'def_', 'enerRech_', 'critRate_', 'critDMG_']);

/** Dimensão do vetor de cada main stat de areia/cálice/tiara (cura e DMG% ficam de fora). */
const MAIN_DIM: Record<string, number> = {
  hp_: DIM.hpPct, atk_: DIM.atkPct, def_: DIM.defPct, eleMas: DIM.em, enerRech_: DIM.er, critRate_: DIM.cr, critDMG_: DIM.cd,
};

const ELEMENT_OF_DMG: Record<string, Element | 'Physical'> = {
  pyro_dmg_: 'Pyro', hydro_dmg_: 'Hydro', cryo_dmg_: 'Cryo', electro_dmg_: 'Electro', anemo_dmg_: 'Anemo', geo_dmg_: 'Geo', dendro_dmg_: 'Dendro', physical_dmg_: 'Physical',
};

/** Posição da peça no vetor de slots. */
export const slotIndex = (slot: SlotKey) => SLOT_ORDER.indexOf(slot);

/** Nível máximo de uma peça da raridade dada (4 por estrela: 5★ = +20, 4★ = +16, 3★ = +12). */
export const maxPieceLevel = (rarity: number): number => 4 * Math.min(5, Math.max(1, Math.round(rarity)));

/** Nível efetivo da peça: o do inventário, limitado a 0..máximo da raridade; sem nível, assume o máximo. */
export const pieceLevel = (p: { rarity: number; level?: number }): number => {
  const max = maxPieceLevel(p.rarity);
  return p.level === undefined ? max : Math.min(max, Math.max(0, Math.round(p.level)));
};

/**
 * Valor do main stat de uma peça da `rarity` no `level` dado (tabela real do jogo, via Genshin Optimizer).
 * `key` é a chave do GOOD (`hp`, `atk`, `atk_`, `pyro_dmg_`...); chave desconhecida vale 0.
 */
export function mainStatValue(key: string, rarity: number, level?: number): number {
  const r = Math.min(5, Math.max(1, Math.round(rarity))) as 1 | 2 | 3 | 4 | 5;
  const table = ARTIFACT_MAIN_STAT[r][key as MainStatKey];
  return table ? table[pieceLevel({ rarity: r, level })] : 0;
}

/** Valor do main stat da peça no nível dela (flor = HP, pluma = ATK, qualquer que seja o `mainStatKey`). */
function mainValue(a: Pick<GoodArtifact, 'slotKey' | 'mainStatKey' | 'rarity' | 'level'>): number {
  const key = a.slotKey === 'flower' ? 'hp' : a.slotKey === 'plume' ? 'atk' : a.mainStatKey;
  return mainStatValue(key, a.rarity, a.level);
}

/** Vetor de stats da peça para um personagem do `element` dado (bônus elementais de outros elementos não valem). */
export function pieceVector(a: GoodArtifact, element: Element): Vec {
  const v = new Float64Array(DIMS);
  const slot = a.slotKey as SlotKey;
  if (slot === 'flower') v[DIM.hpFlat] += mainValue(a);
  else if (slot === 'plume') v[DIM.atkFlat] += mainValue(a);
  else if (a.mainStatKey.endsWith('_dmg_')) {
    if (ELEMENT_OF_DMG[a.mainStatKey] === element) v[DIM.dmg] += mainValue(a);
  } else {
    const m = MAIN_DIM[a.mainStatKey];
    if (m !== undefined) v[m] += mainValue(a);
  }
  for (const s of a.substats) {
    const d = SUB_DIM[s.key];
    if (d === undefined) continue;
    v[d] += PERCENT.has(s.key) ? s.value / 100 : s.value;
  }
  return v;
}

export function addInto(target: Vec, v: Vec): Vec {
  for (let i = 0; i < DIMS; i++) target[i] += v[i];
  return target;
}

/** Vetor → ajuste de stats que o motor entende. */
export function vecToDelta(v: Vec): StatDelta {
  return {
    hpFlat: v[DIM.hpFlat], hpPct: v[DIM.hpPct], atkFlat: v[DIM.atkFlat], atkPct: v[DIM.atkPct],
    defFlat: v[DIM.defFlat], defPct: v[DIM.defPct], em: v[DIM.em], er: v[DIM.er],
    critRate: v[DIM.cr], critDmg: v[DIM.cd], dmgBonus: v[DIM.dmg],
  };
}

/** `a` é melhor ou igual a `b` em todos os stats. */
export function dominates(a: Vec, b: Vec): boolean {
  for (let i = 0; i < DIMS; i++) if (a[i] < b[i] - 1e-12) return false;
  return true;
}

/** "Kamisato Ayaka", "KamisatoAyaka" e "Wolf's Gravestone"/"WolfsGravestone" comparam iguais. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export interface PiecesBuild {
  /** Soma exata das peças, pronta para `MemberInput.externalStats`. */
  stats: StatDelta;
  primarySet?: string;
  secondarySet?: string;
  fourPiece?: boolean;
}

/** Stats e bônus de set de um conjunto de peças reais (até 5, uma por posição; as que faltam não contam). */
export function buildFromPieces(pieces: readonly RealPiece[], element: Element, setNames: readonly string[]): PiecesBuild {
  const vec = new Float64Array(DIMS);
  for (const p of pieces) addInto(vec, pieceVector(p, element));
  const nameOf = (key: string) => setNames.find((n) => norm(n) === norm(key)) ?? key;
  const counts = new Map<string, number>();
  for (const p of pieces) counts.set(nameOf(p.setKey), (counts.get(nameOf(p.setKey)) ?? 0) + 1);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  const out: PiecesBuild = { stats: vecToDelta(vec) };
  if (ranked[0] && ranked[0][1] >= 4) out.primarySet = ranked[0][0];
  else if (ranked[0] && ranked[0][1] >= 2 && ranked[1] && ranked[1][1] >= 2) {
    out.primarySet = ranked[0][0];
    out.secondarySet = ranked[1][0];
  } else if (ranked[0] && ranked[0][1] >= 2) {
    out.primarySet = ranked[0][0];
    out.fourPiece = false;
  }
  return out;
}

/** Main stat da peça (chave do GOOD e valor: fração para %, pontos para o resto) no nível real dela. */
export function mainStatOf(p: RealPiece): { key: string; value: number; level: number } {
  const key = p.slotKey === 'flower' ? 'hp' : p.slotKey === 'plume' ? 'atk' : p.mainStatKey;
  return { key, value: mainValue(p), level: pieceLevel(p) };
}

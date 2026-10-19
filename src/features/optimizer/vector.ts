/**
 * Cada artefato vira um vetor de 11 números: a contribuição EXATA dele aos stats do personagem (main stat, ATK e HP
 * fixos de flor e pluma, substats reais). Somar as 5 peças dá o `externalStats` que o motor avalia, e como o dano é
 * monótono em todos esses números, o máximo de cada posição vira um limite superior válido para a busca.
 */
import { MAIN_STAT_VALUES, FLOWER_HP, PLUME_ATK, type StatDelta } from '../../engine';
import type { Element } from '../../data/schema';
import type { GoodArtifact } from '../good/goodImport';

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

const MAIN_NAME: Record<string, { name: string; dim: number }> = {
  hp_: { name: 'HP%', dim: DIM.hpPct },
  atk_: { name: 'ATK%', dim: DIM.atkPct },
  def_: { name: 'DEF%', dim: DIM.defPct },
  eleMas: { name: 'EM', dim: DIM.em },
  enerRech_: { name: 'ER', dim: DIM.er },
  critRate_: { name: 'CR', dim: DIM.cr },
  critDMG_: { name: 'CD', dim: DIM.cd },
};

const ELEMENT_OF_DMG: Record<string, Element | 'Physical'> = {
  pyro_dmg_: 'Pyro', hydro_dmg_: 'Hydro', cryo_dmg_: 'Cryo', electro_dmg_: 'Electro', anemo_dmg_: 'Anemo', geo_dmg_: 'Geo', dendro_dmg_: 'Dendro', physical_dmg_: 'Physical',
};

/** Posição da peça no vetor de slots. */
export const slotIndex = (slot: SlotKey) => SLOT_ORDER.indexOf(slot);

/** Valor do main stat com a peça no nível máximo (como o motor assume). Nível mais baixo não é modelado. */
function mainValue(slot: SlotKey, key: string, rarity: number): number {
  const r = rarity >= 5 ? 0 : 1;
  if (slot === 'flower') return FLOWER_HP[r];
  if (slot === 'plume') return PLUME_ATK[r];
  const table = MAIN_STAT_VALUES[slot] as Record<string, readonly [number, number]>;
  const name = key.endsWith('_dmg_') ? 'DMG%' : MAIN_NAME[key]?.name;
  const pair = name ? table[name] : undefined;
  return pair ? pair[r] : 0;
}

/** Vetor de stats da peça para um personagem do `element` dado (bônus elementais de outros elementos não valem). */
export function pieceVector(a: GoodArtifact, element: Element): Vec {
  const v = new Float64Array(DIMS);
  const slot = a.slotKey as SlotKey;
  if (slot === 'flower') v[DIM.hpFlat] += mainValue(slot, a.mainStatKey, a.rarity);
  else if (slot === 'plume') v[DIM.atkFlat] += mainValue(slot, a.mainStatKey, a.rarity);
  else if (a.mainStatKey.endsWith('_dmg_')) {
    if (ELEMENT_OF_DMG[a.mainStatKey] === element) v[DIM.dmg] += mainValue(slot, a.mainStatKey, a.rarity);
  } else {
    const m = MAIN_NAME[a.mainStatKey];
    if (m) v[m.dim] += mainValue(slot, a.mainStatKey, a.rarity);
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

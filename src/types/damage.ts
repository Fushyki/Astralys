import { ElementType } from './er';

export type WeaponType = 'sword' | 'claymore' | 'polearm' | 'bow' | 'catalyst';

export type StatKey = 
  | 'hp' | 'hp_' 
  | 'atk' | 'atk_' 
  | 'def' | 'def_' 
  | 'eleMas' 
  | 'enerRech_' 
  | 'critRate_' 
  | 'critDMG_' 
  | 'heal_' 
  | 'physical_dmg_' 
  | 'anemo_dmg_' 
  | 'geo_dmg_' 
  | 'electro_dmg_' 
  | 'hydro_dmg_' 
  | 'pyro_dmg_' 
  | 'cryo_dmg_' 
  | 'dendro_dmg_';

export type ReactionType = 
  | 'none'
  | 'vaporize'      // Pyro on Hydro (1.5x) or Hydro on Pyro (2.0x)
  | 'melt'          // Pyro on Cryo (2.0x) or Cryo on Pyro (1.5x)
  | 'aggravate'     // Electro on Quicken (+flat dmg)
  | 'spread'        // Dendro on Quicken (+flat dmg)
  | 'bloom'         // Dendro + Hydro
  | 'hyperbloom'    // Bloom + Electro
  | 'burgeon'       // Bloom + Pyro
  | 'swirl'         // Anemo
  | 'overloaded'    // Pyro + Electro
  | 'superconduct'; // Cryo + Electro

export interface CharacterConfig {
  name: string;
  element: ElementType;
  weaponType: WeaponType;
  level: number;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  critRate: number;      // e.g. 5.0 (%)
  critDmg: number;       // e.g. 50.0 (%)
  ascensionStatKey?: StatKey;
  ascensionStatValue?: number;
}

export interface WeaponConfig {
  name: string;
  type: WeaponType;
  level: number;
  baseAtk: number;
  subStatKey: StatKey;
  subStatValue: number;
  refinement: number;
  passiveAtkPct: number;
  passiveDmgBonusPct: number;
}

export interface ArtifactTotals {
  hpFlat: number;
  hpPct: number;
  atkFlat: number;
  atkPct: number;
  defFlat: number;
  defPct: number;
  eleMas: number;
  enerRech: number;
  critRate: number;
  critDmg: number;
  elemDmgBonus: number;
  sets: { name: string; count: number }[];
}

export interface TeamBuffs {
  flatAtk: number;          // Bennett / Sara / Iansan
  atkPct: number;           // Noblesse 20%, TTDS 48%, Tenacity 20%
  flatHp: number;
  hpPct: number;            // Hydro Resonance 25%
  flatDef: number;
  defPct: number;
  flatEm: number;           // Instructor 120, Nahida 250, Sucrose
  emPct: number;
  allDmgBonus: number;      // Furina, Kazuha, Cinder City (Scroll) 40%
  resShred: number;         // VV -40%, Zhongli -20%, Deepwood -30%
  defReduction: number;     // Klee C2 23%, Ayaka C4 30%, Nahida C2 30%
  defIgnore: number;        // Raiden C2 60%
}

export interface TargetEnemy {
  level: number;            // e.g. 100 for Abyss 12
  baseRes: number;          // e.g. 10 (%)
  resShred: number;         // Total active RES shred (%)
  defReduction: number;     // Total active DEF shred (%)
  defIgnore: number;        // Total active DEF ignore (%)
}

export interface TalentAction {
  id: string;
  name: string;
  type: 'normal' | 'charged' | 'plunge' | 'skill' | 'burst';
  scalingStat: 'atk' | 'hp' | 'def' | 'em';
  motionValuePct: number;   // e.g. 800% = 800
  secondaryStat?: 'atk' | 'hp' | 'def' | 'em';
  secondaryMvPct?: number;  // For dual scaling like Alhaitham, Nahida
  flatBuffDmg?: number;     // Shenhe / Yun Jin / Fighting spirit
  hits: number;
  reaction: ReactionType;
  amplifyingMultiplierOverride?: number; // 1.5 or 2.0
}

export interface DamageCalculationOutput {
  // Aggregate Stats
  totalHp: number;
  totalAtk: number;
  totalDef: number;
  totalEm: number;
  totalCr: number;
  totalCd: number;
  totalDmgBonus: number;
  effectiveEr: number;

  // Multipliers
  defMultiplier: number;
  resMultiplier: number;
  emAmpMultiplier: number;
  catalyzeFlatBonus: number;
  transformativeDmgBase: number;

  // Damage Outputs per Talent Action
  actions: {
    actionId: string;
    actionName: string;
    baseScalingValue: number;
    nonCritDmg: number;
    critDmg: number;
    avgDmg: number;
    totalActionAvgDmg: number; // Avg * hits
  }[];

  // Rotation Totals
  rotationTotalDmg: number;
  rotationDurationSeconds: number;
  rotationDPS: number;
}

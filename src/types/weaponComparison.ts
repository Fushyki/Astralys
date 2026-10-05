/**
 * Astralys - Weapon Showdown & Damage Comparison Types
 */

export interface WeaponOption {
  id: string;
  name: string;
  refinement: string; // e.g. "R1", "R5"
  rarity: 3 | 4 | 5;
  baseAtk: number;
  subStatType: 'CR' | 'CD' | 'ATK%' | 'EM' | 'ER%' | 'HP%' | 'DEF%' | 'Physical%';
  subStatValue: number; // e.g. 33.1 or 66.2
  passiveEffect: string;
  dpr: number;
  dps: number;
  percentageOfBaseline: number; // e.g. 100.0, 92.4, 105.2
  isBaseline: boolean;
  notes?: string;
}

export interface CharacterWeaponComparison {
  characterName: string;
  characterElement: string;
  carryArchetype: string;
  baselineWeaponId: string;
  rotationDuration: number;
  weapons: WeaponOption[];
}

export type ElementType = 'Pyro' | 'Hydro' | 'Anemo' | 'Electro' | 'Dendro' | 'Cryo' | 'Geo' | 'None';

export type WeaponType = 'Sword' | 'Claymore' | 'Polearm' | 'Bow' | 'Catalyst' | 'None';

export interface CharacterERData {
  name: string;
  element: ElementType;
  burst_cost: number;
  burst_cd: number;
  particles: number;
  label: string;
  weapon?: WeaponType;
  rarity?: 4 | 5;
  releaseStatus?: 'released' | 'upcoming';
  rng?: string;
  aliases?: string[];
  avatarUrl?: string;
}

export type FunnelTarget = 
  | 'Ele mesmo (Em campo)'
  | 'Passar p/ Slot 1'
  | 'Passar p/ Slot 2'
  | 'Passar p/ Slot 3'
  | 'Passar p/ Slot 4'
  | 'Dividir (50% Slot 3 / 50% Slot 4)'
  | 'Dividir (50% Slot 1 / 50% Slot 2)'
  | 'Fora de campo (Dividido)';

export type FavTarget = 
  | 'Ele mesmo (Em campo)'
  | 'Passar p/ Slot 1'
  | 'Passar p/ Slot 2'
  | 'Passar p/ Slot 3'
  | 'Passar p/ Slot 4';

export interface ERSlotConfig {
  id: number;
  name: string;
  e_uses: number;
  custom_part?: number;
  funnel: FunnelTarget;
  fav: number;
  fav_target: FavTarget;
  flat: number;
  onfield: number; // 0.05 to 1.0
  use_burst: boolean;
}

export type ERStatusTier = 'comfortable' | 'balanced' | 'high' | 'critical' | 'ignored';

export interface ERCalculationResult {
  neededER: number;       // e.g. 1.45 (145.0%)
  safeER: number;         // e.g. 1.66 (166.8% with +15% margin)
  status: ERStatusTier;
  statusLabel: string;
  baseFromSkills: number;
  baseFromFav: number;
  baseFromEnemies: number;
  flatEnergy: number;
  totalBaseEnergy: number;
}

export interface SavedTeam {
  id: number;
  name: string;
  rotationTime: number;
  enemyParts: number;
  slots: ERSlotConfig[];
  createdAt?: number;
}

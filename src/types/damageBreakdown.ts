export interface DamageHit {
  id: string;
  label: string; // e.g. "QM", "FM", "E", "PewPew"
  displayName: string;
  charName: string;
  charIndex: number;
  damage: number;
  pctOfTotal: number;
  category: 'burst' | 'skill' | 'normal' | 'charged' | 'other';
}

export interface CharacterStatSnapshot {
  name: string;
  element: string;
  weapon: string;
  artifactSet: string;
  totalDamage: number;
  damagePercentage: number;
  totalAtk?: number;
  critRate?: number;
  critDmg?: number;
  elementalMastery?: number;
  dmgBonus?: number;
  rolls?: {
    cr?: number;
    cd?: number;
    em?: number;
    atkPct?: number;
    hpPct?: number;
    defPct?: number;
    er?: number;
    totalRolls?: number;
  };
}

export interface DamageAnalysisResult {
  title: string;
  characters: CharacterStatSnapshot[];
  hits: DamageHit[];
  totalDpr: number;
  dps: number;
  rotationDuration: number;
  comboNotation: string;
  sheetName?: string;
  variantLabel?: string;
}

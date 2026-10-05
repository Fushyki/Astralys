/**
 * Astralys - Version 6.7 Tierlist Types
 * Defines ranking structures, filter states, and metadata for version 6.7
 * character and weapon meta evaluations.
 */

import { ElementType } from './er';
import { WeaponType as DamageWeaponType } from './damage';

export type WeaponType = DamageWeaponType | 'Sword' | 'Claymore' | 'Polearm' | 'Bow' | 'Catalyst';

/**
 * Tier ranking tiers.
 */
export type TierCategory = 'SS+' | 'SS' | 'S' | 'A' | 'B' | 'C';

/**
 * Primary combat role categorization.
 */
export type RoleCategory = 
  | 'Main DPS' 
  | 'Sub-DPS' 
  | 'Amplifying Support' 
  | 'Sustain' 
  | 'Enabler';

/**
 * Playstyle and specialty tags.
 */
export type PlaystyleTag = 
  | 'On-field' 
  | 'Off-field' 
  | 'Quickswap' 
  | 'Hypercarry' 
  | 'Driver' 
  | 'Buffer' 
  | 'Debuffer' 
  | 'Battery' 
  | 'Shielder' 
  | 'Healer';

/**
 * Category classification for weapons.
 */
export type WeaponCategory = 
  | 'Signature' 
  | 'Generalist' 
  | 'F2P / Craftable' 
  | 'Battle Pass / Gacha 4★' 
  | 'Standard 5★';

/**
 * Visual and descriptive styling configuration for a tier category.
 */
export interface TierCategoryConfig {
  tier: TierCategory;
  label: string;
  badgeColor: string;
  borderColor: string;
  description: string;
}

/**
 * Single character ranking entry in version 6.7 tierlist.
 */
export interface CharacterTierEntry {
  id: string; // e.g. "sandrone", "mavuika"
  name: string;
  element: ElementType;
  weaponType: WeaponType;
  rarity: 4 | 5;
  tier: TierCategory;
  role: RoleCategory;
  secondaryRoles?: RoleCategory[];
  playstyles?: PlaystyleTag[];
  bestWeapons: string[];
  bestArtifactSets: string[];
  keyConstellations?: string; // e.g. "C1", "C2", "C6"
  metaNotes: string; // Detailed 6.7 meta justification
  synergies?: string[]; // Recommended teammates
  avatarUrl?: string;
  version: string; // "6.7"
}

/**
 * Single weapon ranking entry in version 6.7 tierlist.
 */
export interface WeaponTierEntry {
  id: string; // e.g. "tidal_shadow", "blazing_suns"
  name: string;
  weaponType: WeaponType;
  rarity: 3 | 4 | 5;
  tier: TierCategory;
  category?: WeaponCategory;
  baseAtk90?: number;
  subStat?: string; // e.g. "Crit DMG 66.2%", "ER 55.1%"
  passiveSummary: string;
  recommendedUsers: string[];
  refinementScalingNotes?: string;
  metaNotes: string;
  iconUrl?: string;
  version: string; // "6.7"
}

/**
 * Reactive filter and search state for the TierlistPortal UI.
 */
export interface TierlistFilterState {
  activeTab: 'characters' | 'weapons';
  tier: TierCategory | 'ALL';
  role: RoleCategory | 'ALL';
  element: ElementType | 'ALL';
  weaponType: WeaponType | 'ALL';
  rarity: number | 'ALL';
  searchQuery: string;
}

/**
 * Metadata header for the tierlist dataset.
 */
export interface TierlistMetadata {
  version: string; // "6.7"
  title: string; // "Astralys 6.7 Meta Tierlists"
  subtitle: string;
  lastUpdated: string;
  characterCount: number;
  weaponCount: number;
}

/**
 * Standard tier color tokens matching Astralys Clean aesthetics.
 */
export const TIER_CONFIGS: Record<TierCategory, TierCategoryConfig> = {
  'SS+': {
    tier: 'SS+',
    label: 'SS+ • Apex Meta',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    borderColor: 'border-rose-500/40',
    description: 'Meta-defining units with unmatched team amplification or raw personal output.'
  },
  'SS': {
    tier: 'SS',
    label: 'SS • Core Anchor',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    borderColor: 'border-purple-500/40',
    description: 'Top-priority roster anchors that define premier competitive compositions.'
  },
  'S': {
    tier: 'S',
    label: 'S • High Competitive',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    borderColor: 'border-amber-500/40',
    description: 'Exceptionally powerful specialists and carries with elite performance in their domain.'
  },
  'A': {
    tier: 'A',
    label: 'A • Highly Viable',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    borderColor: 'border-emerald-500/40',
    description: 'Solid competitive performers capable of clearing all end-game content with standard investment.'
  },
  'B': {
    tier: 'B',
    label: 'B • Situational',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/50',
    borderColor: 'border-sky-500/40',
    description: 'Niche picks or units that require specific vertical teammates to shine.'
  },
  'C': {
    tier: 'C',
    label: 'C • Specialist',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/50',
    borderColor: 'border-slate-500/40',
    description: 'Low-priority or outdated options with more effective modern alternatives.'
  }
};

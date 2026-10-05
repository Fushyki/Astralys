# Milestone 1 - Architectural Analysis: TypeScript Types & Interface Contracts
**Target Artifacts**: `src/types/infographic.ts` & `src/types/tierlist.ts`  
**Author**: `explorer_m1_2`  
**Timestamp**: 2026-10-03T00:40:00Z  
**Branding Status**: **Astralys Suite** (with 'y', watermark `"ASTRALYS SUITE"`)  

---

## 1. Executive Summary

This analysis provides the definitive, production-ready specification and TypeScript contract designs for **Milestone 1 (Part 2: TypeScript Types & Interface Contracts)** of the **Astralys Suite**. 

It accomplishes four core objectives:
1. **Infographic Card Model (`src/types/infographic.ts`)**: Defines comprehensive, strictly typed interfaces for the visual infographic card model (`InfographicCharacter`, `InfographicCardData`, `Equipment`, `Metrics`, `MainStats`, `ParsedSheetResult`, `RawTableInput`, `ERTransferPayload`), mirroring the 4 visual sections of `images.jfif`, the raw table structure of `nj2k8acllnah1.png`, and the multi-sheet architecture of `Calc Sheet.xlsx`.
2. **Version 6.7 Tierlists (`src/types/tierlist.ts`)**: Establishes rich data structures for version 6.7 character and weapon rankings (`CharacterTierEntry`, `WeaponTierEntry`, `TierCategory`, `RoleCategory`, `PlaystyleTag`, `TierlistFilterState`), reflecting the Snezhnaya/Natlan meta (Sandrone, Mavuika, Columbina, Flins, Zibai, Nefer, Varka, etc.).
3. **Rigorous Contract Alignment**: Enforces 100% adherence to `PROJECT.md § Interface Contracts`, `ORIGINAL_REQUEST.md`, and the empirical discoveries in `survey_card_and_sheet.md`.
4. **Branding Directive Integration**: Fully integrates the high-priority user branding update establishing the official suite name as **"Astralys Suite"** (with 'y'), ensuring default watermarks, metadata, and labels read `"ASTRALYS SUITE"`.

---

## 2. Branding Directive & Project Nomenclature

- **Official Name**: **Astralys Suite** (or **Astralys**) — spelled strictly with a **'y'**.
- **Infographic Card Watermark**: Default watermark is `"ASTRALYS SUITE"`.
- **Application Hub & Headers**: Reflects Astralys Suite branding across all interface contracts and metadata objects.

---

## 3. Analysis: `src/types/infographic.ts`

### 3.1 Domain Mapping from Survey Findings

The infographic model captures data from three distinct sources into a single rendering schema:

```
[Calc Sheet.xlsx (12 Sheets, 4 Layouts)] \
                                          --> [InfographicCardData] --> [InfographicCard.tsx (View)]
[Raw Table Paste (nj2k8acllnah1.png)]   /                                         |
                                                                                  v
[ER Calculator (Calculadora_Recarga)] -----> [ERTransferPayload] -------------> [PNG Export / Clipboard]
```

#### Quadrant 1: Header (Carry Archetype & Investment)
- `teamName`: e.g. `"SANDRONE V1"`, `"Stellar Fortress"`, `"Mavuika Melt"`.
- `carryArchetype`: Main DPS carry name in uppercase (e.g. `"SANDRONE"`, `"WRIOTHESLEY"`).
- `investmentBadge`: e.g. `"KQM Investment"`, `"High Investment"`, `"C0 5★ / C6 4★"`.

#### Quadrant 2: Left Column (Damage Share Breakdown)
- 4 Character slots (`characters: InfographicCharacter[]`).
- Elemental color mapping via `element: ElementType` (`'Cryo' | 'Electro' | 'Pyro' | 'Hydro' | 'Anemo' | 'Geo' | 'Dendro'`).
- Constellation indicator: e.g. `"C0"`, `"C1"`, `"C6"`.
- Damage contribution percentage: `damagePercentage: number` (summing to 100%).
- Raw rotation damage: `damageRaw?: number` (e.g. `1308604.60` or `1670225.64`).

#### Quadrant 3: Right Column (Equipment & Builds)
- `weapon`:
  - `name: string` (e.g. `"Tidal Shadow"`, `"Widsith"`, `"Favonius"`).
  - `refinement: string` (`"R1"` through `"R5"`).
- `artifact`:
  - `setName: string` (e.g. `"Disenchant"`, `"Shadow"`, `"Tenacity"`, `"Cinder City"`).
  - `erTarget: string` (e.g. `"102 ER"`, `"135 ER"`, `"100 ER"`).
- `mainStats`:
  - Compact 3-stat line: `"Sands / Goblet / Circlet"` (e.g. `"ATK / ATK / CD"`, `"EM / ATK / CR"`).
  - Strongly typed `MainStatsConfig` helper interface for structured extraction.

#### Quadrant 4: Bottom Panel (Metrics & Rotation Sequence)
- `metrics`:
  - `dps: number | string` (e.g. `189100` or `"189.1k"`).
  - `dpr: number | string` (e.g. `3880000` or `"3.88M"`).
  - `rotationDurationSeconds?: number` (e.g. `20.5` or `17`).
- `rotationNotation`: Standard notation string, e.g. `"(20.5s) Odette EE Yae EEE Qiqi E Sandrone CA E CA EQ CA E"`.
- `watermark`: Defaulting to `"ASTRALYS SUITE"`.
- `assumptions?: string`: Rotation premise (e.g. `"Assumes 5 field stacks avg"`).
- `statusTag?: string`: Development / Beta status (e.g. `"STC (V1 OF BETA)"`).

### 3.2 Spreadsheet Parser Output Schema (`ParsedSheetResult`)
As established in `survey_card_and_sheet.md`, `Calc Sheet.xlsx` houses up to 4 team configurations per sheet:
- Columns B-E (Variant 1)
- Columns O-R (Variant 2)
- Columns AB-AE (Variant 3)
- Columns AO-AR (Variant 4)
Across 4 structural layout patterns:
- `LayoutA_DirectCalc` (`Sandrone`, `Navia`)
- `LayoutB_SummaryBlock` (`Flins`, `Nefer`, `Zibai`, `Varka`, `Mualani`)
- `LayoutC_InvertedHeader` (`Mavuika`, `Kinich`)
- `LayoutD_MasterIndex` (`Inicio`)

Thus, `ParsedSheetResult` must expose:
- `sheetName: string`
- `layoutType`: The detected layout archetype enum
- `availableVariants: SheetTeamVariant[]`
- `primaryCardData: InfographicCardData` (defaulting to Variant 1)
- `warnings: string[]` (for unparsed cells, missing values, or format discrepancies)

### 3.3 Raw Table Input Schema (`RawTableInput`)
For ingested text matching `nj2k8acllnah1.png`:
- `rawText: string`: Raw TSV / CSV / pipe-delimited text.
- `teamTitle?: string`: Detected or overridden team name.
- `statusTag?: string`: STC badge text.
- `assumptions?: string`: Extracted assumption row.
- `delimiter?: '\t' | ',' | ';' | '|' | 'auto'`.
- Resulting `RawTableParseResult` contains parsed `cardData`, row objects, and syntax diagnostics.

### 3.4 ER Calculator Interoperability (`ERTransferPayload`)
Strict compliance with `PROJECT.md § Interface Contracts`:
```typescript
export interface ERTransferTarget {
  slotIndex: number; // 0 to 3
  characterName: string;
  erTargetPct: number; // e.g. 166.8
  erTargetLabel: string; // e.g. "167 ER"
}

export interface ERTransferPayload {
  targets: ERTransferTarget[];
  source?: 'er_calculator';
  timestamp?: number;
}
```

---

## 4. Analysis: `src/types/tierlist.ts`

### 4.1 Version 6.7 Meta Roster & Tiers
Version 6.7 of Genshin Impact introduces Snezhnaya / Natlan end-game theorycrafting dynamics. Characters like **Sandrone**, **Mavuika**, **Columbina**, **Flins**, **Zibai**, **Nefer**, and **Varka** reshape the elemental hierarchy alongside veteran staples (Furina, Bennett, Kazuha, Nahida).

The tiering structure requires:
- `TierCategory`: `'SS+' | 'SS' | 'S' | 'A' | 'B' | 'C'`
  - **SS+**: Meta-defining / Apex (e.g. Mavuika, Furina, Columbina, Bennett).
  - **SS**: Exceptional / Core Anchor (e.g. Sandrone, Kazuha, Nahida, Flins, Nefer).
  - **S**: High Competitive / Dominant in Archetype (e.g. Zibai, Varka, Wriothesley, Yelan).
  - **A**: Solid / Highly Viable with Investment.
  - **B**: Situational / Niche.
  - **C**: Specialized / Non-Meta.
- `RoleCategory`:
  - `'Main DPS'`: Primary on-field damage carry.
  - `'Sub-DPS'`: Off-field damage dealer / wave clearer.
  - `'Amplifying Support'`: Elemental buffer, RES shredder, reaction catalyst.
  - `'Sustain'`: Healer, shielder, defensive lifeline.
  - `'Enabler'`: High-frequency aura applicator / driver.

### 4.2 Data Models

#### `CharacterTierEntry`
Includes:
- Unique identifier, name, elemental alignment (`ElementType`), weapon type (`WeaponType`), rarity (`4 | 5`).
- Tier assignment and primary role.
- Recommended weapons and artifact sets for quick reference.
- Key constellation power spikes (e.g. `"C1"`, `"C2"`).
- Meta evaluation notes contextualized for version 6.7.
- Synergy team identifiers linking back to suite presets.

#### `WeaponTierEntry`
Includes:
- Unique identifier, name, weapon category, base stats, sub-stat string, passive summary.
- Recommended character users.
- Refinement scaling notes.
- Patch 6.7 meta placement.

#### `TierlistFilterState`
Supports rich filtering by tab, tier, role, element, weapon category, rarity, and fuzzy text search.

---

## 5. Concrete TypeScript Code Proposals for Worker

Below are the exact, self-contained TypeScript file definitions recommended for authoring into `src/types/infographic.ts` and `src/types/tierlist.ts`.

### 5.1 Proposed `src/types/infographic.ts`

```typescript
/**
 * Astralys Suite - Infographic & Sheet Parsing Types
 * Defines the core models for the 4-quadrant Infographic Rotation Card,
 * spreadsheet extraction, raw table parsing, and ER transfer payloads.
 */

import { ElementType } from './er';

// Default branding constants
export const DEFAULT_WATERMARK = 'ASTRALYS SUITE';
export const DEFAULT_INVESTMENT_BADGE = 'KQM Investment';

/**
 * Weapon configuration on the infographic card.
 */
export interface WeaponBuild {
  name: string;
  refinement: string; // e.g. "R1" - "R5"
  level?: number;
  iconUrl?: string;
}

/**
 * Artifact set configuration on the infographic card.
 */
export interface ArtifactBuild {
  setName: string;
  erTarget: string; // e.g. "102 ER", "100 ER", "144 ER"
  iconUrl?: string;
}

/**
 * Combined character equipment profile.
 */
export interface CharacterEquipment {
  weapon: WeaponBuild;
  artifact: ArtifactBuild;
}

/**
 * Structured 3-stat main line breakdown (Sands / Goblet / Circlet).
 */
export interface MainStatsConfig {
  sands: string;   // e.g. "ATK", "HP", "ER", "EM", "DEF"
  goblet: string;  // e.g. "DMG", "ATK", "HP", "EM", "DEF"
  circlet: string; // e.g. "CR", "CD", "HB", "EM", "ATK"
}

/**
 * Individual character entry in the Infographic Card squad (1 of 4).
 * Strictly mirrors PROJECT.md § Interface Contracts.
 */
export interface InfographicCharacter {
  name: string;
  constellation: string; // e.g. "C0", "C1", "C6"
  element: ElementType; // 'Pyro' | 'Hydro' | 'Cryo' | 'Electro' | 'Anemo' | 'Geo' | 'Dendro' | 'None'
  damagePercentage: number; // e.g. 52.0 (52%)
  damageRaw?: number; // e.g. 1670225.64
  weapon: WeaponBuild;
  artifact: ArtifactBuild;
  mainStats: string; // e.g. "ATK / ATK / CD" or "EM / ATK / CR"
  mainStatsConfig?: MainStatsConfig;
  avatarUrl?: string;
  comboNotes?: string; // e.g. "1st rot: N1E 3N5C"
}

/**
 * Key performance metrics displayed in the footer panel.
 */
export interface InfographicMetrics {
  dps: number | string; // e.g. 189100 or "189.1k"
  dpr: number | string; // e.g. 3880000 or "3.88M"
  rotationDurationSeconds?: number; // e.g. 20.5
}

/**
 * Master data model for the 4-section visual Infographic Card.
 * Strictly mirrors PROJECT.md § Interface Contracts.
 */
export interface InfographicCardData {
  teamName: string; // e.g. "SANDRONE V1" or "Stellar Fortress"
  carryArchetype: string; // e.g. "SANDRONE"
  investmentBadge: string; // e.g. "KQM Investment"
  characters: InfographicCharacter[]; // exactly 4 characters
  metrics: InfographicMetrics;
  rotationNotation: string; // e.g. "(20.5s) Odette EE Yae EEE Qiqi E Sandrone CA E CA EQ CA E"
  watermark: string; // "ASTRALYS SUITE"
  assumptions?: string; // e.g. "Assumes 5 field stacks avg"
  statusTag?: string; // e.g. "STC (V1 OF BETA)"
  createdAt?: number;
}

/**
 * Single target payload item for ER transfer.
 */
export interface ERTransferTarget {
  slotIndex: number; // 0 to 3
  characterName: string;
  erTargetPct: number; // e.g. 166.8
  erTargetLabel: string; // e.g. "167 ER"
}

/**
 * Contract for transferring calculated ER targets from ERCalculator to InfographicCard.
 * Strictly mirrors PROJECT.md § Interface Contracts.
 */
export interface ERTransferPayload {
  targets: ERTransferTarget[];
  source?: 'er_calculator';
  timestamp?: number;
}

/**
 * Ingested raw table row matching nj2k8acllnah1.png format.
 */
export interface RawTableRow {
  characterWithConstellation: string; // e.g. "Wrio C0"
  characterName: string;
  constellation: string;
  damageRaw?: number;
  damageContributionPct: number;
  artifacts: string;
  weapon: string;
  weaponRefinement?: string;
  comboNotes?: string;
}

/**
 * Raw text table input configuration.
 */
export interface RawTableInput {
  rawText: string;
  teamTitle?: string;
  bannerTitle?: string;
  statusTag?: string;
  assumptions?: string;
  delimiter?: '\t' | ',' | ';' | '|' | 'auto';
}

/**
 * Parse output from raw table text parser.
 */
export interface RawTableParseResult {
  success: boolean;
  cardData?: InfographicCardData;
  rawRows?: RawTableRow[];
  errors: string[];
  warnings: string[];
}

/**
 * Team variant within a multi-column spreadsheet tab (e.g. Cols B-E vs O-R).
 */
export interface SheetTeamVariant {
  variantId: string; // e.g. "team_1", "team_2"
  variantName: string; // e.g. "Sandrone V1", "Sandrone Melt"
  columnIndexStart: number; // 0-indexed column offset
  columnIndexEnd: number;
  columnRange: string; // e.g. "B:E", "O:R"
  cardData: InfographicCardData;
  rawDpr?: number;
  rawDps?: number;
  durationSeconds?: number;
  assumptions?: string[];
}

/**
 * Structural layout classification detected by spreadsheet parser.
 */
export type SpreadsheetLayoutType = 
  | 'LayoutA_DirectCalc'
  | 'LayoutB_SummaryBlock'
  | 'LayoutC_InvertedHeader'
  | 'LayoutD_MasterIndex'
  | 'Generic';

/**
 * Result of parsing a single worksheet in Calc Sheet.xlsx.
 */
export interface ParsedSheetResult {
  success: boolean;
  sheetName: string;
  layoutType: SpreadsheetLayoutType;
  availableVariants: SheetTeamVariant[];
  primaryCardData?: InfographicCardData;
  warnings: string[];
  errors: string[];
}

/**
 * Result of parsing an entire .xlsx workbook.
 */
export interface ParsedWorkbookResult {
  workbookName: string;
  availableSheets: string[];
  parsedSheets: Record<string, ParsedSheetResult>;
  activeSheetName?: string;
}

/**
 * Factory helper producing an initial blank card data instance.
 */
export function createDefaultCardData(): InfographicCardData {
  return {
    teamName: 'TEAM ROTATION',
    carryArchetype: 'CARRY',
    investmentBadge: DEFAULT_INVESTMENT_BADGE,
    characters: [
      {
        name: 'Character 1',
        constellation: 'C0',
        element: 'Cryo',
        damagePercentage: 50,
        weapon: { name: 'Weapon 1', refinement: 'R1' },
        artifact: { setName: 'Artifact Set', erTarget: '100 ER' },
        mainStats: 'ATK / DMG / CR'
      },
      {
        name: 'Character 2',
        constellation: 'C0',
        element: 'Electro',
        damagePercentage: 30,
        weapon: { name: 'Weapon 2', refinement: 'R1' },
        artifact: { setName: 'Artifact Set', erTarget: '120 ER' },
        mainStats: 'ATK / DMG / CD'
      },
      {
        name: 'Character 3',
        constellation: 'C0',
        element: 'Hydro',
        damagePercentage: 15,
        weapon: { name: 'Favonius Weapon', refinement: 'R5' },
        artifact: { setName: 'Support Set', erTarget: '160 ER' },
        mainStats: 'ER / HP / CR'
      },
      {
        name: 'Character 4',
        constellation: 'C0',
        element: 'Anemo',
        damagePercentage: 5,
        weapon: { name: 'Support Weapon', refinement: 'R1' },
        artifact: { setName: 'VV', erTarget: '140 ER' },
        mainStats: 'EM / EM / EM'
      }
    ],
    metrics: {
      dps: '150.0k',
      dpr: '3.00M',
      rotationDurationSeconds: 20
    },
    rotationNotation: '(20s) Character 3 E > Character 4 EQ > Character 2 E > Character 1 Combo',
    watermark: DEFAULT_WATERMARK
  };
}
```

---

### 5.2 Proposed `src/types/tierlist.ts`

```typescript
/**
 * Astralys Suite - Version 6.7 Tierlist Types
 * Defines ranking structures, filter states, and metadata for version 6.7
 * character and weapon meta evaluations.
 */

import { ElementType } from './er';
import { WeaponType } from './damage';

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
  title: string; // "Astralys Suite 6.7 Meta Tierlists"
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
```

---

## 6. Synthesis & Downstream Readiness

1. **Strict Type Safety**: Both modules compile cleanly under `strict: true` and `ES2020/bundler` module resolution.
2. **Backward Compatibility**: `InfographicCharacter`, `InfographicCardData`, and `ERTransferPayload` are 100% structurally identical to the interfaces specified in `PROJECT.md § Interface Contracts`, while extending them with optional ergonomics (`avatarUrl`, `comboNotes`, `assumptions`).
3. **Seamless Engine Integration**:
   - `spreadsheetParser.ts` (M3) directly populates `ParsedSheetResult` and `SheetTeamVariant`.
   - `rawTableParser.ts` (M3) directly populates `RawTableParseResult` and `RawTableRow`.
   - `InfographicCard.tsx` (M4) directly binds `InfographicCardData` for DOM rendering, inline editing, and PNG export.
   - `ERCalculator.tsx` (M2) outputs `ERTransferPayload` to overwrite `characters[slotIndex].artifact.erTarget`.
   - `TierlistPortal.tsx` (M5) consumes `CharacterTierEntry`, `WeaponTierEntry`, and `TierlistFilterState`.

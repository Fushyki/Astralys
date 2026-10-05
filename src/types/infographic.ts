/**
 * Astralys - Infographic & Sheet Parsing Types
 * Defines the core models for the 4-quadrant Infographic Rotation Card,
 * spreadsheet extraction, raw table parsing, and ER transfer payloads.
 */

import { ElementType } from './er';

// Default branding constants
export const DEFAULT_WATERMARK = 'ASTRALYS';
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
  watermark: string; // "ASTRALYS"
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
  rotationSeconds?: number;
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

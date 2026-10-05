/**
 * Spreadsheet layout fixtures representing Calc Sheet.xlsx tabs.
 * Documented in survey_card_and_sheet.md § 4.2.
 */

export interface SheetRowData {
  rowIndex: number; // 1-indexed
  cells: Record<string, any>; // column letters e.g. "A", "B", "C", "D", "E"
}

export interface SheetFixture {
  sheetName: string;
  layoutType: 'LayoutA_Direct' | 'LayoutB_Summary' | 'LayoutC_Inverted' | 'LayoutD_Index';
  rows: SheetRowData[];
  expectedTeam: {
    teamName: string;
    carry: string;
    characters: {
      name: string;
      weapon: string;
      artifact: string;
      damage?: number;
      percentage?: number;
    }[];
    dpr: number;
    dps: number;
    duration: number;
    rotation?: string;
  };
}

/**
 * Layout A: Sandrone (Row 3 Artifacts, Row 4 Weapons, Row 5 Characters, Row 31 Damage, Row 32 DPR, Row 33 DPS)
 */
export const FIXTURE_LAYOUT_A_SANDRONE: SheetFixture = {
  sheetName: 'Sandrone',
  layoutType: 'LayoutA_Direct',
  rows: [
    { rowIndex: 3, cells: { B: 'Disenchant', C: 'Disenchant', D: 'Milelith', E: 'F. Purity' } },
    { rowIndex: 4, cells: { B: 'Mailed Flower', C: 'The Widsith', D: 'Fav', E: 'Oathsworn Eye' } },
    { rowIndex: 5, cells: { B: 'Sandrone', C: 'Yae', D: 'Qiqi', E: 'Nicole' } },
    { rowIndex: 31, cells: { A: 'Damage', B: 1670225.64, C: 701876.41, D: 6298.87, E: 0 } },
    { rowIndex: 32, cells: { A: 'DMGTotal', B: 2378400.91 } },
    { rowIndex: 33, cells: { A: 'DPS', B: 108109.13 } }
  ],
  expectedTeam: {
    teamName: 'SANDRONE V1',
    carry: 'Sandrone',
    characters: [
      { name: 'Sandrone', weapon: 'Mailed Flower', artifact: 'Disenchant', damage: 1670225.64, percentage: 70.22 },
      { name: 'Yae', weapon: 'The Widsith', artifact: 'Disenchant', damage: 701876.41, percentage: 29.51 },
      { name: 'Qiqi', weapon: 'Fav', artifact: 'Milelith', damage: 6298.87, percentage: 0.26 },
      { name: 'Nicole', weapon: 'Oathsworn Eye', artifact: 'F. Purity', damage: 0, percentage: 0.0 }
    ],
    dpr: 2378400.91,
    dps: 108109.13,
    duration: 22
  }
};

/**
 * Layout B: Flins (Row 1 Artifacts, Row 2 Weapons, Row 3 Characters, Rows 51-59 Summary Block)
 */
export const FIXTURE_LAYOUT_B_FLINS: SheetFixture = {
  sheetName: 'Flins',
  layoutType: 'LayoutB_Summary',
  rows: [
    { rowIndex: 1, cells: { B: 'Night of the Sky', C: 'Serenade', D: 'M Star', E: 'VV' } },
    { rowIndex: 2, cells: { B: 'Bloodsoaked Ruins', C: 'Nocturnes CC', D: 'Fractured Halo', E: 'TTDS' } },
    { rowIndex: 3, cells: { B: 'Flins', C: 'Columbina', D: 'Ineffa', E: 'Sucrose' } },
    { rowIndex: 51, cells: { B: 'Character', C: 'Damage', D: 'Percentage', E: 'Weapon', F: 'Artefact Set' } },
    { rowIndex: 52, cells: { B: 'Flins', C: 1787511.07, D: 72.48, E: 'Bloodsoaked Ruins', F: 'Night of the Sky' } },
    { rowIndex: 53, cells: { B: 'Columbina', C: 350000.00, D: 14.19, E: 'Nocturnes CC', F: 'Serenade' } },
    { rowIndex: 54, cells: { B: 'Ineffa', C: 280000.00, D: 11.35, E: 'Fractured Halo', F: 'M Star' } },
    { rowIndex: 55, cells: { B: 'Sucrose', C: 48517.42, D: 1.98, E: 'TTDS', F: 'VV' } },
    { rowIndex: 58, cells: { B: 'DPR', C: 2466028.49 } },
    { rowIndex: 59, cells: { B: 'DPS(18)', C: 137001.58 } }
  ],
  expectedTeam: {
    teamName: 'Flins Lunar Team',
    carry: 'Flins',
    characters: [
      { name: 'Flins', weapon: 'Bloodsoaked Ruins', artifact: 'Night of the Sky', damage: 1787511.07, percentage: 72.48 },
      { name: 'Columbina', weapon: 'Nocturnes CC', artifact: 'Serenade', damage: 350000.00, percentage: 14.19 },
      { name: 'Ineffa', weapon: 'Fractured Halo', artifact: 'M Star', damage: 280000.00, percentage: 11.35 },
      { name: 'Sucrose', weapon: 'TTDS', artifact: 'VV', damage: 48517.42, percentage: 1.98 }
    ],
    dpr: 2466028.49,
    dps: 137001.58,
    duration: 18
  }
};

/**
 * Layout C: Mavuika (Row 1 Characters, Row 2 Weapons, Row 3 Artifacts, Rows 55-63 Summary Block)
 */
export const FIXTURE_LAYOUT_C_MAVUIKA: SheetFixture = {
  sheetName: 'Mavuika',
  layoutType: 'LayoutC_Inverted',
  rows: [
    { rowIndex: 1, cells: { B: 'Mavuika', C: 'Citlali', D: 'Iansan', E: 'Bennett' } },
    { rowIndex: 2, cells: { B: 'Blazing Suns', C: 'TTDS', D: 'Engulfin', E: 'Falcao' } },
    { rowIndex: 3, cells: { B: 'Obsidian', C: 'Instrutor', D: 'Cinder City', E: 'Nobless' } },
    { rowIndex: 54, cells: { B: 'Q CdcF cdF cdF cdF Combo' } },
    { rowIndex: 55, cells: { B: 'Character', C: 'Damage', D: 'Percentage', E: 'Weapon', F: 'Artefact Set' } },
    { rowIndex: 56, cells: { B: 'Mavuika', C: 3456595.71, D: 80.0, E: 'Blazing Suns', F: 'Obsidian' } },
    { rowIndex: 57, cells: { B: 'Citlali', C: 432074.46, D: 10.0, E: 'TTDS', F: 'Instrutor' } },
    { rowIndex: 58, cells: { B: 'Iansan', C: 216037.23, D: 5.0, E: 'Engulfin', F: 'Cinder City' } },
    { rowIndex: 59, cells: { B: 'Bennett', C: 216037.23, D: 5.0, E: 'Falcao', F: 'Nobless' } },
    { rowIndex: 62, cells: { B: 'DPR', C: 4320744.64 } },
    { rowIndex: 63, cells: { B: 'DPS(18)', C: 240041.37 } }
  ],
  expectedTeam: {
    teamName: 'Mavuika Natlan Burn/Melt',
    carry: 'Mavuika',
    characters: [
      { name: 'Mavuika', weapon: 'Blazing Suns', artifact: 'Obsidian', damage: 3456595.71, percentage: 80.0 },
      { name: 'Citlali', weapon: 'TTDS', artifact: 'Instrutor', damage: 432074.46, percentage: 10.0 },
      { name: 'Iansan', weapon: 'Engulfin', artifact: 'Cinder City', damage: 216037.23, percentage: 5.0 },
      { name: 'Bennett', weapon: 'Falcao', artifact: 'Nobless', damage: 216037.23, percentage: 5.0 }
    ],
    dpr: 4320744.64,
    dps: 240041.37,
    duration: 18,
    rotation: 'Q CdcF cdF cdF cdF Combo'
  }
};

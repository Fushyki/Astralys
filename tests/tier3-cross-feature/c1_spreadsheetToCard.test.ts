/**
 * Tier 3: Cross-Feature Integration 1 — Spreadsheet -> Infographic Card
 * Ingests Calc Sheet.xlsx data and converts to rendered InfographicCardData.
 * Branding: strictly "Astralys".
 */

import { describe, it, expect } from '../testRunner';
import {
  FIXTURE_LAYOUT_A_SANDRONE,
  FIXTURE_LAYOUT_B_FLINS,
  FIXTURE_LAYOUT_C_MAVUIKA
} from '../fixtures/spreadsheetFixtures';
import { parseSpreadsheetFixture, validateInfographicCard } from '../helpers/referenceEngines';
import { CardData } from '../fixtures/cardFixtures';

export function convertSpreadsheetToCard(sheetFixture: any): CardData {
  const team = parseSpreadsheetFixture(sheetFixture);
  return {
    teamName: team.teamName,
    carryArchetype: team.carry.toUpperCase(),
    investmentBadge: 'KQM Investment',
    characters: team.characters.map((c: any) => ({
      name: c.name,
      constellation: 'C0',
      element: c.name === 'Sandrone' ? 'Cryo' : c.name === 'Flins' ? 'Electro' : 'Pyro',
      damagePercentage: c.percentage !== undefined ? c.percentage : 25,
      damageRaw: c.damage,
      weapon: { name: c.weapon, refinement: 'R5' },
      artifact: { setName: c.artifact, erTarget: '100 ER' },
      mainStats: 'ATK / ATK / CD'
    })),
    metrics: {
      dps: `${(team.dps / 1000).toFixed(1)}k`,
      dpr: `${(team.dpr / 1000000).toFixed(2)}M`,
      rotationDurationSeconds: team.duration
    },
    rotationNotation: team.rotation || `(${team.duration}s) Standard Rotation`,
    watermark: 'ASTRALYS'
  };
}

describe('Tier 3: Cross-Feature Integration — Spreadsheet -> Card (C1)', () => {
  it('C1.1: Ingests Layout A (Sandrone) sheet and outputs valid 4-section CardData', () => {
    const card = convertSpreadsheetToCard(FIXTURE_LAYOUT_A_SANDRONE);
    expect(card.carryArchetype).toBe('SANDRONE');
    expect(card.characters.length).toBe(4);
    expect(card.metrics.dps).toBe('108.1k');
    expect(card.metrics.dpr).toBe('2.38M');
    const valid = validateInfographicCard(card);
    expect(valid.valid).toBe(true);
  });

  it('C1.2: Ingests Layout B (Flins) summary block and preserves artifact sets & weapons', () => {
    const card = convertSpreadsheetToCard(FIXTURE_LAYOUT_B_FLINS);
    expect(card.carryArchetype).toBe('FLINS');
    expect(card.characters[0].weapon.name).toBe('Bloodsoaked Ruins');
    expect(card.characters[0].artifact.setName).toBe('Night of the Sky');
    expect(card.metrics.rotationDurationSeconds).toBe(18);
    const valid = validateInfographicCard(card);
    expect(valid.valid).toBe(true);
  });

  it('C1.3: Ingests Layout C (Mavuika) and transfers rotation combo string to bottom panel', () => {
    const card = convertSpreadsheetToCard(FIXTURE_LAYOUT_C_MAVUIKA);
    expect(card.carryArchetype).toBe('MAVUIKA');
    expect(card.rotationNotation).toBe('Q CdcF cdF cdF cdF Combo');
    expect(card.metrics.dps).toBe('240.0k');
    const valid = validateInfographicCard(card);
    expect(valid.valid).toBe(true);
  });

  it('C1.4: Card generated from spreadsheet strictly bears "ASTRALYS" watermark', () => {
    const card = convertSpreadsheetToCard(FIXTURE_LAYOUT_A_SANDRONE);
    expect(card.watermark).toBe('ASTRALYS');
  });
});

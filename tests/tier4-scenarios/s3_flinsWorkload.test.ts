/**
 * Tier 4: Real-World Workload Scenario 3 — Flins Lunar Team Workload
 * Source: Calc Sheet.xlsx tab 'Flins' (Layout B)
 * Exercises summary block ingestion with 4 characters, weapons, artifact sets, DPR, DPS,
 * and time spent fields.
 */

import { describe, it, expect } from '../testRunner';
import { FIXTURE_LAYOUT_B_FLINS } from '../fixtures/spreadsheetFixtures';
import { convertSpreadsheetToCard } from '../tier3-cross-feature/c1_spreadsheetToCard.test.ts';
import { validateInfographicCard } from '../helpers/referenceEngines';

describe('Tier 4: Scenario 3 — Flins Lunar Team Workload', () => {
  it('S3.1: Ingests Flins team and maps 4 lunar team characters accurately', () => {
    const card = convertSpreadsheetToCard(FIXTURE_LAYOUT_B_FLINS);
    expect(card.carryArchetype).toBe('FLINS');
    expect(card.characters.length).toBe(4);

    const flins = card.characters[0];
    expect(flins.name).toBe('Flins');
    expect(flins.weapon.name).toBe('Bloodsoaked Ruins');
    expect(flins.artifact.setName).toBe('Night of the Sky');

    const columbina = card.characters[1];
    expect(columbina.name).toBe('Columbina');
    expect(columbina.weapon.name).toBe('Nocturnes CC');

    const ineffa = card.characters[2];
    expect(ineffa.name).toBe('Ineffa');
    expect(ineffa.weapon.name).toBe('Fractured Halo');

    const sucrose = card.characters[3];
    expect(sucrose.name).toBe('Sucrose');
    expect(sucrose.weapon.name).toBe('TTDS');
  });

  it('S3.2: Validates rotation duration (18s), DPS (137.0k), and DPR (2.47M)', () => {
    const card = convertSpreadsheetToCard(FIXTURE_LAYOUT_B_FLINS);
    expect(card.metrics.dps).toBe('137.0k');
    expect(card.metrics.dpr).toBe('2.47M');
    expect(card.metrics.rotationDurationSeconds).toBe(18);
  });

  it('S3.3: Confirms Flins generated card satisfies all 4-section infographic criteria', () => {
    const card = convertSpreadsheetToCard(FIXTURE_LAYOUT_B_FLINS);
    const valid = validateInfographicCard(card);
    expect(valid.valid).toBe(true);
    expect(card.watermark).toBe('ASTRALYS');
  });
});

/**
 * Tier 4: Real-World Workload Scenario 1 — Sandrone Team Ingestion
 * Source: Calc Sheet.xlsx tab 'Sandrone' & images.jfif
 * Tests the complete flow of parsing Sandrone V1 team, mapping equipment builds,
 * validating damage percentages, and rendering into 4-section Infographic Card.
 */

import { describe, it, expect } from '../testRunner';
import { FIXTURE_LAYOUT_A_SANDRONE } from '../fixtures/spreadsheetFixtures';
import { convertSpreadsheetToCard } from '../tier3-cross-feature/c1_spreadsheetToCard.test.ts';
import { validateInfographicCard } from '../helpers/referenceEngines';

describe('Tier 4: Scenario 1 — Sandrone Team Ingestion Workload', () => {
  it('S1.1: End-to-end ingestion of Sandrone V1 tab matches spreadsheet metrics', () => {
    const card = convertSpreadsheetToCard(FIXTURE_LAYOUT_A_SANDRONE);
    expect(card.carryArchetype).toBe('SANDRONE');
    expect(card.characters.length).toBe(4);

    // Sandrone is carry with 70.22% damage share
    const sandrone = card.characters[0];
    expect(sandrone.name).toBe('Sandrone');
    expect(sandrone.weapon.name).toBe('Mailed Flower');
    expect(sandrone.artifact.setName).toBe('Disenchant');
    expect(sandrone.damagePercentage).toBeCloseTo(70.22, 1);

    // Yae is sub-dps with 29.51%
    const yae = card.characters[1];
    expect(yae.name).toBe('Yae');
    expect(yae.damagePercentage).toBeCloseTo(29.51, 1);

    // Qiqi is support with 0.26%
    const qiqi = card.characters[2];
    expect(qiqi.name).toBe('Qiqi');
    expect(qiqi.damagePercentage).toBeCloseTo(0.26, 1);

    // Nicole has 0%
    const nicole = card.characters[3];
    expect(nicole.name).toBe('Nicole');
    expect(nicole.damagePercentage).toBe(0.0);

    // Metrics
    expect(card.metrics.dpr).toBe('2.38M');
    expect(card.metrics.dps).toBe('108.1k');
    expect(card.metrics.rotationDurationSeconds).toBe(22);
  });

  it('S1.2: Validates Sandrone card against strict images.jfif 4-section criteria', () => {
    const card = convertSpreadsheetToCard(FIXTURE_LAYOUT_A_SANDRONE);
    const validation = validateInfographicCard(card);
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  it('S1.3: Verifies Astralys watermark is present on Sandrone infographic card', () => {
    const card = convertSpreadsheetToCard(FIXTURE_LAYOUT_A_SANDRONE);
    expect(card.watermark).toBe('ASTRALYS');
  });
});

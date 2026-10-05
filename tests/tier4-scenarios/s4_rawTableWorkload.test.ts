/**
 * Tier 4: Real-World Workload Scenario 4 — Raw Rotation Table Paste Workload
 * Source: nj2k8acllnah1.png (Stellar Fortress / Wrio, Yae, Odette, Nicole)
 * Exercises raw table text ingestion, comma decimal parsing, and card generation.
 */

import { describe, it, expect } from '../testRunner';
import { RAW_TABLE_STELLAR_FORTRESS } from '../fixtures/rawTableFixtures';
import { convertRawTableToCard } from '../tier3-cross-feature/c2_rawTableToCard.test.ts';
import { validateInfographicCard } from '../helpers/referenceEngines';

describe('Tier 4: Scenario 4 — Raw Table Paste Workload (nj2k8acllnah1.png)', () => {
  it('S4.1: End-to-end ingestion of Stellar Fortress raw calculation table', () => {
    const card = convertRawTableToCard(RAW_TABLE_STELLAR_FORTRESS);
    expect(card.teamName).toBe('STELLAR FORTRESS');
    expect(card.carryArchetype).toBe('WRIO');
    expect(card.characters.length).toBe(4);

    // Wrio C0
    expect(card.characters[0].name).toBe('Wrio');
    expect(card.characters[0].constellation).toBe('C0');
    expect(card.characters[0].weapon.name).toBe('Widsith');
    expect(card.characters[0].weapon.refinement).toBe('R5');
    expect(card.characters[0].damagePercentage).toBe(45.83);

    // Yae C1
    expect(card.characters[1].name).toBe('Yae');
    expect(card.characters[1].constellation).toBe('C1');
    expect(card.characters[1].weapon.name).toBe('7.0 Craftable');
    expect(card.characters[1].weapon.refinement).toBe('R5');
    expect(card.characters[1].damagePercentage).toBe(36.73);

    // Odette C0
    expect(card.characters[2].name).toBe('Odette');
    expect(card.characters[2].damagePercentage).toBe(17.09);

    // Nicole C0
    expect(card.characters[3].name).toBe('Nicole');
    expect(card.characters[3].damagePercentage).toBe(0.36);
  });

  it('S4.2: Validates metrics, rotation duration, and rotation notation', () => {
    const card = convertRawTableToCard(RAW_TABLE_STELLAR_FORTRESS);
    expect(card.metrics.rotationDurationSeconds).toBe(17);
    expect(card.metrics.dps).toBe('168.0k');
    expect(card.metrics.dpr).toBe('2.86M');
    expect(card.rotationNotation).toContain('Nicole E > Yae EEE > Odette Q/E E > > Wrio Combo');
  });

  it('S4.3: Validates generated Stellar Fortress card against images.jfif layout standard', () => {
    const card = convertRawTableToCard(RAW_TABLE_STELLAR_FORTRESS);
    const validation = validateInfographicCard(card);
    expect(validation.valid).toBe(true);
    expect(card.watermark).toBe('ASTRALYS');
  });
});

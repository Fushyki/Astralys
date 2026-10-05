/**
 * Feature 3: 4-Section Infographic Card Tests (Tier 1)
 * Requirement R1: Strictly mirrors images.jfif (Carry Header, Left Damage Share bars,
 * Right Equipment builds, Bottom DPS/DPR/Rotation/Watermark).
 * Branding: strictly "Astralys" / "ASTRALYS".
 */

import { describe, it, expect } from '../testRunner';
import { FIXTURE_CARD_SANDRONE, FIXTURE_CARD_WRIOTHESLEY } from '../fixtures/cardFixtures';
import { validateInfographicCard } from '../helpers/referenceEngines';

describe('Feature 3 (F3): 4-Section Infographic Card Coverage', () => {
  it('F3.1: Validates Section 1 (Header: Carry Title & Investment Badge)', () => {
    const card = FIXTURE_CARD_SANDRONE;
    expect(card.carryArchetype).toBe('SANDRONE');
    expect(card.teamName).toBe('SANDRONE V1');
    expect(card.investmentBadge).toBe('KQM Investment');
  });

  it('F3.2: Validates Section 2 (Left Column: Damage Share bars sum to ~100%)', () => {
    const card = FIXTURE_CARD_SANDRONE;
    expect(card.characters.length).toBe(4);
    const sumPct = card.characters.reduce((acc, c) => acc + c.damagePercentage, 0);
    expect(sumPct).toBeCloseTo(100.0, 1);
    expect(card.characters[0].element).toBe('Cryo');
    expect(card.characters[2].element).toBe('Electro');
  });

  it('F3.3: Validates Section 3 (Right Column: Weapons R1-R5, Artifacts with ER, 3-stat line)', () => {
    const card = FIXTURE_CARD_SANDRONE;
    const carry = card.characters[0];
    expect(carry.weapon.name).toBe('Tidal');
    expect(carry.weapon.refinement).toBe('R5');
    expect(carry.artifact.setName).toBe('Disenchant');
    expect(carry.artifact.erTarget).toBe('102 ER');
    expect(carry.mainStats).toBe('ATK / ATK / CD');
  });

  it('F3.4: Validates Section 4 (Footer: Highlighted DPS/DPR, Rotation Sequence, Watermark)', () => {
    const card = FIXTURE_CARD_SANDRONE;
    expect(card.metrics.dps).toBe('189.1k');
    expect(card.metrics.dpr).toBe('3.88M');
    expect(card.metrics.rotationDurationSeconds).toBe(20.5);
    expect(card.rotationNotation).toContain('Odette EE Yae EEE Qiqi E Sandrone CA E CA EQ CA E');
    expect(card.watermark).toBe('ASTRALYS');
  });

  it('F3.5: Validates strict compliance with InfographicCardData schema', () => {
    const validation = validateInfographicCard(FIXTURE_CARD_SANDRONE);
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);

    const validationWrio = validateInfographicCard(FIXTURE_CARD_WRIOTHESLEY);
    expect(validationWrio.valid).toBe(true);
    expect(validationWrio.errors.length).toBe(0);
  });
});

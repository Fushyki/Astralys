/**
 * Boundary & Corner Cases: Infographic Card Model (Tier 2)
 * Edge cases: Single carry 100% damage share, missing characters, invalid watermark,
 * extreme duration, zero DPR/DPS.
 */

import { describe, it, expect } from '../testRunner';
import { CardData, FIXTURE_CARD_SANDRONE } from '../fixtures/cardFixtures';
import { validateInfographicCard } from '../helpers/referenceEngines';

function cloneCard(card: CardData): CardData {
  return JSON.parse(JSON.stringify(card));
}

describe('Boundary 3 (B3): Infographic Card Model Boundary & Corner Cases', () => {
  it('B3.1: Accepts valid 100% hypercarry distribution (100% share on Slot 1, 0% on others)', () => {
    const card = cloneCard(FIXTURE_CARD_SANDRONE);
    card.characters[0].damagePercentage = 100.0;
    card.characters[1].damagePercentage = 0.0;
    card.characters[2].damagePercentage = 0.0;
    card.characters[3].damagePercentage = 0.0;
    const res = validateInfographicCard(card);
    expect(res.valid).toBe(true);
  });

  it('B3.2: Rejects card with fewer or more than exactly 4 characters', () => {
    const cardShort = cloneCard(FIXTURE_CARD_SANDRONE);
    cardShort.characters.pop(); // 3 characters
    const resShort = validateInfographicCard(cardShort);
    expect(resShort.valid).toBe(false);
    expect(resShort.errors.some(e => e.includes('Exactly 4 characters'))).toBe(true);

    const cardLong = cloneCard(FIXTURE_CARD_SANDRONE);
    cardLong.characters.push({ ...cardLong.characters[0] }); // 5 characters
    const resLong = validateInfographicCard(cardLong);
    expect(resLong.valid).toBe(false);
  });

  it('B3.3: Rejects card when damage share percentages do not sum to ~100%', () => {
    const cardBadSum = cloneCard(FIXTURE_CARD_SANDRONE);
    cardBadSum.characters[0].damagePercentage = 30.0;
    cardBadSum.characters[1].damagePercentage = 20.0;
    cardBadSum.characters[2].damagePercentage = 10.0;
    cardBadSum.characters[3].damagePercentage = 10.0; // sum = 70%
    const res = validateInfographicCard(cardBadSum);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('does not equal ~100%'))).toBe(true);
  });

  it('B3.4: Rejects card missing mandatory brand watermark containing "ASTRALYS"', () => {
    const cardBadWatermark = cloneCard(FIXTURE_CARD_SANDRONE);
    cardBadWatermark.watermark = 'UNBRANDED APP';
    const res = validateInfographicCard(cardBadWatermark);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('ASTRALYS'))).toBe(true);
  });

  it('B3.5: Handles extreme DPR/DPS display strings (e.g. 0 DPS or > 10M DPR)', () => {
    const cardExtreme = cloneCard(FIXTURE_CARD_SANDRONE);
    cardExtreme.metrics.dps = '0';
    cardExtreme.metrics.dpr = '15.82M';
    const res = validateInfographicCard(cardExtreme);
    expect(res.valid).toBe(true);
  });
});

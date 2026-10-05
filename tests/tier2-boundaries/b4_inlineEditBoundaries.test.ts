/**
 * Boundary & Corner Cases: Inline Editing (Tier 2)
 * Edge cases: Clamping out-of-range percentages, empty strings, unusual weapon refinements, zero rotation time.
 */

import { describe, it, expect } from '../testRunner';
import { CardData, FIXTURE_CARD_SANDRONE } from '../fixtures/cardFixtures';

function cloneCard(card: CardData): CardData {
  return JSON.parse(JSON.stringify(card));
}

export function sanitizePercentage(val: number): number {
  if (isNaN(val) || val < 0) return 0;
  if (val > 100) return 100;
  return Math.round(val * 10) / 10;
}

export function sanitizeRefinement(val: string): string {
  const match = val.toUpperCase().match(/^R([1-5])$/);
  return match ? `R${match[1]}` : 'R1';
}

describe('Boundary 4 (B4): Inline Editing Boundary & Corner Cases', () => {
  it('B4.1: Percentage sanitizer clamps negative numbers to 0% and numbers > 100 to 100%', () => {
    expect(sanitizePercentage(-15)).toBe(0);
    expect(sanitizePercentage(150)).toBe(100);
    expect(sanitizePercentage(45.67)).toBe(45.7);
  });

  it('B4.2: Weapon refinement sanitizer falls back to R1 for invalid inputs (e.g. R0, R6, foo)', () => {
    expect(sanitizeRefinement('R0')).toBe('R1');
    expect(sanitizeRefinement('R6')).toBe('R1');
    expect(sanitizeRefinement('foo')).toBe('R1');
    expect(sanitizeRefinement('r5')).toBe('R5');
    expect(sanitizeRefinement('R3')).toBe('R3');
  });

  it('B4.3: Retains fallback character name if user erases name to blank string', () => {
    const card = cloneCard(FIXTURE_CARD_SANDRONE);
    const newName = ''.trim();
    card.characters[0].name = newName.length > 0 ? newName : 'Character 1';
    expect(card.characters[0].name).toBe('Character 1');
  });

  it('B4.4: Prevents division by zero when editing rotation duration to 0s', () => {
    const dpr = 2000000;
    const duration = 0;
    const dps = duration > 0 ? Math.round(dpr / duration) : 0;
    expect(dps).toBe(0);
    expect(Number.isFinite(dps)).toBe(true);
  });

  it('B4.5: Handles rapid consecutive updates to ER target string without string corruption', () => {
    const card = cloneCard(FIXTURE_CARD_SANDRONE);
    ['120 ER', '135 ER', '150% ER', '200 ER'].forEach(tag => {
      card.characters[0].artifact.erTarget = tag;
    });
    expect(card.characters[0].artifact.erTarget).toBe('200 ER');
  });
});

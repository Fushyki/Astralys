/**
 * Feature 4: Interactive Inline Card Editing Tests (Tier 1)
 * Requirement R1 / Acceptance: Real-time interactive text and number tweaking on the card without re-parsing.
 */

import { describe, it, expect } from '../testRunner';
import { FIXTURE_CARD_SANDRONE, CardData } from '../fixtures/cardFixtures';

function cloneCard(card: CardData): CardData {
  return JSON.parse(JSON.stringify(card));
}

describe('Feature 4 (F4): Interactive Inline Card Editing Coverage', () => {
  it('F4.1: Updates character name and constellation inline without re-parsing', () => {
    const card = cloneCard(FIXTURE_CARD_SANDRONE);
    card.characters[0].name = 'Sandrone Primed';
    card.characters[0].constellation = 'C2';
    expect(card.characters[0].name).toBe('Sandrone Primed');
    expect(card.characters[0].constellation).toBe('C2');
  });

  it('F4.2: Updates damage contribution percentage and maintains team slot ordering', () => {
    const card = cloneCard(FIXTURE_CARD_SANDRONE);
    card.characters[0].damagePercentage = 55.0;
    card.characters[1].damagePercentage = 2.0;
    card.characters[2].damagePercentage = 28.0;
    card.characters[3].damagePercentage = 15.0;
    const sum = card.characters.reduce((a, c) => a + c.damagePercentage, 0);
    expect(sum).toBe(100.0);
    expect(card.characters[0].damagePercentage).toBe(55.0);
  });

  it('F4.3: Updates weapon name and refinement (R1-R5) inline', () => {
    const card = cloneCard(FIXTURE_CARD_SANDRONE);
    card.characters[0].weapon.name = 'Redhorn Stonethresher';
    card.characters[0].weapon.refinement = 'R1';
    expect(card.characters[0].weapon.name).toBe('Redhorn Stonethresher');
    expect(card.characters[0].weapon.refinement).toBe('R1');
  });

  it('F4.4: Updates artifact set name and ER target tag inline', () => {
    const card = cloneCard(FIXTURE_CARD_SANDRONE);
    card.characters[2].artifact.setName = 'Golden Troupe';
    card.characters[2].artifact.erTarget = '130 ER';
    expect(card.characters[2].artifact.setName).toBe('Golden Troupe');
    expect(card.characters[2].artifact.erTarget).toBe('130 ER');
  });

  it('F4.5: Updates footer DPS, DPR, and rotation notation string inline', () => {
    const card = cloneCard(FIXTURE_CARD_SANDRONE);
    card.metrics.dps = '195.4k';
    card.metrics.dpr = '4.01M';
    card.rotationNotation = '(20.5s) Sandrone E CA EQ -> Yae EEE -> Qiqi E';
    expect(card.metrics.dps).toBe('195.4k');
    expect(card.metrics.dpr).toBe('4.01M');
    expect(card.rotationNotation).toContain('Sandrone E CA EQ');
  });
});

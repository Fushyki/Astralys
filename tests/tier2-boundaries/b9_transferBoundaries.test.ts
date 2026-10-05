/**
 * Boundary & Corner Cases: One-Click ER Target Transfer (Tier 2)
 * Edge cases: Name mismatch between card and ER calculator, extreme ER values (>350%),
 * repeated transfers, preserving custom equipment notes.
 */

import { describe, it, expect } from '../testRunner';
import { CardData, FIXTURE_CARD_SANDRONE } from '../fixtures/cardFixtures';
import { ERTransferPayload, applyERTransferToCard } from '../tier1-features/f9_erTransfer.test.ts';

function cloneCard(card: CardData): CardData {
  return JSON.parse(JSON.stringify(card));
}

describe('Boundary 9 (B9): ER Target Transfer Boundary & Corner Cases', () => {
  it('B9.1: Ignores transfer targets when character names do not match card slots', () => {
    const card = cloneCard(FIXTURE_CARD_SANDRONE);
    const mismatchedPayload: ERTransferPayload = {
      targets: [
        { slotIndex: 0, characterName: 'Unknown Warrior', erTargetPct: 200, erTargetLabel: '200 ER' }
      ]
    };
    const updated = applyERTransferToCard(card, mismatchedPayload);
    // Card slots remain unaffected
    expect(updated.characters[0].artifact.erTarget).toBe('102 ER');
  });

  it('B9.2: Formats extreme ER requirements (> 350% ER) cleanly into badge label', () => {
    const card = cloneCard(FIXTURE_CARD_SANDRONE);
    const extremePayload: ERTransferPayload = {
      targets: [
        { slotIndex: 0, characterName: 'Sandrone', erTargetPct: 375.4, erTargetLabel: '375 ER' }
      ]
    };
    const updated = applyERTransferToCard(card, extremePayload);
    expect(updated.characters[0].artifact.erTarget).toBe('375 ER');
  });

  it('B9.3: Repeated sequential transfers cleanly overwrite without string concatenation', () => {
    let card = cloneCard(FIXTURE_CARD_SANDRONE);
    for (let i = 1; i <= 5; i++) {
      const payload: ERTransferPayload = {
        targets: [
          { slotIndex: 0, characterName: 'Sandrone', erTargetPct: 100 + i * 10, erTargetLabel: `${100 + i * 10} ER` }
        ]
      };
      card = applyERTransferToCard(card, payload);
    }
    expect(card.characters[0].artifact.erTarget).toBe('150 ER');
    expect(card.characters[0].artifact.erTarget.includes('140')).toBe(false);
  });

  it('B9.4: Preserves weapon refinement and main stats during ER target updates', () => {
    const card = cloneCard(FIXTURE_CARD_SANDRONE);
    const payload: ERTransferPayload = {
      targets: [
        { slotIndex: 0, characterName: 'Sandrone', erTargetPct: 160, erTargetLabel: '160 ER' }
      ]
    };
    const updated = applyERTransferToCard(card, payload);
    expect(updated.characters[0].weapon.refinement).toBe('R5');
    expect(updated.characters[0].mainStats).toBe('ATK / ATK / CD');
  });

  it('B9.5: Case-insensitive character name matching during ER transfer', () => {
    const card = cloneCard(FIXTURE_CARD_SANDRONE);
    const payload: ERTransferPayload = {
      targets: [
        { slotIndex: 0, characterName: 'sAnDrOnE', erTargetPct: 125, erTargetLabel: '125 ER' }
      ]
    };
    const updated = applyERTransferToCard(card, payload);
    expect(updated.characters[0].artifact.erTarget).toBe('125 ER');
  });
});

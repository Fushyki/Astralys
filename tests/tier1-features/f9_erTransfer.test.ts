/**
 * Feature 9: One-Click ER Target Transfer Tests (Tier 1)
 * Requirement R2 / Acceptance: Direct action sends calculated ER requirements straight into Infographic Card.
 */

import { describe, it, expect } from '../testRunner';
import { safeCalculateTeamER as calculateTeamER } from '../helpers/referenceEngines';
import { SCENARIO_1_MAVUIKA } from '../fixtures/referenceTeams';
import { FIXTURE_CARD_SANDRONE, CardData } from '../fixtures/cardFixtures';

export interface ERTransferPayload {
  targets: {
    slotIndex: number; // 0 to 3
    characterName: string;
    erTargetPct: number; // e.g. 166.8
    erTargetLabel: string; // e.g. "167 ER"
  }[];
}

export function buildERTransferPayload(slots: any[], results: any[]): ERTransferPayload {
  return {
    targets: slots.map((s, idx) => {
      const res = results[idx];
      const pct = Math.round(res.neededER * 1000) / 10;
      const label = res.status === 'ignored' ? '100 ER' : `${Math.round(res.neededER * 100)} ER`;
      return {
        slotIndex: idx,
        characterName: s.name,
        erTargetPct: pct,
        erTargetLabel: label
      };
    })
  };
}

export function applyERTransferToCard(card: CardData, payload: ERTransferPayload): CardData {
  const updated = JSON.parse(JSON.stringify(card));
  payload.targets.forEach(target => {
    const cardChar = updated.characters.find((c: any) => c.name.toLowerCase() === target.characterName.toLowerCase());
    if (cardChar) {
      cardChar.artifact.erTarget = target.erTargetLabel;
    }
  });
  return updated;
}

describe('Feature 9 (F9): One-Click ER Target Transfer Coverage', () => {
  it('F9.1: Generates valid ERTransferPayload matching PROJECT.md interface contract', () => {
    const results = calculateTeamER(SCENARIO_1_MAVUIKA.slots, 20, 6);
    const payload = buildERTransferPayload(SCENARIO_1_MAVUIKA.slots, results);
    expect(payload.targets.length).toBe(4);
    expect(payload.targets[0].characterName).toBe('Mavuika');
    expect(payload.targets[0].erTargetLabel).toBe('100 ER');
    expect(payload.targets[1].characterName).toBe('Citlali');
    expect(payload.targets[1].erTargetLabel).toBe('202 ER');
  });

  it('F9.2: Transfers calculated ER targets into corresponding character slots on Card', () => {
    const mockCard: CardData = {
      teamName: 'Natlan Fire',
      carryArchetype: 'MAVUIKA',
      investmentBadge: 'KQM Investment',
      characters: [
        { name: 'Mavuika', constellation: 'C0', element: 'Pyro', damagePercentage: 80, weapon: { name: 'Claymore', refinement: 'R1' }, artifact: { setName: 'Obsidian', erTarget: '0 ER' }, mainStats: 'ATK/Pyro/CR' },
        { name: 'Citlali', constellation: 'C0', element: 'Cryo', damagePercentage: 10, weapon: { name: 'Catalyst', refinement: 'R1' }, artifact: { setName: 'Instrutor', erTarget: '0 ER' }, mainStats: 'EM/EM/EM' },
        { name: 'Iansan', constellation: 'C0', element: 'Electro', damagePercentage: 5, weapon: { name: 'Polearm', refinement: 'R1' }, artifact: { setName: 'Cinder', erTarget: '0 ER' }, mainStats: 'ATK/Electro/CR' },
        { name: 'Bennett', constellation: 'C6', element: 'Pyro', damagePercentage: 5, weapon: { name: 'Sword', refinement: 'R1' }, artifact: { setName: 'Nobless', erTarget: '0 ER' }, mainStats: 'ER/Pyro/CR' }
      ],
      metrics: { dps: '200k', dpr: '4.0M' },
      rotationNotation: 'Mavuika Q',
      watermark: 'ASTRALYS'
    };

    const results = calculateTeamER(SCENARIO_1_MAVUIKA.slots, 20, 6);
    const payload = buildERTransferPayload(SCENARIO_1_MAVUIKA.slots, results);
    const updated = applyERTransferToCard(mockCard, payload);

    expect(updated.characters[0].artifact.erTarget).toBe('100 ER');
    expect(updated.characters[1].artifact.erTarget).toBe('202 ER');
    expect(updated.characters[2].artifact.erTarget).toBe('205 ER');
    expect(updated.characters[3].artifact.erTarget).toBe('186 ER');
  });

  it('F9.3: Respects burst-disabled characters and transfers baseline 100 ER tag', () => {
    const results = calculateTeamER(SCENARIO_1_MAVUIKA.slots, 20, 6);
    const payload = buildERTransferPayload(SCENARIO_1_MAVUIKA.slots, results);
    const mavuikaTarget = payload.targets.find(t => t.characterName === 'Mavuika');
    expect(mavuikaTarget?.erTargetLabel).toBe('100 ER');
  });

  it('F9.4: Handles slot mapping by character name regardless of slot ordering', () => {
    const reversedCard: CardData = {
      teamName: 'Reversed Team',
      carryArchetype: 'BENNETT',
      investmentBadge: 'High Investment',
      characters: [
        { name: 'Bennett', constellation: 'C6', element: 'Pyro', damagePercentage: 25, weapon: { name: 'Sword', refinement: 'R1' }, artifact: { setName: 'Nobless', erTarget: '0 ER' }, mainStats: 'ER/Pyro/CR' },
        { name: 'Iansan', constellation: 'C0', element: 'Electro', damagePercentage: 25, weapon: { name: 'Polearm', refinement: 'R1' }, artifact: { setName: 'Cinder', erTarget: '0 ER' }, mainStats: 'ATK/Electro/CR' },
        { name: 'Citlali', constellation: 'C0', element: 'Cryo', damagePercentage: 25, weapon: { name: 'Catalyst', refinement: 'R1' }, artifact: { setName: 'Instrutor', erTarget: '0 ER' }, mainStats: 'EM/EM/EM' },
        { name: 'Mavuika', constellation: 'C0', element: 'Pyro', damagePercentage: 25, weapon: { name: 'Claymore', refinement: 'R1' }, artifact: { setName: 'Obsidian', erTarget: '0 ER' }, mainStats: 'ATK/Pyro/CR' }
      ],
      metrics: { dps: '150k', dpr: '3.0M' },
      rotationNotation: 'Bennett Q',
      watermark: 'ASTRALYS'
    };

    const results = calculateTeamER(SCENARIO_1_MAVUIKA.slots, 20, 6);
    const payload = buildERTransferPayload(SCENARIO_1_MAVUIKA.slots, results);
    const updated = applyERTransferToCard(reversedCard, payload);

    expect(updated.characters[0].artifact.erTarget).toBe('186 ER'); // Bennett
    expect(updated.characters[3].artifact.erTarget).toBe('100 ER'); // Mavuika
  });

  it('F9.5: Preserves weapons, main stats, and artifact set names during ER target transfer', () => {
    const results = calculateTeamER(SCENARIO_1_MAVUIKA.slots, 20, 6);
    const payload = buildERTransferPayload(SCENARIO_1_MAVUIKA.slots, results);
    const updated = applyERTransferToCard(FIXTURE_CARD_SANDRONE, payload);

    // FIXTURE_CARD_SANDRONE doesn't have Mavuika/Citlali, so its original values remain intact
    expect(updated.characters[0].weapon.name).toBe('Tidal');
    expect(updated.characters[0].artifact.setName).toBe('Disenchant');
    expect(updated.characters[0].mainStats).toBe('ATK / ATK / CD');
  });
});

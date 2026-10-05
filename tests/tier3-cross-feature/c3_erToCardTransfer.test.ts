/**
 * Tier 3: Cross-Feature Integration 3 — ER Calculator -> Infographic Card Transfer
 * Requirement R2 / Acceptance: Push calculated ER targets straight into Card character equipment slots.
 */

import { describe, it, expect } from '../testRunner';
import { safeCalculateTeamER as calculateTeamER } from '../helpers/referenceEngines';
import { SCENARIO_2_RAIDEN_NATIONAL } from '../fixtures/referenceTeams';
import { CardData } from '../fixtures/cardFixtures';
import { buildERTransferPayload, applyERTransferToCard } from '../tier1-features/f9_erTransfer.test.ts';
import { validateInfographicCard } from '../helpers/referenceEngines';

describe('Tier 3: Cross-Feature Integration — ER Calculator -> Card Transfer (C3)', () => {
  it('C3.1: Calculates Rational ER requirements and syncs all 4 ER tags to card artifact slots', () => {
    const results = calculateTeamER(SCENARIO_2_RAIDEN_NATIONAL.slots, 20, 6);
    const payload = buildERTransferPayload(SCENARIO_2_RAIDEN_NATIONAL.slots, results);

    const nationalCard: CardData = {
      teamName: 'RAIDEN NATIONAL',
      carryArchetype: 'RAIDEN',
      investmentBadge: 'KQM Standard',
      characters: [
        { name: 'Raiden', constellation: 'C0', element: 'Electro', damagePercentage: 35, weapon: { name: 'Catch', refinement: 'R5' }, artifact: { setName: 'Emblem', erTarget: '0 ER' }, mainStats: 'ER/Electro/CR' },
        { name: 'Xiangling', constellation: 'C6', element: 'Pyro', damagePercentage: 40, weapon: { name: 'Dragon Bane', refinement: 'R5' }, artifact: { setName: 'Emblem', erTarget: '0 ER' }, mainStats: 'EM/Pyro/CR' },
        { name: 'Xingqiu', constellation: 'C6', element: 'Hydro', damagePercentage: 20, weapon: { name: 'Sacrificial', refinement: 'R5' }, artifact: { setName: 'Emblem', erTarget: '0 ER' }, mainStats: 'ATK/Hydro/CR' },
        { name: 'Bennett', constellation: 'C5', element: 'Pyro', damagePercentage: 5, weapon: { name: 'Favonius', refinement: 'R5' }, artifact: { setName: 'Nobless', erTarget: '0 ER' }, mainStats: 'ER/Pyro/CR' }
      ],
      metrics: { dps: '110k', dpr: '2.2M' },
      rotationNotation: 'Raiden E -> Xingqiu EQE -> Bennett QE -> Xiangling QE -> Raiden Q 3N3C N1C',
      watermark: 'ASTRALYS'
    };

    const updatedCard = applyERTransferToCard(nationalCard, payload);

    expect(updatedCard.characters[0].artifact.erTarget).toBe('190 ER'); // Raiden ~189.9%
    expect(updatedCard.characters[1].artifact.erTarget).toBe('106 ER'); // Xiangling ~106.3%
    expect(updatedCard.characters[2].artifact.erTarget).toBe('100 ER'); // Xingqiu 100%
    expect(updatedCard.characters[3].artifact.erTarget).toBe('100 ER'); // Bennett 100%

    const validation = validateInfographicCard(updatedCard);
    expect(validation.valid).toBe(true);
  });

  it('C3.2: Re-calculates ER when Favonius weapon procs are adjusted and updates card dynamically', () => {
    // If Bennett Favonius is disabled (fav: 0), Xiangling's ER demand rises
    const modifiedSlots = JSON.parse(JSON.stringify(SCENARIO_2_RAIDEN_NATIONAL.slots));
    modifiedSlots[3].fav = 0; // Bennett no fav
    modifiedSlots[2].fav = 0; // Xingqiu no fav
    const results = calculateTeamER(modifiedSlots, 20, 6);
    const payload = buildERTransferPayload(modifiedSlots, results);

    const baseCard: CardData = {
      teamName: 'RAIDEN NATIONAL NO-FAV',
      carryArchetype: 'RAIDEN',
      investmentBadge: 'KQM Standard',
      characters: [
        { name: 'Raiden', constellation: 'C0', element: 'Electro', damagePercentage: 35, weapon: { name: 'Catch', refinement: 'R5' }, artifact: { setName: 'Emblem', erTarget: '100 ER' }, mainStats: 'ER/Electro/CR' },
        { name: 'Xiangling', constellation: 'C6', element: 'Pyro', damagePercentage: 40, weapon: { name: 'DB', refinement: 'R5' }, artifact: { setName: 'Emblem', erTarget: '100 ER' }, mainStats: 'EM/Pyro/CR' },
        { name: 'Xingqiu', constellation: 'C6', element: 'Hydro', damagePercentage: 20, weapon: { name: 'Sac', refinement: 'R5' }, artifact: { setName: 'Emblem', erTarget: '100 ER' }, mainStats: 'ATK/Hydro/CR' },
        { name: 'Bennett', constellation: 'C5', element: 'Pyro', damagePercentage: 5, weapon: { name: 'Alley', refinement: 'R1' }, artifact: { setName: 'Nobless', erTarget: '100 ER' }, mainStats: 'ER/Pyro/CR' }
      ],
      metrics: { dps: '110k', dpr: '2.2M' },
      rotationNotation: 'Standard',
      watermark: 'ASTRALYS'
    };

    const updated = applyERTransferToCard(baseCard, payload);
    // Without Favonius, Raiden needed ER increases (was 189.9%, now higher)
    expect(parseInt(updated.characters[0].artifact.erTarget, 10)).toBeGreaterThan(190);
  });

  it('C3.3: Transfer maintains card schema validity after transfer operations', () => {
    const results = calculateTeamER(SCENARIO_2_RAIDEN_NATIONAL.slots, 20, 6);
    const payload = buildERTransferPayload(SCENARIO_2_RAIDEN_NATIONAL.slots, results);
    const updated = applyERTransferToCard({
      teamName: 'TEST',
      carryArchetype: 'RAIDEN',
      investmentBadge: 'KQM',
      characters: [
        { name: 'Raiden', constellation: 'C0', element: 'Electro', damagePercentage: 25, weapon: { name: 'W', refinement: 'R1' }, artifact: { setName: 'A', erTarget: '100 ER' }, mainStats: 'S/G/C' },
        { name: 'Xiangling', constellation: 'C0', element: 'Pyro', damagePercentage: 25, weapon: { name: 'W', refinement: 'R1' }, artifact: { setName: 'A', erTarget: '100 ER' }, mainStats: 'S/G/C' },
        { name: 'Xingqiu', constellation: 'C0', element: 'Hydro', damagePercentage: 25, weapon: { name: 'W', refinement: 'R1' }, artifact: { setName: 'A', erTarget: '100 ER' }, mainStats: 'S/G/C' },
        { name: 'Bennett', constellation: 'C0', element: 'Pyro', damagePercentage: 25, weapon: { name: 'W', refinement: 'R1' }, artifact: { setName: 'A', erTarget: '100 ER' }, mainStats: 'S/G/C' }
      ],
      metrics: { dps: 100, dpr: 2000 },
      rotationNotation: 'Rot',
      watermark: 'ASTRALYS'
    }, payload);

    const val = validateInfographicCard(updated);
    expect(val.valid).toBe(true);
  });
});

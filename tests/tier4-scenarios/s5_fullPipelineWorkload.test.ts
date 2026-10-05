/**
 * Tier 4: Real-World Workload Scenario 5 — Full End-to-End Pipeline
 * Pipeline: ER Target Calculation -> Card Generation -> 1-Click ER Transfer -> PNG Export Config
 * Strictly checks "Astralys" branding throughout.
 */

import { describe, it, expect } from '../testRunner';
import { safeCalculateTeamER as calculateTeamER } from '../helpers/referenceEngines';
import { SCENARIO_3_AYAKA_FREEZE } from '../fixtures/referenceTeams';
import { CardData } from '../fixtures/cardFixtures';
import { buildERTransferPayload, applyERTransferToCard } from '../tier1-features/f9_erTransfer.test.ts';
import { buildExportOptions, generateCardExportFileName } from '../tier1-features/f5_exportService.test.ts';
import { validateInfographicCard } from '../helpers/referenceEngines';

describe('Tier 4: Scenario 5 — Full Pipeline Workload (ER -> Card -> Transfer -> Export)', () => {
  it('S5.1: Executes complete multi-module pipeline from ER math to final exported card asset', () => {
    // 1. Calculate ER for Ayaka Freeze team
    const erResults = calculateTeamER(SCENARIO_3_AYAKA_FREEZE.slots, 20, 6);
    expect(erResults[0].neededER).toBeCloseTo(1.775, 2); // Ayaka ~177.5%
    expect(erResults[1].neededER).toBeCloseTo(2.483, 2); // Shenhe ~248.3%

    // 2. Build ER transfer payload
    const transferPayload = buildERTransferPayload(SCENARIO_3_AYAKA_FREEZE.slots, erResults);
    expect(transferPayload.targets.length).toBe(4);

    // 3. Initialize Card Data
    const freezeCard: CardData = {
      teamName: 'AYAKA PREMIUM FREEZE',
      carryArchetype: 'AYAKA',
      investmentBadge: 'KQM Investment',
      characters: [
        { name: 'Ayaka', constellation: 'C0', element: 'Cryo', damagePercentage: 70, weapon: { name: 'Mistsplitter', refinement: 'R1' }, artifact: { setName: 'Blizzard', erTarget: '100 ER' }, mainStats: 'ATK/Cryo/CD' },
        { name: 'Shenhe', constellation: 'C0', element: 'Cryo', damagePercentage: 15, weapon: { name: 'Calamity', refinement: 'R1' }, artifact: { setName: 'Nobless', erTarget: '100 ER' }, mainStats: 'ATK/ATK/ATK' },
        { name: 'Kazuha', constellation: 'C0', element: 'Anemo', damagePercentage: 10, weapon: { name: 'Favonius', refinement: 'R5' }, artifact: { setName: 'VV', erTarget: '100 ER' }, mainStats: 'EM/EM/EM' },
        { name: 'Kokomi', constellation: 'C0', element: 'Hydro', damagePercentage: 5, weapon: { name: 'TTDS', refinement: 'R5' }, artifact: { setName: 'Tenacity', erTarget: '100 ER' }, mainStats: 'HP/Hydro/HB' }
      ],
      metrics: { dps: '145k', dpr: '2.9M', rotationDurationSeconds: 20 },
      rotationNotation: 'Shenhe EQ -> Kazuha tEP Q -> Kokomi E -> Ayaka D N1 E Q N2C',
      watermark: 'ASTRALYS'
    };

    // 4. One-Click ER Target Transfer to Card
    const syncedCard = applyERTransferToCard(freezeCard, transferPayload);
    expect(syncedCard.characters[0].artifact.erTarget).toBe('178 ER');
    expect(syncedCard.characters[1].artifact.erTarget).toBe('248 ER');
    expect(syncedCard.characters[2].artifact.erTarget).toBe('181 ER');
    expect(syncedCard.characters[3].artifact.erTarget).toBe('228 ER');

    // 5. Card Validation
    const validation = validateInfographicCard(syncedCard);
    expect(validation.valid).toBe(true);

    // 6. High-Res PNG Export Configuration
    const exportOpts = buildExportOptions({ pixelRatio: 2 });
    expect(exportOpts.pixelRatio).toBe(2);
    expect(exportOpts.backgroundColor).toBe('#080311');

    // 7. Output Asset Naming
    const filename = generateCardExportFileName(syncedCard.teamName, syncedCard.carryArchetype);
    expect(filename).toBe('astralys-ayaka-ayaka-premium-freeze.png');
  });

  it('S5.2: Pipeline strictly preserves "ASTRALYS" brand identity in watermark and asset naming', () => {
    const freezeCard: CardData = {
      teamName: 'AYAKA FREEZE',
      carryArchetype: 'AYAKA',
      investmentBadge: 'KQM',
      characters: [
        { name: 'Ayaka', constellation: 'C0', element: 'Cryo', damagePercentage: 25, weapon: { name: 'W', refinement: 'R1' }, artifact: { setName: 'A', erTarget: '100 ER' }, mainStats: 'S/G/C' },
        { name: 'Shenhe', constellation: 'C0', element: 'Cryo', damagePercentage: 25, weapon: { name: 'W', refinement: 'R1' }, artifact: { setName: 'A', erTarget: '100 ER' }, mainStats: 'S/G/C' },
        { name: 'Kazuha', constellation: 'C0', element: 'Anemo', damagePercentage: 25, weapon: { name: 'W', refinement: 'R1' }, artifact: { setName: 'A', erTarget: '100 ER' }, mainStats: 'S/G/C' },
        { name: 'Kokomi', constellation: 'C0', element: 'Hydro', damagePercentage: 25, weapon: { name: 'W', refinement: 'R1' }, artifact: { setName: 'A', erTarget: '100 ER' }, mainStats: 'S/G/C' }
      ],
      metrics: { dps: 100, dpr: 2000 },
      rotationNotation: 'Rot',
      watermark: 'ASTRALYS'
    };
    expect(freezeCard.watermark).toBe('ASTRALYS');
    const filename = generateCardExportFileName(freezeCard.teamName, freezeCard.carryArchetype);
    expect(filename.startsWith('astralys-')).toBe(true);
  });
});

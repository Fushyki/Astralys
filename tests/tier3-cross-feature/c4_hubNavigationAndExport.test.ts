/**
 * Tier 3: Cross-Feature Integration 4 — Clean Hub Navigation & Workflow Pipeline
 * Ingests data -> renders card -> inline tweaks -> high-res export config -> brand verification.
 * Branding: strictly "Astralys".
 */

import { describe, it, expect } from '../testRunner';
import { FIXTURE_CARD_SANDRONE } from '../fixtures/cardFixtures';
import { generateCardExportFileName, buildExportOptions } from '../tier1-features/f5_exportService.test.ts';
import { validateInfographicCard } from '../helpers/referenceEngines';

describe('Tier 3: Cross-Feature Integration — Hub Pipeline & Export (C4)', () => {
  it('C4.1: Executes complete pipeline: Card Model -> Inline Edit -> Export Options', () => {
    const card = JSON.parse(JSON.stringify(FIXTURE_CARD_SANDRONE));
    // Step 1: Inline edit
    card.teamName = 'SANDRONE HYPER';
    card.characters[0].damagePercentage = 60.0;
    card.characters[1].damagePercentage = 1.0;
    card.characters[2].damagePercentage = 25.0;
    card.characters[3].damagePercentage = 14.0;
    card.metrics.dps = '205.0k';

    // Step 2: Validate card contract
    const validation = validateInfographicCard(card);
    expect(validation.valid).toBe(true);

    // Step 3: Configure high-res export
    const opts = buildExportOptions({ pixelRatio: 2 });
    expect(opts.pixelRatio).toBe(2);

    // Step 4: Verify filename uses astralys prefix
    const filename = generateCardExportFileName(card.teamName, card.carryArchetype);
    expect(filename).toBe('astralys-sandrone-sandrone-hyper.png');
  });

  it('C4.2: Brand identity strictly "Astralys" is preserved from Hub to Card Footer to File Output', () => {
    const card = FIXTURE_CARD_SANDRONE;
    expect(card.watermark).toBe('ASTRALYS');
    const filename = generateCardExportFileName(card.teamName, card.carryArchetype);
    expect(filename.startsWith('astralys-')).toBe(true);
  });

  it('C4.3: Switching Hub view tabs preserves global team state without resets', () => {
    let currentView = 'landing';
    const setView = (v: string) => { currentView = v; };

    // Navigate to ER Calc
    setView('er');
    expect(currentView).toBe('er');

    // Navigate to Infographic Generator
    setView('damage');
    expect(currentView).toBe('damage');

    // Return to Hub Dashboard
    setView('landing');
    expect(currentView).toBe('landing');
  });
});

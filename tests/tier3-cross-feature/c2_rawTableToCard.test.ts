/**
 * Tier 3: Cross-Feature Integration 2 — Raw Table -> Infographic Card
 * Ingests nj2k8acllnah1.png pasted table text and builds valid InfographicCardData.
 * Branding: strictly "Astralys".
 */

import { describe, it, expect } from '../testRunner';
import { RAW_TABLE_STELLAR_FORTRESS } from '../fixtures/rawTableFixtures';
import { parseRawRotationTable, validateInfographicCard } from '../helpers/referenceEngines';
import { CardData } from '../fixtures/cardFixtures';

export function convertRawTableToCard(rawText: string): CardData {
  const parsed = parseRawRotationTable(rawText);
  return {
    teamName: parsed.teamName.toUpperCase(),
    carryArchetype: parsed.characters[0]?.name.toUpperCase() || 'CARRY',
    investmentBadge: 'KQM Investment',
    characters: parsed.characters.map(c => ({
      name: c.name,
      constellation: c.constellation,
      element: c.name === 'Wrio' ? 'Cryo' : c.name === 'Yae' ? 'Electro' : c.name === 'Nicole' ? 'Pyro' : 'Cryo',
      damagePercentage: c.damagePercent,
      damageRaw: c.damage,
      weapon: { name: c.weapon, refinement: c.refinement },
      artifact: { setName: c.artifact, erTarget: '110 ER' },
      mainStats: 'ATK / DMG / CR'
    })),
    metrics: {
      dps: `${(parsed.dps / 1000).toFixed(1)}k`,
      dpr: `${(parsed.dpr / 1000000).toFixed(2)}M`,
      rotationDurationSeconds: parsed.rotationDuration
    },
    rotationNotation: parsed.rotationSequence,
    watermark: 'ASTRALYS'
  };
}

describe('Tier 3: Cross-Feature Integration — Raw Table -> Card (C2)', () => {
  it('C2.1: Converts raw pasted table text directly into valid 4-section Infographic Card', () => {
    const card = convertRawTableToCard(RAW_TABLE_STELLAR_FORTRESS);
    expect(card.carryArchetype).toBe('WRIO');
    expect(card.characters.length).toBe(4);
    expect(card.metrics.dps).toBe('168.0k');
    expect(card.metrics.dpr).toBe('2.86M');
    const valid = validateInfographicCard(card);
    expect(valid.valid).toBe(true);
  });

  it('C2.2: Preserves parsed weapon refinements (R5) and constellations (C0, C1) on the card', () => {
    const card = convertRawTableToCard(RAW_TABLE_STELLAR_FORTRESS);
    expect(card.characters[0].weapon.refinement).toBe('R5');
    expect(card.characters[1].constellation).toBe('C1');
  });

  it('C2.3: Populates footer rotation notation and duration from raw table merged row', () => {
    const card = convertRawTableToCard(RAW_TABLE_STELLAR_FORTRESS);
    expect(card.rotationNotation).toContain('Nicole E > Yae EEE > Odette Q/E E > > Wrio Combo');
    expect(card.metrics.rotationDurationSeconds).toBe(17);
  });

  it('C2.4: Card generated from raw table strictly bears "ASTRALYS" watermark', () => {
    const card = convertRawTableToCard(RAW_TABLE_STELLAR_FORTRESS);
    expect(card.watermark).toBe('ASTRALYS');
  });
});

/**
 * Feature 1: Spreadsheet (.xlsx) Parser Tests (Tier 1)
 * Requirement R1: Parses Calc Sheet.xlsx across 4 layout archetypes.
 */

import { describe, it, expect } from '../testRunner';
import {
  FIXTURE_LAYOUT_A_SANDRONE,
  FIXTURE_LAYOUT_B_FLINS,
  FIXTURE_LAYOUT_C_MAVUIKA
} from '../fixtures/spreadsheetFixtures';
import { parseSpreadsheetFixture } from '../helpers/referenceEngines';

describe('Feature 1 (F1): Spreadsheet (.xlsx) Parser Coverage', () => {
  it('F1.1: Parses Layout A (Sandrone) tab extracting 4 team members and weapons', () => {
    const parsed = parseSpreadsheetFixture(FIXTURE_LAYOUT_A_SANDRONE);
    expect(parsed.carry).toBe('Sandrone');
    expect(parsed.characters.length).toBe(4);
    expect(parsed.characters[0].name).toBe('Sandrone');
    expect(parsed.characters[0].weapon).toBe('Mailed Flower');
    expect(parsed.characters[1].name).toBe('Yae');
    expect(parsed.characters[2].name).toBe('Qiqi');
    expect(parsed.characters[3].name).toBe('Nicole');
  });

  it('F1.2: Extracts damage contribution and calculates damage shares for Layout A', () => {
    const parsed = parseSpreadsheetFixture(FIXTURE_LAYOUT_A_SANDRONE);
    expect(parsed.characters[0].damage).toBe(1670225.64);
    expect(parsed.characters[0].percentage).toBeCloseTo(70.22, 1);
    expect(parsed.dpr).toBe(2378400.91);
    expect(parsed.dps).toBe(108109.13);
  });

  it('F1.3: Parses Layout B (Flins) summary block extracting artifacts and weapons', () => {
    const parsed = parseSpreadsheetFixture(FIXTURE_LAYOUT_B_FLINS);
    expect(parsed.carry).toBe('Flins');
    expect(parsed.characters[0].artifact).toBe('Night of the Sky');
    expect(parsed.characters[0].weapon).toBe('Bloodsoaked Ruins');
    expect(parsed.characters[3].name).toBe('Sucrose');
    expect(parsed.characters[3].weapon).toBe('TTDS');
    expect(parsed.dpr).toBe(2466028.49);
    expect(parsed.dps).toBe(137001.58);
  });

  it('F1.4: Parses Layout C (Mavuika) inverted header layout and combo notation', () => {
    const parsed = parseSpreadsheetFixture(FIXTURE_LAYOUT_C_MAVUIKA);
    expect(parsed.carry).toBe('Mavuika');
    expect(parsed.characters[0].weapon).toBe('Blazing Suns');
    expect(parsed.characters[0].artifact).toBe('Obsidian');
    expect(parsed.rotation).toBe('Q CdcF cdF cdF cdF Combo');
    expect(parsed.duration).toBe(18);
  });

  it('F1.5: Extracts artifact sets with corresponding ER target rolls across characters', () => {
    const parsed = parseSpreadsheetFixture(FIXTURE_LAYOUT_A_SANDRONE);
    const sandroneArt = parsed.characters.find(c => c.name === 'Sandrone');
    const qiqiArt = parsed.characters.find(c => c.name === 'Qiqi');
    expect(sandroneArt?.artifact).toBe('Disenchant');
    expect(qiqiArt?.artifact).toBe('Milelith');
  });

  it('F1.6: Correctly computes total team DPR from sum of individual character damages', () => {
    const parsed = parseSpreadsheetFixture(FIXTURE_LAYOUT_B_FLINS);
    const sumDamage = parsed.characters.reduce((acc, c) => acc + (c.damage || 0), 0);
    expect(sumDamage).toBeCloseTo(parsed.dpr, 0);
  });
});

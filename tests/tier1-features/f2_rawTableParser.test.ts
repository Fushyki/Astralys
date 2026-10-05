/**
 * Feature 2: Raw Rotation Table Parser Tests (Tier 1)
 * Requirement R1: Ingests pasted table text matching nj2k8acllnah1.png with comma decimals.
 */

import { describe, it, expect } from '../testRunner';
import {
  RAW_TABLE_STELLAR_FORTRESS,
  RAW_TABLE_PIPE_DELIMITED,
  RAW_TABLE_MINIMAL_COMMA
} from '../fixtures/rawTableFixtures';
import { parseRawRotationTable } from '../helpers/referenceEngines';

describe('Feature 2 (F2): Raw Rotation Table Parser Coverage', () => {
  it('F2.1: Parses nj2k8acllnah1.png format extracting 4 characters with constellations', () => {
    const parsed = parseRawRotationTable(RAW_TABLE_STELLAR_FORTRESS);
    expect(parsed.characters.length).toBe(4);
    expect(parsed.characters[0].name).toBe('Wrio');
    expect(parsed.characters[0].constellation).toBe('C0');
    expect(parsed.characters[1].name).toBe('Yae');
    expect(parsed.characters[1].constellation).toBe('C1');
    expect(parsed.characters[2].name).toBe('Odette');
    expect(parsed.characters[3].name).toBe('Nicole');
  });

  it('F2.2: Correctly parses Brazilian comma decimals for damage values and percentages', () => {
    const parsed = parseRawRotationTable(RAW_TABLE_STELLAR_FORTRESS);
    expect(parsed.characters[0].damage).toBe(1308604.60);
    expect(parsed.characters[0].damagePercent).toBe(45.83);
    expect(parsed.characters[1].damage).toBe(1048791.93);
    expect(parsed.characters[1].damagePercent).toBe(36.73);
    expect(parsed.characters[3].damagePercent).toBe(0.36);
  });

  it('F2.3: Extracts weapon names and refinement levels (R1-R5)', () => {
    const parsed = parseRawRotationTable(RAW_TABLE_STELLAR_FORTRESS);
    expect(parsed.characters[0].weapon).toBe('Widsith');
    expect(parsed.characters[0].refinement).toBe('R5');
    expect(parsed.characters[1].weapon).toBe('7.0 Craftable');
    expect(parsed.characters[1].refinement).toBe('R5');
    expect(parsed.characters[2].weapon).toBe('HoD');
    expect(parsed.characters[3].weapon).toBe('Flowing Purity');
  });

  it('F2.4: Extracts rotation duration, DPR, DPS, and rotation sequence string', () => {
    const parsed = parseRawRotationTable(RAW_TABLE_STELLAR_FORTRESS);
    expect(parsed.rotationDuration).toBe(17);
    expect(parsed.dpr).toBe(2855567.58);
    expect(parsed.dps).toBe(167974.56);
    expect(parsed.rotationSequence).toContain('Nicole E > Yae EEE > Odette Q/E E > > Wrio Combo');
    expect(parsed.assumptions).toContain('Assumes 5 field stacks avg');
  });

  it('F2.5: Parses pipe-delimited raw table inputs without losing data fidelity', () => {
    const parsed = parseRawRotationTable(RAW_TABLE_PIPE_DELIMITED);
    expect(parsed.characters.length).toBe(4);
    expect(parsed.characters[0].name).toBe('Wrio');
    expect(parsed.characters[0].damagePercent).toBe(45.83);
    expect(parsed.characters[0].artifact).toBe('4p Shadow');
  });

  it('F2.6: Parses comma-delimited raw table text with metadata notes', () => {
    const parsed = parseRawRotationTable(RAW_TABLE_MINIMAL_COMMA);
    expect(parsed.characters.length).toBe(4);
    expect(parsed.characters[0].name).toBe('Sandrone');
    expect(parsed.characters[0].damagePercent).toBe(70.22);
    expect(parsed.dpr).toBe(2378400.91);
    expect(parsed.dps).toBe(108109.13);
  });
});

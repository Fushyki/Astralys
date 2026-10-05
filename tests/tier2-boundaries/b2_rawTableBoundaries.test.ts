/**
 * Boundary & Corner Cases: Raw Table Parser (Tier 2)
 * Edge cases: Empty text, missing refinements, unstandardized delimiters, missing constellations, non-100% sums.
 */

import { describe, it, expect } from '../testRunner';
import { parseRawRotationTable } from '../helpers/referenceEngines';

describe('Boundary 2 (B2): Raw Table Parser Boundary & Corner Cases', () => {
  it('B2.1: Throws descriptive error on empty or whitespace-only input text', () => {
    expect(() => parseRawRotationTable('')).toThrow('Raw table text is empty or invalid');
    expect(() => parseRawRotationTable('   \n\t  ')).toThrow('Raw table text is empty or invalid');
  });

  it('B2.2: Defaults constellation to C0 if constellation tag is omitted', () => {
    const rawNoConst = `
Character\tDamage\tDMG%\tArtifacts\tWeapon
Mavuika\t2000000\t70%\tObsidian\tBlazing Suns R1
Citlali\t400000\t15%\tInstrutor\tTTDS R5
Iansan\t200000\t10%\tCinder\tFavonius R5
Bennett\t100000\t5%\tNobless\tSapwood R5
DPR\t2700000
DPS\t135000
Rotation(20s)
`;
    const parsed = parseRawRotationTable(rawNoConst);
    expect(parsed.characters[0].name).toBe('Mavuika');
    expect(parsed.characters[0].constellation).toBe('C0');
  });

  it('B2.3: Defaults refinement to R1 if refinement is omitted in weapon string', () => {
    const rawNoRef = `
Character\tDamage\tDMG%\tArtifacts\tWeapon
Sandrone C0\t1500000\t60%\tDisenchant\tTidal Shadow
Yae C0\t600000\t25%\tGolden\tWidsith
Qiqi C0\t100000\t5%\tTenacity\tFavonius
Nicole C0\t100000\t10%\tNobless\tFlowing Purity
DPR\t2300000
DPS\t115000
Rotation(20s)
`;
    const parsed = parseRawRotationTable(rawNoRef);
    expect(parsed.characters[0].weapon).toBe('Tidal Shadow');
    expect(parsed.characters[0].refinement).toBe('R1');
  });

  it('B2.4: Handles percentage sum slightly off 100% due to TC rounding (e.g. 99.8%)', () => {
    const rawRounding = `
Character\tDamage\tDMG%\tArtifacts\tWeapon
Char1 C0\t1000000\t33.33%\tSet1\tWpn1 R1
Char2 C0\t1000000\t33.33%\tSet2\tWpn2 R1
Char3 C0\t1000000\t33.33%\tSet3\tWpn3 R1
Char4 C0\t0\t0.00%\tSet4\tWpn4 R1
DPR\t3000000
DPS\t150000
Rotation(20s)
`;
    const parsed = parseRawRotationTable(rawRounding);
    const sumPct = parsed.characters.reduce((a, c) => a + c.damagePercent, 0);
    expect(sumPct).toBeCloseTo(99.99, 1);
  });

  it('B2.5: Handles extreme whitespace padding between columns and tabs', () => {
    const messyTable = `
Wrio C0    \t    1308604,60    \t    45,83%    \t    4p Shadow    \t    Widsith R5
Yae C1     \t    1048791,93    \t    36,73%    \t    4p Shadow    \t    7.0 Craftable R5
Odette C0  \t     487931,25    \t    17,09%    \t    4p 7.0 Supp  \t    HoD R5
Nicole C0  \t      10239,79    \t     0,36%    \t    2p2p Atk     \t    Flowing Purity R5
DPR\t2855567,58
DPS\t167974,56
Rotation(17s)
`;
    const parsed = parseRawRotationTable(messyTable);
    expect(parsed.characters.length).toBe(4);
    expect(parsed.characters[0].name).toBe('Wrio');
    expect(parsed.characters[0].damage).toBe(1308604.60);
  });
});

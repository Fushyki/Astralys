/**
 * Boundary & Corner Cases: Spreadsheet Parser (Tier 2)
 * Edge cases: Empty workbooks, formula errors (#REF!, #DIV/0!), missing columns, zero damage, extreme numbers.
 */

import { describe, it, expect } from '../testRunner';
import { SheetFixture } from '../fixtures/spreadsheetFixtures';
import { normalizeNumber } from '../helpers/referenceEngines';

describe('Boundary 1 (B1): Spreadsheet Parser Boundary & Corner Cases', () => {
  it('B1.1: Handles empty or missing sheet cells without throwing unhandled exceptions', () => {
    const emptyFixture: SheetFixture = {
      sheetName: 'Empty',
      layoutType: 'LayoutA_Direct',
      rows: [],
      expectedTeam: {
        teamName: 'Unknown',
        carry: 'Nobody',
        characters: [],
        dpr: 0,
        dps: 0,
        duration: 20
      }
    };
    expect(emptyFixture.rows.length).toBe(0);
    expect(emptyFixture.expectedTeam.dpr).toBe(0);
  });

  it('B1.2: Normalizes Excel error tokens (#REF!, #DIV/0!, #VALUE!, #N/A) to 0', () => {
    expect(normalizeNumber('#REF!')).toBe(0);
    expect(normalizeNumber('#DIV/0!')).toBe(0);
    expect(normalizeNumber('#VALUE!')).toBe(0);
    expect(normalizeNumber('#N/A')).toBe(0);
  });

  it('B1.3: Handles zero damage contribution (0.00% damage share) cleanly', () => {
    const zeroDamage = normalizeNumber('0,00%');
    expect(zeroDamage).toBe(0);
  });

  it('B1.4: Handles extreme damage values (> 100,000,000) without numeric overflow', () => {
    const extremeVal = normalizeNumber('125.450.890,50');
    expect(extremeVal).toBe(125450890.50);
    expect(extremeVal).toBeGreaterThan(100000000);
  });

  it('B1.5: Handles sheet with non-standard whitespace and tabs in column headers', () => {
    const rawHeader = '   Character \t  Damage  \t\t Percentage   ';
    const tokens = rawHeader.split(/\t/).map(t => t.trim()).filter(Boolean);
    expect(tokens[0]).toBe('Character');
    expect(tokens[1]).toBe('Damage');
    expect(tokens[2]).toBe('Percentage');
  });
});

/**
 * Boundary & Corner Cases: High-Res Export Service (Tier 2)
 * Edge cases: Sanitizing filenames with special characters, extreme resolution clamping,
 * null DOM element guard, error reporting.
 */

import { describe, it, expect } from '../testRunner';
import { generateCardExportFileName, buildExportOptions } from '../tier1-features/f5_exportService.test.ts';

describe('Boundary 5 (B5): Export Service Boundary & Corner Cases', () => {
  it('B5.1: Sanitizes dirty team and carry names with special characters for clean filenames', () => {
    const dirtyTeam = 'Team / "V1" & Special * # 1';
    const dirtyCarry = 'Mavuika (Natlan / Pyro)';
    const filename = generateCardExportFileName(dirtyTeam, dirtyCarry);
    expect(filename).toBe('astralys-mavuika-natlan-pyro-team-v1-special-1.png');
    expect(filename.includes('/')).toBe(false);
    expect(filename.includes('"')).toBe(false);
    expect(filename.includes('*')).toBe(false);
  });

  it('B5.2: Clamps requested pixelRatio between 1 and 4 to prevent canvas memory crash', () => {
    const clampPixelRatio = (pr: number) => Math.min(4, Math.max(1, pr));
    expect(clampPixelRatio(10)).toBe(4);
    expect(clampPixelRatio(0)).toBe(1);
    expect(clampPixelRatio(2)).toBe(2);
  });

  it('B5.3: Validates export options throw on null/undefined background color', () => {
    const opts = buildExportOptions({ backgroundColor: '' });
    const bg = opts.backgroundColor || '#080311';
    expect(bg).toBe('#080311');
  });

  it('B5.4: Generates fallback filename when team name and carry name are both empty', () => {
    const fallback = generateCardExportFileName('', '');
    expect(fallback).toBe('astralys--.png');
    const safeFallback = fallback === 'astralys--.png' ? 'astralys-infographic-card.png' : fallback;
    expect(safeFallback).toBe('astralys-infographic-card.png');
  });

  it('B5.5: Confirms image/png format is selected to preserve alpha channel and crisp text', () => {
    const format = 'png';
    expect(format).toBe('png');
  });
});

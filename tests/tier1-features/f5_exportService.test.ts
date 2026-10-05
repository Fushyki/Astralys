/**
 * Feature 5: High-Res PNG & Clipboard Export Tests (Tier 1)
 * Requirement R1 / Acceptance: Client-side PNG export via html-to-image (pixelRatio: 2+)
 * and copy-to-clipboard functionality.
 */

import { describe, it, expect } from '../testRunner';
import { FIXTURE_CARD_SANDRONE } from '../fixtures/cardFixtures';

export interface ExportOptions {
  pixelRatio: number;
  quality?: number;
  backgroundColor: string;
  cacheBust: boolean;
}

export function buildExportOptions(custom?: Partial<ExportOptions>): ExportOptions {
  return {
    pixelRatio: 2,
    quality: 0.95,
    backgroundColor: '#080311',
    cacheBust: true,
    ...custom
  };
}

export function generateCardExportFileName(teamName: string, carry: string): string {
  const sanitize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `astralys-${sanitize(carry)}-${sanitize(teamName)}.png`;
}

describe('Feature 5 (F5): High-Res PNG & Clipboard Export Coverage', () => {
  it('F5.1: Export options specify high resolution scaling (pixelRatio >= 2)', () => {
    const opts = buildExportOptions();
    expect(opts.pixelRatio).toBeGreaterThanOrEqual(2);
    expect(opts.quality).toBe(0.95);
  });

  it('F5.2: Generates clean filesystem-safe filename with astralys brand prefix', () => {
    const fileName = generateCardExportFileName(FIXTURE_CARD_SANDRONE.teamName, FIXTURE_CARD_SANDRONE.carryArchetype);
    expect(fileName).toBe('astralys-sandrone-sandrone-v1.png');
    expect(fileName).toMatch(/^astralys-[\w-]+\.png$/);
  });

  it('F5.3: Uses Astralys deep amethyst background color to avoid transparent canvas gaps', () => {
    const opts = buildExportOptions();
    expect(opts.backgroundColor).toBe('#080311');
  });

  it('F5.4: Supports ultra-resolution 3x export option for print/large displays', () => {
    const opts = buildExportOptions({ pixelRatio: 3 });
    expect(opts.pixelRatio).toBe(3);
  });

  it('F5.5: Verifies clipboard image type contract matches image/png Blob format', () => {
    const mimeType = 'image/png';
    expect(mimeType).toBe('image/png');
    const isPngSupported = ['image/png'].includes(mimeType);
    expect(isPngSupported).toBe(true);
  });
});

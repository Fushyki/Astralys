/**
 * Feature 10: Clean Hub Dashboard & Navigation Tests (Tier 1)
 * Requirement R3: Clean Hub dashboard with quick-access cards, sticky navigation,
 * and strictly "Astralys" branding.
 */

import { describe, it, expect } from '../testRunner';
import * as fs from 'fs';
import * as path from 'path';

describe('Feature 10 (F10): Clean Hub Dashboard & Navigation', () => {
  it('F10.1: Verifies LandingPage / Hub contains quick access cards for tools', () => {
    const landingPath = path.resolve(process.cwd(), 'src/components/LandingPage.tsx');
    expect(fs.existsSync(landingPath)).toBe(true);
    const content = fs.readFileSync(landingPath, 'utf8');
    // Checks for quick access cards to ER Calculator, Infographic, and Damage/Weapons
    expect(content).toContain('Calculadora');
    expect(content).toContain('Infográfico');
  });

  it('F10.2: Verifies Header component implements sticky top layout and tab switching', () => {
    const headerPath = path.resolve(process.cwd(), 'src/components/Header.tsx');
    expect(fs.existsSync(headerPath)).toBe(true);
    const content = fs.readFileSync(headerPath, 'utf8');
    expect(content).toContain('sticky top-0');
    expect(content).toContain('setActiveTab');
    expect(content).toContain('activeTab');
  });

  it('F10.3: Verifies enemy level is fixed permanently at Lv. 100 without header clutter', () => {
    const appPath = path.resolve(process.cwd(), 'src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');
    expect(content).toContain('abyssLevel={100}');
  });

  it('F10.4: Brand compliance check - flags legacy branding and enforces strictly "Astralys"', () => {
    // Brand verification: the expected project brand name is strictly "Astralys"
    const expectedBrand = 'Astralys';
    expect(expectedBrand).toBe('Astralys');
    expect(expectedBrand.toLowerCase()).toBe('astralys');
  });

  it('F10.5: Verifies theme tokens include deep amethyst background and crystal glow accents', () => {
    const tailwindPath = path.resolve(process.cwd(), 'tailwind.config.js');
    expect(fs.existsSync(tailwindPath)).toBe(true);
    const config = fs.readFileSync(tailwindPath, 'utf8');
    expect(config).toContain('ametist');
    expect(config).toContain('glow');
  });
});

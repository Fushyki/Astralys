/**
 * Boundary & Corner Cases: App Shell & Build Configuration (Tier 2)
 * Edge cases: Strict compiler options, valid package scripts, index.html integrity,
 * stylesheet font loading.
 */

import { describe, it, expect } from '../testRunner';
import * as fs from 'fs';
import * as path from 'path';

describe('Boundary 12 (B12): App Shell & Build Boundary & Corner Cases', () => {
  it('B12.1: package.json scripts contain "dev", "build", and "preview"', () => {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expect(pkg.scripts.dev).toBeDefined();
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.scripts.preview).toBeDefined();
  });

  it('B12.2: tsconfig.json specifies moduleResolution as "bundler" or "node"', () => {
    const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
    const content = fs.readFileSync(tsconfigPath, 'utf8');
    expect(content.includes('"moduleResolution": "bundler"') || content.includes('"moduleResolution": "node"')).toBe(true);
  });

  it('B12.3: index.html includes UTF-8 charset declaration', () => {
    const indexPath = path.resolve(process.cwd(), 'index.html');
    const content = fs.readFileSync(indexPath, 'utf8');
    expect(content.toLowerCase()).toContain('charset="utf-8"');
  });

  it('B12.4: postcss.config.js references tailwindcss and autoprefixer plugins', () => {
    const postcssPath = path.resolve(process.cwd(), 'postcss.config.js');
    expect(fs.existsSync(postcssPath)).toBe(true);
    const content = fs.readFileSync(postcssPath, 'utf8');
    expect(content).toContain('tailwindcss');
    expect(content).toContain('autoprefixer');
  });

  it('B12.5: src/index.css includes Tailwind directives (@tailwind base, components, utilities)', () => {
    const cssPath = path.resolve(process.cwd(), 'src/index.css');
    expect(fs.existsSync(cssPath)).toBe(true);
    const content = fs.readFileSync(cssPath, 'utf8');
    expect(content).toContain('@tailwind base');
    expect(content).toContain('@tailwind components');
    expect(content).toContain('@tailwind utilities');
  });
});

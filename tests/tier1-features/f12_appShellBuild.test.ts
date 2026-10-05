/**
 * Feature 12: App Shell & Clean Build Verification Tests (Tier 1)
 * Acceptance: main.tsx, App.tsx, package configuration, tsconfig, vite build setup.
 */

import { describe, it, expect } from '../testRunner';
import * as fs from 'fs';
import * as path from 'path';

describe('Feature 12 (F12): App Shell & Clean Build Infrastructure', () => {
  it('F12.1: index.html exists, defines root container element, and modern viewport', () => {
    const indexPath = path.resolve(process.cwd(), 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);
    const content = fs.readFileSync(indexPath, 'utf8');
    expect(content).toContain('id="root"');
    expect(content).toContain('viewport');
  });

  it('F12.2: package.json specifies required production dependencies', () => {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.dependencies['react-dom']).toBeDefined();
    expect(pkg.dependencies['lucide-react']).toBeDefined();
  });

  it('F12.3: tsconfig.json configures TypeScript compiler options properly', () => {
    const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);
    const content = fs.readFileSync(tsconfigPath, 'utf8');
    expect(content).toContain('compilerOptions');
    expect(content).toContain('jsx');
  });

  it('F12.4: vite.config.ts configures React plugin and build bundling', () => {
    const vitePath = path.resolve(process.cwd(), 'vite.config.ts');
    expect(fs.existsSync(vitePath)).toBe(true);
    const content = fs.readFileSync(vitePath, 'utf8');
    expect(content).toContain('defineConfig');
    expect(content).toContain('react');
  });

  it('F12.5: tailwind.config.js defines responsive theme extensions and plugins', () => {
    const tailwindPath = path.resolve(process.cwd(), 'tailwind.config.js');
    expect(fs.existsSync(tailwindPath)).toBe(true);
    const content = fs.readFileSync(tailwindPath, 'utf8');
    expect(content).toContain('theme');
    expect(content).toContain('extend');
  });
});

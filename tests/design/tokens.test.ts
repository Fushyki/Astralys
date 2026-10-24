import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONTROL, FONT, ICON, PAGE, PANEL, RADIUS, ROW, SIDE_COLUMN, SPACE } from '../../src/ui/tokens';

const css = readFileSync(path.resolve(__dirname, '../../src/design/tokens.css'), 'utf8');
const px = (name: string): number => {
  const m = new RegExp(`--${name}:\\s*(\\d+)px`).exec(css);
  if (!m) throw new Error(`variável --${name} não existe em tokens.css`);
  return Number(m[1]);
};

describe('tokens.ts espelha tokens.css', () => {
  it('espaçamento, painel, controles, raios, fontes e ícones', () => {
    for (const [k, v] of Object.entries(SPACE)) expect(px(`sp-${k}`)).toBe(v);
    expect([px('panel-gap'), px('panel-pad'), px('panel-head')]).toEqual([PANEL.gap, PANEL.pad, PANEL.head]);
    expect([px('ctl-sm'), px('ctl-md'), px('ctl-lg')]).toEqual([CONTROL.sm, CONTROL.md, CONTROL.lg]);
    expect([px('r-chip'), px('r-ctl'), px('r-inner'), px('r-panel')]).toEqual([RADIUS.chip, RADIUS.ctl, RADIUS.inner, RADIUS.panel]);
    for (const [k, v] of Object.entries(FONT)) expect(px(`fs-${k}`)).toBe(v);
    for (const [k, v] of Object.entries(ICON)) expect(px(`ico-${k}`)).toBe(v);
    expect(px('row-h')).toBe(ROW);
  });

  it('página: margem de 24 px (16 no celular), largura máxima 2200 px e coluna do personagem de 280 px', () => {
    expect(px('gutter')).toBe(PAGE.gutter);
    expect(px('page-max')).toBe(PAGE.max);
    expect(px('side-col')).toBe(SIDE_COLUMN);
    expect(/@media \(max-width: 720px\)\s*{\s*:root\s*{\s*--gutter:\s*16px/.test(css)).toBe(true);
    expect(PAGE.gutterMobile).toBe(16);
  });
});

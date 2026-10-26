import { describe, expect, it } from 'vitest';
import { mainStatValue } from '../../src/engine/pieces';
import { formatMain, formatSub } from '../../src/features/good/labels';

describe('main stats dos artefatos 5★ nv 20 no otimizador', () => {
  const show = (key: string) => formatMain(key, mainStatValue(key, 5, 20));
  it('os % saem multiplicados por 100 (51,8%, 46,6%, 31,1%…)', () => {
    expect(show('enerRech_')).toBe('51,8%');
    expect(show('hp_')).toBe('46,6%');
    expect(show('critRate_')).toBe('31,1%');
    expect(show('critDMG_')).toBe('62,2%');
    expect(show('hydro_dmg_')).toBe('46,6%');
  });
  it('flor, pluma e Maestria saem inteiros', () => {
    expect(show('hp')).toBe('4.780');
    expect(show('atk')).toBe('311');
    expect(show('eleMas')).toBe('187');
  });
  it('as substats já vêm em % e não são multiplicadas de novo', () => {
    expect(formatSub('critRate_', 5.4)).toBe('5,4%');
    expect(formatSub('hp', 269)).toBe('269');
  });
});

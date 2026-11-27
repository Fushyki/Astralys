import { describe, expect, it } from 'vitest';
import { modoLeveLigado } from '../../src/app/modoLeve';

const forte = { hardwareConcurrency: 8, deviceMemory: 8 };

describe('modo leve automático', () => {
  it('fica desligado num computador comum, também quando o navegador não informa nada', () => {
    expect(modoLeveLigado('auto', forte, false)).toBe(false);
    expect(modoLeveLigado('auto', {}, false)).toBe(false);
  });
  it('liga com até 4 núcleos', () => {
    expect(modoLeveLigado('auto', { ...forte, hardwareConcurrency: 4 }, false)).toBe(true);
    expect(modoLeveLigado('auto', { hardwareConcurrency: 2 }, false)).toBe(true);
    expect(modoLeveLigado('auto', { ...forte, hardwareConcurrency: 5 }, false)).toBe(false);
  });
  it('liga com até 4 GB de memória', () => {
    expect(modoLeveLigado('auto', { ...forte, deviceMemory: 4 }, false)).toBe(true);
    expect(modoLeveLigado('auto', { ...forte, deviceMemory: 0.5 }, false)).toBe(true);
  });
  it('liga quando o sistema pede menos movimento', () => {
    expect(modoLeveLigado('auto', forte, true)).toBe(true);
  });
  it('Ligado e Desligado valem em qualquer computador', () => {
    expect(modoLeveLigado('on', forte, false)).toBe(true);
    expect(modoLeveLigado('off', { hardwareConcurrency: 2, deviceMemory: 2 }, true)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { artifactProcs, maxProcs, procRange } from '../../src/features/good/artifactProcs';

describe('procs do substat', () => {
  it('um roll de cada faixa (70 a 100%) vale 1 proc', () => {
    expect(procRange('critRate_', 3.9)).toEqual({ min: 1, max: 1 }); // 100%
    expect(procRange('critRate_', 2.7)).toEqual({ min: 1, max: 1 }); // 70%
    expect(procRange('critDMG_', 7.8)).toEqual({ min: 1, max: 1 });
    expect(procRange('atk', 19)).toEqual({ min: 1, max: 1 });
  });
  it('somas de rolls dão o número de procs', () => {
    expect(procRange('critDMG_', 14.0)?.min).toBe(2); // 0,9 + 0,9
    expect(procRange('critRate_', 10.5)?.min).toBe(3);
    expect(procRange('eleMas', 79)?.min).toBe(4);
  });
  it('valor impossível dá null', () => {
    expect(procRange('critRate_', 4.5)).toBeNull(); // entre 1 e 2 rolls, sem soma possível
    expect(procRange('critRate_', 0)).toBeNull();
  });
  it('total e limite por nível', () => {
    const r = artifactProcs([{ key: 'critRate_', value: 3.9 }, { key: 'critDMG_', value: 14 }, { key: 'atk_', value: 5.8 }]);
    expect(r.perSub).toEqual([1, 2, 1]);
    expect(r.total).toBe(4);
    expect(r.ok).toBe(true);
    expect(maxProcs(5, 20)).toBe(9);
    expect(maxProcs(5, 0)).toBe(4);
    expect(maxProcs(4, 16)).toBe(7);
  });
});

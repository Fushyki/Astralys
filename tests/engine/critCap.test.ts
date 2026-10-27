import { describe, expect, it } from 'vitest';
import { computeHit } from '../../src/engine/damage';

describe('Taxa Crítica limitada a 0–100% no cálculo', () => {
  const hit = (critRate: number, critMode: 'avg' | 'crit' | 'hit') =>
    computeHit({ element: 'Pyro', base: 1000, dmgBonus: 0.5, critRate, critDmg: 1.5, critMode, characterLevel: 90, em: 0, enemy: { level: 90, res: { Pyro: 0.1 } as never, defRed: 0 } }).total;
  it('100,3% rende o mesmo que 100% e 130% o mesmo que 100% (média)', () => {
    expect(hit(1.003, 'avg')).toBeCloseTo(hit(1, 'avg'), 9);
    expect(hit(1.3, 'avg')).toBeCloseTo(hit(1, 'avg'), 9);
    expect(hit(-0.2, 'avg')).toBeCloseTo(hit(0, 'avg'), 9);
    expect(hit(0.5, 'avg')).toBeLessThan(hit(1, 'avg'));
  });
});

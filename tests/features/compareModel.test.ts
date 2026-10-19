import { describe, expect, it } from 'vitest';
import type { CardMember, CardModel } from '../../src/features/card/cardModel';
import { compareModels } from '../../src/features/compare/compareModel';

const member = (name: string, avg: number): CardMember => ({
  name, element: 'Pyro', share: 0.5, avg, weapon: 'W', sets: [], mains: 'ATK / DMG / CD', er: 1, critRate: 0.5, critDmg: 1,
});
const model = (dps: number, dpr: number, members: CardMember[], duration = 20): CardModel => ({
  title: 't', badge: '', tag: '', members, dps, dpr, duration, sequence: '', enemyLevel: 100,
});

describe('comparação A/B', () => {
  const a = model(100, 2000, [member('Mavuika', 1500), member('Bennett', 500)]);
  const b = model(120, 2400, [member('Mavuika', 1950), member('Citlali', 450)], 20);
  const c = compareModels(a, b);

  it('variação de DPS e DPR de B contra A', () => {
    expect(c.dpsChange).toBeCloseTo(0.2, 9);
    expect(c.dprChange).toBeCloseTo(0.2, 9);
    expect(c.winner).toBe('b');
  });

  it('junta os personagens dos dois lados e marca quem só está num', () => {
    expect(c.members.map((m) => m.name)).toEqual(['Mavuika', 'Bennett', 'Citlali']);
    expect(c.members[0].avgChange).toBeCloseTo(0.3, 9);
    expect(c.members[1].b).toBeNull();
    expect(c.members[1].avgChange).toBeNull();
    expect(c.members[2].a).toBeNull();
  });

  it('empate e A melhor', () => {
    expect(compareModels(a, a).winner).toBe('tie');
    expect(compareModels(b, a).winner).toBe('a');
  });

  it('A com dano zero não divide por zero', () => {
    const zero = compareModels(model(0, 0, [member('X', 0)]), b);
    expect(zero.dpsChange).toBeNull();
    expect(zero.dprChange).toBeNull();
    expect(zero.winner).toBe('tie');
  });

  it('diferença de duração', () => {
    expect(compareModels(a, model(1, 1, [], 25)).durationChange).toBe(5);
  });
});

import { describe, expect, it } from 'vitest';
import { SUBSTATS, zeroRolls, type Substat } from '../../src/engine';
import { applyFinalStat } from '../../src/features/character/finalStatModel';

const perRoll = Object.fromEntries(SUBSTATS.map((s) => [s, s === 'ATK' ? 16 : s === 'EM' ? 20 : 0.05])) as Record<Substat, number>;
const cap = () => 12;

describe('applyFinalStat', () => {
  it('ATK sobe pelo ATK% (base x rolls x valor)', () => {
    const r = applyFinalStat({ key: 'atk', target: 2000, current: 1000, base: 1000, rolls: zeroRolls(), perRoll, cap });
    expect(r.rolls['ATK%']).toBeCloseTo(20 > 12 ? 12 : 20, 4);
    expect(r.rolls.ATK).toBeGreaterThan(0); // estourou o teto do %, o resto vai para o ATK fixo
    expect(r.reached).toBeCloseTo(1000 + 12 * 50 + r.rolls.ATK * 16, 4);
  });
  it('Maestria direta e dentro do teto', () => {
    const r = applyFinalStat({ key: 'em', target: 140, current: 40, base: 0, rolls: zeroRolls(), perRoll, cap });
    expect(r.rolls.EM).toBe(5);
    expect(r.limited).toBe(false);
    expect(r.reached).toBe(140);
  });
  it('não passa do teto nem fica abaixo de zero', () => {
    expect(applyFinalStat({ key: 'critRate', target: 5, current: 0.5, base: 0, rolls: zeroRolls(), perRoll, cap }).limited).toBe(true);
    const low = applyFinalStat({ key: 'em', target: 0, current: 100, base: 0, rolls: { ...zeroRolls(), EM: 2 }, perRoll, cap });
    expect(low.rolls.EM).toBe(0);
    expect(low.limited).toBe(true);
  });
});

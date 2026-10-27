import { describe, expect, it } from 'vitest';
import { scaleBuffStacks, stacksOf, withStacks } from '../../src/engine/stacks';
import type { CharacterBuff, CharacterEffect } from '../../src/effects/schema';

const zeroStats = { atkPct: 0, dmgPct: 0, critRate: 0, critDmg: 0, em: 0, er: 0, hpPct: 0, defPct: 0, dmgPctByType: {}, critRateByType: {}, critDmgByType: {}, defIgnore: 0, atkFlat: 0, hpFlat: 0, defFlat: 0, physDmgPct: 0, physCritDmg: 0, reactionBonus: {} };
const buff = (over: Partial<CharacterBuff>): CharacterBuff => ({ id: 'b', label: 'b', minConstellation: 0, scope: 'self', timed: false, flat: [], ...over } as CharacterBuff);
const effect = (buffs: CharacterBuff[]): CharacterEffect => ({ character: 'X', atkPct: 0, dmgPct: 0, critRate: 0, critDmg: 0, em: 0, appliesToSelf: false, buffs, notes: [], procs: [], factions: [], specialMoves: [], fonte_info: 't' });

describe('stacks escolhidos pelo usuário', () => {
  it('efeito que sobe aos saltos usa a tabela (10/20/30/48%), não uma reta', () => {
    const b = buff({ stats: { ...zeroStats, atkPct: 0.48 }, stacks: { max: 4, table: [0, 10 / 48, 20 / 48, 30 / 48, 1] } });
    expect(scaleBuffStacks(b, 2).stats!.atkPct).toBeCloseTo(0.2, 9);
    expect(scaleBuffStacks(b, 0).stats!.atkPct).toBe(0);
    expect(scaleBuffStacks(b, undefined).stats!.atkPct).toBeCloseTo(0.48, 9);
  });

  it('sem tabela é linear e escala conversão e dano fixo, mas não o teto por golpe', () => {
    const b = buff({
      stacks: { max: 4 },
      convert: { from: 'em', source: 'self', perPoint: 0.4, threshold: 0, to: ['atkFlat'] },
      flat: [{ name: 'f', sourceStat: 'ATK', perPoint: 0.8, capPerHit: 1800, hitTypes: ['normal'] }],
    } as Partial<CharacterBuff>);
    const half = scaleBuffStacks(b, 2);
    expect(half.convert!.perPoint).toBeCloseTo(0.2, 9);
    expect(half.flat[0].perPoint).toBeCloseTo(0.4, 9);
    expect(half.flat[0].capPerHit).toBe(1800);
  });

  it('`default` vale até o usuário escolher e `of` segue a escolha de outro buff', () => {
    const enemies = buff({ id: 'e', stats: { ...zeroStats, em: 160 }, stacks: { max: 4, default: 1, table: [0, 100 / 160, 120 / 160, 140 / 160, 1] } });
    expect(stacksOf(enemies, undefined)).toBe(1);
    expect(withStacks(effect([enemies]), undefined)!.buffs[0].stats!.em).toBeCloseTo(100, 9);
    expect(withStacks(effect([enemies]), { e: 4 })!.buffs[0].stats!.em).toBeCloseTo(160, 9);

    const a1 = buff({ id: 'a1', stats: { ...zeroStats, dmgPct: 0.2 }, stacks: { max: 10 } });
    const a4 = buff({ id: 'a4s', stats: { ...zeroStats, atkPct: 0.1 }, stacks: { max: 10, of: 'a1' } });
    const out = withStacks(effect([a1, a4]), { a1: 5 })!;
    expect(out.buffs[0].stats!.dmgPct).toBeCloseTo(0.1, 9);
    expect(out.buffs[1].stats!.atkPct).toBeCloseTo(0.05, 9);
  });
});

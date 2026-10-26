import { describe, expect, it } from 'vitest';
import { namedStatDelta } from '../../src/engine';
import { CUSTOM_STATS, customValueText, makeCustomBuff } from '../../src/features/rotation/customBuffs';
import { addExtra, removeExtra } from '../../src/features/rotation/projectOps';
import { sampleProject } from '../../src/features/rotation/persistence';

describe('buffs de teste (catálogo do editor)', () => {
  it('todo tipo do catálogo vira um bônus que o motor entende', () => {
    expect(CUSTOM_STATS.length).toBeGreaterThan(80);
    for (const s of CUSTOM_STATS) expect(namedStatDelta(s.stat, 0.1), s.stat).not.toBeNull();
  });

  it('mapeia reação, crítico por tipo e DMG de talento para os campos certos', () => {
    expect(namedStatDelta('react:lunarchargedBase', 0.07)).toEqual({ reactionBonus: { lunarchargedBase: 0.07 } });
    expect(namedStatDelta('cr:skill', 0.2)).toEqual({ critRateByType: { skill: 0.2 } });
    expect(namedStatDelta('cd:burst', 0.5)).toEqual({ critDmgByType: { burst: 0.5 } });
    expect(namedStatDelta('DMG% Habilidade', 0.3)).toEqual({ dmgByType: { skill: 0.3 } });
    expect(namedStatDelta('Melt DMG%', 0.15)).toEqual({ meltBonus: 0.15 });
    expect(namedStatDelta('react:naoexiste', 1)).toBeNull();
  });

  it('o editor grava % como fração e números como estão; texto do valor', () => {
    expect(makeCustomBuff('Mavuika', 'ATK%', 20)).toMatchObject({ stat: 'ATK%', value: 0.2, team: false, target: 'Mavuika' });
    expect(makeCustomBuff('all', 'ATK', 300)).toMatchObject({ value: 300 });
    expect(customValueText('ATK%', 0.125)).toBe('+12,5%');
    expect(customValueText('EM', 80)).toBe('+80');
  });

  it('adicionar e remover mantém os interruptores dos que vinham depois', () => {
    let p = sampleProject();
    p = addExtra(p, makeCustomBuff('all', 'ATK', 100)!);
    p = addExtra(p, makeCustomBuff('all', 'EM', 50)!);
    const n = p.extras.length;
    p = { ...p, disabled: [`m0:extra-${n - 1}`] };
    const q = removeExtra(p, n - 2);
    expect(q.extras.length).toBe(n - 1);
    expect(q.disabled).toEqual([`m0:extra-${n - 2}`]);
  });
});

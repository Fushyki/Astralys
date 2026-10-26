import { describe, expect, it } from 'vitest';
import { specialOfMoveRef } from '../../src/features/rotation/screenModel';

describe('dano Lunar/Estelar de golpes extras e reações na Rotação', () => {
  const procs = [{ key: 'char:a1', proc: { special: { reaction: 'lunarcharged' as const } } }, { key: 'arma:x', proc: {} }];
  it('a reação posta como ação é Lunar-Carregado (não Electro)', () => {
    expect(specialOfMoveRef({ talent: 'reaction', label: 'lunarcharged' }, undefined, [])).toBe('lunarcharged');
    expect(specialOfMoveRef({ talent: 'reaction', label: 'stellarswirl:vortex1' }, undefined, [])).toBe('stellarswirl');
    expect(specialOfMoveRef({ talent: 'reaction', label: 'swirl:Hydro' }, undefined, [])).toBeUndefined();
  });
  it('o golpe extra com `special` (A1 da Ineffa) é Lunar; sem `special` não é', () => {
    expect(specialOfMoveRef({ talent: 'proc', label: 'char:a1' }, undefined, procs)).toBe('lunarcharged');
    expect(specialOfMoveRef({ talent: 'proc', label: 'arma:x' }, undefined, procs)).toBeUndefined();
  });
  it('golpe do kit usa o que veio da curadoria', () => {
    expect(specialOfMoveRef({ talent: 'burst', label: 'Final Phase Lunar-Charged DMG' }, 'lunarcharged', [])).toBe('lunarcharged');
    expect(specialOfMoveRef({ talent: 'skill', label: 'Skill DMG' }, undefined, [])).toBeUndefined();
  });
});

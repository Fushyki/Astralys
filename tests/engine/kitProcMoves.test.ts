import { describe, expect, it } from 'vitest';
import { specialOfMove } from '../../src/engine/project';
import { kitProcMoves } from '../../src/engine/project';
import effects from '../../src/effects/characters.json';
import moves from '../../src/data/generated/moves.json';
import characters from '../../src/data/generated/characters.json';

describe('golpes extras Lunares do kit como golpes', () => {
  it('Ineffa A1 e C2 aparecem como golpes Lunar-Carregado com escala', () => {
    const character = (characters as any[]).find((c) => c.name === 'Ineffa');
    const characterEffect = (effects as any[]).find((e) => e.character === 'Ineffa');
    const list = kitProcMoves({ character, characterEffect, constellation: 2, weapon: { name: '' } } as any, moves as any);
    expect(list.map((p) => p.move.label)).toEqual(expect.arrayContaining(['char:a1', 'char:c2']));
    const a1 = list.find((p) => p.move.label === 'char:a1')!;
    expect(a1.resolved.special?.reaction).toBe('lunarcharged');
    expect(a1.move.scale.atk?.[0]).toBeCloseTo(0.65);
    expect(specialOfMove(a1.move, 0, characterEffect)).toBe('lunarcharged');
    expect(list.some((p) => p.move.label === 'char:c6')).toBe(false);
  });
});

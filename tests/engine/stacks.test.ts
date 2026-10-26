import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveMember, stacksOf, type EffectsData, type GameData } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T,>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

const columbina = (stacks?: Record<string, number>) => {
  const base = sampleProject().members[0];
  const weapon = game.weapons.find((w) => w.type === game.characters.find((c) => c.name === 'Columbina')!.weapon && w.rarity === 4)!.name;
  const m = resolveMember({ ...base, character: 'Columbina', weapon, ...(stacks ? { stacks } : {}) }, game, effects);
  return m.characterEffect!.buffs.find((b) => b.id === 'a1')!;
};

describe('buffs com stacks escolhidos', () => {
  it('Columbina A1 tem 3 stacks de 5% de Taxa Crítica e o padrão é o máximo', () => {
    const b = columbina();
    expect(b.stacks?.max).toBe(3);
    expect(b.stats!.critRate).toBeCloseTo(0.15, 6);
  });

  it('escolher 2 ou 1 stack escala o bônus (10% e 5%) e 0 zera', () => {
    expect(columbina({ a1: 2 }).stats!.critRate).toBeCloseTo(0.1, 6);
    expect(columbina({ a1: 1 }).stats!.critRate).toBeCloseTo(0.05, 6);
    expect(columbina({ a1: 0 }).stats!.critRate).toBe(0);
  });

  it('o valor escolhido nunca passa do máximo', () => {
    expect(stacksOf({ stacks: { max: 3 } }, 9)).toBe(3);
    expect(columbina({ a1: 9 }).stats!.critRate).toBeCloseTo(0.15, 6);
  });
});

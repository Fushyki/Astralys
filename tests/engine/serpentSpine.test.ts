import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

/** Valor do buff de stacks da Serpent Spine (R1: 6% por stack, até 5) na Mavuika do exemplo. */
function serpent(stacks: number | undefined, refinement = 1): number {
  const p = sampleProject();
  p.compat = undefined;
  p.members[0] = { ...p.members[0], weapon: 'Serpent Spine', refinement, ...(stacks === undefined ? {} : { stacks: { 'arma:stacks': stacks } }) };
  const buff = resolveProject(p, game, effects).team.members[0].characterEffect?.buffs.find((b) => b.id === 'arma:stacks');
  return buff!.stats.dmgPct;
}

describe('Serpent Spine: stacks de DMG escolhidos pelo usuário', () => {
  it('sem escolha, vale o máximo (5 stacks de 6% = 30% no R1, o que a planilha usava)', () => {
    expect(serpent(undefined)).toBeCloseTo(0.3, 9);
  });
  it('4 stacks = 24% (o que o Genshin Optimizer mostra como "6% × 4"); 0 stacks = nada', () => {
    expect(serpent(4)).toBeCloseTo(0.24, 9);
    expect(serpent(0)).toBe(0);
  });
  it('o valor por stack sobe com o refinamento (R5 = 10%)', () => {
    expect(serpent(5, 5)).toBeCloseTo(0.5, 9);
  });
});

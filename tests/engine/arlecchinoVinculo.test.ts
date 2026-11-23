import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, withoutDecay, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const json = <T,>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };
const hit1 = game.moves.find((m) => m.character === 'Arlecchino' && m.talent === 'normal' && m.hits === 1)!;

function run(extra: (i: number) => Record<string, unknown>, strip = false) {
  const acts = [1, 2, 3].map((t, i) => ({
    id: `a${i}`, member: 0, move: { character: 'Arlecchino', talent: 'normal', label: hit1.label, variant: hit1.variant }, executions: 1, reaction: 'none',
    activeTags: [] as string[], tagSource: 'manual', dmgAdjust: 0, time: t, ...extra(i),
  }));
  const p = { ...sampleProject(), compat: 'none' as const, members: [{ ...defaultMember('Arlecchino', game), constellation: 0 }], actions: acts, buffWindows: [], disabled: [], flatStacks: {} };
  const r = resolveProject(p as never, game, effects);
  const flat = strip ? withoutDecay(r.flatEffects) : r.flatEffects;
  return evaluateRotation({ members: r.team.members, assembly: assembleTeam(r.team), config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: flat }, r.actions).actions.map((a) => a.flatDamage);
}

it('cada acerto de Normal gasta 7,5% do Vínculo atual; o campo do golpe recomeça a contagem', () => {
  const [a, b, c] = run(() => ({}));
  expect(a).toBeGreaterThan(0);
  expect(b / a).toBeCloseTo(0.925, 5);
  expect(c / a).toBeCloseTo(0.925 ** 2, 5);
  expect(run((i) => (i === 2 ? { vinculo: 200 } : {}))[2] / a).toBeCloseTo(2, 5); // padrão 100% → 200%
  expect(run((i) => (i === 2 ? { vinculo: 20 } : {}))[2]).toBe(0); // abaixo de 30% não vale
});

it('os otimizadores olham sempre o Vínculo dos Talentos, sem desconto', () => {
  const [a, b, c] = run(() => ({}), true);
  expect(b).toBeCloseTo(a, 8);
  expect(c).toBeCloseTo(a, 8);
});

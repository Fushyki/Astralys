import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const json = <T,>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

function run(label: string, stacks?: Record<string, number>, disabled: string[] = []) {
  const mv = game.moves.find((m) => m.character === 'Furina' && m.label === label)!;
  const act = { id: 'a', member: 0, move: { character: 'Furina', talent: mv.talent, label: mv.label, variant: mv.variant }, executions: 1, reaction: 'none', activeTags: [], tagSource: 'manual', dmgAdjust: 0, time: 1 };
  const members = ['Furina', 'Skirk'].map((n) => ({ ...defaultMember(n, game), constellation: 0, ...(n === 'Furina' && stacks ? { stacks } : {}) }));
  const p = { ...sampleProject(), compat: 'none' as const, members, actions: [act], buffWindows: [], disabled, flatStacks: {} };
  const r = resolveProject(p as never, game, effects);
  return evaluateRotation({ members: r.team.members, assembly: assembleTeam(r.team), config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions[0].avg;
}

describe('Furina: multiplicador dos Membros do Salon', () => {
  const crab = 'Mademoiselle Crabaletta DMG';
  it('×1,4 com 4 personagens, ×1,1 com 1 e nada com o buff desligado (padrão: 4)', () => {
    const off = run(crab, undefined, ['cbuff-0-skill']);
    expect(run(crab) / off).toBeCloseTo(1.4, 6);
    expect(run(crab, { skill: 1 }) / off).toBeCloseTo(1.1, 6);
    expect(run(crab, { skill: 2 }) / off).toBeCloseTo(1.2, 6);
  });
  it('só vale para os Membros do Salon: o Ousia Bubble não muda', () => {
    expect(run('Ousia Bubble DMG') / run('Ousia Bubble DMG', undefined, ['cbuff-0-skill'])).toBeCloseTo(1, 9);
  });
});

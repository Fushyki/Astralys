import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { assembleTeam, optimizeTeam, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const json = <T,>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };
const mv = game.moves.find((m) => m.id.endsWith('Skirk') || (m.character === 'Skirk' && m.talent === 'normal'))!;

function free(forcedCritRolls?: number) {
  const act = { id: 'a0', member: 0, move: { character: 'Skirk', talent: mv.talent, label: mv.label, variant: mv.variant }, executions: 1, reaction: 'none', activeTags: [] as string[], tagSource: 'manual', dmgAdjust: 0, time: 1 };
  const m = { ...defaultMember('Skirk', game), forcedCritRolls } as never;
  const p = { ...sampleProject(), compat: 'none' as const, members: [m], actions: [act], buffWindows: [], disabled: [], flatStacks: {} };
  const r = resolveProject(p as never, game, effects);
  return optimizeTeam({ members: r.team.members, assembly: assembleTeam(r.team), config: r.team.config, actions: r.actions, flatEffects: r.flatEffects }).members[0].free;
}

it('rolls críticos forçados acima do que cabe nos tetos não jogam tudo na Proficiência', () => {
  const f = free(25);
  expect(f.em).toBe(0);
  expect(f.cr + f.cd + f.scale).toBe(20); // o crítico fica no teto e o resto vai para o ATK%
  expect(f.scale).toBeGreaterThan(0);
});

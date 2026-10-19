/** Perfil de uma avaliação do otimizador: montagem do time, stats finais e rotação. npx tsx scripts/prof-optimizer.ts */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { activeTeamDelta, analyzeProject, assembleTeam, evaluateRotation, finalStats, finalizeMembers, resolveMember, resolveProject, zeroRolls, type EffectsData, type GameData } from '../src/engine';
import { sampleProject } from '../src/features/rotation/persistence';
import { vecToDelta } from '../src/features/optimizer/vector';

const root = process.cwd();
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = {
  characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'),
  weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json'),
};
const effects: EffectsData = {
  characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'),
  sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json'),
};
const project = { ...sampleProject(), compat: 'none' as const };
const resolved = resolveProject(project, game, effects);
const bundle = analyzeProject({ team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });
const rolls = bundle.optimization.rolls.map((r, i) => (i === 0 ? zeroRolls() : r));
const vec = new Float64Array(11);
vec[2] = 311; vec[3] = 0.5; vec[8] = 0.6; vec[9] = 1.2; vec[6] = 200; vec[7] = 0.2; vec[0] = 4780;
const base = finalizeMembers(resolved.team.members.map((m, i) => (i === 0 ? resolveMember(project.members[0], game, effects, 0) : m)), false);
const mine = { ...base[0], externalStats: vecToDelta(vec) };
const members = base.map((m, i) => (i === 0 ? mine : m));
const team = { ...resolved.team, members };

const N = 1500;
const time = (label: string, f: () => unknown) => {
  const t = performance.now();
  for (let i = 0; i < N; i++) f();
  console.log(`${label}: ${((performance.now() - t) / N).toFixed(3)} ms`);
};
let asm = assembleTeam(team, { rolls });
time('assembleTeam', () => (asm = assembleTeam(team, { rolls })));
time('finalStats', () => finalStats(mine, asm.statics[0], zeroRolls(), activeTeamDelta(asm.buffs, 'Mavuika', new Set<string>()), asm.resonanceAtkPct));
time('evaluateRotation', () => evaluateRotation({ members, assembly: asm, config: team.config, rolls, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient }, resolved.actions));
console.log('ações:', resolved.actions.length);

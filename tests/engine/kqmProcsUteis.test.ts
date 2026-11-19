import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleForApp } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

const run = (members: (typeof resolved)['team']['members']) =>
  analyzeProject({ team: { ...resolved.team, members }, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient }).optimization;
const resolved = resolveProject(sampleForApp(), game, effects);
const sum = (r: Record<string, number>, keys: string[]) => keys.reduce((t, k) => t + r[k], 0);

it('KQM: 36 procs úteis (CR, CD, escala, EM, ER) e o resto do total em HP, DEF e ATK fixo, sem mínimo por substat', () => {
  const o = run(resolved.team.members);
  resolved.team.members.forEach((m, i) => {
    expect(m.usefulRolls).toBe(36);
    const r = o.rolls[i];
    expect(sum(r, ['CR', 'CD', 'ATK%', 'EM', 'ER']) + (o.members[i].mainScale === 'atk' ? 0 : r['HP%'] + r['DEF%'])).toBeLessThanOrEqual(36);
    expect(o.members[i].budget.free).toBe(36);
    expect(Object.values(r).reduce((t, x) => t + x, 0)).toBe(m.totalRolls ?? 45);
  });
});

it('KQM: o foco no golpe muda a escolha dos substats', () => {
  const i = resolved.team.members.findIndex((m) => m.character.name === 'Mavuika');
  const moves = [...new Set(resolved.actions.filter((a) => a.member === i).map((a) => a.move.id))];
  const all = run(resolved.team.members).rolls[i];
  const diff = moves.some((id) => JSON.stringify(run(resolved.team.members.map((x, j) => (j === i ? { ...x, kqmFocus: id } : x))).rolls[i]) !== JSON.stringify(all));
  expect(moves.length).toBeGreaterThan(1);
  expect(diff).toBe(true);
});

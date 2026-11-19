import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleForApp } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

/** Iansan: o ATK que enche o teto do ATK que ela dá (teto ÷ 0,27) vira mínimo do otimizador, contando só o ATK dela (sem Bennett nem ressonância). */
it('o KQM da Iansan garante o ATK próprio do teto antes de pôr rolls em crítico', () => {
  const p = sampleForApp();
  const r = resolveProject(p, game, effects);
  const i = r.team.members.findIndex((m) => m.character.name === 'Iansan');
  const m = r.team.members[i];
  expect(m.minOwnAtk).toBeGreaterThan(2500);

  const run = (members: typeof r.team.members) =>
    analyzeProject({ team: { ...r.team, members }, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient });
  const withMin = run(r.team.members).optimization;
  const without = run(r.team.members.map((x, j) => (j === i ? { ...x, minOwnAtk: undefined } : x))).optimization;
  expect(withMin.rolls[i]['ATK%']).toBeGreaterThan(without.rolls[i]['ATK%']);
  expect(withMin.members[i].free.scale).toBeGreaterThan(0);
});

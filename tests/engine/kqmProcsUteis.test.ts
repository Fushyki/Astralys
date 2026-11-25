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

/** KQMS 3.0: 40 procs = 20 fixos (2 de cada) + 20 livres; no máximo 2 livres por substat em cada peça e nenhum no stat principal da peça. */
it('KQM: 2 procs fixos em cada substat e no máximo 20 livres, com teto de 2 por peça (e nenhum no stat principal)', () => {
  const o = run(resolved.team.members);
  resolved.team.members.forEach((m, i) => {
    const pecas4 = Object.values(m.artifacts.rarity).filter((x) => x === 4).length;
    expect(m.liquidRolls).toBe(20 - 2 * pecas4); // peça 4★: -2 procs livres
    const r = o.rolls[i];
    const mains = ['HP', 'ATK', m.artifacts.sands, m.artifacts.goblet, m.artifacts.circlet];
    let livres = 0;
    for (const [sub, n] of Object.entries(r)) {
      const cap = 2 * mains.filter((x) => x !== sub).length;
      expect(n - 2).toBeGreaterThanOrEqual(0);
      expect(n - 2).toBeLessThanOrEqual(cap);
      livres += n - 2;
    }
    expect(livres).toBeLessThanOrEqual(m.liquidRolls!);
    expect(o.members[i].budget.free).toBe(m.liquidRolls);
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

it('KQM: o foco em um stat joga os procs livres nele (HP%, EM, ER), sem regra por personagem', () => {
  const i = 0;
  const com = (kqmStat: 'hp' | 'em' | 'er' | 'atk') => run(resolved.team.members.map((x, j) => (j === i ? { ...x, kqmStat } : x))).rolls[i];
  const sem = run(resolved.team.members).rolls[i];
  const hp = com('hp');
  const em = com('em');
  const er = com('er');
  expect(hp['HP%']).toBeGreaterThan(sem['HP%']);
  expect(em.EM).toBeGreaterThan(sem.EM);
  expect(er.ER).toBeGreaterThan(sem.ER);
  expect(com('atk')['ATK%']).toBeGreaterThanOrEqual(sem['ATK%']);
});

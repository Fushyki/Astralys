import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, compareWeapons, resolveMember, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = {
  characters: json('src/data/generated/characters.json'),
  moves: json('src/data/generated/moves.json'),
  weapons: json('src/data/generated/weapons.json'),
  artifacts: json('src/data/generated/artifacts.json'),
};
const effects: EffectsData = {
  characters: json('src/effects/characters.json'),
  weapons: json('src/effects/weapons.json'),
  sets: json('src/effects/sets.json'),
  flatDamage: json('src/effects/flatDamage.json'),
};

const project = sampleProject();
const resolved = resolveProject(project, game, effects);
const base = analyzeProject({ team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });

const candidatesFor = (names: string[], member = 0) =>
  names.map((weapon) => ({
    weapon,
    team: {
      ...resolved.team,
      members: resolved.team.members.map((m, i) =>
        i === member ? resolveMember({ ...project.members[member], weapon }, game, effects, project.config.minRollsPerSubstat) : m,
      ),
    },
  }));
const run = (names: string[], member = 0) =>
  compareWeapons({ member, candidates: candidatesFor(names, member), actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });

describe('comparação de armas', () => {
  const mavuikaWeapons = game.weapons.filter((w) => w.type === 'Claymore').map((w) => w.name);

  it('a arma atual reproduz exatamente a análise do projeto', () => {
    const [row] = run([project.members[0].weapon]);
    expect(row.teamAvg).toBeCloseTo(base.optimization.result.totals.avg, 4);
    expect(row.teamAvg).toBeCloseTo(3790496.07, 1);
  });

  it('ordena do maior para o menor dano da equipe', () => {
    const rows = run(mavuikaWeapons.slice(0, 12));
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].teamAvg).toBeGreaterThanOrEqual(rows[i].teamAvg);
  });

  it('armas diferentes dão resultados diferentes', () => {
    const rows = run(mavuikaWeapons.slice(0, 12));
    expect(new Set(rows.map((r) => Math.round(r.teamAvg))).size).toBeGreaterThan(3);
  });

  it('o dano do membro nunca passa o da equipe', () => {
    for (const r of run(mavuikaWeapons.slice(0, 6))) expect(r.memberAvg).toBeLessThanOrEqual(r.teamAvg + 1e-6);
  });

  it('linhas de refinamento: R5 rende mais que R1 numa arma com tabela por refinamento', () => {
    const royal = { ...project.members[0], weapon: 'Royal Greatsword' };
    const cands = [1, 5].map((refinement) => ({
      weapon: 'Royal Greatsword',
      refinement,
      team: { ...resolved.team, members: resolved.team.members.map((m, i) => (i === 0 ? resolveMember({ ...royal, refinement }, game, effects, project.config.minRollsPerSubstat) : m)) },
    }));
    const rows = compareWeapons({ member: 0, candidates: cands, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });
    const get = (r: number) => rows.find((x) => x.refinement === r)!.teamAvg;
    expect(get(5)).toBeGreaterThan(get(1));
    expect(rows.every((x) => x.weapon === 'Royal Greatsword')).toBe(true);
  });
});

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, assembleTeam, critSweep, resolveProject, type EffectsData, type GameData } from '../../src/engine';
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

// Sem crítico forçado: assim o otimizador escolhe livremente e a curva tem o ótimo no meio.
const project = sampleProject();
project.members[0] = { ...project.members[0], forcedCritRolls: undefined };
const resolved = resolveProject(project, game, effects);
const bundle = analyzeProject({ team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });
const ctx = {
  members: resolved.team.members,
  assembly: assembleTeam(resolved.team),
  config: resolved.team.config,
  actions: resolved.actions,
  flatEffects: resolved.flatEffects,
  ampCoefficient: resolved.ampCoefficient,
};

describe('curva de dano × rolls em crítico', () => {
  const sweep = critSweep({ ctx, rolls: bundle.optimization.rolls, member: 0 });

  it('cobre do mínimo ao orçamento de dano, um ponto por roll', () => {
    expect(sweep.points.length).toBe(bundle.optimization.members[0].budget.damageRolls + 1);
    sweep.points.forEach((p, i) => expect(p.critRolls).toBe(sweep.points[0].critRolls + i));
  });

  it('cada ponto respeita o orçamento de rolls do membro', () => {
    const budget = bundle.optimization.members[0].budget.total;
    for (const p of sweep.points) expect(Object.values(p.rolls).reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(budget);
  });

  it('o melhor ponto da curva coincide com o ótimo do otimizador', () => {
    const best = sweep.points[sweep.best];
    expect(best.teamAvg).toBeCloseTo(bundle.optimization.result.totals.avg, 4);
    expect(best.rolls.CR + best.rolls.CD).toBe(bundle.optimization.rolls[0].CR + bundle.optimization.rolls[0].CD);
  });

  it('o melhor ponto rende pelo menos o que qualquer outro e mais que o mínimo de crítico', () => {
    const best = sweep.points[sweep.best].teamAvg;
    for (const p of sweep.points) expect(p.teamAvg).toBeLessThanOrEqual(best + 1e-6);
    expect(sweep.points[0].teamAvg).toBeLessThan(best);
  });

  it('o ponto com o crítico escolhido pelo otimizador reproduz o DPR da planilha', () => {
    const forcedPoint = sweep.points.find((p) => p.critRolls === 20)!;
    expect(forcedPoint.teamAvg).toBeCloseTo(3790496.07, 1);
  });

  it('rolls à mão ou suporte sem dano não geram curva', () => {
    const manual = { ...ctx, members: ctx.members.map((m, i) => (i === 0 ? { ...m, manualRolls: bundle.optimization.rolls[0] } : m)) };
    expect(critSweep({ ctx: manual, rolls: bundle.optimization.rolls, member: 0 }).points).toEqual([]);
  });
});

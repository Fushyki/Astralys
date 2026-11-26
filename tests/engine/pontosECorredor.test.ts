/** Pontos do recurso (Serpent's Subtlety) e a trava de 6 s do Epílogo do Corredor (#54). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, damageTable, evaluateRotation, optimizeTeam, resolveProject, type EffectsData, type GameData, type RotationProject } from '../../src/engine';
import { buildNewTeam } from '../../src/features/rotation/newTeam';
import { setMemberPoints } from '../../src/features/rotation/projectOps';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

const skirk = (constellation?: number) => {
  const p = buildNewTeam({ characters: ['Skirk'], rotation: 'basic' }, game, effects);
  return constellation ? buildNewTeam({ characters: ['Skirk'], rotation: 'basic', builds: { Skirk: { ...p.members[0], constellation } } }, game, effects) : p;
};
const burst = (p: RotationProject) => p.actions.find((a) => a.move.label === 'Slash DMG')!;

describe('pontos do recurso do golpe', () => {
  it('a rotação básica entra com o teto, que sobe na C2', () => {
    expect(burst(skirk()).points).toBe(12);
    expect(burst(skirk(2)).points).toBe(22);
  });
  it('a escolha vale para a rotação e para a tabela de dano', () => {
    const p = skirk();
    const set = setMemberPoints(p, 0, 0, (m) => m.talent === 'burst');
    expect(burst(set).points).toBe(0);
    const slash = (q: RotationProject) => {
      const r = resolveProject(q, game, effects);
      return damageTable({ team: r.team, assembly: assembleTeam(r.team), rolls: optimizeTeam({ members: r.team.members, assembly: assembleTeam(r.team), config: r.team.config, actions: r.actions, flatEffects: r.flatEffects }).rolls, member: 0, moves: game.moves, reaction: 'none' }).find((x) => x.move.label === 'Slash DMG')!.result.scale.atk;
    };
    // Habilidade nível 10: 34,78% do ATK por ponto, por corte (5 cortes).
    expect(slash(p) - slash(set)).toBeGreaterThan(1);
  });
});

describe('Epílogo do Corredor', () => {
  const run = (times: [string, number][], disabled: string[] = []) => {
    const base = skirk();
    const member = { ...base.members[0], noArtifacts: false, primarySet: 'Finale of the Deep Galleries', secondarySet: undefined, fourPiece: true, gearManual: false };
    const p: RotationProject = {
      ...base, members: [member], disabled,
      actions: times.map(([label, time], i) => ({ ...burst(base), id: `a${i}`, time, move: { character: 'Skirk', talent: label === 'Slash DMG' ? 'burst' as const : 'normal' as const, label, variant: 0 } })),
    };
    const r = resolveProject(p, game, effects);
    const assembly = assembleTeam(r.team);
    return evaluateRotation({ members: r.team.members, assembly, config: r.team.config, rolls: optimizeTeam({ members: r.team.members, assembly, config: r.team.config, actions: r.actions, flatEffects: r.flatEffects }).rolls }, r.actions).actions;
  };
  it('o Normal tira o bônus do Supremo por 6 s, e o próprio tipo não se trava', () => {
    const [n1, q, n2, q2] = run([['1-Hit DMG', 0], ['Slash DMG', 5.9], ['1-Hit DMG', 8], ['Slash DMG', 14]]);
    expect(n1.setCut).toBeUndefined();
    expect(q.setCut).toBeCloseTo(0.6, 6);
    expect(n2.setCut).toBeCloseTo(0.6, 6);
    expect(q2.setCut).toBeUndefined(); // 6 s depois do último Normal
    expect(q2.breakdown.dmgMultiplier - q.breakdown.dmgMultiplier).toBeCloseTo(0.6, 6);
  });
  it('com o conjunto desligado nada é descontado', () => {
    const [, q] = run([['1-Hit DMG', 0], ['Slash DMG', 1]], ['m0:set4p']);
    expect(q.setCut).toBeUndefined();
  });
});

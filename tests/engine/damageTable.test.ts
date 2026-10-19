import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, assembleTeam, damageTable, resolveProject, type EffectsData, type GameData } from '../../src/engine';
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

const resolved = resolveProject(sampleProject(), game, effects);
const bundle = analyzeProject({ team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });
const assembly = assembleTeam(resolved.team);
const table = (reaction: 'none' | 'melt' | 'vaporize', member = 0) =>
  damageTable({ team: resolved.team, assembly, rolls: bundle.optimization.rolls, member, moves: game.moves, reaction, ampCoefficient: resolved.ampCoefficient });

describe('tabela de dano do personagem', () => {
  it('traz só golpes do personagem e crit ≥ médio ≥ sem crit', () => {
    const rows = table('none');
    expect(rows.length).toBeGreaterThan(5);
    for (const r of rows) {
      expect(r.move.character).toBe('Mavuika');
      expect(r.crit).toBeGreaterThanOrEqual(r.avg);
      expect(r.avg).toBeGreaterThanOrEqual(r.noCrit);
    }
  });

  it('Derreter aumenta o dano Pyro e marca como aplicada', () => {
    const none = table('none');
    const melt = table('melt');
    const i = none.findIndex((r) => r.element === 'Pyro' && r.noCrit > 0);
    expect(melt[i].reactionApplied).toBe(true);
    expect(melt[i].noCrit).toBeGreaterThan(none[i].noCrit);
  });

  it('Pyro: Derreter (×2) rende mais que Vaporizar (×1,5) no mesmo golpe', () => {
    const none = table('none');
    const melt = table('melt');
    const vap = table('vaporize');
    const i = none.findIndex((r) => r.element === 'Pyro' && r.noCrit > 0);
    expect(vap[i].noCrit).toBeGreaterThan(none[i].noCrit);
    expect(melt[i].noCrit / none[i].noCrit).toBeGreaterThan(vap[i].noCrit / none[i].noCrit);
  });

  it('cobre mais de um tipo de talento', () => {
    const rows = table('none');
    expect(new Set(rows.map((r) => r.move.talent)).size).toBeGreaterThanOrEqual(2);
  });
});

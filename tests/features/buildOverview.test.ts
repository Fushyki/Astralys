/** Panorama da build: stats fora e em campo (#61). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, assembleTeam, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { overviewRows, sheetStats } from '../../src/features/character/buildOverview';
import { sampleForApp } from '../../src/features/rotation/persistence';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

describe('panorama da build', () => {
  const r = resolveProject(sampleForApp(), game, effects);
  const bundle = analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient });
  const assembly = assembleTeam(r.team);
  const mav = sheetStats(r.team.members[0], assembly, 0, bundle.optimization.rolls[0]);
  const field = bundle.memberStats[0];

  it('fora de campo não leva os buffs; em campo leva', () => {
    expect(mav.atk).toBeLessThan(field.atk);
    expect(mav.hp).toBeGreaterThan(r.team.members[0].character.baseHp);
  });
  it('as linhas marcam o que muda em campo', () => {
    const rows = overviewRows(mav, field, 'Pyro');
    expect(rows.map((x) => x.key)).toEqual(['hp', 'atk', 'def', 'em', 'er', 'cr', 'cd', 'cv', 'ele']);
    expect(rows.find((x) => x.key === 'atk')!.changed).toBe(true);
    expect(rows.find((x) => x.key === 'ele')!.label).toBe('Bônus de dano Pyro');
  });
});

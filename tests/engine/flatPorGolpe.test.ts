import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

describe('dano fixo filtrado pelo nome do golpe', () => {
  const r = resolveProject({ ...sampleProject(), compat: 'none' }, game, effects);
  const citlali = r.team.members.findIndex((m) => m.character.name === 'Citlali');
  const skill = r.actions.find((a) => a.member === citlali && a.move.hitType === 'skill')!;
  const flatEffects = r.flatEffects.filter((e) => e.name.includes('Frostfall Storm'));
  const dmg = (label: string) => {
    const a = { ...skill, move: { ...skill.move, label } };
    const res = analyzeProject({ team: r.team, actions: [a], flatEffects, ampCoefficient: r.ampCoefficient });
    return res.optimization.result.actions[0].flatDamage;
  };

  it('a Citlali A4 existe com o filtro do Frostfall Storm', () => {
    expect(flatEffects).toHaveLength(1);
    expect(flatEffects[0].labels).toEqual(['Frostfall Storm DMG']);
  });
  it('só o Frostfall Storm recebe; o Obsidian Tzitzimitl não', () => {
    expect(dmg('Frostfall Storm DMG')).toBeGreaterThan(0);
    expect(dmg('Obsidian Tzitzimitl DMG')).toBe(0);
  });
});

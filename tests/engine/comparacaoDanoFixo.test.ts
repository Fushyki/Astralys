/** Na comparação de armas, o dano fixo da arma equipada não vale para as outras (#77). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { compareWeapons, resolveProject, teamFlat, type EffectsData, type GameData, type RotationProject } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

describe('comparação de armas: dano fixo', () => {
  const label = game.moves.find((m) => m.character === 'Albedo' && m.talent === 'skill')!.label;
  const resolve = (weapon: string) => resolveProject({
    ...sampleProject(), compat: 'none', extras: [], buffWindows: [], disabled: [], enabled: [],
    members: [{ ...defaultMember('Albedo', game), weapon, gearManual: false }],
    actions: [{ id: 'a', member: 0, move: { character: 'Albedo', talent: 'skill', label, variant: 0 }, executions: 1, reaction: 'none', activeTags: [], tagSource: 'windows', dmgAdjust: 0, time: 0 }],
  } as RotationProject, game, effects);

  it('cada candidata leva o dano fixo da própria arma', () => {
    const current = resolve('Cinnabar Spindle');
    const other = resolve('Harbinger of Dawn');
    expect(current.flatEffects.some((f) => f.name.startsWith('Cinnabar Spindle'))).toBe(true);
    const flat = teamFlat(effects.flatDamage, other.team.members, new Set(other.team.disabled), false);
    expect(flat.some((f) => f.name.startsWith('Cinnabar Spindle'))).toBe(false);
    const input = { member: 0, actions: current.actions, flatEffects: current.flatEffects };
    const [fixed] = compareWeapons({ ...input, candidates: [{ weapon: 'Harbinger of Dawn', team: other.team, flatEffects: flat }] });
    const [leaked] = compareWeapons({ ...input, candidates: [{ weapon: 'Harbinger of Dawn', team: other.team }] });
    expect(fixed.teamAvg).toBeLessThan(leaked.teamAvg);
  });
});

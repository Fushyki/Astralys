/** Correções achadas na comparação com o Genshin Optimizer (Issue #47). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { activeCharacterBuffs, minimumRolls } from '../../src/engine/stats';
import { pointMoveOf } from '../../src/engine/project';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

const project = (names: string[], constellation = 0, actions: unknown[] = [], disabled: string[] = []) => ({
  ...sampleProject(), compat: 'none', elementMode: 'kit', extras: [], buffWindows: [], disabled, enabled: [], flatStacks: {},
  members: names.map((n, i) => ({ ...defaultMember(n, game), constellation: i ? 0 : constellation })), actions,
}) as never;
const team = (names: string[], constellation = 0) => resolveProject(project(names, constellation), game, effects).team.members;
const MONO = ['Skirk', 'Furina', 'Escoffier', 'Shenhe'];

function hit(talent: 'normal' | 'skill' | 'burst', label: string, points?: number, disabled: string[] = []) {
  const p = project(MONO, 0, [{ id: 'a', member: 0, move: { character: 'Skirk', talent, label, variant: 0 }, executions: 1, reaction: 'none', activeTags: [], tagSource: 'manual', dmgAdjust: 0, time: 0, ...(points === undefined ? {} : { points }) }], disabled);
  const r = resolveProject(p, game, effects);
  return evaluateRotation({ members: r.team.members, assembly: assembleTeam(r.team), config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions[0].noCrit;
}

describe('Skirk', () => {
  it('+1 na Habilidade de todos só com o time de Hydro e Cryo', () => {
    expect(team(MONO).map((m) => m.talents.skill)).toEqual([11, 11, 11, 11]);
    expect(team(['Skirk', 'Furina', 'Escoffier', 'Bennett'])[0].talents.skill).toBe(10);
  });

  it('o A4 multiplica o Normal da habilidade, não o Normal físico', () => {
    const off = ['cbuff-0-a4n'];
    expect(hit('skill', '1-Hit DMG') / hit('skill', '1-Hit DMG', undefined, off)).toBeCloseTo(1.7, 5);
    expect(hit('normal', '1-Hit DMG') / hit('normal', '1-Hit DMG', undefined, off)).toBeCloseTo(1, 5);
  });

  it('o Supremo soma os pontos de Serpent\'s Subtlety, com teto maior na C2', () => {
    const slash = { talent: 'burst', label: 'Slash DMG' };
    expect(pointMoveOf(slash, team(MONO)[0].characterEffect)!.max).toBe(12);
    expect(pointMoveOf(slash, team(MONO, 2)[0].characterEffect)!.max).toBe(22);
    // 5 acertos de 220,97% no nível 10, mais 12 pontos de 34,78% em cada um.
    expect(hit('burst', 'Slash DMG', 12) / hit('burst', 'Slash DMG', 0)).toBeCloseTo(1 + (12 * 0.3478) / 2.2097, 2);
  });
});

describe('Mavuika C6', () => {
  it('a redução de DEF do anel conta uma vez só', () => {
    const shreds = (c: number) => activeCharacterBuffs(team(['Mavuika'], c)[0]).filter((b) => b.defShred).map((b) => b.id);
    expect(shreds(2)).toEqual(['c2anel']);
    expect(shreds(6)).toEqual(['c6def']);
  });
});

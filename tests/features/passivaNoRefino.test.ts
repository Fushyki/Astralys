/** Stacks da passiva da arma: continuam no kit com 0 e não passam para outra arma (#55). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember, updateMember } from '../../src/features/rotation/teamOps';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

describe('stacks da passiva da arma', () => {
  const base = { ...sampleProject(), compat: 'none' as const, extras: [], actions: [], buffWindows: [], members: [{ ...defaultMember('Vodyanitsa', game), weapon: 'Hymn of the Maelstrom' }] };
  it('com 0 stacks o buff continua no kit (o campo não some)', () => {
    const p = updateMember(base, 0, { stacks: { 'arma:stacks': 0 } });
    const buff = resolveProject(p, game, effects).team.members[0].characterEffect!.buffs.find((b) => b.id === 'arma:stacks')!;
    expect(buff.stacks?.max).toBe(3);
    expect(buff.stats?.hpPct).toBe(0);
  });
  it('trocar de arma apaga só os stacks da arma antiga', () => {
    const p = updateMember(base, 0, { stacks: { 'arma:stacks': 1, a1: 2 } });
    expect(updateMember(p, 0, { weapon: 'Starsealed Edict' }).members[0].stacks).toEqual({ a1: 2 });
    expect(updateMember(p, 0, { refinement: 5 }).members[0].stacks).toEqual({ 'arma:stacks': 1, a1: 2 });
  });
});

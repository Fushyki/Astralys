/** Hymn of the Maelstrom: ATK por stack, como no GO (#55). Symphonist of Scents: Sweet Echoes só para quem recebe a cura (#57). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, resolveProject, type EffectsData, type GameData, type MemberRef } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

const team = (members: MemberRef[]) => {
  const p = { ...sampleProject(), compat: 'none' as const, extras: [], actions: [], buffWindows: [], disabled: [], members };
  const r = resolveProject(p, game, effects);
  return { r, a: assembleTeam(r.team) };
};
const m = (name: string, patch: Partial<MemberRef> = {}): MemberRef => ({ ...defaultMember(name, game), ...patch });

describe('Sweet Echoes: só quem recebe a cura', () => {
  const who = (receivers?: string[], first = 'Skirk') => {
    const { a } = team([m(first), m('Escoffier', { weapon: 'Symphonist of Scents', gearManual: false, ...(receivers ? { receivers: { 'arma:echoes': receivers } } : {}) }), m('Furina')]);
    return a.buffs.find((b) => b.id === 'cbuff-1-arma:echoes')?.targets;
  };
  it('o padrão é o 1º do time que não é o portador', () => {
    expect(who()).toEqual(['Skirk']);
    expect(who(undefined, 'Bennett')).toEqual(['Bennett']);
  });
  it('vale a escolha; nenhum = sem buff; quem saiu do time volta ao padrão', () => {
    expect(who(['Furina'])).toEqual(['Furina']);
    expect(who(['Skirk', 'Furina'])).toEqual(['Skirk', 'Furina']);
    expect(who([])).toBeUndefined();
    expect(who(['Zhongli'])).toEqual(['Skirk']);
  });
});

describe('Hymn of the Maelstrom: ATK por stack', () => {
  const buff = (n: number | undefined, id: string) => team([m('Vodyanitsa', { weapon: 'Hymn of the Maelstrom', gearManual: false, ...(n === undefined ? {} : { stacks: { 'arma:stacks': n } }) })]).r.team.members[0].characterEffect!.buffs.find((b) => b.id === `arma:${id}`)!;
  it('R1: 0,4% do ATK por 1.000 de HP e até 8% por stack', () => {
    for (const [n, k] of [[undefined, 3], [3, 3], [2, 2], [1, 1], [0, 0]] as const) {
      const c = buff(n, 'hp-atk').convert!;
      expect(c.perPoint).toBeCloseTo(0.000004 * k, 12);
      expect(c.cap).toBeCloseTo(0.08 * k, 12);
    }
    expect(buff(1, 'reforco-hp').stats!.hpPct).toBeCloseTo(0.03, 9);
    expect(buff(1, 'reforco-atk').convert!.cap).toBeCloseTo(0.06, 9);
  });
});

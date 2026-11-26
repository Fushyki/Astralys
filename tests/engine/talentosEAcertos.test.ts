/** Níveis de talento sem soma dobrada e limite de buff contado em acertos (#52). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { talentNote } from '../../src/features/character/talentNote';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

const team = (names: string[], skill: number, constellation = 0) => ({ ...sampleProject(), compat: 'none' as const, extras: [], buffWindows: [], disabled: [], actions: [], members: names.map((n) => ({ ...defaultMember(n, game), constellation, talents: { normal: 10, skill, burst: 10 } })) });
const skillOf = (names: string[], skill: number, constellation = 0) => resolveProject(team(names, skill, constellation), game, effects).team.members[0].talents.skill;
const HYDRO_CRYO = ['Skirk', 'Furina', 'Escoffier', 'Vodyanitsa'];

describe('nível de talento com a passiva da Skirk', () => {
  it('10 vira 11; 11 já digitado continua 11', () => {
    expect(skillOf(HYDRO_CRYO, 10)).toBe(11);
    expect(skillOf(HYDRO_CRYO, 11)).toBe(11);
  });
  it('com a constelação na Habilidade o máximo é 14, sem somar duas vezes', () => {
    expect(skillOf(['Escoffier', 'Skirk', 'Furina'], 10, 3)).toBe(14);
    expect(skillOf(['Escoffier', 'Skirk', 'Furina'], 13, 3)).toBe(14);
    expect(skillOf(['Escoffier', 'Bennett'], 13, 3)).toBe(13);
  });
  it('outro elemento no time tira o +1', () => {
    expect(skillOf(['Skirk', 'Furina', 'Bennett'], 10)).toBe(10);
  });
  it('a tela explica de onde vem o nível', () => {
    const r = resolveProject(team(HYDRO_CRYO, 10), game, effects).team.members[0];
    expect(talentNote({ normal: 10, skill: 10, burst: 10 }, 0, r.character, r.talents)).toBe(' (+1 na Habilidade pela passiva do time)');
  });
});

describe('limite de acertos da janela', () => {
  const COMBO = ['1-Hit DMG', '2-Hit DMG', '3-Hit DMG', '4-Hit DMG', '5-Hit DMG'];
  /** N normais da Skirk no Seven-Phase Flash com um bônus de Normal limitado aos `max` primeiros acertos. */
  const run = (labels: string[], max: number) => {
    const p = {
      ...team(HYDRO_CRYO, 10),
      extras: [{ target: 'Skirk', stat: 'DMG% Normal', value: 0.2, team: true, label: 'Rift', description: 'teste' }],
      buffWindows: [{ id: 'w', tag: 'label:Rift', start: 0, end: 60, whole: true, maxHits: max }],
      actions: labels.map((label, i) => ({ id: `a${i}`, member: 0, move: { character: 'Skirk', talent: 'skill', label, variant: 0 }, executions: 1, reaction: 'none' as const, activeTags: [], tagSource: 'windows' as const, dmgAdjust: 0, time: i })),
    };
    const r = resolveProject(p as never, game, effects);
    const rolls = analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient }).optimization.rolls;
    const res = evaluateRotation({ members: r.team.members, assembly: assembleTeam(r.team, { rolls }), config: r.team.config, rolls, flatEffects: r.flatEffects }, r.actions);
    return { actions: r.actions, dmg: res.actions.map((a) => a.breakdown.dmgMultiplier) };
  };

  it('3º e 4º golpes gastam 2 acertos: o 5º golpe é o 11º e fica sem o bônus', () => {
    const { actions } = run([...COMBO.slice(0, 2), ...COMBO.slice(0, 2), ...COMBO], 10);
    expect(actions.map((a) => a.activeTags.includes('label:Rift'))).toEqual([true, true, true, true, true, true, true, true, false]);
  });
  it('o golpe que cruza o limite leva metade do bônus', () => {
    const { actions, dmg } = run(['1-Hit DMG', '3-Hit DMG', '1-Hit DMG'], 2);
    expect(actions[1].tagShare).toEqual({ 'label:Rift': 0.5 });
    expect(dmg[0] - dmg[2]).toBeCloseTo(0.2, 9);
    expect(dmg[1] - dmg[2]).toBeCloseTo(0.1, 9);
  });
});

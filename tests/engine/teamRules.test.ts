import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyTeamRules, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import type { CharacterBuff } from '../../src/effects/schema';
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
// Equipe do exemplo: Pyro, Cryo, Electro, Pyro (3 elementos diferentes).
const members = resolveProject(sampleProject(), game, effects).team.members;

const stats = { atkPct: 1, dmgPct: 0, critRate: 0, critDmg: 0, em: 0, er: 0, hpPct: 0, defPct: 0, dmgPctByType: {} };
const withBuff = (team: CharacterBuff['team'], extra: Partial<CharacterBuff> = {}) => {
  const buff = { id: 't', label: 'T', minConstellation: 0, scope: 'team', timed: true, stats, team, ...extra } as CharacterBuff;
  const out = members.map((m, i) => (i === 0 ? { ...m, characterEffect: { ...m.characterEffect!, buffs: [buff] } } : m));
  return applyTeamRules(out)[0].characterEffect!.buffs;
};

describe('regras de composição do time', () => {
  it('escala pelo nº de elementos diferentes (3 no exemplo)', () => {
    const [b] = withBuff({ scale: { of: 'distinct', table: [0.08, 0.12, 0.16, 0.2] } });
    expect(b.stats!.atkPct).toBeCloseTo(0.16, 9);
  });

  it('escala pelo nº de membros dos elementos listados (2 Pyro)', () => {
    const [b] = withBuff({ scale: { of: ['Pyro'], table: [0.1, 0.5, 0.9] } });
    expect(b.stats!.atkPct).toBeCloseTo(0.5, 9);
  });

  it('escala também a redução de RES', () => {
    const [b] = withBuff({ scale: { of: 'distinct', table: [0.05, 0.1, 0.15, 0.55] } }, { stats: undefined, resShred: { value: 1, elements: ['Cryo'] } });
    expect(b.resShred!.value).toBeCloseTo(0.15, 9);
  });

  it('"only" tira o buff quando o time tem outro elemento; "eachOf" exige um de cada', () => {
    expect(withBuff({ only: ['Pyro', 'Electro'] })).toHaveLength(0);
    expect(withBuff({ eachOf: ['Pyro', 'Electro'] })).toHaveLength(1);
    expect(withBuff({ eachOf: ['Pyro', 'Anemo'] })).toHaveLength(0);
  });

  it('multiplica pelo valor da tabela no nível do talento (e junto com a regra de time)', () => {
    const table = Array.from({ length: 15 }, (_, i) => (i + 1) / 100);
    const level = members[0].talents.skill;
    const [b] = withBuff(undefined, { level: { talent: 'skill', table } });
    expect(b.stats!.atkPct).toBeCloseTo(table[level - 1], 9);
    const [c] = withBuff({ scale: { of: 'distinct', table: [1, 2, 3] } }, { level: { talent: 'skill', table } });
    expect(c.stats!.atkPct).toBeCloseTo(table[level - 1] * 3, 9);
  });

  it('multiplica também o coeficiente de uma conversão', () => {
    const table = Array.from({ length: 15 }, () => 0.5);
    const [b] = withBuff(undefined, { stats: undefined, convert: { from: 'hp', source: 'self', perPoint: 1, threshold: 0, to: ['atkFlat'] }, level: { talent: 'burst', table } });
    expect(b.convert!.perPoint).toBeCloseTo(0.5, 9);
  });

  it('sem regra, devolve o mesmo membro e não mexe nos dados originais', () => {
    expect(applyTeamRules(members)[1]).toBe(members[1]);
    withBuff({ scale: { of: 'distinct', table: [0.5] } });
    expect((members[0].characterEffect!.buffs ?? []).some((b) => b.id === 't')).toBe(false);
  });
});

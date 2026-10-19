import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { activeTeamDelta, analyzeProject, applyTeamRules, assembleTeam, finalStats, minimumRolls, resolveProject, type EffectsData, type GameData } from '../../src/engine';
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

const base = resolveProject(sampleProject(), game, effects);

/** Equipe do exemplo com um buff de conversão a mais no membro `owner`. */
function withConvert(owner: number, convert: NonNullable<CharacterBuff['convert']>, extra: Partial<CharacterBuff> = {}) {
  const buff: CharacterBuff = { id: 'teste', label: 'Teste', minConstellation: 0, scope: 'team', timed: false, convert, ...extra } as CharacterBuff;
  const members = base.team.members.map((m, i) =>
    i === owner ? { ...m, characterEffect: { ...m.characterEffect!, buffs: [...(m.characterEffect?.buffs ?? []), buff] } } : m,
  );
  return { ...base, team: { ...base.team, members } };
}
const analyze = (r: typeof base) => analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient });

describe('conversões de stat', () => {
  const noConvert = analyze(base);

  it('sem conversão, nada muda e a montagem não marca conversões', () => {
    expect(assembleTeam(base.team).hasDerived).toBe(false);
    expect(noConvert.optimization.result.totals.dps).toBeCloseTo(216_599.78, 1);
  });

  it('vale coeficiente × stat da fonte, limitado pelo teto', () => {
    const r = withConvert(2, { from: 'atk', source: 'self', perPoint: 0.0001, threshold: 0, to: ['dmgPct'] });
    const bundle = analyze(r);
    const a = assembleTeam(r.team, { rolls: bundle.optimization.rolls });
    const buff = a.buffs.find((b) => b.id.endsWith('-teste'))!;
    expect(buff.derived).toBe(true);
    expect(buff.always).toBe(true);
    expect(buff.delta.dmgBonus).toBeCloseTo(0.0001 * bundle.memberStats[2].atk, 6);

    const capped = withConvert(2, { from: 'atk', source: 'self', perPoint: 0.0001, threshold: 0, cap: 0.1, to: ['dmgPct'] });
    const cappedBuff = assembleTeam(capped.team, { rolls: analyze(capped).optimization.rolls }).buffs.find((b) => b.id.endsWith('-teste'))!;
    expect(cappedBuff.delta.dmgBonus).toBeCloseTo(0.1, 9);
  });

  it('um bônus de DMG convertido aumenta o dano da equipe', () => {
    const r = withConvert(2, { from: 'atk', source: 'self', perPoint: 0.0001, threshold: 0, to: ['dmgPct'] });
    expect(analyze(r).optimization.result.totals.dps).toBeGreaterThan(noConvert.optimization.result.totals.dps);
  });

  it('escopo "others" não dá o bônus ao dono', () => {
    const r = withConvert(2, { from: 'em', source: 'self', perPoint: 1, threshold: 0, to: ['em'] }, { scope: 'others' });
    const buff = assembleTeam(r.team, { rolls: analyze(r).optimization.rolls }).buffs.find((b) => b.id.endsWith('-teste'))!;
    expect(buff.targets).not.toContain(r.team.members[2].character.name);
    expect(buff.targets).toHaveLength(3);
  });

  it('a fonte "highestEm" usa o membro com mais Maestria', () => {
    const r = withConvert(1, { from: 'em', source: 'highestEm', perPoint: 1, threshold: 0, to: ['em'] }, { scope: 'self' });
    const bundle = analyze(r);
    const highest = Math.max(...bundle.memberStats.map((s) => s.em));
    // com perPoint 1 e dono = membro 1 (Citlali), o bônus é a maior Maestria do time sem o próprio bônus
    const buff = assembleTeam(r.team, { rolls: bundle.optimization.rolls }).buffs.find((b) => b.id.endsWith('-teste'))!;
    expect(buff.delta.em).toBeGreaterThan(0);
    expect(buff.delta.em!).toBeLessThanOrEqual(highest + 1e-6);
  });

  it('desligar o buff pelo id zera o efeito (atribuição)', () => {
    const r = withConvert(2, { from: 'atk', source: 'self', perPoint: 0.0001, threshold: 0, to: ['dmgPct'] });
    const bundle = analyze(r);
    const item = bundle.attribution.items.find((i) => i.id.endsWith('-teste'));
    expect(item).toBeDefined();
    expect(item!.contribution).toBeGreaterThan(0);
  });
});

describe('Paramita da Hu Tao (kit com nível e teto em ATK base)', () => {
  it('ATK fixo = % do HP pelo nível, limitado a 400% do ATK base', () => {
    const huTao = effects.characters.find((c) => c.character === 'Hu Tao')!;
    const paramita = huTao.buffs.find((b) => b.id === 'paramita')!;
    const m0 = base.team.members[0];
    const members = applyTeamRules([{ ...m0, characterEffect: { ...m0.characterEffect!, buffs: [paramita] } }, ...base.team.members.slice(1)]);
    const team = { ...base.team, members };
    const a = assembleTeam(team);
    const buff = a.buffs.find((b) => b.id.endsWith('-paramita'))!;
    expect(buff.derived).toBe(true);
    const level = m0.talents.skill;
    const hp = finalStats(members[0], a.statics[0], minimumRolls(team.config.minRollsPerSubstat), activeTeamDelta(a.buffs.filter((b) => !b.derived), m0.character.name, 'all'), a.resonanceAtkPct).hp;
    const baseAtk = m0.character.baseAtk + m0.weapon.baseAtk;
    const expected = Math.min(hp * paramita.level!.table[level - 1], 4 * baseAtk);
    expect(buff.delta.atkFlat).toBeCloseTo(expected, 3);
  });
});

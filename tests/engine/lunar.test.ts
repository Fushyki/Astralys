import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, computeSpecial, computeTransformative, damageBySource, evaluateRotation, memberProcs, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';
import type { CharacterEffect } from '../../src/effects/schema';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = {
  characters: json('src/data/generated/characters.json'),
  moves: json('src/data/generated/moves.json'),
  weapons: json('src/data/generated/weapons.json'),
  artifacts: json('src/data/generated/artifacts.json'),
};
const baseEffects: EffectsData = {
  characters: json('src/effects/characters.json'),
  weapons: json('src/effects/weapons.json'),
  sets: json('src/effects/sets.json'),
  flatDamage: json('src/effects/flatDamage.json'),
};

/** Efeito de personagem mínimo (sem passivas curadas), com os campos pedidos. */
const effect = (character: string, extra: Partial<CharacterEffect>): CharacterEffect => ({
  character, atkPct: 0, dmgPct: 0, critRate: 0, critDmg: 0, em: 0, appliesToSelf: false, buffs: [], notes: [], procs: [], factions: [], specialMoves: [],
  fonte_info: 'teste', ...extra,
});

type MemberSpec = { character: string; weapon?: string; constellation?: number };
type ActionSpec = { member?: number; talent?: 'normal' | 'skill' | 'burst' | 'proc' | 'reaction'; label: string; element?: string; tags?: string[] };

function run(members: MemberSpec[], actions: ActionSpec[], override: CharacterEffect[] = []) {
  const effects: EffectsData = { ...baseEffects, characters: [...baseEffects.characters.filter((c) => !override.some((o) => o.character === c.character)), ...override] };
  const p = {
    ...sampleProject(),
    compat: 'none',
    members: members.map((m) => {
      const d = defaultMember(m.character, game);
      return { ...d, ...m, weapon: m.weapon ?? d.weapon };
    }),
    actions: actions.map((a, i) => ({
      id: `a${i}`, member: a.member ?? 0, move: { character: members[a.member ?? 0].character, talent: a.talent ?? 'normal', label: a.label, variant: 0 },
      executions: 1, reaction: 'none', activeTags: a.tags ?? [], tagSource: 'manual', dmgAdjust: 0, time: i, ...(a.element ? { element: a.element } : {}),
    })),
    buffWindows: [],
    disabled: [],
  };
  const r = resolveProject(p as never, game, effects);
  const assembly = assembleTeam(r.team);
  const rolls = r.team.members.map(() => minimumRolls(2));
  return { r, assembly, result: evaluateRotation({ members: r.team.members, assembly, config: r.team.config, rolls, flatEffects: r.flatEffects }, r.actions) };
}

describe('golpes Lunar/Estelar do kit', () => {
  it('golpe marcado como Lunar-Carregado usa a fórmula do Genshin Optimizer (sem DMG% comum)', () => {
    const label = 'Middle Phase Lunar-Charged DMG';
    const override = [effect('Flins', { specialMoves: [{ talent: 'burst', label, reaction: 'lunarcharged' }] })];
    const lunar = run([{ character: 'Flins' }], [{ talent: 'burst', label }], override);
    const plain = run([{ character: 'Flins' }], [{ talent: 'burst', label }], [effect('Flins', {})]);
    const a = lunar.result.actions[0];
    expect(a.kind).toBe('lunar');
    expect(a.element).toBe('Electro');
    expect(plain.result.actions[0].kind).toBe('direct');
    const s = a.stats;
    const expected = computeSpecial({
      reaction: 'lunarcharged', characterLevel: 90, em: s.em, base: { statValue: s.atk * a.scale.atk }, multiplier: 1,
      critRate: s.critRate, critDmg: s.critDmg, critMode: 'hit', enemy: { level: lunar.r.team.config.enemyLevel, res: lunar.assembly.enemyRes, defRed: lunar.assembly.enemyDefRed },
    }).total;
    expect(a.noCrit).toBeCloseTo(expected, 6);
    expect(a.avg).toBeCloseTo(expected * (1 + Math.min(s.critRate, 1) * s.critDmg), 6);
    expect(damageBySource(lunar.result).bySource.lunar).toBeCloseTo(a.avg, 6);
  });
});

describe('reações na rotação', () => {
  it('Sobrecarga posta como ação usa a Maestria do membro e entra no DPS; não consome dano fixo', () => {
    const { result, r, assembly } = run([{ character: 'Bennett' }], [{ talent: 'reaction', label: 'overloaded' }]);
    const a = result.actions[0];
    expect(a.kind).toBe('transformative');
    expect(a.element).toBe('Pyro');
    const t = computeTransformative({ reaction: 'overloaded', characterLevel: r.team.config.characterLevel, em: a.stats.em, enemy: { level: r.team.config.enemyLevel, res: assembly.enemyRes, defRed: assembly.enemyDefRed } });
    expect(a.noCrit).toBeCloseTo(t.total, 6);
    expect(a.avg).toBeCloseTo(t.total, 6); // Sobrecarga não critica
    expect(result.totals.avg).toBeCloseTo(t.total, 6);
    expect(damageBySource(result).bySource.transformative).toBeCloseTo(t.total, 6);
  });

  it('Redemoinho usa a RES do elemento espalhado; Lunar-Carregado e Redemoinho Estelar também viram ações', () => {
    const { result } = run([{ character: 'Sucrose' }], [
      { talent: 'reaction', label: 'swirl:Hydro' }, { talent: 'reaction', label: 'lunarcharged' }, { talent: 'reaction', label: 'stellarswirl:vortex1' },
    ]);
    expect(result.actions.map((a) => a.element)).toEqual(['Hydro', 'Electro', 'Cryo']);
    expect(result.actions.map((a) => a.kind)).toEqual(['transformative', 'lunar', 'stellar']);
    for (const a of result.actions) expect(a.noCrit).toBeGreaterThan(0);
  });
});

describe('Moonsign e golpes derivados', () => {
  it('com 2 membros Moonsign, quem não é Moonsign ganha a faixa Ascendant Gleam (DMG Lunar por stat, teto 36%)', () => {
    const override = [effect('Flins', { factions: ['moonsign'] }), effect('Ineffa', { factions: ['moonsign'] })];
    const two = run([{ character: 'Flins' }, { character: 'Ineffa' }, { character: 'Bennett' }], [], override);
    const one = run([{ character: 'Flins' }, { character: 'Bennett' }], [], override);
    const gleam = (x: typeof two) => x.r.team.members.flatMap((m) => m.characterEffect?.buffs ?? []).filter((b) => b.id === 'moonsign-gleam');
    expect(gleam(two)).toHaveLength(1);
    expect(gleam(two)[0].convert).toMatchObject({ from: 'atk', cap: 0.36 });
    expect(gleam(two)[0].convert!.perPoint).toBeCloseTo(0.00009, 12);
    expect(gleam(one)).toHaveLength(0);
    const buff = two.assembly.buffs.find((b) => b.description?.includes('Ascendant Gleam'))!;
    expect(buff.delta.reactionBonus?.lunarcharged).toBeGreaterThan(0);
    expect(buff.delta.reactionBonus?.lunarcharged).toBeLessThanOrEqual(0.36);
  });

  it('golpe extra que é fração de outro golpe usa a escala dele no nível do talento', () => {
    const r = run([{ character: 'Amber' }], []).r;
    const m = { ...r.team.members[0], characterEffect: effect('Amber', { procs: [{ id: 't', label: 'teste', scale: {}, minConstellation: 0, of: { talent: 'normal', label: 'Fully-Charged Aimed Shot', variant: 0, fraction: 0.2 } }] }) };
    const orig = game.moves.find((x) => x.character === 'Amber' && x.label === 'Fully-Charged Aimed Shot')!;
    const p = memberProcs(m, game.moves).find((x) => x.key === 'char:t')!;
    const lvl = m.talents.normal;
    expect(p.move.scale.atk![0]).toBeCloseTo(orig.scale.atk![lvl - 1] * 0.2, 9);
    expect(p.move.hitType).toBe(orig.hitType);
  });

  it('dano fixo para a equipe (targets: team) vale nos golpes dos aliados', () => {
    const override = [effect('Xilonen', { buffs: [{ id: 'x', label: 'teste', minConstellation: 0, scope: 'self', timed: false, flat: [{ name: 'f', sourceStat: 'DEF', perPoint: 0.65, hitTypes: ['normal'], targets: 'team' }] }] })];
    const { result } = run([{ character: 'Xilonen' }, { character: 'Bennett' }], [{ member: 1, label: '1-Hit DMG' }, { member: 0, talent: 'skill', label: game.moves.find((x) => x.character === 'Xilonen' && x.talent === 'skill')!.label }], override);
    const def = result.actions[1].stats.def;
    expect(result.actions[0].flatDamage).toBeCloseTo(0.65 * def, 6);
    expect(result.actions[1].flatDamage).toBe(0); // golpe de habilidade: fora dos tipos
  });
});

describe('curadoria Lunar (dados reais)', () => {
  it('Flins: o Supremo Lunar-Carregado usa a fórmula Lunar; Ineffa A1 é golpe extra Lunar-Carregado; Moonsign com os dois', () => {
    const r = run([{ character: 'Flins' }, { character: 'Ineffa' }, { character: 'Bennett' }], [
      { talent: 'burst', label: 'Middle Phase Lunar-Charged DMG' },
      { member: 1, talent: 'proc', label: 'char:a1' },
    ]);
    expect(r.result.actions.map((a) => a.kind)).toEqual(['lunar', 'lunar']);
    expect(r.result.actions[1].scale.atk).toBeCloseTo(0.65, 6);
    // Base do Lunar-Carregado da Ineffa e do Flins (Moonsign Benediction), sem janela, até 14% cada.
    const base = r.result.actions[0].stats.reactionBonus.lunarchargedBase;
    expect(base).toBeGreaterThan(0);
    expect(base).toBeLessThanOrEqual(0.28 + 1e-9);
    expect(r.assembly.buffs.some((b) => b.description?.includes('Ascendant Gleam (Bennett)'))).toBe(true);
  });
});

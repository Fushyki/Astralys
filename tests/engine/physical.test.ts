import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { reactionTable } from '../../src/engine/reactionTable';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

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

type MemberSpec = { character: string; weapon?: string; primarySet?: string; secondarySet?: string; constellation?: number; refinement?: number };
type ActionSpec = { member?: number; talent?: 'normal' | 'skill' | 'burst' | 'proc'; label: string; element?: string; reaction?: string };

/** Avalia uma rotação sem o modo planilha, com rolls mínimos (2 em cada substat). */
function run(members: MemberSpec[], actions: ActionSpec[]) {
  const base = sampleProject();
  const p = {
    ...base,
    compat: 'none',
    members: members.map((m) => {
      const d = defaultMember(m.character, game);
      return { ...d, ...m, weapon: m.weapon ?? d.weapon };
    }),
    actions: actions.map((a, i) => ({
      id: `a${i}`, member: a.member ?? 0, move: { character: members[a.member ?? 0].character, talent: a.talent ?? 'normal', label: a.label, variant: 0 },
      executions: 1, reaction: a.reaction ?? 'none', activeTags: [], tagSource: 'manual', dmgAdjust: 0, time: i, ...(a.element ? { element: a.element } : {}),
    })),
    buffWindows: [],
    disabled: [],
  };
  const r = resolveProject(p as never, game, effects);
  const assembly = assembleTeam(r.team);
  const rolls = r.team.members.map(() => minimumRolls(2));
  return { r, assembly, result: evaluateRotation({ members: r.team.members, assembly, config: r.team.config, rolls, flatEffects: r.flatEffects }, r.actions) };
}

describe('elemento Físico', () => {
  it('o golpe marcado como Físico usa a RES Física e o bônus Físico, sem o bônus elemental do cálice', () => {
    const cryo = run([{ character: 'Eula', weapon: 'Dull Blade', primarySet: 'Pale Flame' }], [{ label: '1-Hit DMG' }]).result.actions[0];
    const phys = run([{ character: 'Eula', weapon: 'Dull Blade', primarySet: 'Pale Flame' }], [{ label: '1-Hit DMG', element: 'Physical' }]).result.actions[0];
    expect(cryo.element).toBe('Cryo');
    expect(phys.element).toBe('Physical');
    const s = phys.stats;
    // Pale Flame: +25% Físico de 2 peças e +25% com os 2 stacks; o cálice de DMG elemental (46,6%) não vale no Físico.
    expect(s.physDmg).toBeCloseTo(0.5, 6);
    expect(phys.breakdown.dmgMultiplier - 1).toBeCloseTo(s.dmgBonus - s.eleDmg + s.physDmg + s.dmgByType.normal, 9);
    expect(cryo.breakdown.dmgMultiplier - 1).toBeCloseTo(s.dmgBonus + s.dmgByType.normal, 9);
    expect(s.eleDmg).toBeGreaterThan(0.4);
  });

  it('redução de RES Física (Rosaria C6) só muda o golpe Físico', () => {
    const team = (c: number) => run([{ character: 'Rosaria', constellation: c }], [{ label: '1-Hit DMG', element: 'Physical' }, { label: '1-Hit DMG' }]);
    const c0 = team(0);
    const c6 = team(6);
    expect(c0.assembly.enemyRes.Physical! - c6.assembly.enemyRes.Physical!).toBeCloseTo(0.2, 6);
    expect(c6.assembly.enemyRes.Cryo).toBeCloseTo(c0.assembly.enemyRes.Cryo!, 9);
    expect(c6.result.actions[0].noCrit).toBeGreaterThan(c0.result.actions[0].noCrit);
    expect(c6.result.actions[1].noCrit).toBeCloseTo(c0.result.actions[1].noCrit, 6);
  });

  it('substat Físico da arma vira bônus Físico', () => {
    const w = game.weapons.find((x) => x.substat?.stat === 'Physical%' && x.type === 'Claymore')!;
    const s = run([{ character: 'Eula', weapon: w.name }], [{ label: '1-Hit DMG', element: 'Physical' }]).result.actions[0].stats;
    expect(s.physDmg).toBeCloseTo(w.substat!.value, 6);
  });
});

describe('bônus de reação', () => {
  it('Thundering Fury soma +20% ao bônus de Intensificar no golpe e +40% de Sobrecarga na tabela de reações', () => {
    const tf = run([{ character: 'Fischl', primarySet: 'Thundering Fury' }], [{ label: '1-Hit DMG', reaction: 'aggravate' }]);
    const none = run([{ character: 'Fischl', primarySet: 'Gladiator\'s Finale' }], [{ label: '1-Hit DMG', reaction: 'aggravate' }]);
    const stats = tf.result.actions[0].stats;
    expect(stats.reactionBonus.aggravate).toBeCloseTo(0.2, 6);
    expect(stats.reactionBonus.overloaded).toBeCloseTo(0.4, 6);
    expect(tf.result.actions[0].breakdown.additive).toBeGreaterThan(none.result.actions[0].breakdown.additive);
    const enemy = { level: 100, res: 0.1 };
    const base = reactionTable({ characterLevel: 90, em: 0, enemy }).find((r) => r.id === 'overloaded')!.total;
    const plus = reactionTable({ characterLevel: 90, em: 0, enemy, reactionBonus: stats.reactionBonus }).find((r) => r.id === 'overloaded')!.total;
    expect(plus / base).toBeCloseTo(1.4, 6); // sem Maestria: (1 + 0,4) / 1
  });
});

describe('golpes extras de proc', () => {
  it('The Flute: a onda é um golpe Físico de 200% do ATK em todo refinamento (Genshin Optimizer), sem bônus de Normal', () => {
    const at = (refinement: number) =>
      run([{ character: 'Bennett', weapon: 'The Flute', refinement }], [{ talent: 'proc', label: 'arma:onda' }]).result.actions[0];
    const r1 = at(1);
    const r5 = at(5);
    expect(r1.element).toBe('Physical');
    expect(r1.action.move.hitType).toBe('other');
    expect(r1.scale.atk).toBeCloseTo(2, 9);
    expect(r1.breakdown.base).toBeCloseTo(2 * r1.stats.atk, 6);
    expect(r1.breakdown.dmgMultiplier - 1).toBeCloseTo(r1.stats.dmgBonus - r1.stats.eleDmg + r1.stats.physDmg, 9);
    expect(r5.scale.atk).toBeCloseTo(2, 9);
  });

  it('golpe extra de arma que o membro não tem mais vale 0 (sem quebrar o projeto)', () => {
    const r = run([{ character: 'Bennett', weapon: 'Dull Blade' }], [{ talent: 'proc', label: 'arma:onda' }]).result.actions[0];
    expect(r.avg).toBe(0);
    expect(r.action.move.displayName).toContain('indisponível');
  });
});

describe('golpes extras de passivas e constelações', () => {
  it('Nahida C6: 200% do ATK + 400% da Maestria, conta como habilidade, só a partir da C6', () => {
    const c6 = run([{ character: 'Nahida', constellation: 6 }], [{ talent: 'proc', label: 'char:c6' }]).result.actions[0];
    expect(c6.action.move.hitType).toBe('skill');
    expect(c6.breakdown.base).toBeCloseTo(2 * c6.stats.atk + 4 * c6.stats.em, 6);
    const c5 = run([{ character: 'Nahida', constellation: 5 }], [{ talent: 'proc', label: 'char:c6' }]).result.actions[0];
    expect(c5.avg).toBe(0);
  });

  it('Hu Tao C2: Blood Blossom ganha 10% do HP como dano fixo', () => {
    const r = run([{ character: 'Hu Tao', constellation: 2 }], []).r;
    const f = r.flatEffects.find((e) => e.name.includes('Blood Blossom'))!;
    expect(f).toMatchObject({ sourceStat: 'HP', perPoint: 0.1, hitTypes: ['skill'] });
  });
});

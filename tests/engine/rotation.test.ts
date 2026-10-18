/**
 * Cobre o que o gabarito da planilha NÃO exercita: dano fixo (na planilha vale 0, pois a Vodyanitsa não está no
 * time), reações aditivas dentro do otimizador, buffs por etiqueta e consistência otimizador × avaliação.
 */
import { describe, it, expect } from 'vitest';
import {
  evaluateRotation,
  optimizeTeam,
  type FlatDamageEffect,
  type OptimizerContext,
  type RotationAction,
} from '../../src/engine';
import { loadPlanilhaFixture } from '../helpers/planilhaFixture';

const fx = loadPlanilhaFixture();
const { ctx, optimized, imported } = fx;
const names = imported.team.members.map((m) => m.character.name);

const withFlat = (e: Partial<FlatDamageEffect>): FlatDamageEffect => ({
  name: 'teste', source: 'Bennett', sourceStat: 'ATK', perPoint: 0.1, threshold: 3000, targets: ['Mavuika'],
  elements: [], hitTypes: ['charged'], active: true, fonte_info: 'teste sintético', ...e,
});

describe('dano fixo: valor por hit, filtros e consumo de stacks', () => {
  const bennettAtk = 3700.235; // ATK do Bennett com todas as etiquetas (gabarito)

  it('valor por hit = coef × (stat − limiar), com teto', () => {
    const r = evaluateRotation({ ...ctx, rolls: optimized.rolls, flatEffects: [withFlat({ capPerHit: 50 })] }, imported.actions);
    const first = r.actions.find((a) => a.flatDamage > 0)!;
    expect(first.flatDamage).toBeCloseTo(50, 9); // 0,1 × 700 = 70 → limitado a 50

    const r2 = evaluateRotation({ ...ctx, rolls: optimized.rolls, flatEffects: [withFlat({})] }, imported.actions);
    expect(r2.actions.find((a) => a.flatDamage > 0)!.flatDamage).toBeCloseTo(0.1 * (bennettAtk - 3000), 6);
  });

  it('stacks são consumidos pelos primeiros hits elegíveis, na ordem da rotação', () => {
    const r = evaluateRotation({ ...ctx, rolls: optimized.rolls, flatEffects: [withFlat({ stacks: 3 })] }, imported.actions);
    const perHit = 0.1 * (bennettAtk - 3000);
    const covered = r.actions.map((a) => a.flatDamage / perHit);
    // Golpes Carregados da Mavuika nas linhas 5, 7 e 9 (índices 0, 2, 4); o resto fica sem dano fixo.
    expect(covered.slice(0, 6).map((x) => Math.round(x))).toEqual([1, 0, 1, 0, 1, 0]);
    expect(covered.slice(6).every((x) => x < 1e-9)).toBe(true);
    expect(r.actions[0].breakdown.baseTotal).toBeCloseTo(r.actions[0].breakdown.base * 1 + perHit, 6);
  });

  it('sem stacks, vale para todos os hits elegíveis', () => {
    const r = evaluateRotation({ ...ctx, rolls: optimized.rolls, flatEffects: [withFlat({})] }, imported.actions);
    const eligible = r.actions.filter((a) => a.flatDamage > 0);
    expect(eligible.length).toBeGreaterThan(3);
    expect(eligible.every((a) => a.action.move.hitType === 'charged' && a.action.member === 0)).toBe(true);
  });

  it('filtra por alvo, elemento e tipo de golpe; efeito inativo ou fonte fora do time vale 0', () => {
    const run = (e: Partial<FlatDamageEffect>) =>
      evaluateRotation({ ...ctx, rolls: optimized.rolls, flatEffects: [withFlat(e)] }, imported.actions).actions.reduce(
        (s, a) => s + a.flatDamage, 0,
      );
    expect(run({ targets: ['Citlali'], hitTypes: ['charged'] })).toBe(0); // Citlali não tem golpe carregado na rotação
    expect(run({ elements: ['Hydro'] })).toBe(0); // Mavuika é Pyro
    expect(run({ elements: ['Pyro'] })).toBeGreaterThan(0);
    expect(run({ active: false })).toBe(0);
    expect(run({ source: 'Vodyanitsa' })).toBe(0);
    expect(run({ targets: 'all', hitTypes: [] })).toBeGreaterThan(run({}));
  });

  it('hits múltiplos de uma linha consomem vários stacks de uma vez', () => {
    // Ordem da Citlali na rotação: Obsidian Tzitzimitl (1 hit) → Frostfall Storm (8 hits) → Ice Storm → Skull (2 hits)
    const r = evaluateRotation(
      { ...ctx, rolls: optimized.rolls, flatEffects: [withFlat({ targets: ['Citlali'], hitTypes: [], stacks: 5 })] },
      imported.actions,
    );
    const perHit = 0.1 * (bennettAtk - 3000);
    const covered = (label: string) => r.actions.find((a) => a.action.move.label === label)!.flatDamage / perHit;
    expect(covered('Obsidian Tzitzimitl DMG')).toBeCloseTo(1, 9); // consome 1 de 5
    expect(covered('Frostfall Storm DMG')).toBeCloseTo(4, 9); // 8 hits, mas só restam 4 stacks
    expect(covered('Ice Storm DMG')).toBeCloseTo(0, 9); // stacks esgotados
    expect(covered('Spiritvessel Skull DMG')).toBeCloseTo(0, 9);
  });
});

describe('buffs por etiqueta', () => {
  it('sem nenhuma etiqueta ativa o dano cai; com todas bate o perfil "Todos"', () => {
    const all = imported.profiles['Todos'];
    const mk = (tags: string[]): RotationAction[] => imported.actions.map((a) => ({ ...a, activeTags: tags }));
    const none = evaluateRotation({ ...ctx, rolls: optimized.rolls }, mk([])).totals.avg;
    const full = evaluateRotation({ ...ctx, rolls: optimized.rolls }, mk(all)).totals.avg;
    expect(none).toBeLessThan(full);
  });

  it('o ATK fixo do Bennett vale para ele (appliesToSelf), o da Iansan não vale para ela', () => {
    const atk = (member: number, tags: string[]) =>
      evaluateRotation(
        { ...ctx, rolls: optimized.rolls },
        [{ ...imported.actions.find((a) => a.member === member)!, activeTags: tags }],
      ).actions[0].stats.atk;
    const bennettOff = atk(3, []);
    expect(atk(3, ['char:3'])).toBeGreaterThan(bennettOff); // Bennett recebe o próprio buff
    const iansanOff = atk(2, []);
    expect(atk(2, ['char:2'])).toBeCloseTo(iansanOff, 9); // Iansan não recebe o próprio
    expect(atk(0, ['char:2'])).toBeGreaterThan(atk(0, [])); // mas a Mavuika recebe
  });
});

describe('otimizador × avaliação completa', () => {
  const check = (c: OptimizerContext) => {
    const o = optimizeTeam(c);
    names.forEach((_, i) => {
      expect(o.members[i].expectedAvg).toBeCloseTo(o.result.members[i].avg, 6);
    });
    return o;
  };

  it('reação aditiva (Intensificar) na Iansan', () => {
    const actions = imported.actions.map((a) => (a.member === 2 ? { ...a, reaction: 'aggravate' as const } : a));
    const o = check({ ...ctx, actions });
    // Intensificar soma dano à base da Iansan, que é Electro
    const base = optimizeTeam(ctx).result.members[2].avg;
    expect(o.result.members[2].avg).toBeGreaterThan(base);
  });

  it('vaporizar na Citlali (Cryo não vaporiza: sem efeito)', () => {
    const actions = imported.actions.map((a) => (a.member === 1 ? { ...a, reaction: 'vaporize' as const } : a));
    const o = check({ ...ctx, actions });
    const citlali = o.result.actions.filter((a) => a.action.member === 1);
    expect(citlali.every((a) => !a.breakdown.reactionApplied)).toBe(true);
  });

  it('com dano fixo ativo a busca em duas passadas continua consistente', () => {
    check({ ...ctx, flatEffects: [withFlat({ stacks: 6 })] });
  });

  it('o ER mínimo é respeitado quando possível', () => {
    const o = optimizeTeam(ctx);
    imported.team.members.forEach((m, i) => {
      const er = evaluateRotation({ ...ctx, rolls: o.rolls }, imported.actions).actions.find((a) => a.action.member === i)!.stats.er;
      expect(er).toBeGreaterThanOrEqual((m.minER ?? 0) - 1e-9);
    });
  });

  it('nunca estoura o limite de rolls por substat nem o orçamento', () => {
    const o = optimizeTeam(ctx);
    o.members.forEach((r, i) => {
      const total = Object.values(r.rolls).reduce((s, x) => s + x, 0);
      expect(total).toBeLessThanOrEqual(r.budget.total + 1e-9);
      expect(Object.values(r.rolls).every((x) => x >= imported.team.config.minRollsPerSubstat)).toBe(true);
      void i;
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  compareVariants,
  critProfile,
  damageBySource,
  evaluateRotation,
  hitWaterfall,
  substatGains,
  SUBSTATS,
  type MemberInput,
  type Variant,
} from '../../src/engine';
import { loadPlanilhaFixture } from '../helpers/planilhaFixture';
import { planilhaWeapon } from '../../src/engine/compat/planilha';

const fx = loadPlanilhaFixture();
const { ctx, optimized, imported, data, effects } = fx;
const result = optimized.result;
const rotCtx = { ...ctx, rolls: optimized.rolls };

describe('dano por fonte', () => {
  const src = damageBySource(result);

  it('a soma das fontes é exatamente o dano médio total', () => {
    const sum = Object.values(src.bySource).reduce((s, x) => s + x, 0);
    expect(sum).toBeCloseTo(result.totals.avg, 4);
    expect(Object.values(src.shares).reduce((s, x) => s + x, 0)).toBeCloseTo(1, 9);
  });

  it('Derreter vale ≈ 55,3% do dano da rotação; sem aditivas nem transformativas', () => {
    expect(src.shares.amplifying).toBeCloseTo(0.5527, 3);
    expect(src.shares.additive).toBe(0);
    expect(src.shares.transformative + src.shares.lunar + src.shares.stellar).toBe(0);
    expect(src.reactionShare).toBeCloseTo(src.shares.amplifying, 12);
  });

  it('valor exato: o ganho do Derreter é soma de dano × (1 − 1/amp) das linhas com reação', () => {
    const manual = result.actions.reduce((s, r) => s + r.avg * (1 - 1 / r.breakdown.amp), 0);
    expect(src.bySource.amplifying).toBeCloseTo(manual, 4);
  });

  it('Intensificar na Iansan aparece como fonte aditiva', () => {
    const actions = imported.actions.map((a) => (a.member === 2 ? { ...a, reaction: 'aggravate' as const } : a));
    const r = evaluateRotation(rotCtx, actions);
    const s = damageBySource(r);
    expect(s.bySource.additive).toBeGreaterThan(0);
    expect(Object.values(s.bySource).reduce((x, y) => x + y, 0)).toBeCloseTo(r.totals.avg, 4);
  });

  it('o Supremo da Mavuika domina a fonte "burst"', () => {
    expect(src.shares.burst).toBeGreaterThan(0.1);
  });
});

describe('crit value e proporção', () => {
  it('Mavuika: CR 98,9% / CD 231,8% → CV 429,6 e proporção ≈ 2,34', () => {
    const p = critProfile(result.actions[0].stats);
    expect(p.critValue).toBeCloseTo(2 * 98.9 + 231.8, 6);
    expect(p.ratio).toBeCloseTo(2.318 / 0.989, 9);
    expect(p.status).toBe('ok');
  });

  it('alertas', () => {
    expect(critProfile({ critRate: 0.8, critDmg: 0.9 }).status).toBe('low-crit-dmg');
    expect(critProfile({ critRate: 0.3, critDmg: 2.0 }).status).toBe('low-crit-rate');
    expect(critProfile({ critRate: 1.1, critDmg: 2.0 }).status).toBe('rate-over-cap');
    expect(critProfile({ critRate: 0.5, critDmg: 1.0 }).status).toBe('ok');
    expect(critProfile({ critRate: 0, critDmg: 1 }).ratio).toBe(Infinity);
  });
});

describe('ganho marginal por substat', () => {
  const gains = substatGains(rotCtx, imported.actions);
  const g = (member: number, s: string) => gains.find((x) => x.member === member && x.substat === s)!;

  it('um registro por membro e substat', () => {
    expect(gains).toHaveLength(4 * SUBSTATS.length);
  });

  it('para a Mavuika, +1 roll de CD rende mais que +1 de DEF% (que não faz nada)', () => {
    expect(g(0, 'CD').dpsGain).toBeGreaterThan(0);
    expect(g(0, 'DEF%').dpsGain).toBeCloseTo(0, 6);
    expect(g(0, 'CD').dpsGain).toBeGreaterThan(g(0, 'HP%').dpsGain);
  });

  it('é coerente com a avaliação direta', () => {
    const rolls = optimized.rolls.map((r) => ({ ...r }));
    rolls[0]['ATK%'] += 1;
    const direct = evaluateRotation({ ...rotCtx, rolls }, imported.actions).totals.dps - result.totals.dps;
    expect(g(0, 'ATK%').dpsGain).toBeCloseTo(direct, 6);
  });

  it('marca o substat que já está no limite de rolls', () => {
    expect(gains.every((x) => typeof x.atCap === 'boolean')).toBe(true);
    // Mavuika tem 13 rolls de CR de um máximo de 28+2: não está no limite
    expect(g(0, 'CR').atCap).toBe(false);
  });
});

describe('cascata de multiplicadores', () => {
  it('termina exatamente no dano médio do golpe', () => {
    const burst = result.actions[1]; // Supremo (200 FS)
    const steps = hitWaterfall(burst, 'avg');
    expect(steps.map((s) => s.key)).toEqual(['base', 'dmg', 'crit', 'reaction', 'def', 'res']);
    expect(steps[steps.length - 1].value).toBeCloseTo(burst.avg, 4);
    expect(hitWaterfall(burst, 'hit').at(-1)!.value).toBeCloseTo(burst.noCrit, 4);
    expect(hitWaterfall(burst, 'crit').at(-1)!.value).toBeCloseTo(burst.crit, 4);
  });

  it('valores do Supremo da Mavuika conferem com a planilha: base 79.724,66 (5791,25 × 13,7664), DMG% ×2,804, Derreter ×3,292', () => {
    const steps = hitWaterfall(result.actions[1], 'avg');
    expect(steps[0].value).toBeCloseTo(5791.25 * (8.0064 + 5.76), 3);
    expect(steps[1].factor).toBeCloseTo(2.804, 3);
    expect(steps[3].factor).toBeCloseTo(3.2925, 3);
    expect(steps[4].factor).toBeCloseTo(0.4871794872, 9);
    expect(steps[5].factor).toBeCloseTo(1.05, 12);
  });
});

describe('comparação de variantes', () => {
  const weaponVariant = (label: string, name: string): Variant => ({
    label,
    apply: (m: MemberInput) => ({
      ...m,
      weapon: data.weapons.find((w) => w.name === name)!,
      weaponEffect: planilhaWeapon(effects.weapons.find((e) => e.weapon === name)),
    }),
  });
  const input = { team: imported.team, actions: imported.actions, flatEffects: imported.flatEffects, ampCoefficient: ctx.ampCoefficient };

  it('a referência vale 100% e o resultado vem ordenado', () => {
    const r = compareVariants(
      input,
      0,
      [
        weaponVariant('A Thousand Blazing Suns', 'A Thousand Blazing Suns'),
        weaponVariant('Beacon of the Reed Sea', 'Beacon of the Reed Sea'),
        weaponVariant("Wolf's Gravestone", "Wolf's Gravestone"),
      ],
      0,
    );
    expect(r).toHaveLength(3);
    const ref = r.find((x) => x.label === 'A Thousand Blazing Suns')!;
    expect(ref.relative).toBeCloseTo(1, 12);
    expect(ref.dps).toBeCloseTo(result.totals.dps, 4); // idêntica à rotação original
    for (let i = 1; i < r.length; i++) expect(r[i - 1].dps).toBeGreaterThanOrEqual(r[i].dps);
  });

  it('troca de arma muda mesmo o dano (efeitos registrados contam)', () => {
    const r = compareVariants(input, 0, [weaponVariant('Mil Sóis', 'A Thousand Blazing Suns'), weaponVariant('Lobo', "Wolf's Gravestone")], 0);
    const lobo = r.find((x) => x.label === 'Lobo')!;
    expect(lobo.relative).not.toBeCloseTo(1, 3);
  });
});

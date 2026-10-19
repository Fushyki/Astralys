import { describe, expect, it } from 'vitest';
import { computeLunarReaction, computeTransformative, reactionTable, transformativeLevelMultiplier } from '../../src/engine';

const enemy = { level: 100, res: { Physical: 0.1, Pyro: 0.1, Hydro: 0.1, Electro: 0.1, Cryo: 0.1, Anemo: 0.1, Geo: 0.1, Dendro: 0.1 } };
const table = (em: number) => reactionTable({ characterLevel: 90, em, enemy });
const total = (rows: ReturnType<typeof table>, id: string) => rows.find((r) => r.id === id)!.total;

describe('tabela de dano das reações', () => {
  const rows = table(0);

  it('traz transformativas, Lunares e Estelares sem repetir ids', () => {
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    expect(rows.some((r) => r.group === 'transformative')).toBe(true);
    expect(rows.some((r) => r.group === 'lunar')).toBe(true);
    expect(rows.some((r) => r.group === 'stellar')).toBe(true);
    expect(rows.every((r) => r.total > 0 && Number.isFinite(r.total))).toBe(true);
  });

  it('Sobrecarga com EM 0: 2,75 × multiplicador de nível × RES (reações transformativas ignoram a DEF)', () => {
    const expected = 2.75 * transformativeLevelMultiplier(90) * 0.9;
    expect(total(rows, 'overloaded')).toBeCloseTo(expected, 1); // o jogo usa uma DEF enorme (99999999), então o fator vale ~0,99999
    expect(total(rows, 'overloaded')).toBeCloseTo(computeTransformative({ reaction: 'overloaded', characterLevel: 90, em: 0, enemy }).total, 6);
  });

  it('a Maestria Elemental aumenta toda reação', () => {
    const high = table(800);
    for (const r of rows) expect(total(high, r.id), r.id).toBeGreaterThan(r.total);
  });

  it('Hiperflorescer (×3) rende 1,5 vez o Florescer (×2) com a mesma RES', () => {
    expect(total(rows, 'hyperbloom') / total(rows, 'bloom')).toBeCloseTo(1.5, 6);
  });

  it('vórtice 2 do Redemoinho Estelar rende 1,5 vez o vórtice 1 (×3 contra ×2)', () => {
    expect(total(rows, 'stellarswirl-Pyro-vortex2') / total(rows, 'stellarswirl-Pyro-vortex1')).toBeCloseTo(1.5, 6);
  });

  it('Lunar-Carregado confere com o cálculo direto', () => {
    const direct = computeLunarReaction('lunarcharged', { characterLevel: 90, em: 0, critRate: 0, critDmg: 0, critMode: 'hit', enemy }).total;
    expect(total(rows, 'lunarcharged')).toBeCloseTo(direct, 6);
  });

  it('RES maior reduz o dano da reação daquele elemento', () => {
    const tough = reactionTable({ characterLevel: 90, em: 0, enemy: { ...enemy, res: { ...enemy.res, Pyro: 0.5 } } });
    expect(total(tough, 'overloaded')).toBeLessThan(total(rows, 'overloaded'));
    expect(total(tough, 'superconduct')).toBeCloseTo(total(rows, 'superconduct'), 6);
  });
});

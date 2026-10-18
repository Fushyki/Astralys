import { describe, it, expect } from 'vitest';
import {
  additiveBase,
  ampBase,
  critFactor,
  crystallizeBase,
  crystallizeLevelMultiplier,
  defMultiplier,
  resMultiplier,
  specialBase,
  transformativeBase,
  transformativeDefMultiplier,
  transformativeLevelMultiplier,
} from '../../src/engine';

describe('tabelas de nível (extraídas do Genshin Optimizer)', () => {
  it('valores conhecidos em níveis-chave', () => {
    expect(transformativeLevelMultiplier(1)).toBeCloseTo(17.165606, 6);
    expect(transformativeLevelMultiplier(80)).toBeCloseTo(1077.4437, 4);
    expect(transformativeLevelMultiplier(90)).toBeCloseTo(1446.8535, 4);
    // O código antigo do projeto tinha 1650 e 1860 (chutados); os valores reais são estes:
    expect(transformativeLevelMultiplier(95)).toBeCloseTo(1561.468, 3);
    expect(transformativeLevelMultiplier(100)).toBeCloseTo(1674.8092, 4);
    expect(crystallizeLevelMultiplier(90)).toBeCloseTo(1851.0603, 4);
  });

  it('é estritamente crescente e cobre 1–100', () => {
    for (let lvl = 2; lvl <= 100; lvl++) {
      expect(transformativeLevelMultiplier(lvl)).toBeGreaterThan(transformativeLevelMultiplier(lvl - 1));
      expect(crystallizeLevelMultiplier(lvl)).toBeGreaterThan(crystallizeLevelMultiplier(lvl - 1));
    }
  });

  it('recusa níveis fora de 1–100 ou não inteiros', () => {
    for (const bad of [0, -1, 101, 90.5, NaN]) {
      expect(() => transformativeLevelMultiplier(bad)).toThrow(RangeError);
    }
  });
});

describe('bases dependentes de Maestria Elemental', () => {
  it('EM 0 (ou negativa) = 1', () => {
    for (const f of [ampBase, additiveBase, transformativeBase, specialBase, crystallizeBase]) {
      expect(f(0)).toBe(1);
      expect(f(-50)).toBe(1);
    }
  });

  it('valores com EM = denominador (fração = 1/2)', () => {
    expect(ampBase(1400)).toBeCloseTo(1 + (25 / 9) * 0.5, 10);
    expect(additiveBase(1200)).toBeCloseTo(1 + 5 * 0.5, 10);
    expect(transformativeBase(2000)).toBeCloseTo(1 + 16 * 0.5, 10);
    expect(specialBase(2000)).toBeCloseTo(1 + 6 * 0.5, 10);
    expect(crystallizeBase(1400)).toBeCloseTo(1 + (40 / 9) * 0.5, 10);
  });

  it('amplificadora aceita o 2,78 arredondado da planilha', () => {
    expect(ampBase(1400, 2.78)).toBeCloseTo(1 + 1.39, 10);
    // A diferença para 25/9 é pequena (<0,1%) com EM típica
    const rel = Math.abs(ampBase(424, 2.78) / ampBase(424) - 1);
    expect(rel).toBeLessThan(0.001);
  });
});

describe('defesa', () => {
  it('nível 90 vs 100, sem reduções = 0,4871794872 (idêntico à planilha de referência)', () => {
    expect(defMultiplier(90, 100)).toBeCloseTo(0.4871794872, 9);
  });

  it('redução e DEF ignorada se combinam multiplicativamente', () => {
    expect(defMultiplier(90, 100, 0.2)).toBeCloseTo(190 / (190 + 200 * 0.8), 12);
    expect(defMultiplier(90, 100, 0.2, 0.1)).toBeCloseTo(190 / (190 + 200 * 0.8 * 0.9), 12);
  });

  it('reduzir DEF sempre aumenta o dano', () => {
    expect(defMultiplier(90, 100, 0.3)).toBeGreaterThan(defMultiplier(90, 100, 0.1));
  });

  it('reações transformativas praticamente ignoram a DEF', () => {
    const v = transformativeDefMultiplier(100);
    expect(v).toBeCloseTo(99999999 / (99999999 + 1000), 12);
    expect(v).toBeGreaterThan(0.99998);
  });
});

describe('resistência', () => {
  it('faixas: negativa, normal e acima de 75%', () => {
    expect(resMultiplier(0.1)).toBeCloseTo(0.9, 12);
    expect(resMultiplier(0)).toBe(1);
    expect(resMultiplier(-0.2)).toBeCloseTo(1.1, 12);
    expect(resMultiplier(0.74)).toBeCloseTo(0.26, 12);
    expect(resMultiplier(0.75)).toBeCloseTo(0.25, 12);
    expect(resMultiplier(0.9)).toBeCloseTo(1 / 4.6, 12);
  });

  it('cruza com a planilha: RES 10% − 20% (Citlali) = 1,05; RES 10% = 0,9', () => {
    expect(resMultiplier(0.1 - 0.2)).toBeCloseTo(1.05, 12);
    expect(resMultiplier(0.1)).toBeCloseTo(0.9, 12);
  });

  it('é contínua nos pontos de quebra', () => {
    expect(resMultiplier(1e-9)).toBeCloseTo(resMultiplier(-1e-9), 6);
    expect(resMultiplier(0.75 - 1e-9)).toBeCloseTo(resMultiplier(0.75), 6);
  });
});

describe('crítico', () => {
  it('três modos', () => {
    expect(critFactor('hit', 0.5, 1)).toBe(1);
    expect(critFactor('crit', 0.5, 1.2)).toBeCloseTo(2.2, 12);
    expect(critFactor('avg', 0.5, 1.2)).toBeCloseTo(1.6, 12);
  });

  it('taxa crítica limitada a 0–100% no modo médio', () => {
    expect(critFactor('avg', 1.7, 2)).toBeCloseTo(3, 12);
    expect(critFactor('avg', -0.3, 2)).toBe(1);
  });
});

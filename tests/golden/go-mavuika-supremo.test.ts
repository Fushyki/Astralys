/**
 * Referência do Genshin Optimizer (build real do usuário, time Mavuika · Citlali · Iansan · Bennett): Supremo crítico com Derreter = 1.516.981.
 * Aqui o motor recebe os MESMOS fatores do traço do GO (ATK, bônus, crítico, DEF, RES, EM) e tem de chegar ao mesmo valor (0,5%).
 * O que falta para fechar com a build do inventário (a origem do +62% de ATK da Iansan e do +30% sem dono) está nas perguntas da Fase 1.
 */
import { describe, expect, it } from 'vitest';
import { computeHit } from '../../src/engine/damage';

describe('GO: Supremo da Mavuika (1.516.981)', () => {
  it('a cadeia de fatores do traço do GO dá 1.516.981 ± 0,5%', () => {
    const atk = 6394.0;
    const burstBonus = atk * 0.0288 * 200; // Aumento de Dano do Supremo = 36.830 (2,88% do ATK por ponto × 200)
    expect(burstBonus).toBeCloseTo(36830, -1);
    const hit = computeHit({
      element: 'Pyro',
      base: 8.006 * atk + burstBonus,
      dmgBonus: 1.816,
      critRate: 1,
      critDmg: 2.625,
      critMode: 'crit',
      characterLevel: 90,
      em: 427.73,
      enemy: { level: 100, res: { Pyro: -0.1 } as never, defRed: 0 },
      reaction: { kind: 'melt', bonus: 0 },
      ampCoefficient: 2.778,
    });
    expect(hit.def).toBeCloseTo(0.487, 3);
    expect(hit.res).toBeCloseTo(1.05, 9);
    expect(hit.amp).toBeCloseTo(2 * 1.65, 2);
    expect(Math.abs(hit.total / 1_516_981 - 1)).toBeLessThan(0.005);
  });
});

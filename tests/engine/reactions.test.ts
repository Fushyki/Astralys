/**
 * Cada valor esperado é calculado À MÃO neste arquivo (constantes do jogo + aritmética), sem chamar as
 * funções do motor, para que um erro de fórmula não se "valide" a si mesmo.
 */
import { describe, it, expect } from 'vitest';
import {
  additiveTerm,
  ampMultiplier,
  computeHit,
  computeLunarReaction,
  computeSpecial,
  computeStellarSwirlReaction,
  computeTransformative,
  crystallizeShield,
  type EnemyStats,
} from '../../src/engine';

const L90 = 1446.8535; // multiplicador de nível 90 (transformativas/catalisadoras)
const C90 = 1851.0603; // multiplicador de nível 90 (cristalizar)
const TRANS_DEF_90 = 99999999 / (99999999 + (5 * 90 + 500)); // ≈ 1: transformativas quase ignoram a DEF
const DEF_90_vs_90 = 190 / (190 + 190); // 0,5

const enemy90 = (res = 0.1, extra: Partial<EnemyStats> = {}): EnemyStats => ({ level: 90, res, ...extra });

describe('dano direto', () => {
  const base = {
    element: 'Pyro' as const,
    base: 1000,
    dmgBonus: 0.5,
    critRate: 0.5,
    critDmg: 1,
    critMode: 'avg' as const,
    characterLevel: 90,
    em: 0,
    enemy: enemy90(0.1),
  };

  it('sem reação: base × (1+DMG%) × crítico × DEF × RES', () => {
    const r = computeHit(base);
    expect(r.total).toBeCloseTo(1000 * 1.5 * 1.5 * DEF_90_vs_90 * 0.9, 6);
    expect(r.reactionApplied).toBe(false);
    expect(r.amp).toBe(1);
  });

  it('dano fixo entra na base, antes dos multiplicadores', () => {
    const r = computeHit({ ...base, flatDamage: 500 });
    expect(r.total).toBeCloseTo((1000 + 500) * 1.5 * 1.5 * DEF_90_vs_90 * 0.9, 6);
  });

  it('Derreter: Pyro ×2, Cryo ×1,5; EM 0', () => {
    const pyro = computeHit({ ...base, reaction: { kind: 'melt' } });
    expect(pyro.amp).toBeCloseTo(2, 12);
    expect(pyro.total).toBeCloseTo(1000 * 1.5 * 1.5 * DEF_90_vs_90 * 0.9 * 2, 6);
    expect(computeHit({ ...base, element: 'Cryo', reaction: { kind: 'melt' } }).amp).toBeCloseTo(1.5, 12);
  });

  it('Vaporizar: Hydro ×2, Pyro ×1,5', () => {
    expect(computeHit({ ...base, element: 'Hydro', reaction: { kind: 'vaporize' } }).amp).toBeCloseTo(2, 12);
    expect(computeHit({ ...base, reaction: { kind: 'vaporize' } }).amp).toBeCloseTo(1.5, 12);
  });

  it('amplificadora usa EM e o bônus da reação: mult × (1 + 25/9·EM/(EM+1400) + bônus)', () => {
    const em = 424;
    const expected = 2 * (1 + (25 / 9) * (em / (em + 1400)) + 0.15);
    const r = computeHit({ ...base, em, reaction: { kind: 'melt', bonus: 0.15 } });
    expect(r.amp).toBeCloseTo(expected, 10);
    expect(ampMultiplier('melt', 'Pyro', em, 0.15)).toBeCloseTo(expected, 10);
  });

  it('elemento incompatível ignora a reação (sem erro)', () => {
    const electroMelt = computeHit({ ...base, element: 'Electro', reaction: { kind: 'melt' } });
    expect(electroMelt.amp).toBe(1);
    expect(electroMelt.reactionApplied).toBe(false);
    expect(computeHit({ ...base, element: 'Physical', reaction: { kind: 'vaporize' } }).reactionApplied).toBe(false);
  });

  it('Intensificar (Electro) soma um termo ANTES de DMG%, crítico, DEF e RES', () => {
    const em = 300;
    const term = L90 * 1.15 * (1 + 5 * (em / (em + 1200)));
    const r = computeHit({ ...base, element: 'Electro', em, reaction: { kind: 'aggravate' } });
    expect(r.additive).toBeCloseTo(term, 8);
    expect(r.total).toBeCloseTo((1000 + term) * 1.5 * 1.5 * DEF_90_vs_90 * 0.9, 6);
    expect(r.reactionApplied).toBe(true);
  });

  it('Espalhar (Dendro) ×1,25 e só vale para Dendro', () => {
    expect(additiveTerm('spread', 'Dendro', 90, 0)).toBeCloseTo(L90 * 1.25, 8);
    expect(additiveTerm('spread', 'Pyro', 90, 0)).toBe(0);
    expect(additiveTerm('aggravate', 'Dendro', 90, 0)).toBe(0);
  });

  it('o termo aditivo também recebe o bônus da reação', () => {
    expect(additiveTerm('aggravate', 'Electro', 90, 0, 0.2)).toBeCloseTo(L90 * 1.15 * 1.2, 8);
  });

  it('DEF reduzida e DEF ignorada aumentam o dano', () => {
    const plain = computeHit(base).total;
    const shred = computeHit({ ...base, enemy: enemy90(0.1, { defRed: 0.2, defIgnore: 0.1 }) });
    expect(shred.def).toBeCloseTo(190 / (190 + 190 * 0.8 * 0.9), 12);
    expect(shred.total).toBeGreaterThan(plain);
  });

  it('RES negativa dá bônus', () => {
    const r = computeHit({ ...base, enemy: enemy90(-0.2) });
    expect(r.res).toBeCloseTo(1.1, 12);
  });

  it('três modos de crítico', () => {
    const hit = computeHit({ ...base, critMode: 'hit' }).total;
    const crit = computeHit({ ...base, critMode: 'crit' }).total;
    const avg = computeHit({ ...base, critMode: 'avg' }).total;
    expect(crit / hit).toBeCloseTo(2, 10); // CD 100%
    expect(avg / hit).toBeCloseTo(1.5, 10); // CR 50%
  });
});

describe('reações transformativas clássicas', () => {
  const em0 = { characterLevel: 90, em: 0, enemy: enemy90(0.1) };

  // Valores base (pré-RES) de nível 90 que a comunidade conhece: Swirl ≈ 868, Sobrecarga ≈ 3979.
  it.each([
    ['overloaded', 2.75],
    ['shattered', 3],
    ['electrocharged', 2],
    ['superconduct', 1.5],
    ['swirl', 0.6],
    ['burning', 0.25],
    ['bloom', 2],
    ['burgeon', 3],
    ['hyperbloom', 3],
  ] as const)('%s = %s × multiplicador de nível × RES', (reaction, multi) => {
    const r = computeTransformative({ reaction, ...em0 });
    expect(r.total).toBeCloseTo(multi * L90 * TRANS_DEF_90 * 0.9, 6);
    expect(r.reactionMulti).toBe(multi);
  });

  it('Swirl ≈ 868 e Sobrecarga ≈ 3979 antes da RES (nível 90, EM 0)', () => {
    expect(0.6 * L90).toBeCloseTo(868.11, 1);
    expect(2.75 * L90).toBeCloseTo(3978.84, 1);
  });

  it('EM e bônus da reação: nível × coef × (1 + 16·EM/(EM+2000) + bônus)', () => {
    const em = 1000;
    const r = computeTransformative({
      reaction: 'overloaded', characterLevel: 90, em, enemy: enemy90(0.1), bonuses: { dmgBonus: 0.2 },
    });
    const emMult = 1 + 16 * (em / (em + 2000)) + 0.2;
    expect(r.emMultiplier).toBeCloseTo(emMult, 10);
    expect(r.total).toBeCloseTo(2.75 * L90 * emMult * TRANS_DEF_90 * 0.9, 6);
  });

  it('dano fixo da reação soma-se à base antes de RES', () => {
    const r = computeTransformative({ reaction: 'overloaded', ...em0, bonuses: { flatDamage: 1000 } });
    expect(r.total).toBeCloseTo((2.75 * L90 + 1000) * TRANS_DEF_90 * 0.9, 6);
  });

  it('só reações "crittáveis" recebem crítico', () => {
    const bonuses = { critRate: 0.6, critDmg: 1 };
    const bloomCrit = computeTransformative({ reaction: 'bloom', ...em0, bonuses, critMode: 'crit' });
    expect(bloomCrit.crit).toBeCloseTo(2, 12);
    const bloomAvg = computeTransformative({ reaction: 'hyperbloom', ...em0, bonuses, critMode: 'avg' });
    expect(bloomAvg.crit).toBeCloseTo(1.6, 12);
    const overloaded = computeTransformative({ reaction: 'overloaded', ...em0, bonuses, critMode: 'crit' });
    expect(overloaded.crit).toBe(1);
  });

  it('Swirl pyro/hydro/cryo multiplica pela amplificadora (Derreter/Vaporizar)', () => {
    const swirl = computeTransformative({
      reaction: 'swirl', ...em0,
      swirl: { element: 'Pyro', amplifying: { kind: 'vaporize' } },
    });
    expect(swirl.amp).toBeCloseTo(1.5, 12);
    expect(swirl.total).toBeCloseTo(0.6 * L90 * TRANS_DEF_90 * 0.9 * 1.5, 6);
    const cryo = computeTransformative({
      reaction: 'swirl', ...em0, swirl: { element: 'Cryo', amplifying: { kind: 'melt' } },
    });
    expect(cryo.amp).toBeCloseTo(1.5, 12);
  });

  it('Swirl elétrico soma o termo da Intensificar antes de crítico e RES', () => {
    const term = L90 * 1.15;
    const swirl = computeTransformative({
      reaction: 'swirl', ...em0,
      swirl: { element: 'Electro', additive: { kind: 'aggravate' } },
    });
    expect(swirl.total).toBeCloseTo((0.6 * L90 + term) * TRANS_DEF_90 * 0.9, 6);
    expect(swirl.amp).toBe(1);
  });
});

describe('reações Lunares', () => {
  const common = { characterLevel: 90, em: 0, critRate: 0, critDmg: 0, critMode: 'hit' as const, enemy: enemy90(0.1) };

  it('Lunar-Charged (da reação): 3 × nível × (1 + 6·EM/(EM+2000)), RES Electro', () => {
    const r = computeLunarReaction('lunarcharged', common);
    expect(r.total).toBeCloseTo(3 * L90 * TRANS_DEF_90 * 0.9, 6);
    expect(r.reactionMultiplier).toBeCloseTo(L90, 6);
  });

  it('Lunar-Crystallize (da reação): 1,6 × nível', () => {
    expect(computeLunarReaction('lunarcrystallize', common).total).toBeCloseTo(1.6 * L90 * TRANS_DEF_90 * 0.9, 6);
  });

  it('usa 6 (e não 16) como coeficiente de EM', () => {
    const em = 1000;
    const r = computeLunarReaction('lunarcharged', { ...common, em });
    const emMult = 1 + 6 * (em / (em + 2000));
    expect(r.emMultiplier).toBeCloseTo(emMult, 10);
    expect(r.total).toBeCloseTo(3 * L90 * emMult * TRANS_DEF_90 * 0.9, 6);
  });

  it('golpe de personagem Lunar-Bloom: talento × stat × 1 × bases', () => {
    // Ex.: 250% do ATK final de 5000, bônus de EM 0.
    const r = computeSpecial({
      ...common, reaction: 'lunarbloom', base: { statValue: 5000 }, multiplier: 2.5,
    });
    expect(r.reactionMultiplier).toBe(1);
    expect(r.total).toBeCloseTo(2.5 * 5000 * TRANS_DEF_90 * resFor(0.1), 6);
  });

  it('golpe de personagem Lunar-Charged usa multiplicador 3 e Lunar-Crystallize 1,6', () => {
    const charged = computeSpecial({ ...common, reaction: 'lunarcharged', base: { statValue: 4000 }, multiplier: 1 });
    expect(charged.total).toBeCloseTo(1 * 4000 * 3 * TRANS_DEF_90 * 0.9, 6);
    const crystal = computeSpecial({ ...common, reaction: 'lunarcrystallize', base: { statValue: 4000 }, multiplier: 1 });
    expect(crystal.total).toBeCloseTo(4000 * 1.6 * TRANS_DEF_90 * 0.9, 6);
  });

  it('bônus: dmg da reação, baseDmg, specialDmg, dano fixo direto vs. da reação', () => {
    const bonuses = {
      dmgBonus: 0.3, baseDmgBonus: 0.5, specialDmgBonus: 0.25, flatDamage: 100, directFlatDamage: 400, reactionFlatDamage: 7000,
    };
    const stat = computeSpecial({
      ...common, reaction: 'lunarbloom', base: { statValue: 1000 }, multiplier: 2, bonuses,
    });
    // base = 2 × 1000 × 1 × (1 + 0 + 0.3) × (1 + 0.5) + (100 + 400)
    const expectedBase = 2 * 1000 * 1 * 1.3 * 1.5 + 500;
    expect(stat.base).toBeCloseTo(expectedBase, 8);
    expect(stat.total).toBeCloseTo(expectedBase * 1.25 * TRANS_DEF_90 * 0.9, 6);

    const reaction = computeLunarReaction('lunarcharged', { ...common, bonuses });
    // base = 3 × L90 × 1.3 × 1.5 + (100 + 7000)
    expect(reaction.base).toBeCloseTo(3 * L90 * 1.3 * 1.5 + 7100, 6);
  });

  it('crítico das Lunares usa a taxa/dano crítico finais informados', () => {
    const crit = computeLunarReaction('lunarcharged', { ...common, critRate: 0.6, critDmg: 1.5, critMode: 'crit' });
    expect(crit.crit).toBeCloseTo(2.5, 12);
    const avg = computeLunarReaction('lunarcharged', { ...common, critRate: 2, critDmg: 1.5, critMode: 'avg' });
    expect(avg.crit).toBeCloseTo(2.5, 12); // taxa limitada a 100%
  });
});

describe('reações Estelares', () => {
  const common = { characterLevel: 90, em: 0, critRate: 0, critDmg: 0, critMode: 'hit' as const, enemy: enemy90(0.1) };

  it('exigem o elemento da RES (depende do disparo)', () => {
    expect(() => computeSpecial({ ...common, reaction: 'stellarconduct', base: { statValue: 100 }, multiplier: 1 })).toThrow(
      /resistElement/,
    );
  });

  it('Stellar-Swirl (da reação): 0,75 × nível; vórtices valem 2x e 3x', () => {
    const swirl = computeStellarSwirlReaction({ ...common, resistElement: 'Anemo' });
    expect(swirl.total).toBeCloseTo(0.75 * L90 * TRANS_DEF_90 * 0.9, 6);
    expect(computeStellarSwirlReaction({ ...common, resistElement: 'Cryo' }, 'vortex1').total).toBeCloseTo(
      2 * L90 * TRANS_DEF_90 * 0.9, 6,
    );
    expect(computeStellarSwirlReaction({ ...common, resistElement: 'Cryo' }, 'vortex2').total).toBeCloseTo(
      3 * L90 * TRANS_DEF_90 * 0.9, 6,
    );
  });

  it('golpe de personagem Stellar-Conduct: multiplicador 1 + bônus "_mult_"', () => {
    const base = computeSpecial({
      ...common, reaction: 'stellarconduct', resistElement: 'Electro', base: { statValue: 3000 }, multiplier: 2,
    });
    expect(base.reactionMultiplier).toBe(1);
    expect(base.total).toBeCloseTo(2 * 3000 * TRANS_DEF_90 * 0.9, 6);

    const boosted = computeSpecial({
      ...common, reaction: 'stellarconduct', resistElement: 'Cryo', base: { statValue: 3000 }, multiplier: 2,
      bonuses: { stellarMultiBonus: 0.4 },
    });
    expect(boosted.reactionMultiplier).toBeCloseTo(1.4, 12);
    expect(boosted.total).toBeCloseTo(2 * 3000 * 1.4 * TRANS_DEF_90 * 0.9, 6);
  });
});

describe('RES por elemento', () => {
  // Cenário do gabarito: RES base 10% e Citlali reduzindo 20% de Pyro e Hydro.
  const enemy: EnemyStats = {
    level: 90,
    res: { Physical: 0.1, Pyro: -0.1, Hydro: -0.1, Cryo: 0.1, Electro: 0.1, Dendro: 0.1, Geo: 0.1, Anemo: 0.1 },
  };

  it('dano direto usa a RES do elemento do golpe', () => {
    const pyro = computeHit({ element: 'Pyro', base: 1000, dmgBonus: 0, critRate: 0, critDmg: 0, critMode: 'hit', characterLevel: 90, em: 0, enemy });
    const cryo = computeHit({ element: 'Cryo', base: 1000, dmgBonus: 0, critRate: 0, critDmg: 0, critMode: 'hit', characterLevel: 90, em: 0, enemy });
    expect(pyro.res).toBeCloseTo(1.05, 12);
    expect(cryo.res).toBeCloseTo(0.9, 12);
  });

  it('Sobrecarga usa Pyro; Swirl usa o elemento espalhado; Lunar-Charged usa Electro', () => {
    const base = { characterLevel: 90, em: 0 };
    expect(computeTransformative({ reaction: 'overloaded', ...base, enemy }).res).toBeCloseTo(1.05, 12);
    expect(computeTransformative({ reaction: 'swirl', ...base, enemy, swirl: { element: 'Cryo' } }).res).toBeCloseTo(0.9, 12);
    expect(computeTransformative({ reaction: 'swirl', ...base, enemy, swirl: { element: 'Hydro' } }).res).toBeCloseTo(1.05, 12);
    expect(
      computeLunarReaction('lunarcharged', { ...base, enemy, critRate: 0, critDmg: 0, critMode: 'hit' }).res,
    ).toBeCloseTo(0.9, 12);
  });

  it('Estelar usa a RES do elemento informado (Cryo vs Anemo)', () => {
    const common = { characterLevel: 90, em: 0, enemy, critRate: 0, critDmg: 0, critMode: 'hit' as const };
    expect(computeStellarSwirlReaction({ ...common, resistElement: 'Cryo' }).res).toBeCloseTo(0.9, 12);
    const reduced = { ...enemy, res: { ...(enemy.res as object), Anemo: -0.3 } };
    expect(computeStellarSwirlReaction({ ...common, enemy: reduced, resistElement: 'Anemo' }).res).toBeCloseTo(1.15, 12);
  });

  it('mapa sem o elemento pedido falha em vez de assumir 0', () => {
    const partial: EnemyStats = { level: 90, res: { Pyro: 0.1 } };
    expect(() =>
      computeHit({ element: 'Hydro', base: 1, dmgBonus: 0, critRate: 0, critDmg: 0, critMode: 'hit', characterLevel: 90, em: 0, enemy: partial }),
    ).toThrow(/Hydro/);
  });
});

describe('Cristalizar (escudo)', () => {
  it('nível 90, EM 0 = multiplicador de nível', () => {
    expect(crystallizeShield({ characterLevel: 90, em: 0 })).toBeCloseTo(C90, 6);
  });

  it('EM 1400 e bônus; escudo do próprio elemento ×2,5', () => {
    const shield = C90 * (1 + (40 / 9) * 0.5 + 0.1);
    expect(crystallizeShield({ characterLevel: 90, em: 1400, bonus: 0.1 })).toBeCloseTo(shield, 6);
    expect(crystallizeShield({ characterLevel: 90, em: 1400, bonus: 0.1, elemental: true })).toBeCloseTo(shield * 2.5, 6);
  });
});

/** RES 10% = 0,9 (escrito à mão para os testes acima). */
function resFor(res: number) {
  return 1 - res;
}

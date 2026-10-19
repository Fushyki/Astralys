/**
 * Reações que causam dano por si: transformativas clássicas, Lunares e Estelares, mais o escudo de Cristalizar.
 * Referência: Genshin Optimizer (libs/gi/wr/src/reaction/{trans,lunar,stellar,special,multi}.ts), MIT.
 */
import {
  ELEMENTAL_CRYSTALLIZE_SHIELD_MULTI,
  LUNAR_STAT_MULTIPLIER,
  SPECIAL_REACTION_MULTI,
  SPECIAL_RESIST,
  STELLAR_SWIRL_VORTEX,
  TRANSFORMATIVE,
  type AdditiveReaction,
  type AmplifyingReaction,
  type ElementOrPhysical,
  type LunarReaction,
  type SpecialReaction,
  type StellarReaction,
  type TransformativeReaction,
} from './constants/reactions';
import { additiveTerm, ampMultiplier, enemyRes, type EnemyStats } from './damage';
import {
  cappedCritRate,
  crystallizeBase,
  crystallizeLevelMultiplier,
  critFactor,
  resMultiplier,
  specialBase,
  transformativeBase,
  transformativeDefMultiplier,
  transformativeLevelMultiplier,
  type CritMode,
} from './formulas';
import type { Element } from '../data/schema';

/** Inimigo das reações: o motor escolhe a RES do elemento que cada reação usa. */
export type ReactionEnemy = EnemyStats;

// ---------- Transformativas clássicas ----------

export interface TransformativeBonuses {
  /** "Bônus de dano da reação" (ex.: +% Sobrecarga de sets/armas), em fração. */
  dmgBonus?: number;
  /** Dano fixo somado à base da reação. */
  flatDamage?: number;
  /** Só contam para reações que podem causar crítico (burning, bloom, burgeon, hyperbloom, swirl). */
  critRate?: number;
  critDmg?: number;
}

export interface TransformativeInput {
  reaction: TransformativeReaction;
  characterLevel: number;
  em: number;
  bonuses?: TransformativeBonuses;
  critMode?: CritMode;
  /** Inimigo. A RES usada é a do elemento da reação (no Swirl, o elemento espalhado). */
  enemy: ReactionEnemy;
  /**
   * Swirl: reação que o elemento espalhado dispara no inimigo.
   * Pyro/Hydro/Cryo usam amplificadoras; Electro usa Intensificar (aditiva).
   */
  swirl?: {
    element: Element;
    amplifying?: { kind: AmplifyingReaction; bonus?: number };
    additive?: { kind: AdditiveReaction; bonus?: number };
  };
  ampCoefficient?: number;
}

export interface TransformativeBreakdown {
  levelMultiplier: number;
  reactionMulti: number;
  /** 1 + 16·EM/(EM+2000) + bônus da reação. */
  emMultiplier: number;
  /** Base antes de crítico, DEF e RES (inclui dano fixo e o termo aditivo do Swirl elétrico). */
  base: number;
  crit: number;
  def: number;
  res: number;
  /** Amplificação do Swirl (1 nos demais). */
  amp: number;
  total: number;
}

export function computeTransformative(input: TransformativeInput): TransformativeBreakdown {
  const info = TRANSFORMATIVE[input.reaction];
  const b = input.bonuses ?? {};
  const levelMultiplier = transformativeLevelMultiplier(input.characterLevel);
  const emMultiplier = transformativeBase(input.em) + (b.dmgBonus ?? 0);

  let base = info.multi * levelMultiplier * emMultiplier + (b.flatDamage ?? 0);

  // Swirl elétrico recebe o termo aditivo ANTES de crítico e RES (como o Genshin Optimizer).
  let amp = 1;
  if (input.reaction === 'swirl' && input.swirl) {
    const { element, amplifying, additive } = input.swirl;
    if (additive && element === 'Electro') {
      base += additiveTerm(additive.kind, element, input.characterLevel, input.em, additive.bonus ?? 0);
    }
    if (amplifying && element !== 'Electro') {
      amp = ampMultiplier(amplifying.kind, element, input.em, amplifying.bonus ?? 0, input.ampCoefficient);
    }
  }

  const crit = info.canCrit ? critFactor(input.critMode ?? 'hit', b.critRate ?? 0, b.critDmg ?? 0) : 1;
  const def = transformativeDefMultiplier(input.enemy.level, input.enemy.defRed ?? 0, input.enemy.defIgnore ?? 0);
  const resistElement = input.reaction === 'swirl' && input.swirl ? input.swirl.element : info.resist;
  const res = resMultiplier(enemyRes(input.enemy, resistElement));

  return {
    levelMultiplier,
    reactionMulti: info.multi,
    emMultiplier,
    base,
    crit,
    def,
    res,
    amp,
    total: base * crit * def * res * amp,
  };
}

// ---------- Lunares e Estelares ----------

export interface SpecialBonuses {
  /** `${reação}_dmg_`: soma ao multiplicador de EM (1 + 6·EM/(EM+2000) + dmgBonus). */
  dmgBonus?: number;
  /** `${reação}_baseDmg_`: multiplica a base como (1 + baseDmgBonus). */
  baseDmgBonus?: number;
  /** `${reação}_specialDmg_`: multiplicador final (1 + specialDmgBonus). */
  specialDmgBonus?: number;
  /** Dano fixo comum à reação. */
  flatDamage?: number;
  /** Dano fixo apenas quando a base é a própria reação / apenas quando é um stat de personagem. */
  reactionFlatDamage?: number;
  directFlatDamage?: number;
  /** Bônus `${stellar}_mult_` que soma ao multiplicador de reação dos golpes Estelares baseados em stat. */
  stellarMultiBonus?: number;
}

export interface SpecialInput {
  reaction: SpecialReaction;
  /** Elemento cuja RES se aplica. Obrigatório nas Estelares (depende do disparo); nas Lunares é deduzido. */
  resistElement?: Element;
  characterLevel: number;
  em: number;
  /**
   * `'reaction'`: dano da própria reação (multiplicador de nível × coeficiente).
   * `{ statValue }`: golpe de personagem baseado num stat (ex.: ATK final), com `multiplier` do talento.
   */
  base: 'reaction' | { statValue: number };
  /** Multiplicador do talento (golpe de personagem) ou coeficiente da reação (base = 'reaction'). */
  multiplier: number;
  /** Multiplicador extra de habilidade (quando existir). */
  specialMultiplier?: number;
  bonuses?: SpecialBonuses;
  /** Taxa e dano crítico FINAIS deste golpe (já somados: gerais + da reação + do elemento). */
  critRate: number;
  critDmg: number;
  critMode: CritMode;
  enemy: ReactionEnemy;
}

export interface SpecialBreakdown {
  /** Multiplicador de reação (nível quando base = 'reaction'; coeficiente fixo quando base = stat). */
  reactionMultiplier: number;
  /** 1 + 6·EM/(EM+2000) + bônus da reação. */
  emMultiplier: number;
  baseDmgMultiplier: number;
  flatDamage: number;
  /** (multiplicador × stat × extras × reação × EM × baseDmg) + dano fixo. */
  base: number;
  crit: number;
  specialDmgMultiplier: number;
  def: number;
  res: number;
  total: number;
}

function specialResist(input: SpecialInput): Element {
  if (input.reaction === 'stellarconduct' || input.reaction === 'stellarswirl') {
    if (!input.resistElement) throw new Error(`${input.reaction} exige resistElement (depende do elemento do disparo)`);
    return input.resistElement;
  }
  return SPECIAL_RESIST[input.reaction as LunarReaction];
}

export function computeSpecial(input: SpecialInput): SpecialBreakdown {
  const b = input.bonuses ?? {};
  const isReactionBase = input.base === 'reaction';

  let reactionMultiplier: number;
  if (isReactionBase) {
    reactionMultiplier = transformativeLevelMultiplier(input.characterLevel);
  } else if (input.reaction === 'stellarconduct' || input.reaction === 'stellarswirl') {
    reactionMultiplier = 1 + (b.stellarMultiBonus ?? 0);
  } else {
    reactionMultiplier = LUNAR_STAT_MULTIPLIER[input.reaction as LunarReaction];
  }

  const emMultiplier = specialBase(input.em) + (b.dmgBonus ?? 0);
  const baseDmgMultiplier = 1 + (b.baseDmgBonus ?? 0);
  const statValue = isReactionBase ? 1 : (input.base as { statValue: number }).statValue;
  const flatDamage = (b.flatDamage ?? 0) + (isReactionBase ? (b.reactionFlatDamage ?? 0) : (b.directFlatDamage ?? 0));

  const base =
    input.multiplier * statValue * (input.specialMultiplier ?? 1) * reactionMultiplier * emMultiplier * baseDmgMultiplier +
    flatDamage;

  const crit = critFactor(input.critMode, cappedCritRate(input.critRate), input.critDmg);
  const specialDmgMultiplier = 1 + (b.specialDmgBonus ?? 0);
  const def = transformativeDefMultiplier(input.enemy.level, input.enemy.defRed ?? 0, input.enemy.defIgnore ?? 0);
  const res = resMultiplier(enemyRes(input.enemy, specialResist(input)));

  return {
    reactionMultiplier,
    emMultiplier,
    baseDmgMultiplier,
    flatDamage,
    base,
    crit,
    specialDmgMultiplier,
    def,
    res,
    total: base * crit * specialDmgMultiplier * def * res,
  };
}

/** Dano da própria reação Lunar-Charged / Lunar-Crystallize (Lunar-Bloom e Estelares só existem como golpe de personagem). */
export function computeLunarReaction(
  reaction: 'lunarcharged' | 'lunarcrystallize',
  common: Omit<SpecialInput, 'reaction' | 'base' | 'multiplier'>,
): SpecialBreakdown {
  return computeSpecial({ ...common, reaction, base: 'reaction', multiplier: SPECIAL_REACTION_MULTI[reaction] });
}

/** Dano da reação Redemoinho Estelar: o vórtice 1 vale 2x e o vórtice 2 vale 3x o coeficiente base. */
export function computeStellarSwirlReaction(
  common: Omit<SpecialInput, 'reaction' | 'base' | 'multiplier'>,
  vortex?: keyof typeof STELLAR_SWIRL_VORTEX,
): SpecialBreakdown {
  const multiplier = vortex ? STELLAR_SWIRL_VORTEX[vortex] : SPECIAL_REACTION_MULTI.stellarswirl;
  return computeSpecial({ ...common, reaction: 'stellarswirl', base: 'reaction', multiplier });
}

export type { LunarReaction, SpecialReaction, StellarReaction };

// ---------- Cristalizar (escudo) ----------

/** Escudo de Cristalizar. `elemental` aplica o ×2,5 do escudo do elemento do próprio personagem. */
export function crystallizeShield(options: {
  characterLevel: number;
  em: number;
  /** Bônus de escudo de cristalizar, em fração. */
  bonus?: number;
  elemental?: boolean;
}): number {
  const shield = crystallizeLevelMultiplier(options.characterLevel) * (crystallizeBase(options.em) + (options.bonus ?? 0));
  return options.elemental ? shield * ELEMENTAL_CRYSTALLIZE_SHIELD_MULTI : shield;
}

export type { ElementOrPhysical };

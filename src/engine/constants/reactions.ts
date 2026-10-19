/**
 * Constantes das reações elementais. Valores e estrutura seguem o Genshin Optimizer
 * (frzyc/genshin-optimizer@cbee3af, libs/gi/keymap/src/StatConstants.ts e libs/gi/wr/src/reaction/*, MIT).
 * Veja THIRD_PARTY_NOTICES.md. Se o jogo mudar um valor, altere AQUI e anote a fonte.
 *
 * Os elementos usam a grafia do projeto (`Pyro`, não `pyro`); `Physical` é o dano físico.
 */
import type { Element } from '../../data/schema';

export type ElementOrPhysical = Element | 'Physical';

// ---------- Amplificadoras ----------

export type AmplifyingReaction = 'vaporize' | 'melt';

/** Multiplicador por elemento do golpe que dispara a reação. */
export const AMPLIFYING: Record<AmplifyingReaction, Partial<Record<Element, number>>> = {
  vaporize: { Pyro: 1.5, Hydro: 2 },
  melt: { Pyro: 2, Cryo: 1.5 },
};

// ---------- Catalisadoras (aditivas) ----------

export type AdditiveReaction = 'spread' | 'aggravate';

export const ADDITIVE: Record<AdditiveReaction, { element: Element; multi: number }> = {
  spread: { element: 'Dendro', multi: 1.25 },
  aggravate: { element: 'Electro', multi: 1.15 },
};

// ---------- Transformativas "clássicas" ----------

export type TransformativeReaction =
  | 'overloaded'
  | 'shattered'
  | 'electrocharged'
  | 'superconduct'
  | 'swirl'
  | 'burning'
  | 'bloom'
  | 'burgeon'
  | 'hyperbloom';

export interface TransformativeInfo {
  name: string;
  /** Coeficiente da reação (multiplicado pelo multiplicador de nível). */
  multi: number;
  /** Elemento cuja RES se aplica ao dano. No Swirl vale o elemento espalhado. */
  resist: ElementOrPhysical;
  /** Elementos possíveis do dano. */
  variants: ElementOrPhysical[];
  /** Pode causar crítico (só com bônus específicos da reação). */
  canCrit: boolean;
}

export const TRANSFORMATIVE: Record<TransformativeReaction, TransformativeInfo> = {
  overloaded: { name: 'Sobrecarga', multi: 2.75, resist: 'Pyro', variants: ['Pyro'], canCrit: false },
  shattered: { name: 'Estilhaçar', multi: 3, resist: 'Physical', variants: ['Physical'], canCrit: false },
  electrocharged: { name: 'Eletrocarregado', multi: 2, resist: 'Electro', variants: ['Electro'], canCrit: false },
  superconduct: { name: 'Supercondutor', multi: 1.5, resist: 'Cryo', variants: ['Cryo'], canCrit: false },
  swirl: { name: 'Redemoinho', multi: 0.6, resist: 'Pyro', variants: ['Pyro', 'Hydro', 'Electro', 'Cryo'], canCrit: true },
  burning: { name: 'Queimadura', multi: 0.25, resist: 'Pyro', variants: ['Pyro', 'Dendro'], canCrit: true },
  bloom: { name: 'Florescer', multi: 2, resist: 'Dendro', variants: ['Dendro', 'Hydro'], canCrit: true },
  burgeon: { name: 'Brotar', multi: 3, resist: 'Dendro', variants: ['Pyro'], canCrit: true },
  hyperbloom: { name: 'Hiperflorescer', multi: 3, resist: 'Dendro', variants: ['Electro'], canCrit: true },
};

// ---------- Lunares e Estelares ----------

export type LunarReaction = 'lunarcharged' | 'lunarbloom' | 'lunarcrystallize';
export type StellarReaction = 'stellarconduct' | 'stellarswirl';
export type SpecialReaction = LunarReaction | StellarReaction;

/** Multiplicador de reação quando a base é um STAT (golpe de personagem) e não o nível. */
export const LUNAR_STAT_MULTIPLIER: Record<LunarReaction, number> = {
  lunarcharged: 3,
  lunarbloom: 1,
  lunarcrystallize: 1.6,
};

/** Coeficiente quando a base é a própria reação (multiplicador de nível × coeficiente). */
export const SPECIAL_REACTION_MULTI: Record<SpecialReaction, number> = {
  lunarcharged: 3,
  lunarbloom: 0, // só existe como golpe de personagem (base = stat)
  lunarcrystallize: 1.6,
  stellarconduct: 0, // idem
  stellarswirl: 0.75, // os vórtices valem 2x e 3x (ver STELLAR_SWIRL_VORTEX)
};

export const STELLAR_SWIRL_VORTEX = { vortex1: 2, vortex2: 3 } as const;

/** RES usada por cada reação especial. Stellar-Conduct e Stellar-Swirl dependem do elemento do disparo. */
export const SPECIAL_RESIST: Record<LunarReaction, Element> = {
  lunarcharged: 'Electro',
  lunarbloom: 'Dendro',
  lunarcrystallize: 'Geo',
};

// ---------- Cristalizar (escudo, não é dano) ----------

/** Escudo de cristalizar do elemento do próprio personagem vale 250% do escudo base. */
export const ELEMENTAL_CRYSTALLIZE_SHIELD_MULTI = 2.5;

// ---------- Coeficientes de EM ----------

/** Amplificadoras: 25/9 (≈2,7778). A planilha de referência usa 2,78 (arredondado). */
export const AMP_EM_COEFFICIENT = 25 / 9;
export const AMP_EM_COEFFICIENT_SHEET = 2.78;
export const AMP_EM_DENOMINATOR = 1400;

export const ADD_EM_COEFFICIENT = 5;
export const ADD_EM_DENOMINATOR = 1200;

export const TRANS_EM_COEFFICIENT = 16;
export const SPECIAL_EM_COEFFICIENT = 6;
export const TRANS_EM_DENOMINATOR = 2000;

export const CRYSTALLIZE_EM_COEFFICIENT = 40 / 9;
export const CRYSTALLIZE_EM_DENOMINATOR = 1400;

export const MAX_LEVEL = 100;

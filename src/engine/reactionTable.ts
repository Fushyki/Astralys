/**
 * Dano das reações em si (transformativas, Lunares e Estelares) para um personagem, com a Maestria Elemental do build.
 * Complementa a tabela de dano dos golpes. Os bônus de dano de reação do personagem (sets, armas, passivas) entram nas
 * transformativas clássicas (`reactionBonus`); as Lunares e Estelares saem sem bônus e sem crítico, com UM contribuinte (o coeficiente cheio: 3 no Lunar-Charged).
 */
import type { Element } from '../data/schema';
import { TRANSFORMATIVE, type ElementOrPhysical, type TransformativeReaction } from './constants/reactions';
import type { EnemyStats } from './damage';
import type { ReactionBonusKey } from './stats';
import { computeLunarReaction, computeStellarSwirlReaction, computeTransformative } from './reactions';

export interface ReactionRow {
  id: string;
  name: string;
  /** Grupo para a tela: transformativa clássica, Lunar ou Estelar. */
  group: 'transformative' | 'lunar' | 'stellar';
  element: ElementOrPhysical;
  total: number;
}

export interface ReactionTableInput {
  characterLevel: number;
  em: number;
  enemy: EnemyStats;
  /** Bônus de dano de cada reação (fração), somado ao multiplicador de Maestria como no Genshin Optimizer. */
  reactionBonus?: Partial<Record<ReactionBonusKey, number>>;
}

const SWIRL_ELEMENTS: Element[] = ['Pyro', 'Hydro', 'Electro', 'Cryo'];
const SIMPLE: TransformativeReaction[] = ['overloaded', 'electrocharged', 'superconduct', 'shattered', 'burning', 'bloom', 'hyperbloom', 'burgeon'];

export function reactionTable({ characterLevel, em, enemy, reactionBonus = {} }: ReactionTableInput): ReactionRow[] {
  const rows: ReactionRow[] = [];

  for (const reaction of SIMPLE) {
    const info = TRANSFORMATIVE[reaction];
    const total = computeTransformative({ reaction, characterLevel, em, enemy, bonuses: { dmgBonus: reactionBonus[reaction] ?? 0 } }).total;
    rows.push({ id: reaction, name: info.name, group: 'transformative', element: info.resist, total });
  }
  for (const element of SWIRL_ELEMENTS) {
    const total = computeTransformative({ reaction: 'swirl', characterLevel, em, enemy, swirl: { element }, bonuses: { dmgBonus: reactionBonus.swirl ?? 0 } }).total;
    rows.push({ id: `swirl-${element}`, name: `Redemoinho ${element}`, group: 'transformative', element, total });
  }

  const common = { characterLevel, em, critRate: 0, critDmg: 0, critMode: 'hit' as const, enemy };
  rows.push({ id: 'lunarcharged', name: 'Lunar-Carregado', group: 'lunar', element: 'Electro', total: computeLunarReaction('lunarcharged', common).total });
  rows.push({ id: 'lunarcrystallize', name: 'Lunar-Cristalizar', group: 'lunar', element: 'Geo', total: computeLunarReaction('lunarcrystallize', common).total });
  for (const element of SWIRL_ELEMENTS) {
    for (const vortex of ['vortex1', 'vortex2'] as const) {
      const total = computeStellarSwirlReaction({ ...common, resistElement: element }, vortex).total;
      rows.push({ id: `stellarswirl-${element}-${vortex}`, name: `Redemoinho Estelar ${element} (vórtice ${vortex === 'vortex1' ? 1 : 2})`, group: 'stellar', element, total });
    }
  }
  return rows;
}

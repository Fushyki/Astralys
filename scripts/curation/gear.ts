/**
 * Linguagem de curadoria de armas e sets: cada número vem de um parâmetro do Lunaris (`p`), de um literal tirado da
 * descrição (`lit`) ou de uma expressão regular sobre o texto de CADA refinamento (`re`, grupo 1; "16%" vira 0,16).
 */
import type { Element, HitType } from '../../src/data/schema';
import type { BuffTeamRules, ConvertTarget } from '../../src/effects/schema';
import type { Val } from './sets';

export type { Val };
export type Sum = Val | Val[];

export type StatKey = 'atkPct' | 'dmgPct' | 'critRate' | 'critDmg' | 'em' | 'er' | 'hpPct' | 'defPct';
export type ByType = Partial<Record<HitType, Sum>>;

export type StatsCur = Partial<Record<StatKey, Sum>> & {
  byType?: ByType;
  critRateByType?: ByType;
  critDmgByType?: ByType;
  /** Bônus de DMG Físico. */
  physDmgPct?: Sum;
  physCritDmg?: Sum;
  /** Bônus de dano de reação (ex.: { bloom: { p: 0 } }). */
  reactionBonus?: Partial<Record<ReactionKey, Sum>>;
};

export type ReactionKey = 'overloaded' | 'shattered' | 'electrocharged' | 'superconduct' | 'swirl' | 'burning' | 'bloom' | 'burgeon' | 'hyperbloom' | 'spread' | 'aggravate';

/**
 * Golpe extra de proc: escala em fração do stat final do dono (`atk: { p: 0 }` = parâmetro 0 do Lunaris). O elemento
 * vem do Genshin Optimizer (`customDmgNode` da arma: 'Physical' quando ele marca `ele: physical`; sem `element`, o do
 * personagem). Sem `hitType`, não conta como Normal/Carregado/etc.
 */
export interface ProcCur {
  id: string;
  label: string;
  scale: { atk?: Sum; hp?: Sum; def?: Sum; em?: Sum };
  element?: Element | 'Physical';
  hitType?: HitType;
  note?: string;
}

/** Buff com conversão, regra de time ou dono diferente de "só o próprio personagem". */
export interface BuffCur {
  id: string;
  label: string;
  scope?: 'self' | 'others' | 'team';
  /** Vira faixa na linha do tempo (só vale nas janelas ligadas). Padrão: sempre ativo. */
  timed?: boolean;
  forElements?: Element[];
  stats?: StatsCur;
  convert?: { from: 'atk' | 'baseAtk' | 'hp' | 'def' | 'em' | 'er' | 'partyEnergy'; perPoint: Sum; threshold?: Sum; cap?: Sum; to: ConvertTarget[] };
  team?: BuffTeamRules;
}

export interface FlatCur {
  name: string;
  sourceStat: 'ATK' | 'HP' | 'DEF' | 'EM';
  perPoint: Sum;
  cap?: Sum;
  hitTypes: HitType[];
  stacks?: number;
}

export interface GearCur extends StatsCur {
  /** Buff que a arma dá à equipe inteira (vale nas janelas de buff). */
  team?: { atkPct?: Sum; dmgPct?: Sum; em?: Sum };
  buffs?: BuffCur[];
  flat?: FlatCur[];
  /** Golpes extras (ver `ProcCur`). */
  procs?: ProcCur[];
  /** Passiva que só mexe em energia, cura, estamina ou recarga de habilidade: nada a calcular em dano. */
  noDamage?: true;
  /** Parte que mexe em dano (golpe extra, reação nova) ainda fora do cálculo. */
  partial?: true;
  /** Trecho que TEM de aparecer na descrição do R1 (protege contra o Lunaris mudar). Omitido em armas sem passiva. */
  expect?: string;
  note: string;
}

export const ALWAYS = 'Assume os stacks máximos e a condição sempre ativos.';

/** Personagens por nação, só para as armas que contam "membros de Liyue / de Natlan". */
export const LIYUE = ['Xiao', 'Ganyu', 'Keqing', 'Hu Tao', 'Zhongli', 'Xiangling', 'Xingqiu', 'Beidou', 'Ningguang', 'Qiqi', 'Chongyun', 'Xinyan', 'Yanfei', 'Yun Jin', 'Shenhe', 'Yelan', 'Gaming', 'Xianyun', 'Baizhu', 'Lan Yan', 'Yaoyao'];
export const NATLAN = ['Mavuika', 'Citlali', 'Kachina', 'Kinich', 'Mualani', 'Xilonen', 'Chasca', 'Ororon', 'Varesa', 'Iansan', 'Ifa'];

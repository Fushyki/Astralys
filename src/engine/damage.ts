/**
 * Dano direto de um golpe: base × bônus × crítico × DEF × RES, com reações amplificadoras
 * (Derreter/Vaporizar) e catalisadoras (Espalhar/Intensificar).
 *
 *   total = (base + danoFixo + termoAditivo) × (1 + DMG%) × crítico × DEF × RES × amplificação
 *
 * O termo aditivo (catalisadoras) entra ANTES de DMG%/crítico/DEF/RES, e a amplificação multiplica no fim.
 * O dano fixo (ex.: Lead Vocal) também entra na base, como na planilha de referência.
 * Referência: Genshin Optimizer (libs/gi/wr/src/formula.ts), MIT.
 */
import {
  ADDITIVE,
  AMP_EM_COEFFICIENT,
  AMPLIFYING,
  type AdditiveReaction,
  type AmplifyingReaction,
  type ElementOrPhysical,
} from './constants/reactions';
import {
  additiveBase,
  ampBase,
  critFactor,
  defMultiplier,
  resMultiplier,
  transformativeLevelMultiplier,
  type CritMode,
} from './formulas';

/** RES por elemento (fração: 0.1 = 10%), já com reduções aplicadas. */
export type ResistanceMap = Partial<Record<ElementOrPhysical, number>>;

export interface EnemyStats {
  level: number;
  /**
   * RES do inimigo. Um número vale para qualquer elemento (útil em cálculos simples); um mapa por elemento
   * deixa o motor escolher a RES certa para cada golpe e reação (Estelar/Lunar/Swirl usam elementos diferentes).
   */
  res: number | ResistanceMap;
  /** Redução de DEF (fração). */
  defRed?: number;
  /** DEF ignorada (fração). */
  defIgnore?: number;
}

/** RES do inimigo ao elemento dado. Falha se o mapa não informar esse elemento. */
export function enemyRes(enemy: EnemyStats, element: ElementOrPhysical): number {
  if (typeof enemy.res === 'number') return enemy.res;
  const value = enemy.res[element];
  if (value === undefined) throw new Error(`RES do inimigo não informada para ${element}`);
  return value;
}

export interface ReactionTrigger {
  kind: AmplifyingReaction | AdditiveReaction;
  /** Soma dos bônus específicos da reação (ex.: "+15% Derreter" do Crimson Witch), em fração. */
  bonus?: number;
}

export interface HitInput {
  element: ElementOrPhysical;
  /** Dano base já escalado: Σ(stat × multiplicador do talento) × acertos. */
  base: number;
  /** Dano fixo somado à base (antes dos multiplicadores). */
  flatDamage?: number;
  /** Soma dos bônus de DMG% aplicáveis a este golpe (geral + elemento + tipo de golpe), em fração. */
  dmgBonus: number;
  critRate: number;
  critDmg: number;
  critMode: CritMode;
  characterLevel: number;
  /** Maestria Elemental final do atacante. */
  em: number;
  enemy: EnemyStats;
  reaction?: ReactionTrigger;
  /** Coeficiente de EM das amplificadoras. Padrão 25/9; a planilha de referência usa 2,78. */
  ampCoefficient?: number;
}

export interface HitBreakdown {
  base: number;
  flatDamage: number;
  /** Termo das catalisadoras (0 se não houve reação aditiva válida). */
  additive: number;
  /** base + dano fixo + termo aditivo. */
  baseTotal: number;
  dmgMultiplier: number;
  crit: number;
  def: number;
  res: number;
  /** Multiplicador das amplificadoras (1 se não houve). */
  amp: number;
  /** A reação pedida realmente se aplicou (elemento compatível)? */
  reactionApplied: boolean;
  total: number;
}

/** Multiplicador final de uma amplificadora para o elemento do golpe (1 se o elemento não dispara a reação). */
export function ampMultiplier(
  reaction: AmplifyingReaction,
  element: ElementOrPhysical,
  em: number,
  bonus = 0,
  coefficient: number = AMP_EM_COEFFICIENT,
): number {
  const multi = element === 'Physical' ? undefined : AMPLIFYING[reaction][element];
  if (multi === undefined) return 1;
  return multi * (ampBase(em, coefficient) + bonus);
}

/** Termo aditivo de uma catalisadora (0 se o elemento do golpe não é o da reação). */
export function additiveTerm(
  reaction: AdditiveReaction,
  element: ElementOrPhysical,
  characterLevel: number,
  em: number,
  bonus = 0,
): number {
  const info = ADDITIVE[reaction];
  if (element !== info.element) return 0;
  return transformativeLevelMultiplier(characterLevel) * info.multi * (additiveBase(em) + bonus);
}

export function computeHit(input: HitInput): HitBreakdown {
  const flatDamage = input.flatDamage ?? 0;
  const coefficient = input.ampCoefficient ?? AMP_EM_COEFFICIENT;
  const bonus = input.reaction?.bonus ?? 0;

  let additive = 0;
  let amp = 1;
  let reactionApplied = false;
  if (input.reaction) {
    if (input.reaction.kind === 'spread' || input.reaction.kind === 'aggravate') {
      additive = additiveTerm(input.reaction.kind, input.element, input.characterLevel, input.em, bonus);
      reactionApplied = additive > 0;
    } else {
      amp = ampMultiplier(input.reaction.kind, input.element, input.em, bonus, coefficient);
      reactionApplied = amp !== 1;
    }
  }

  const baseTotal = input.base + flatDamage + additive;
  const dmgMultiplier = 1 + input.dmgBonus;
  const crit = critFactor(input.critMode, input.critRate, input.critDmg);
  const def = defMultiplier(
    input.characterLevel,
    input.enemy.level,
    input.enemy.defRed ?? 0,
    input.enemy.defIgnore ?? 0,
  );
  const res = resMultiplier(enemyRes(input.enemy, input.element));

  return {
    base: input.base,
    flatDamage,
    additive,
    baseTotal,
    dmgMultiplier,
    crit,
    def,
    res,
    amp,
    reactionApplied,
    total: baseTotal * dmgMultiplier * crit * def * res * amp,
  };
}

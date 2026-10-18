/**
 * Fórmulas elementares do dano de Genshin. Funções puras, sem dependência de React.
 * Referência: Genshin Optimizer (libs/gi/wr/src/formula.ts e reaction/*), MIT. Ver THIRD_PARTY_NOTICES.md.
 */
import levels from './constants/levelMultipliers.json';
import {
  ADD_EM_COEFFICIENT,
  ADD_EM_DENOMINATOR,
  AMP_EM_COEFFICIENT,
  AMP_EM_DENOMINATOR,
  CRYSTALLIZE_EM_COEFFICIENT,
  CRYSTALLIZE_EM_DENOMINATOR,
  MAX_LEVEL,
  SPECIAL_EM_COEFFICIENT,
  TRANS_EM_COEFFICIENT,
  TRANS_EM_DENOMINATOR,
} from './constants/reactions';

export type CritMode = 'hit' | 'crit' | 'avg';

/** Fração do tipo EM / (EM + k). */
const emFrac = (em: number, k: number) => (em <= 0 ? 0 : em / (em + k));

function assertLevel(level: number): void {
  if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL) {
    throw new RangeError(`Nível inválido: ${level} (esperado inteiro entre 1 e ${MAX_LEVEL})`);
  }
}

/** Multiplicador de nível das reações transformativas e catalisadoras (tabela do jogo, níveis 1–100). */
export function transformativeLevelMultiplier(level: number): number {
  assertLevel(level);
  return levels.transformative[level - 1];
}

/** Multiplicador de nível do escudo de Cristalizar. */
export function crystallizeLevelMultiplier(level: number): number {
  assertLevel(level);
  return levels.crystallize[level - 1];
}

// ---------- Bases dependentes de Maestria Elemental ----------

/** Amplificadoras (Derreter/Vaporizar): 1 + 25/9 · EM/(EM+1400). `coefficient` permite o 2,78 da planilha. */
export const ampBase = (em: number, coefficient: number = AMP_EM_COEFFICIENT) =>
  1 + coefficient * emFrac(em, AMP_EM_DENOMINATOR);

/** Catalisadoras (Espalhar/Intensificar): 1 + 5 · EM/(EM+1200). */
export const additiveBase = (em: number) => 1 + ADD_EM_COEFFICIENT * emFrac(em, ADD_EM_DENOMINATOR);

/** Transformativas clássicas: 1 + 16 · EM/(EM+2000). */
export const transformativeBase = (em: number) => 1 + TRANS_EM_COEFFICIENT * emFrac(em, TRANS_EM_DENOMINATOR);

/** Lunares e Estelares: 1 + 6 · EM/(EM+2000). */
export const specialBase = (em: number) => 1 + SPECIAL_EM_COEFFICIENT * emFrac(em, TRANS_EM_DENOMINATOR);

/** Cristalizar: 1 + 40/9 · EM/(EM+1400). */
export const crystallizeBase = (em: number) => 1 + CRYSTALLIZE_EM_COEFFICIENT * emFrac(em, CRYSTALLIZE_EM_DENOMINATOR);

// ---------- Defesa e resistência ----------

/**
 * Multiplicador de DEF do inimigo: (Lc+100) / ((Lc+100) + (Le+100)·(1−redução)·(1−ignorada)).
 * A planilha de referência não tem `defIgnore` (equivale a 0).
 */
export function defMultiplier(charLevel: number, enemyLevel: number, defRed = 0, defIgnore = 0): number {
  const attacker = charLevel + 100;
  const defender = (enemyLevel + 100) * (1 - defRed) * (1 - defIgnore);
  return attacker / (attacker + defender);
}

/**
 * Reações transformativas ignoram quase toda a DEF. O Genshin Optimizer modela isso com um fator
 * 99999999 / (99999999 + (5·Le+500)·(1−red)·(1−ign)), praticamente 1. Mantido por paridade.
 */
export function transformativeDefMultiplier(enemyLevel: number, defRed = 0, defIgnore = 0): number {
  const big = 99999999;
  return big / (big + (5 * enemyLevel + 500) * (1 - defRed) * (1 - defIgnore));
}

/** Multiplicador de RES: <0 → 1−RES/2; 0..0,75 → 1−RES; ≥0,75 → 1/(4·RES+1). */
export function resMultiplier(res: number): number {
  if (res < 0) return 1 - res / 2;
  if (res >= 0.75) return 1 / (4 * res + 1);
  return 1 - res;
}

// ---------- Crítico ----------

export const cappedCritRate = (critRate: number) => Math.min(Math.max(critRate, 0), 1);

/** Fator do crítico: sem crítico 1; crítico 1+CD; médio 1 + min(max(CR,0),1)·CD. */
export function critFactor(mode: CritMode, critRate: number, critDmg: number): number {
  switch (mode) {
    case 'hit':
      return 1;
    case 'crit':
      return 1 + critDmg;
    case 'avg':
      return 1 + cappedCritRate(critRate) * critDmg;
  }
}

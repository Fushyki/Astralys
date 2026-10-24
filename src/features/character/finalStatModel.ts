/** Digitar o stat FINAL no build "À mão": converte a diferença em rolls dos substats (puro, sem React). */
import type { Rolls, Substat } from '../../engine';

export type FinalStatKey = 'atk' | 'hp' | 'def' | 'em' | 'er' | 'critRate' | 'critDmg';

/** Substat principal e o fixo que absorve o que sobrar (só ATK, HP e DEF têm os dois). */
export const FINAL_STAT_SUBS: Record<FinalStatKey, { pct: Substat; flat?: Substat }> = {
  atk: { pct: 'ATK%', flat: 'ATK' },
  hp: { pct: 'HP%', flat: 'HP' },
  def: { pct: 'DEF%', flat: 'DEF' },
  em: { pct: 'EM' },
  er: { pct: 'ER' },
  critRate: { pct: 'CR' },
  critDmg: { pct: 'CD' },
};

export interface FinalStatResult {
  rolls: Rolls;
  /** Valor final que de fato foi alcançado (igual ao pedido, salvo se bateu num limite). */
  reached: number;
  /** true quando o pedido ficou fora do que os substats permitem (teto de rolls ou abaixo de zero). */
  limited: boolean;
}

/**
 * Soma a diferença (alvo - atual) aos substats do stat: primeiro o % (ou o único), o que sobrar vai para o fixo.
 * `base` = base que o % multiplica (ATK: personagem + arma; HP/DEF: base do personagem; ignorado nos demais).
 * `perRoll` = valor de 1 roll de cada substat (frações para %), `cap` = máximo de rolls por substat.
 * O delta é linear: já inclui arma, main stats, set e buffs ativos que o painel de atributos mostra.
 */
export function applyFinalStat(args: {
  key: FinalStatKey;
  target: number;
  current: number;
  base: number;
  rolls: Rolls;
  perRoll: Record<Substat, number>;
  cap: (s: Substat) => number;
}): FinalStatResult {
  const { key, target, current, base, perRoll, cap } = args;
  const { pct, flat } = FINAL_STAT_SUBS[key];
  const rolls = { ...args.rolls };
  const scale = (s: Substat) => (s === pct && flat ? base * perRoll[s] : perRoll[s]);
  let rest = (Number.isFinite(target) ? target : current) - current;
  let reached = current;
  for (const s of [pct, flat]) {
    if (!s || Math.abs(rest) < 1e-9) continue;
    const k = scale(s);
    if (!(k > 0)) continue;
    const next = Math.max(0, Math.min(cap(s), rolls[s] + rest / k));
    const moved = (next - rolls[s]) * k;
    rolls[s] = Math.round(next * 10000) / 10000;
    rest -= moved;
    reached += moved;
  }
  return { rolls, reached, limited: Math.abs(rest) > 1e-6 * Math.max(1, Math.abs(target)) };
}

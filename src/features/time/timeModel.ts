/**
 * Modelo do dashboard do time: curva de dano acumulado (com os Supremos marcados), ranking de golpes, valor de cada
 * buff e a "leitura rápida" (3 frases por regras simples sobre o resultado do motor, sem IA). Funções puras.
 */
import type { AnalysisBundle, ResolvedProject } from '../../engine';
import type { Summary } from '../rotation/summary';
import { formatDecimal, formatPercent } from '../../ui/format';

export interface CumulativePoint {
  /** Instante do golpe (s). */
  t: number;
  /** Dano acumulado depois deste golpe. */
  total: number;
  member: number;
  actionId: string;
  /** Supremo: aparece marcado na curva. */
  burst: boolean;
  avg: number;
  name: string;
}

/** Dano médio acumulado golpe a golpe, na ordem do tempo (golpes no mesmo instante ficam na ordem original). */
export function cumulativeCurve(bundle: AnalysisBundle): CumulativePoint[] {
  const actions = [...bundle.optimization.result.actions]
    .map((a, i) => ({ a, i }))
    .sort((x, y) => (x.a.action.time ?? 0) - (y.a.action.time ?? 0) || x.i - y.i);
  let total = 0;
  return actions.map(({ a }) => {
    total += a.avg;
    return {
      t: a.action.time ?? 0,
      total,
      member: a.action.member,
      actionId: a.action.id,
      burst: a.action.move.hitType === 'burst',
      avg: a.avg,
      name: a.action.move.displayName.replace(`${a.action.move.character} - `, ''),
    };
  });
}

export interface RankedHit {
  rank: number;
  actionId: string;
  name: string;
  member: number;
  time: number;
  avg: number;
  fraction: number;
}

export function topHits(bundle: AnalysisBundle, count = 10): RankedHit[] {
  const total = bundle.optimization.result.totals.avg || 1;
  return [...bundle.optimization.result.actions]
    .sort((a, b) => b.avg - a.avg)
    .slice(0, count)
    .map((a, i) => ({
      rank: i + 1,
      actionId: a.action.id,
      name: a.action.move.displayName.replace(`${a.action.move.character} - `, ''),
      member: a.action.member,
      time: a.action.time ?? 0,
      avg: a.avg,
      fraction: a.avg / total,
    }));
}

export interface BuffValue {
  id: string;
  label: string;
  fraction: number;
  flagged: boolean;
  /** Quem dá o buff (índice do membro), se der para saber. */
  member?: number;
  /** Fonte própria do personagem (arma, set, passiva, main stat) ou buff de equipe. */
  team: boolean;
}

/** Valor de cada fonte (o dano que some sem ela), com as "a confirmar" sinalizadas. */
export function buffValues(summary: Summary, bundle: AnalysisBundle): BuffValue[] {
  return summary.why.map((w) => {
    const item = bundle.attribution.items.find((i) => i.id === w.id);
    return {
      id: w.id,
      label: w.label,
      fraction: w.fraction,
      flagged: w.flag !== undefined,
      member: item?.member,
      team: !!item && /^(team-|resonance|res-shred)/.test(item.kind),
    };
  });
}

/** Três frases sobre o resultado. Regras simples, escritas em português. */
export function quickRead(summary: Summary, values: BuffValue[], reaction: { name: string; fraction: number } | null): string[] {
  const out: string[] = [];
  const members = [...summary.members].sort((a, b) => b.fraction - a.fraction);
  const top = members[0];
  if (top) {
    if (top.fraction >= 0.6) out.push(`Hipercarry: ${top.name} causa ${formatPercent(top.fraction, 0)} do dano.`);
    else if (members[1] && members[1].fraction >= 0.25) out.push(`Dano dividido: ${top.name} (${formatPercent(top.fraction, 0)}) e ${members[1].name} (${formatPercent(members[1].fraction, 0)}).`);
    else out.push(`Dano distribuído: ${top.name} causa ${formatPercent(top.fraction, 0)}, o maior quinhão.`);
  }
  const best = values.find((v) => !v.flagged && v.team);
  if (best) out.push(`O buff mais valioso é ${best.label.replace(/^[^:]+: /, '')} (${formatPercent(best.fraction, 1)}).`);
  const flagged = values.filter((v) => v.flagged);
  if (flagged.length > 0) {
    out.push(`${flagged.length === 1 ? 'Um buff sem origem soma' : `${flagged.length} buffs sem origem somam`} ${formatPercent(flagged.reduce((s, f) => s + f.fraction, 0), 1)}, confirme.`);
  } else if (reaction) {
    out.push(`${formatPercent(reaction.fraction, 1)} do dano vem de ${reaction.name}.`);
  }
  return out.slice(0, 3);
}

/** Rótulo do Supremo na curva: "Q Mavuika +1,24 mi". */
export function burstLabel(p: CumulativePoint, memberName: string): string {
  const mi = p.avg / 1e6;
  return `Q ${memberName} +${formatDecimal(mi, mi >= 0.1 ? 2 : 3)} mi`;
}

export const memberNames = (resolved: ResolvedProject): string[] => resolved.team.members.map((m) => m.character.name);

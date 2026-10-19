/**
 * Curva "dano × rolls em crítico" de um membro: para cada total de rolls em CR+CD (o campo `forcedCritRolls`),
 * roda o otimizador para o resto dos substats e avalia a rotação inteira. Mostra o quanto o dano muda ao tirar
 * ou pôr rolls em crítico, em vez de só devolver o melhor ponto.
 */
import type { Rolls } from './artifacts';
import { optimizeMember, type OptimizerContext } from './optimizer';
import { evaluateRotation } from './rotation';

export interface CritSweepPoint {
  /** Total de rolls em Taxa + Dano Crítico (inclui o mínimo de cada um). */
  critRolls: number;
  rolls: Rolls;
  critRate: number;
  critDmg: number;
  /** Dano médio da rotação do membro e da equipe inteira, com estes rolls. */
  memberAvg: number;
  teamAvg: number;
}

export interface CritSweep {
  member: number;
  points: CritSweepPoint[];
  /** Índice do melhor ponto da equipe (empate: menos rolls em crítico). */
  best: number;
}

export interface CritSweepInput {
  ctx: OptimizerContext;
  /** Rolls totais de cada membro (a base: os outros membros ficam como estão). */
  rolls: Rolls[];
  member: number;
}

export function critSweep({ ctx, rolls, member }: CritSweepInput): CritSweep {
  const m = ctx.members[member];
  const minR = ctx.config.minRollsPerSubstat;
  const empty: CritSweep = { member, points: [], best: -1 };
  if (m.manualRolls) return empty;

  // O orçamento de dano (rolls livres) define até onde o crítico pode ir.
  const base = optimizeMember(ctx, member);
  if (base.support) return empty;
  const lo = 2 * minR;
  const hi = lo + base.budget.damageRolls;

  const points: CritSweepPoint[] = [];
  for (let f = lo; f <= hi; f++) {
    const members = ctx.members.map((x, i) => (i === member ? { ...x, forcedCritRolls: f } : x));
    const opt = optimizeMember({ ...ctx, members }, member);
    const all = rolls.map((r, i) => (i === member ? opt.rolls : r));
    const res = evaluateRotation({ ...ctx, members, rolls: all }, ctx.actions);
    const first = res.actions.find((a) => a.action.member === member);
    points.push({
      critRolls: f,
      rolls: opt.rolls,
      critRate: first?.stats.critRate ?? 0,
      critDmg: first?.stats.critDmg ?? 0,
      memberAvg: res.members[member].avg,
      teamAvg: res.totals.avg,
    });
  }
  let best = -1;
  points.forEach((p, i) => {
    if (best < 0 || p.teamAvg > points[best].teamAvg + 1e-9) best = i;
  });
  return { member, points, best };
}

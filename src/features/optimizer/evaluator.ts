/**
 * Liga o solver ao motor de dano: dado o vetor de stats das 5 peças e o bônus de set, devolve o valor do foco da
 * build (dano do time, do personagem, de um golpe ou um stat) ou -Infinity se alguma restrição mínima falhar.
 *
 * O membro otimizado entra com `externalStats` (a soma exata das peças). Os outros membros ficam como estão, com os
 * rolls que a análise do projeto já escolheu para eles.
 */
import type { Element } from '../../data/schema';
import {
  activeTeamDelta,
  assembleTeam,
  applyFlatLevels,
  evaluateRotation,
  finalizeMembers,
  finalStats,
  gearFlat,
  resolveMember,
  zeroRolls,
  type EffectsData,
  type FinalStats,
  type GameData,
  type MemberInput,
  type MemberRef,
  type ResolvedProject,
  type Rolls,
} from '../../engine';
import type { Evaluate, SetConfig } from './solver';
import { vecToDelta, type Vec } from './vector';

/** O que se maximiza. */
export type Objective =
  | { kind: 'team' }
  | { kind: 'member' }
  | { kind: 'action'; index: number }
  | { kind: 'stat'; stat: 'hp' | 'atk' | 'def' | 'em' | 'er' };

/** Mínimos nos stats finais do personagem (Recarga em fração: 1,2 = 120%; Taxa e Dano Crítico em fração, com os 5% e 50% base). */
export interface Constraints {
  er?: number;
  cr?: number;
  cd?: number;
  em?: number;
  hp?: number;
  atk?: number;
  def?: number;
}

export interface EvaluatorInput {
  resolved: Pick<ResolvedProject, 'team' | 'actions' | 'flatEffects' | 'ampCoefficient'>;
  /** O projeto está no modo planilha (os 4 personagens da planilha ficam só com os efeitos dela). */
  planilha?: boolean;
  member: number;
  /** Rolls de todos os membros (os do membro otimizado são ignorados). */
  rolls: Rolls[];
  ref: MemberRef;
  game: GameData;
  effects: EffectsData;
  objective: Objective;
  constraints?: Constraints;
}

export interface BuildReport {
  /** Valor do foco. */
  value: number;
  teamAvg: number;
  memberAvg: number;
  dps: number;
  stats: FinalStats;
  /** Restrições cumpridas. */
  feasible: boolean;
}

export interface Evaluator {
  evaluate: Evaluate;
  /** Relatório completo (números da tela de resultado). */
  report(vec: Vec, config: SetConfig): BuildReport;
}

const configKey = (c: SetConfig) => `${c.primarySet ?? ''}|${c.secondarySet ?? ''}|${c.fourPiece === false ? 'two' : 'four'}`;

export function createEvaluator(input: EvaluatorInput): Evaluator {
  const { resolved, member, game, effects } = input;
  const name = resolved.team.members[member].character.name;
  const rolls = input.rolls.map((r, i) => (i === member ? zeroRolls() : r));
  const cache = new Map<string, { members: MemberInput[]; flat: ResolvedProject['flatEffects'] }>();

  const forConfig = (config: SetConfig) => {
    const key = configKey(config);
    let hit = cache.get(key);
    if (!hit) {
      const ref: MemberRef = { ...input.ref, primarySet: config.primarySet, secondarySet: config.secondarySet, fourPiece: config.fourPiece };
      const base = resolved.team.members.map((m, i) => (i === member ? resolveMember(ref, game, effects, resolved.team.config.minRollsPerSubstat) : m));
      const members = finalizeMembers(base, !!input.planilha);
      hit = { members, flat: [...applyFlatLevels(effects.flatDamage, members), ...gearFlat(members)] };
      cache.set(key, hit);
    }
    return hit;
  };

  const run = (vec: Vec, config: SetConfig) => {
    const { members: base, flat } = forConfig(config);
    const mine: MemberInput = { ...base[member], externalStats: vecToDelta(vec) };
    const members = base.map((m, i) => (i === member ? mine : m));
    const team = { ...resolved.team, members };
    const assembly = assembleTeam(team, { rolls });
    const stats = finalStats(mine, assembly.statics[member], zeroRolls(), activeTeamDelta(assembly.buffs, name, new Set<string>()), assembly.resonanceAtkPct);
    return { members, assembly, stats, flat, team };
  };

  const meets = (s: FinalStats): boolean => {
    const c = input.constraints;
    if (!c) return true;
    return (
      (c.er === undefined || s.er >= c.er - 1e-9) &&
      (c.cr === undefined || s.critRate >= c.cr - 1e-9) &&
      (c.cd === undefined || s.critDmg >= c.cd - 1e-9) &&
      (c.em === undefined || s.em >= c.em - 1e-9) &&
      (c.hp === undefined || s.hp >= c.hp - 1e-9) &&
      (c.atk === undefined || s.atk >= c.atk - 1e-9) &&
      (c.def === undefined || s.def >= c.def - 1e-9)
    );
  };

  const rotation = (r: ReturnType<typeof run>) =>
    evaluateRotation(
      { members: r.members, assembly: r.assembly, config: r.team.config, rolls, flatEffects: r.flat, ampCoefficient: resolved.ampCoefficient },
      resolved.actions,
    );

  const valueOf = (r: ReturnType<typeof run>): number => {
    const o = input.objective;
    if (o.kind === 'stat') return { hp: r.stats.hp, atk: r.stats.atk, def: r.stats.def, em: r.stats.em, er: r.stats.er }[o.stat];
    const result = rotation(r);
    if (o.kind === 'team') return result.totals.avg;
    if (o.kind === 'member') return result.members[member].avg;
    return result.actions[o.index]?.avg ?? 0;
  };

  return {
    evaluate(vec, config) {
      const r = run(vec, config);
      if (!meets(r.stats)) return -Infinity;
      return valueOf(r);
    },
    report(vec, config) {
      const r = run(vec, config);
      const result = rotation(r);
      const feasible = meets(r.stats);
      return {
        value: feasible ? valueOf(r) : -Infinity,
        teamAvg: result.totals.avg,
        memberAvg: result.members[member].avg,
        dps: result.totals.dps,
        stats: r.stats,
        feasible,
      };
    },
  };
}

/** Elemento do personagem (para o bônus de DMG% do cálice). */
export const elementOf = (resolved: Pick<ResolvedProject, 'team'>, member: number): Element => resolved.team.members[member].character.element;

/**
 * Análise completa de uma equipe e rotação numa chamada só: otimiza os substats e calcula tudo o que a
 * interface mostra. Pensado para rodar no Web Worker (uma ida e volta por edição).
 */
import type { FlatDamageEffect } from '../effects/schema';
import { attributeBuffs, type AttributionResult } from './attribution';
import { critProfile, optimizeAssembled, damageBySource, substatGains, type CritProfile, type SourceBreakdown, type SubstatGain } from './analysis';
import { SUBSTATS, type Rolls } from './artifacts';
import { type TeamOptimization } from './optimizer';
import type { RotationAction } from './rotation';
import { activeTeamDelta, defaultTotalRolls, finalStats, maxRollsFor, type FinalStats } from './stats';
import { assembleTeam, type TeamAssembly, type TeamInput } from './team';

export interface AnalysisInput {
  team: TeamInput;
  actions: RotationAction[];
  flatEffects?: FlatDamageEffect[];
  ampCoefficient?: number;
}

export interface AnalysisBundle {
  optimization: TeamOptimization;
  attribution: AttributionResult;
  sources: SourceBreakdown;
  gains: SubstatGain[];
  /** Perfil de crítico de cada membro (nos stats da primeira ação dele). */
  crit: (CritProfile | null)[];
  /** Stats finais de cada membro com todos os buffs de time ativos (o "melhor caso" do build). */
  memberStats: FinalStats[];
  /** Avisos sobre o uso de rolls de cada membro (orçamento e limite por substat). */
  rollWarnings: RollWarning[];
  warnings: string[];
}

export interface RollWarning {
  member: number;
  kind: 'over-budget' | 'over-substat-cap';
  message: string;
}

/** Confere se os rolls de um membro cabem no orçamento e no limite de cada substat. */
export function rollWarningsFor(member: number, name: string, team: TeamInput, rolls: Rolls): RollWarning[] {
  const m = team.members[member];
  const out: RollWarning[] = [];
  const used = SUBSTATS.reduce((s, k) => s + rolls[k], 0);
  const budget = m.totalRolls ?? defaultTotalRolls(m.artifacts);
  if (used > budget) out.push({ member, kind: 'over-budget', message: `${name}: ${used} rolls usados, mas o orçamento das peças é ${budget}.` });
  for (const s of SUBSTATS) {
    const cap = maxRollsFor(m.artifacts, s);
    if (rolls[s] > cap) out.push({ member, kind: 'over-substat-cap', message: `${name}: ${rolls[s]} rolls de ${s}, mas as peças comportam no máximo ${cap}.` });
  }
  return out;
}

export function analyzeProject(input: AnalysisInput): AnalysisBundle {
  const { assembly, optimization } = optimizeAssembled(input.team, { actions: input.actions, flatEffects: input.flatEffects, ampCoefficient: input.ampCoefficient });
  const ctx = {
    members: input.team.members,
    assembly,
    config: input.team.config,
    actions: input.actions,
    flatEffects: input.flatEffects,
    ampCoefficient: input.ampCoefficient,
  };
  const attribution = attributeBuffs({
    team: input.team,
    actions: input.actions,
    rolls: optimization.rolls,
    flatEffects: input.flatEffects,
    ampCoefficient: input.ampCoefficient,
  });
  const gains = substatGains({ ...ctx, rolls: optimization.rolls }, input.actions);
  const crit = input.team.members.map((_, i) => {
    const first = optimization.result.actions.find((a) => a.action.member === i);
    return first ? critProfile(first.stats) : null;
  });
  const memberStats = input.team.members.map((m, i) =>
    finalStats(m, assembly.statics[i], optimization.rolls[i], activeTeamDelta(assembly.buffs, m.character.name, 'all'), assembly.resonanceAtkPct),
  );
  const rollWarnings = input.team.members.flatMap((m, i) => rollWarningsFor(i, m.character.name, input.team, optimization.rolls[i]));
  return { optimization, attribution, sources: damageBySource(optimization.result), gains, crit, memberStats, rollWarnings, warnings: assembly.warnings };
}

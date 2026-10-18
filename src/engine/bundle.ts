/**
 * Análise completa de uma equipe e rotação numa chamada só: otimiza os substats e calcula tudo o que a
 * interface mostra. Pensado para rodar no Web Worker (uma ida e volta por edição).
 */
import type { FlatDamageEffect } from '../effects/schema';
import { attributeBuffs, type AttributionResult } from './attribution';
import { critProfile, damageBySource, substatGains, type CritProfile, type SourceBreakdown, type SubstatGain } from './analysis';
import { optimizeTeam, type TeamOptimization } from './optimizer';
import type { RotationAction } from './rotation';
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
  warnings: string[];
}

export function analyzeProject(input: AnalysisInput): AnalysisBundle {
  const assembly: TeamAssembly = assembleTeam(input.team);
  const ctx = {
    members: input.team.members,
    assembly,
    config: input.team.config,
    actions: input.actions,
    flatEffects: input.flatEffects,
    ampCoefficient: input.ampCoefficient,
  };
  const optimization = optimizeTeam(ctx);
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
  return { optimization, attribution, sources: damageBySource(optimization.result), gains, crit, warnings: assembly.warnings };
}

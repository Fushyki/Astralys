/**
 * Comparação de armas: a rotação inteira é reanalisada (com os substats do membro reotimizados) para cada arma
 * candidata. As equipes candidatas chegam prontas (só o membro trocado muda), então o worker não precisa dos
 * dados de jogo.
 */
import type { FlatDamageEffect } from '../effects/schema';
import { analyzeProject } from './bundle';
import type { RotationAction } from './rotation';
import type { TeamInput } from './team';

export interface WeaponCandidate {
  weapon: string;
  /** Quando informado, é uma linha de comparação de refinamentos da mesma arma. */
  refinement?: number;
  /** Quando informado, é uma linha de comparação de constelações do mesmo personagem. */
  constellation?: number;
  team: TeamInput;
}

export interface WeaponCompareInput {
  member: number;
  candidates: WeaponCandidate[];
  actions: RotationAction[];
  flatEffects?: FlatDamageEffect[];
  ampCoefficient?: number;
}

export interface WeaponCompareRow {
  weapon: string;
  refinement?: number;
  constellation?: number;
  /** Dano médio da rotação da equipe e do membro com esta arma. */
  teamAvg: number;
  memberAvg: number;
  dps: number;
}

export function compareWeapons(input: WeaponCompareInput): WeaponCompareRow[] {
  return input.candidates
    .map(({ weapon, refinement, constellation, team }) => {
      const b = analyzeProject({ team, actions: input.actions, flatEffects: input.flatEffects, ampCoefficient: input.ampCoefficient });
      const totals = b.optimization.result.totals;
      return { weapon, ...(refinement ? { refinement } : {}), ...(constellation !== undefined ? { constellation } : {}), teamAvg: totals.avg, memberAvg: b.optimization.result.members[input.member].avg, dps: totals.dps };
    })
    .sort((a, b) => b.teamAvg - a.teamAvg);
}

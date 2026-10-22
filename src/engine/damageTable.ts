/**
 * Tabela de dano de um personagem (como a aba "Talentos" do Genshin Optimizer): cada golpe do kit avaliado uma
 * vez, com os stats finais do build e TODOS os buffs de time ativos, sem consumir stacks de dano fixo.
 */
import type { Move } from '../data/schema';
import type { ElementOrPhysical } from './constants/reactions';
import { evaluateRotation, type ReactionChoice, type ResolvedMove, type RotationAction, type RotationContext } from './rotation';
import { withSpecial } from './project';
import type { Rolls } from './artifacts';
import type { TeamAssembly, TeamInput } from './team';

export interface DamageRow {
  move: Move;
  element: ElementOrPhysical;
  noCrit: number;
  crit: number;
  avg: number;
  /** A reação escolhida só vale para alguns elementos: false = o golpe saiu sem reação. */
  reactionApplied: boolean;
}

export interface DamageTableInput {
  team: TeamInput;
  assembly: TeamAssembly;
  rolls: Rolls[];
  member: number;
  moves: readonly Move[];
  reaction: ReactionChoice;
  ampCoefficient?: number;
}

const toResolved = (m: Move): ResolvedMove => ({
  id: m.id,
  character: m.character,
  talent: m.talent,
  hitType: m.hitType,
  label: m.label,
  displayName: m.label,
  hits: m.hits,
  scale: m.scale,
});

export function damageTable(input: DamageTableInput): DamageRow[] {
  const { team, assembly, member, reaction } = input;
  const name = team.members[member].character.name;
  const own = input.moves.filter((m) => m.character === name);
  const tags = [...new Set(assembly.buffs.map((b) => b.tag))];
  const actions: RotationAction[] = own.map((m) => ({
    id: m.id,
    member,
    // Golpes que no jogo causam dano Lunar/Estelar usam a fórmula deles (curadoria `specialMoves`).
    move: withSpecial(toResolved(m), m.variant, team.members[member].characterEffect),
    executions: 1,
    reaction,
    activeTags: tags,
    dmgAdjust: 0,
  }));
  const ctx: RotationContext = {
    members: team.members,
    assembly,
    config: team.config,
    rolls: input.rolls,
    ampCoefficient: input.ampCoefficient,
  };
  const { actions: results } = evaluateRotation(ctx, actions);
  return results.map((r, i) => ({
    move: own[i],
    element: r.element,
    noCrit: r.noCrit,
    crit: r.crit,
    avg: r.avg,
    reactionApplied: r.breakdown.reactionApplied,
  }));
}

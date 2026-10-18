/**
 * Atribuição de buffs: quanto cada fonte de bônus vale na rotação.
 *
 * Para cada fonte (arma, set, passiva, main stat, buff de time, ressonância, redução de RES) calcula o dano
 * médio da rotação com tudo ligado MENOS o dano médio com aquela fonte desligada, mantendo os rolls fixos.
 * É a contribuição marginal: como os multiplicadores se combinam, as contribuições NÃO somam 100%.
 */
import type { FlatDamageEffect } from '../effects/schema';
import type { Rolls } from './artifacts';
import { evaluateRotation, type RotationAction } from './rotation';
import { activeCharacterBuffs, fourPieceActive, type StatSourceKind } from './stats';
import { assembleTeam, type TeamInput } from './team';

export type AttributionKind = StatSourceKind | 'team-gear' | 'team-extra' | 'team-flat-atk' | 'team-character' | 'resonance' | 'res-shred';

export interface Attribution {
  id: string;
  label: string;
  kind: AttributionKind;
  /** Membro dono da fonte (quando faz sentido). */
  member?: number;
  /** Dano médio ganho por esta fonte (com tudo − sem ela). */
  contribution: number;
  /** contribution / dano médio total. */
  share: number;
  /** Quanto cada membro ganha com ela. */
  perMember: { name: string; contribution: number }[];
}

export interface AttributionInput {
  team: TeamInput;
  actions: readonly RotationAction[];
  rolls: Rolls[];
  flatEffects?: FlatDamageEffect[];
  ampCoefficient?: number;
}

export interface AttributionResult {
  total: number;
  items: Attribution[];
}

export function attributeBuffs(input: AttributionInput): AttributionResult {
  const { team, actions, rolls } = input;
  const base = assembleTeam(team);
  const run = (disabled?: ReadonlySet<string>) => {
    const assembly = disabled ? assembleTeam(team, { disabled }) : base;
    return evaluateRotation(
      { members: team.members, assembly, config: team.config, rolls, flatEffects: input.flatEffects, ampCoefficient: input.ampCoefficient },
      actions,
    );
  };

  const full = run();
  const names = team.members.map((m) => m.character.name);

  const candidates: Omit<Attribution, 'contribution' | 'share' | 'perMember'>[] = [];
  base.sources.flat().forEach((s) => candidates.push({ id: s.id, label: `${names[s.member]}: ${s.label}`, kind: s.kind, member: s.member }));
  base.buffs.forEach((b) => {
    const kind: AttributionKind = b.id.startsWith('gear-') ? 'team-gear' : b.id.startsWith('flat-atk-') ? 'team-flat-atk' : b.id.startsWith('cbuff-') ? 'team-character' : 'team-extra';
    candidates.push({ id: b.id, label: b.description ?? b.id, kind });
  });
  if (base.resonanceAtkPct > 0) candidates.push({ id: 'resonance-pyro', label: 'Ressonância Pyro (+25% ATK)', kind: 'resonance' });
  team.members.forEach((m, i) => {
    if (m.characterEffect?.resShred && m.characterEffect.resShred.value > 0) {
      candidates.push({ id: `res-shred-${i}`, label: `${names[i]}: redução de RES`, kind: 'res-shred', member: i });
    }
  });

  team.members.forEach((m, i) => {
    for (const b of activeCharacterBuffs(m)) {
      if (b.resShred && b.resShred.value > 0) candidates.push({ id: `cbuff-res-${i}-${b.id}`, label: `${names[i]}: ${b.label} (redução de RES)`, kind: 'res-shred', member: i });
    }
    const sr = fourPieceActive(m) ? m.primarySet?.effect?.fourPiece?.resShred : undefined;
    if (sr && sr.value > 0) candidates.push({ id: `set-res-shred-${i}`, label: `${names[i]}: ${m.primarySet?.name} (redução de RES)`, kind: 'res-shred', member: i });
  });

  const items: Attribution[] = candidates.map((c) => {
    const without = run(new Set([c.id]));
    const contribution = full.totals.avg - without.totals.avg;
    return {
      ...c,
      contribution,
      share: full.totals.avg > 0 ? contribution / full.totals.avg : 0,
      perMember: full.members.map((m, i) => ({ name: m.name, contribution: m.avg - without.members[i].avg })),
    };
  });
  items.sort((a, b) => b.contribution - a.contribution);
  return { total: full.totals.avg, items };
}

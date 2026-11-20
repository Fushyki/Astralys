/** O que o card da galeria mostra de um time publicado: números e sequência da rotação. Função pura, calculada no navegador de quem publica. */
import type { RotationProject } from '../../engine';

export interface TeamSummary {
  dps: number;
  dpr: number;
  duration: number;
  shares: number[];
  members: { character: string; weapon: string; constellation: number; set?: string }[];
  /** Golpes em ordem de tempo, juntando repetições seguidas do mesmo golpe (`times` = quantas vezes). */
  sequence: { member: number; label: string; times: number; /** instante do primeiro golpe, em s (ausente em times publicados antes da linha do tempo) */ time?: number }[];
  actionCount: number;
}

export const MAX_SEQUENCE = 30;

export function buildSummary(p: RotationProject, n: { dps: number; dpr: number; duration: number; shares: number[] }): TeamSummary {
  const sequence: TeamSummary['sequence'] = [];
  for (const a of [...p.actions].sort((x, y) => x.time - y.time)) {
    const label = a.displayName || a.move.label;
    const last = sequence[sequence.length - 1];
    if (last && last.member === a.member && last.label === label) last.times += Math.max(1, Math.round(a.executions));
    else if (sequence.length < MAX_SEQUENCE) sequence.push({ member: a.member, label, times: Math.max(1, Math.round(a.executions)), time: Math.round(a.time * 10) / 10 });
  }
  return {
    ...n,
    members: p.members.map((m) => ({ character: m.character, weapon: m.weapon, constellation: m.constellation ?? 0, set: m.primarySet })),
    sequence,
    actionCount: p.actions.length,
  };
}

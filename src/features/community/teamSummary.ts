/** O que o card da galeria mostra de um time publicado: números e sequência da rotação. Função pura, calculada no navegador de quem publica. */
import type { RotationProject } from '../../engine';
import type { CardHit } from '../card/cardModel';

export interface TeamSummary {
  dps: number;
  dpr: number;
  duration: number;
  shares: number[];
  members: { character: string; weapon: string; constellation: number; set?: string }[];
  /** Golpes em ordem de tempo, juntando repetições seguidas do mesmo golpe (`times` = quantas vezes). */
  sequence: { member: number; label: string; times: number; /** instante do primeiro golpe, em s (ausente em times publicados antes do plano de combate) */ time?: number }[];
  actionCount: number;
  /** Golpes da rotação como no card (instante de 0 a 1, tamanho, Supremo, letra); ausente em times publicados antes do card da galeria. */
  hits?: CardHit[];
}

export const MAX_SEQUENCE = 30;

const r3 = (x: number) => Math.round(x * 1000) / 1000;
export const MAX_TICKS = 30;

export function buildSummary(p: RotationProject, n: { dps: number; dpr: number; duration: number; shares: number[]; hits?: CardHit[] }): TeamSummary {
  const sequence: TeamSummary['sequence'] = [];
  for (const a of [...p.actions].sort((x, y) => x.time - y.time)) {
    const label = a.displayName || a.move.label;
    const last = sequence[sequence.length - 1];
    if (last && last.member === a.member && last.label === label) last.times += Math.max(1, Math.round(a.executions));
    else if (sequence.length < MAX_SEQUENCE) sequence.push({ member: a.member, label, times: Math.max(1, Math.round(a.executions)), time: Math.round(a.time * 10) / 10 });
  }
  const { hits, ...rest } = n;
  const out: TeamSummary = {
    ...rest,
    ...(hits ? { hits: hits.map((h) => ({ ...h, at: r3(h.at), weight: r3(h.weight), ...(h.to !== undefined ? { to: r3(h.to) } : {}), ...(h.ticks ? { ticks: h.ticks.slice(0, MAX_TICKS).map(r3) } : {}) })) } : {}),
    members: p.members.map((m) => ({ character: m.character, weapon: m.weapon, constellation: m.constellation ?? 0, set: m.primarySet })),
    sequence,
    actionCount: p.actions.length,
  };
  // O servidor recusa resumo acima de ~20 KB: sem os instantes de cada execução dos golpes contínuos o card ainda funciona.
  if (out.hits && JSON.stringify(out).length > 17000) out.hits = out.hits.map(({ ticks: _t, ...h }) => h);
  return out;
}

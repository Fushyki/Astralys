/**
 * Modelo da tela Rotação (puro): rótulo curto do golpe na linha do tempo, quem está em campo, buffs agrupados por quem
 * dá, linhas da Sequência (golpe contínuo = uma linha) e dados do gráfico de dano acumulado.
 */
import type { ActionRef, ActionResult, RotationProject } from '../../engine';
import { effectiveDuration } from '../../engine';
import type { LaneInfo } from './rotationModel';

/** Rótulo do marcador: N1–N5, CA (carregado), QD (imersivo), E (habilidade), Q (supremo). */
export function hitTag(move: { talent: string; hitType: string; label: string }): string {
  if (move.talent === 'reaction') return /swirl/i.test(move.label) ? 'RD' : 'RE';
  if (move.talent === 'skill' && move.hitType === 'skill') return 'E';
  if (move.talent === 'burst' && move.hitType === 'burst') return 'Q';
  if (move.hitType === 'charged') return 'CA';
  if (move.hitType === 'plunge') return 'QD';
  const n = /^(?:Skill )?(\d+)-Hit/i.exec(move.label);
  if (n) return `N${n[1]}`;
  if (move.talent === 'skill') return 'E';
  if (move.talent === 'burst') return 'Q';
  return move.label.slice(0, 2).toUpperCase();
}

export interface FieldSegment {
  member: number;
  start: number;
  end: number;
}

/** Quem está em campo: o personagem do golpe vale até o próximo golpe de OUTRO personagem. */
export function fieldSegments(project: Pick<RotationProject, 'actions' | 'config' | 'compat'>, duration: number): FieldSegment[] {
  const list = [...project.actions].sort((a, b) => a.time - b.time);
  const out: FieldSegment[] = [];
  for (const a of list) {
    const last = out[out.length - 1];
    if (last && last.member === a.member) continue;
    if (last) last.end = a.time;
    out.push({ member: a.member, start: a.time, end: a.time });
  }
  const end = Math.max(duration, list[list.length - 1]?.time ?? 0);
  if (out.length) out[out.length - 1].end = end;
  return out.filter((s) => s.end > s.start);
}

export interface BuffGroup {
  /** Índice de quem dá (null = sem dono conhecido, "Time"). */
  giver: number | null;
  name: string;
  lanes: LaneInfo[];
}

/** Agrupa as faixas de buff por quem dá, na ordem da equipe; "só os ativos" tira as que não têm janela. */
export function groupBuffLanes(lanes: LaneInfo[], names: string[], windowedTags: Set<string>, onlyActive: boolean): BuffGroup[] {
  const pick = onlyActive ? lanes.filter((l) => windowedTags.has(l.tag)) : lanes;
  const groups: BuffGroup[] = [];
  names.forEach((name, i) => {
    const mine = pick.filter((l) => l.giver === i);
    if (mine.length) groups.push({ giver: i, name, lanes: mine });
  });
  const rest = pick.filter((l) => l.giver === null || l.giver >= names.length);
  if (rest.length) groups.push({ giver: null, name: 'Time', lanes: rest });
  return groups;
}

export interface SequenceRow {
  /** Ação que representa a linha (a 1ª execução, se for contínuo). */
  action: ActionRef;
  /** Todas as ações da linha (execuções do golpe contínuo). */
  ids: string[];
  index: number;
  /** "a cada 2,0 s · ×5" ou null. */
  repeat: { every: number; count: number } | null;
}

/** Linhas da Sequência na ordem da lista: o golpe contínuo vira uma linha só. */
export function sequenceRows(project: Pick<RotationProject, 'actions' | 'chains'>): SequenceRow[] {
  const seen = new Set<string>();
  const rows: SequenceRow[] = [];
  for (const a of project.actions) {
    if (a.chainId) {
      if (seen.has(a.chainId)) continue;
      seen.add(a.chainId);
      const members = project.actions.filter((x) => x.chainId === a.chainId).sort((x, y) => x.time - y.time);
      rows.push({ action: members[0], ids: members.map((m) => m.id), index: rows.length + 1, repeat: { every: project.chains[a.chainId]?.every ?? 0, count: members.length } });
    } else {
      rows.push({ action: a, ids: [a.id], index: rows.length + 1, repeat: null });
    }
  }
  return rows;
}

/** Quantos golpes e quantos são contínuos (para o subtítulo): "22 golpes (1 contínuo)". */
export function countActions(project: Pick<RotationProject, 'actions'>): { total: number; continuous: number } {
  const chains = new Set(project.actions.map((a) => a.chainId).filter(Boolean));
  const loose = project.actions.filter((a) => !a.chainId).length;
  return { total: loose + chains.size, continuous: chains.size };
}

/** Janelas distintas por buff: "buffs com janela" do subtítulo. */
export const windowedBuffs = (project: Pick<RotationProject, 'buffWindows'>): number => new Set(project.buffWindows.map((w) => w.tag)).size;

export interface CurvePoint {
  t: number;
  total: number;
  actionId: string;
  member: number;
}

/** Curva em degraus: soma do dano médio golpe a golpe, na ordem do tempo. */
export function damageCurve(results: ActionResult[]): CurvePoint[] {
  const list = results.map((r, i) => ({ r, i })).sort((x, y) => (x.r.action.time ?? 0) - (y.r.action.time ?? 0) || x.i - y.i);
  let total = 0;
  return list.map(({ r }) => {
    total += r.avg;
    return { t: r.action.time ?? 0, total, actionId: r.action.id, member: r.action.member };
  });
}

/** Eixo Y "em mil": degraus redondos (100, 200, 400 mil…) que cobrem o total. */
export function niceAxis(max: number): { top: number; ticks: number[] } {
  const raw = Math.max(max, 1) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const top = step * 4;
  return { top, ticks: [0, 1, 2, 3, 4].map((i) => i * step) };
}

/** "400 mil", "1,2 mi", "0". */
export function axisLabel(v: number): string {
  if (v === 0) return '0';
  if (v >= 1e6) return `${(v / 1e6).toString().replace('.', ',')} mi`;
  return `${Math.round(v / 1000)} mil`;
}

/** Frase do rodapé da divisão do dano: só quando um personagem passa de 60%. */
export function hypercarryNote(members: { name: string; fraction: number }[]): string | null {
  const top = members.reduce<{ name: string; fraction: number } | null>((b, m) => (!b || m.fraction > b.fraction ? m : b), null);
  return top && top.fraction >= 0.6 ? `Hipercarry: ${top.name} causa a maior parte do dano.` : null;
}

export const effectiveEnd = (project: Pick<RotationProject, 'config' | 'actions' | 'compat'>) => effectiveDuration(project);

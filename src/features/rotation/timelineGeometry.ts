/**
 * Geometria da linha do tempo (sem React): conversão tempo ↔ posição, snap e tamanho das estrelas.
 * O SVG usa um viewBox de largura fixa (1000); o navegador escala.
 */
import { effectiveDuration, type RotationProject } from '../../engine';

export const VIEW_W = 1000;
export const X0 = 184; // início do eixo (depois da coluna de nomes e fontes)
export const X1 = 984; // fim do eixo
export const SNAP = 0.1; // segundos
export const SNAP_COARSE = 0.5; // com Shift

export const LANE_H = 44;
export const LANE_GAP = 8;
export const RULER_H = 28;
export const BUFF_ROW_H = 34;
export const BUFF_BAR_H = 26;

/** Fim do eixo em segundos: cobre a duração, as ações e as janelas, arredondado para cima a um passo par. */
export function axisEnd(project: Pick<RotationProject, 'config' | 'actions' | 'buffWindows' | 'compat'>): number {
  const lastAction = project.actions.reduce((m, a) => Math.max(m, a.time), 0);
  const lastWindow = project.buffWindows.reduce((m, w) => Math.max(m, w.end), 0);
  const needed = Math.max(effectiveDuration(project), lastAction + 1, lastWindow);
  return Math.max(4, Math.ceil(needed / 2) * 2);
}

export interface Scale {
  tmax: number;
  x: (t: number) => number;
  /** Posição no viewBox → tempo (sem snap, limitado a ≥ 0). */
  t: (x: number) => number;
}

export function createScale(tmax: number): Scale {
  const span = X1 - X0;
  return {
    tmax,
    x: (t) => X0 + (t / tmax) * span,
    t: (x) => Math.max(0, ((x - X0) / span) * tmax),
  };
}

export const snap = (t: number, step: number = SNAP): number => Math.max(0, Math.round(t / step) * step);

/** Raio da estrela: cresce com a raiz do dano, relativo ao maior golpe da rotação. */
export function starRadius(avg: number, maxAvg: number): number {
  if (!(maxAvg > 0) || !(avg > 0)) return 3.2;
  return 3.2 + Math.sqrt(Math.min(1, avg / maxAvg)) * 15;
}

/** Marcas da régua: a cada 2 s (a cada 1 s se o eixo for curto). */
export function rulerTicks(tmax: number): number[] {
  const step = tmax <= 10 ? 1 : 2;
  const ticks: number[] = [];
  for (let t = 0; t <= tmax + 1e-9; t += step) ticks.push(t);
  return ticks;
}

export const memberLaneY = (index: number) => RULER_H + 8 + index * (LANE_H + LANE_GAP);
export const buffAreaY = (memberCount: number) => memberLaneY(memberCount) + 22;
export const buffRowY = (memberCount: number, row: number) => buffAreaY(memberCount) + row * BUFF_ROW_H;
export const timelineHeight = (memberCount: number, buffRows: number) => buffRowY(memberCount, buffRows) + 14;

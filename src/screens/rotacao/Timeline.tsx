/**
 * Linha do tempo da rotação (SVG): uma faixa por personagem com os golpes como círculos (tamanho proporcional ao dano),
 * faixas de buff com janelas arrastáveis, régua com marcador e tooltip.
 *
 * Interação: arrastar um golpe muda o tempo; arrastar a janela a move; arrastar as pontas a redimensiona; clique na
 * régua marca o instante de inserção; duplo clique numa faixa de buff cria uma janela; setas movem (Shift = 0,5 s),
 * Delete apaga, Enter seleciona. Durante o arrasto só há prévia: o histórico recebe UMA entrada ao soltar.
 */
import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { ActionResult, RotationProject } from '../../engine';
import { MIN_WINDOW } from '../../features/rotation/projectOps';
import type { LaneInfo } from '../../features/rotation/rotationModel';
import { useRotationStore } from '../../features/rotation/store';
import {
  BUFF_BAR_H,
  LANE_H,
  RULER_H,
  SNAP,
  SNAP_COARSE,
  VIEW_W,
  X0,
  X1,
  axisEnd,
  buffAreaY,
  buffRowY,
  createScale,
  memberLaneY,
  rulerTicks,
  snap,
  starRadius,
  timelineHeight,
} from '../../features/rotation/timelineGeometry';
import { formatDecimal, formatInt, formatPercent } from '../../ui/format';

const REACTION_LABEL: Record<string, string> = { none: 'sem reação', melt: 'Derreter', vaporize: 'Vaporizar', spread: 'Intensificar', aggravate: 'Propagar' };
const DRAG_THRESHOLD_PX = 3;
const GOLD = '#e9c46a';

type DragKind = 'action' | 'win-move' | 'win-start' | 'win-end';
interface DragInfo {
  kind: DragKind;
  id: string;
  startClientX: number;
  grab: number;
  moved: boolean;
  origin: { time?: number; start?: number; end?: number };
}
type Preview = { kind: 'action'; id: string; time: number } | { kind: 'window'; id: string; start: number; end: number } | null;

interface Props {
  project: RotationProject;
  results: ActionResult[];
  names: string[];
  colors: string[];
  lanes: LaneInfo[];
  total: number;
}

export function Timeline({ project, results, names, colors, lanes, total }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragInfo | null>(null);
  const [preview, setPreview] = useState<Preview>(null);
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(null);

  const selectedActionId = useRotationStore((s) => s.selectedActionId);
  const selectedWindowId = useRotationStore((s) => s.selectedWindowId);
  const playhead = useRotationStore((s) => s.playhead);
  const st = useRotationStore.getState;

  const tmax = axisEnd(project);
  const scale = useMemo(() => createScale(tmax), [tmax]);
  const byId = useMemo(() => new Map(results.map((r) => [r.action.id, r])), [results]);
  const maxAvg = useMemo(() => results.reduce((m, r) => Math.max(m, r.avg), 0), [results]);
  const laneLabel = useMemo(() => new Map(lanes.map((l) => [l.tag, l.label])), [lanes]);
  const height = timelineHeight(names.length, lanes.length);
  const selectedResult = selectedActionId ? byId.get(selectedActionId) : undefined;
  const litTags = new Set(selectedResult?.action.activeTags ?? []);

  const timeFromEvent = (e: { clientX: number; clientY: number }): number => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return 0;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return scale.t(pt.matrixTransform(ctm.inverse()).x);
  };

  const timeOf = (id: string, fallback: number) => (preview?.kind === 'action' && preview.id === id ? preview.time : fallback);
  const windowOf = (id: string, start: number, end: number) => (preview?.kind === 'window' && preview.id === id ? { start: preview.start, end: preview.end } : { start, end });

  const begin = (e: ReactPointerEvent<SVGElement>, info: Omit<DragInfo, 'startClientX' | 'moved' | 'grab'>, itemStart: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { ...info, startClientX: e.clientX, moved: false, grab: timeFromEvent(e) - itemStart };
    setTip(null);
  };

  const drag = (e: ReactPointerEvent<SVGElement>) => {
    const d = dragRef.current;
    if (!d) return;
    if (!d.moved && Math.abs(e.clientX - d.startClientX) < DRAG_THRESHOLD_PX) return;
    d.moved = true;
    const step = e.shiftKey ? SNAP_COARSE : SNAP;
    const t = timeFromEvent(e);
    if (d.kind === 'action') {
      setPreview({ kind: 'action', id: d.id, time: snap(t - d.grab, step) });
    } else {
      const { start = 0, end = 0 } = d.origin;
      if (d.kind === 'win-move') {
        const s = snap(t - d.grab, step);
        setPreview({ kind: 'window', id: d.id, start: s, end: s + (end - start) });
      } else if (d.kind === 'win-start') {
        setPreview({ kind: 'window', id: d.id, start: Math.min(snap(t, step), end - MIN_WINDOW), end });
      } else {
        setPreview({ kind: 'window', id: d.id, start, end: Math.max(snap(t, step), start + MIN_WINDOW) });
      }
    }
  };

  const finish = (e: ReactPointerEvent<SVGElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    const p = preview;
    setPreview(null);
    if (!d) return;
    if (!d.moved) {
      if (d.kind === 'action') st().select(st().selectedActionId === d.id ? null : d.id);
      else st().selectWindow(st().selectedWindowId === d.id ? null : d.id);
      return;
    }
    if (p?.kind === 'action') {
      st().moveAction(p.id, p.time);
      st().select(p.id);
    } else if (p?.kind === 'window') {
      st().updateWindow(p.id, { start: p.start, end: p.end });
      st().selectWindow(p.id);
    }
  };

  const onItemKey = (e: KeyboardEvent<SVGElement>, kind: 'action' | 'window', id: string, start: number) => {
    const step = e.shiftKey ? SNAP_COARSE : SNAP;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = start + (e.key === 'ArrowRight' ? step : -step);
      if (kind === 'action') st().moveAction(id, next);
      else st().shiftWindow(id, next);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (kind === 'action') st().removeAction(id);
      else st().removeWindow(id);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (kind === 'action') st().select(id);
      else st().selectWindow(id);
    } else if (e.key === 'Escape') {
      st().select(null);
      st().selectWindow(null);
    }
  };

  const showTip = (e: ReactPointerEvent<SVGElement>, id: string) => {
    if (dragRef.current) return;
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return;
    setTip({ id, x: e.clientX - box.left + 14, y: e.clientY - box.top + 14 });
  };

  const hovered = tip ? byId.get(tip.id) : undefined;
  const marker = selectedResult ? timeOf(selectedResult.action.id, selectedResult.action.time ?? 0) : Math.min(playhead, tmax);

  return (
    <div className="rt-tl" ref={wrapRef}>
      <div className="dz-scroll">
        <svg ref={svgRef} className="rt-svg" viewBox={`0 0 ${VIEW_W} ${height}`} role="group" aria-label="Linha do tempo da rotação" onPointerLeave={() => setTip(null)}>
          {/* Régua */}
          <rect x={X0} y={0} width={X1 - X0} height={RULER_H} fill="transparent" style={{ cursor: 'crosshair' }} onPointerDown={(e) => st().setPlayhead(snap(timeFromEvent(e)))} />
          {rulerTicks(tmax).map((t) => (
            <g key={t}>
              <line x1={scale.x(t)} x2={scale.x(t)} y1={RULER_H - 4} y2={height - 8} className="tick-line" />
              <text x={scale.x(t)} y={16} className="tick-text" textAnchor="middle">{t} s</text>
            </g>
          ))}

          {/* Golpes */}
          <text x={10} y={memberLaneY(0) - 3} className="sec-text">GOLPES</text>
          {names.map((name, i) => {
            const y = memberLaneY(i);
            return (
              <g key={name}>
                <rect x={X0} y={y} width={X1 - X0} height={LANE_H} className="lane-bg" />
                <rect x={8} y={y} width={X0 - 16} height={LANE_H} className="label-bg" />
                <circle cx={22} cy={y + LANE_H / 2} r={5} fill={colors[i]} />
                <text x={34} y={y + LANE_H / 2 + 6} className="lane-name">{name}</text>
              </g>
            );
          })}

          {/* Buffs */}
          <text x={10} y={buffAreaY(names.length) - 10} className="sec-text">BUFFS NO TEMPO</text>
          {lanes.map((lane, row) => {
            const y = buffRowY(names.length, row);
            const color = lane.giver !== null ? colors[lane.giver] : GOLD;
            return (
              <g key={lane.tag}>
                <title>{lane.detail}</title>
                <rect x={X0} y={y} width={X1 - X0} height={BUFF_BAR_H + 6} className="lane-bg" onDoubleClick={(e) => st().addWindow(lane.tag, snap(timeFromEvent(e)))} />
                <rect x={8} y={y} width={X0 - 16} height={BUFF_BAR_H + 6} className="label-bg" />
                <text x={16} y={y + 14} className="buff-src">{lane.source}</text>
                <text x={16} y={y + 28} className="buff-tgt">→ {lane.target}</text>
                {project.buffWindows
                  .filter((w) => w.tag === lane.tag)
                  .map((w) => {
                    const cur = windowOf(w.id, w.start, w.end);
                    const x = scale.x(cur.start);
                    const width = scale.x(cur.end) - x;
                    const selected = selectedWindowId === w.id;
                    const selTime = selectedResult?.action.time ?? 0;
                    const dim = selectedResult && !(litTags.has(lane.tag) && cur.start <= selTime && selTime < cur.end);
                    return (
                      <g key={w.id} tabIndex={0} role="button" aria-label={`Janela de ${lane.label}, de ${formatDecimal(cur.start)} a ${formatDecimal(cur.end)} segundos`} className="rt-win" opacity={dim ? 0.35 : 1} onKeyDown={(e) => onItemKey(e, 'window', w.id, w.start)}>
                        <rect
                          x={x}
                          y={y + 3}
                          width={Math.max(width, 2)}
                          height={BUFF_BAR_H}
                          rx={6}
                          fill={color}
                          stroke={selected ? '#fff' : 'none'}
                          strokeWidth={selected ? 2 : 0}
                          style={{ cursor: 'grab' }}
                          onPointerDown={(e) => begin(e, { kind: 'win-move', id: w.id, origin: { start: w.start, end: w.end } }, w.start)}
                          onPointerMove={drag}
                          onPointerUp={finish}
                          onPointerCancel={finish}
                        />
                        {width > 90 && <text x={x + 8} y={y + 20} className="bar-text" pointerEvents="none">{lane.value}</text>}
                        {width > 170 && <text x={x + width - 8} y={y + 20} className="bar-win" textAnchor="end" pointerEvents="none">{formatDecimal(cur.start)}–{formatDecimal(cur.end)} s</text>}
                        {(['win-start', 'win-end'] as const).map((kind) => (
                          <rect
                            key={kind}
                            x={kind === 'win-start' ? x - 3 : x + width - 3}
                            y={y + 3}
                            width={7}
                            height={BUFF_BAR_H}
                            fill="#fff"
                            fillOpacity={selected ? 0.5 : 0.001}
                            style={{ cursor: 'ew-resize' }}
                            onPointerDown={(e) => begin(e, { kind, id: w.id, origin: { start: w.start, end: w.end } }, kind === 'win-start' ? w.start : w.end)}
                            onPointerMove={drag}
                            onPointerUp={finish}
                            onPointerCancel={finish}
                          />
                        ))}
                      </g>
                    );
                  })}
              </g>
            );
          })}

          {/* Golpes (círculos) */}
          {project.actions.map((a) => {
            const res = byId.get(a.id);
            const r = starRadius(res?.avg ?? 0, maxAvg) + 3;
            const t = timeOf(a.id, a.time);
            const cx = scale.x(t);
            const cy = memberLaneY(a.member) + LANE_H / 2;
            const selected = selectedActionId === a.id;
            const name = a.displayName ?? `${a.move.character} - ${a.move.label}`;
            const letter = res?.action.move.hitType === 'burst' ? 'Q' : res?.action.move.hitType === 'skill' ? 'E' : '';
            return (
              <g
                key={a.id}
                tabIndex={0}
                role="button"
                aria-pressed={selected}
                aria-label={`${name}, aos ${formatDecimal(t)} segundos${res ? `, ${formatInt(res.avg)} de dano` : ''}`}
                className="rt-hit"
                style={{ cursor: 'grab' }}
                onPointerDown={(e) => begin(e, { kind: 'action', id: a.id, origin: { time: a.time } }, a.time)}
                onPointerMove={(e) => {
                  drag(e);
                  showTip(e, a.id);
                }}
                onPointerUp={finish}
                onPointerCancel={finish}
                onPointerLeave={() => setTip((cur) => (cur?.id === a.id ? null : cur))}
                onKeyDown={(e) => onItemKey(e, 'action', a.id, a.time)}
              >
                <circle cx={cx} cy={cy} r={Math.max(r + 6, 13)} fill="transparent" />
                <circle cx={cx} cy={cy} r={r} fill={colors[a.member] ?? GOLD} stroke={selected ? GOLD : '#0a0e1c'} strokeWidth={selected ? 3 : 2} pointerEvents="none" />
                {selected && <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="#0a0e1c" strokeWidth="2" pointerEvents="none" opacity=".0" />}
                {r >= 14 && letter && <text x={cx} y={cy + 5} textAnchor="middle" className="hit-letter" pointerEvents="none">{letter}</text>}
              </g>
            );
          })}

          {/* Marcador */}
          <g pointerEvents="none">
            <line x1={scale.x(marker)} x2={scale.x(marker)} y1={RULER_H - 4} y2={height - 8} stroke={GOLD} strokeWidth="1.6" />
            <rect x={scale.x(marker) - 22} y={0} width={44} height={16} rx={4} fill={GOLD} />
            <text x={scale.x(marker)} y={12} textAnchor="middle" className="marker-text">{formatDecimal(marker)} s</text>
          </g>
        </svg>
      </div>

      {tip && hovered && (
        <div className="rt-tip" style={{ left: tip.x, top: tip.y }} role="tooltip">
          <strong>{hovered.action.move.displayName.replace(`${hovered.action.move.character} - `, '')}</strong>
          <span>{hovered.action.move.character} · {formatDecimal(hovered.action.time ?? 0)} s · {REACTION_LABEL[hovered.action.reaction]}</span>
          <span className="n">{formatInt(hovered.avg)} de dano médio ({formatPercent(total > 0 ? hovered.avg / total : 0)} do time)</span>
          <span className="b">{hovered.action.activeTags.length ? `Buffs ativos: ${hovered.action.activeTags.map((t) => laneLabel.get(t) ?? t).join(', ')}` : 'Nenhum buff de time ativo'}</span>
        </div>
      )}
      <p className="note rt-help">
        Arraste um golpe para mudar o tempo e as pontas de uma barra de buff para redimensioná-la. Clique na régua para marcar o instante de inserção, ou duas vezes numa faixa de buff para criar uma janela. Setas movem o item selecionado (Shift: 0,5 s) e Delete apaga.
      </p>
    </div>
  );
}

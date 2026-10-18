/**
 * Linha do tempo da rotação (SVG): uma faixa por personagem com os golpes como estrelas (maiores = mais dano),
 * faixas de buff embaixo com janelas arrastáveis, régua com marcador e tooltip.
 *
 * Interação: arrastar estrela = muda o tempo; arrastar janela = move; arrastar as pontas = redimensiona;
 * clique na régua = marcador; duplo clique numa faixa de buff = nova janela; teclado: setas movem (Shift = 0,5 s),
 * Delete apaga, Enter seleciona. Durante o arrasto só se mostra uma prévia; o histórico recebe UMA entrada ao soltar.
 */
import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { ActionResult, RotationProject } from '../../engine';
import { formatDecimal, formatInt, formatPercent } from '../../ui/format';
import type { BuffLane } from './buffLanes';
import { useRotationStore } from './store';
import type { MemberRow } from './summary';
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
} from './timelineGeometry';
import { MIN_WINDOW } from './projectOps';

const REACTION_LABEL: Record<string, string> = { none: 'sem reação', melt: 'Derreter', vaporize: 'Vaporizar', spread: 'Espalhar', aggravate: 'Intensificar' };
const DRAG_THRESHOLD_PX = 3;

type DragKind = 'action' | 'win-move' | 'win-start' | 'win-end';
interface DragInfo {
  kind: DragKind;
  id: string;
  startClientX: number;
  grab: number; // diferença entre o instante do ponteiro e o início do item
  moved: boolean;
  origin: { time?: number; start?: number; end?: number };
}
type Preview = { kind: 'action'; id: string; time: number } | { kind: 'window'; id: string; start: number; end: number } | null;

interface Props {
  project: RotationProject;
  results: ActionResult[];
  members: MemberRow[];
  lanes: BuffLane[];
  total: number;
}

export function Timeline({ project, results, members, lanes, total }: Props) {
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
  const height = timelineHeight(members.length, lanes.length);

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
  const windowOf = (id: string, start: number, end: number) =>
    preview?.kind === 'window' && preview.id === id ? { start: preview.start, end: preview.end } : { start, end };

  // ---------- Arrastar ----------
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
      // Clique simples: seleciona (clicar de novo na estrela já selecionada tira a seleção).
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

  // ---------- Teclado ----------
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
  const litTags = new Set(hovered?.action.activeTags ?? []);

  // Linhas de ligação (constelação) por membro, em ordem de tempo.
  const constellations = members.map((_, i) =>
    project.actions
      .filter((a) => a.member === i)
      .map((a) => ({ id: a.id, t: timeOf(a.id, a.time) }))
      .sort((a, b) => a.t - b.t),
  );

  const ph = Math.min(playhead, tmax);

  return (
    <div className="ast-tl" ref={wrapRef}>
      <div className="ast-scroll">
        <svg
          ref={svgRef}
          className="ast-svg"
          viewBox={`0 0 ${VIEW_W} ${height}`}
          role="group"
          aria-label="Linha do tempo da rotação"
          onPointerLeave={() => setTip(null)}
        >
          <defs>
            {members.map((m, i) => (
              <radialGradient id={`glow-${i}`} key={m.name}>
                <stop offset="0" stopColor={m.color} stopOpacity=".85" />
                <stop offset=".4" stopColor={m.color} stopOpacity=".22" />
                <stop offset="1" stopColor={m.color} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>

          {/* Céu */}
          {Array.from({ length: 110 }, (_, i) => (
            <circle key={i} cx={(i * 137.5) % VIEW_W} cy={(i * 71.3) % height} r={0.5 + (i % 3) * 0.35} fill="#cfcbe8" opacity={0.14 + (i % 5) * 0.06} />
          ))}

          {/* Régua */}
          <rect x={X0} y={0} width={X1 - X0} height={RULER_H} fill="transparent" style={{ cursor: 'crosshair' }} onPointerDown={(e) => st().setPlayhead(snap(timeFromEvent(e)))} />
          {rulerTicks(tmax).map((t) => (
            <g key={t}>
              <line x1={scale.x(t)} x2={scale.x(t)} y1={RULER_H - 4} y2={height - 8} stroke="#2a2e55" opacity=".7" />
              <text x={scale.x(t)} y={16} fill="#9a98b8" fontSize="12.5" textAnchor="middle">{t} S</text>
            </g>
          ))}

          {/* Faixas dos personagens */}
          {members.map((m, i) => {
            const y = memberLaneY(i);
            return (
              <g key={m.name}>
                <rect x={X0} y={y} width={X1 - X0} height={LANE_H} fill="#141833" fillOpacity=".55" stroke="#2a2e55" />
                <line x1={X0} x2={X1} y1={y + LANE_H / 2} y2={y + LANE_H / 2} stroke="#d8b668" strokeOpacity=".22" strokeDasharray="2 5" />
                <rect x={8} y={y} width={108} height={LANE_H} fill="#0e1126" stroke="#2a2e55" />
                <rect x={8} y={y} width={4} height={LANE_H} fill={m.color} />
                <text x={22} y={y + 28} fontSize="17" fontWeight="700" fill="#e9e6f5" letterSpacing="1.2">{m.name.toUpperCase()}</text>
                {constellations[i].slice(1).map((p, k) => (
                  <line key={p.id} x1={scale.x(constellations[i][k].t)} y1={y + LANE_H / 2} x2={scale.x(p.t)} y2={y + LANE_H / 2} stroke="#d8b668" strokeOpacity=".4" />
                ))}
              </g>
            );
          })}

          {/* Faixas de buff */}
          <text x={10} y={buffAreaY(members.length) - 10} fill="#d8b668" fontSize="13" fontWeight="600" letterSpacing="1.2">BUFFS NO TEMPO</text>
          {lanes.map((lane, row) => {
            const y = buffRowY(members.length, row);
            return (
              <g key={lane.tag}>
                <title>{lane.detail}</title>
                <rect
                  x={X0}
                  y={y}
                  width={X1 - X0}
                  height={BUFF_BAR_H + 4}
                  fill="#141833"
                  fillOpacity=".55"
                  stroke="#2a2e55"
                  onDoubleClick={(e) => st().addWindow(lane.tag, snap(timeFromEvent(e)))}
                />
                <rect x={8} y={y} width={108} height={BUFF_BAR_H + 4} fill="#0e1126" stroke="#2a2e55" />
                <text x={16} y={y + 16.5} fontSize={lane.label.length > 11 ? 10.5 : 13} fontWeight="600" fill="#efe3c2" letterSpacing=".6">{lane.label.toUpperCase()}</text>
                {project.buffWindows
                  .filter((w) => w.tag === lane.tag)
                  .map((w) => {
                    const cur = windowOf(w.id, w.start, w.end);
                    const x = scale.x(cur.start);
                    const width = scale.x(cur.end) - x;
                    const selected = selectedWindowId === w.id;
                    const lit = litTags.has(lane.tag);
                    return (
                      <g key={w.id} tabIndex={0} role="button" aria-label={`Janela de ${lane.label}, de ${formatDecimal(cur.start)} a ${formatDecimal(cur.end)} segundos`} className="ast-win" onKeyDown={(e) => onItemKey(e, 'window', w.id, w.start)}>
                        <rect
                          x={x}
                          y={y + 2}
                          width={Math.max(width, 2)}
                          height={BUFF_BAR_H}
                          fill="#d8b668"
                          fillOpacity={lit || selected ? 0.4 : 0.2}
                          stroke={selected ? '#fff' : '#d8b668'}
                          strokeOpacity={lit || selected ? 1 : 0.8}
                          strokeWidth={selected ? 1.6 : 1}
                          style={{ cursor: 'grab' }}
                          onPointerDown={(e) => begin(e, { kind: 'win-move', id: w.id, origin: { start: w.start, end: w.end } }, w.start)}
                          onPointerMove={drag}
                          onPointerUp={finish}
                          onPointerCancel={finish}
                        />
                        {width > 70 && (
                          <text x={x + 8} y={y + 16.5} fontSize="12.5" fill="#efe3c2" fontFamily="Barlow, sans-serif" pointerEvents="none">
                            {formatDecimal(cur.start)}–{formatDecimal(cur.end)} s
                          </text>
                        )}
                        {(['win-start', 'win-end'] as const).map((kind) => (
                          <rect
                            key={kind}
                            x={kind === 'win-start' ? x - 3 : x + width - 3}
                            y={y + 2}
                            width={7}
                            height={BUFF_BAR_H}
                            fill="#d8b668"
                            fillOpacity={selected ? 0.9 : 0.01}
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

          {/* Estrelas */}
          {project.actions.map((a) => {
            const res = byId.get(a.id);
            const r = starRadius(res?.avg ?? 0, maxAvg);
            const t = timeOf(a.id, a.time);
            const cx = scale.x(t);
            const cy = memberLaneY(a.member) + LANE_H / 2;
            const color = members[a.member]?.color ?? '#d8b668';
            const selected = selectedActionId === a.id;
            const name = a.displayName ?? `${a.move.character}: ${a.move.label}`;
            return (
              <g
                key={a.id}
                tabIndex={0}
                role="button"
                aria-pressed={selected}
                aria-label={`${name}, aos ${formatDecimal(t)} segundos${res ? `, ${formatInt(res.avg)} de dano` : ''}`}
                className="ast-star"
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
                <circle cx={cx} cy={cy} r={Math.max(r + 7, 13)} fill="transparent" />
                <circle cx={cx} cy={cy} r={r * 2.6} fill={`url(#glow-${a.member})`} opacity=".6" pointerEvents="none" />
                <circle cx={cx} cy={cy} r={r} fill={color} className={res && res.avg === maxAvg ? 'ast-pulse' : undefined} pointerEvents="none" />
                {res?.breakdown.reactionApplied && <circle cx={cx} cy={cy} r={r + 3.6} fill="none" stroke="#d8b668" strokeWidth="1.2" pointerEvents="none" />}
                {selected && <circle cx={cx} cy={cy} r={r + 7} fill="none" stroke="#fff" strokeWidth="1.4" strokeDasharray="3 3" pointerEvents="none" />}
              </g>
            );
          })}

          {/* Marcador */}
          <g pointerEvents="none">
            <line x1={scale.x(ph)} x2={scale.x(ph)} y1={RULER_H - 4} y2={height - 8} stroke="#d8b668" strokeWidth="1.6" />
            <path d={`M${scale.x(ph) - 6} ${RULER_H - 4} h12 l-6 9z`} fill="#d8b668" />
          </g>
        </svg>
      </div>

      {tip && hovered && (
        <div className="ast-tip" style={{ left: tip.x, top: tip.y }} role="tooltip">
          <strong>{hovered.action.move.displayName.replace(`${hovered.action.move.character} - `, '')}</strong>
          <span>
            {hovered.action.move.character} · {formatDecimal(hovered.action.time ?? 0)} s · {REACTION_LABEL[hovered.action.reaction]}
          </span>
          <span className="n">
            {formatInt(hovered.avg)} de dano médio ({formatPercent(total > 0 ? hovered.avg / total : 0)} do total)
          </span>
          <span className="b">
            {hovered.action.activeTags.length
              ? `Buffs ativos: ${hovered.action.activeTags.map((t) => laneLabel.get(t) ?? t).join(', ')}`
              : 'Nenhum buff de time ativo'}
          </span>
        </div>
      )}
      <p className="ast-hint ast-tl-help">
        Arraste uma estrela para mudar o tempo e as pontas de uma janela para redimensioná-la. Clique na régua para marcar o instante de inserção, ou duas vezes numa faixa de buff para criar uma janela. Setas movem o item selecionado (Shift: 0,5 s) e Delete apaga.
      </p>
    </div>
  );
}

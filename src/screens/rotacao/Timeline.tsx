/**
 * Linha do tempo (mockup RotacaoEstelar): régua com marcador, "Em campo", uma faixa por personagem (golpe único = círculo,
 * contínuo = linha com losangos), buffs agrupados por quem dá e janelas arrastáveis. Todas as faixas usam a mesma grade
 * (rótulo de 200 px + trilha). Arrastar muda o tempo (uma entrada de histórico ao soltar); setas movem (Shift = 0,5 s) e
 * Delete apaga o item selecionado.
 */
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { Panel } from '../../design/primitives';
import { effectiveDuration, type ActionResult } from '../../engine';
import { specialOfMove } from '../../engine/project';
import { MIN_WINDOW, minPush } from '../../features/rotation/projectOps';
import type { LaneInfo } from '../../features/rotation/rotationModel';
import { fieldSegments, groupBuffLanes, hitTag } from '../../features/rotation/screenModel';
import { useRotationStore } from '../../features/rotation/store';
import { SNAP, SNAP_COARSE, snap } from '../../features/rotation/timelineGeometry';
import { formatDecimal, formatInt, formatPercent } from '../../ui/format';
import { Seg, dec } from './ui';

type Zoom = 'fit' | '1' | '2';
const PX_PER_S = 36;
const DRAG_PX = 3;
const GOLD = 'var(--gold)';

type Drag =
  | { kind: 'action'; id: string; grab: number; x0: number; moved: boolean }
  | { kind: 'win'; id: string; mode: 'move' | 'start' | 'end'; grab: number; start: number; end: number; x0: number; moved: boolean };
type DragInit = Drag extends infer D ? (D extends Drag ? Omit<D, 'x0' | 'moved'> : never) : never;
type Preview = { id: string; time?: number; start?: number; end?: number } | null;

const sizeOf = (avg: number, max: number) => 18 + Math.sqrt(max > 0 ? Math.min(1, avg / max) : 0) * 16;

export function Timeline({ v, lanes }: { v: ProjectView; lanes: LaneInfo[] }) {
  const project = v.project;
  const results = v.bundle.optimization.result.actions;
  const names = project.members.map((m) => m.character);
  const [zoom, setZoom] = useState<Zoom>('1');
  const [buffMode, setBuffMode] = useState<'group' | 'active'>('group');
  const [preview, setPreview] = useState<Preview>(null);
  /** Empurrar a linha: tudo à direita de `t0` anda `delta` s enquanto se arrasta (grava ao soltar). */
  const [push, setPush] = useState<{ t0: number; delta: number } | null>(null);
  const pushRef = useRef<{ t0: number } | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lowRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ left: 0, max: 0 });
  const measure = (el: HTMLDivElement) => setScroll({ left: Math.round(el.scrollLeft), max: Math.max(0, el.scrollWidth - el.clientWidth) });
  const syncFromTop = (e: React.UIEvent<HTMLDivElement>) => {
    if (lowRef.current) lowRef.current.scrollLeft = e.currentTarget.scrollLeft;
    measure(e.currentTarget);
  };
  const scrollTo = (x: number) => { if (wrapRef.current) wrapRef.current.scrollLeft = x; };
  const wheelLow = (e: React.WheelEvent<HTMLDivElement>) => {
    const amount = e.deltaX || (e.shiftKey ? e.deltaY : 0);
    if (amount && wrapRef.current) wrapRef.current.scrollLeft += amount;
  };
  const [wrapW, setWrapW] = useState(800);

  const selectedActionId = useRotationStore((s) => s.selectedActionId);
  const selectedWindowId = useRotationStore((s) => s.selectedWindowId);
  const playhead = useRotationStore((s) => s.playhead);
  const mode = useRotationStore((s) => s.insertMode);
  const gap = useRotationStore((s) => s.gap);
  const st = useRotationStore.getState;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { setWrapW(el.clientWidth); measure(el); });
    ro.observe(el);
    setWrapW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const duration = effectiveDuration(project);
  const lastTime = project.actions.reduce((m, a) => Math.max(m, a.time), 0);
  const tmax = Math.max(4, Math.ceil(Math.max(duration, lastTime)));
  const labelW = 200;
  const fitW = Math.max(300, wrapW - labelW);
  const trackW = zoom === 'fit' ? fitW : Math.max(fitW, tmax * PX_PER_S * (zoom === '2' ? 2 : 1));
  useEffect(() => { if (wrapRef.current) measure(wrapRef.current); }, [trackW, wrapW]); // eslint-disable-line react-hooks/exhaustive-deps
  const x = (t: number) => (t / tmax) * 100;
  const byId = useMemo(() => new Map(results.map((r) => [r.action.id, r])), [results]);
  const maxAvg = useMemo(() => results.reduce((m, r) => Math.max(m, r.avg), 0), [results]);
  const total = v.bundle.optimization.result.totals.avg || 1;
  const effects = v.resolved.team.members.map((m) => m.characterEffect);
  const windowedTags = useMemo(() => new Set(project.buffWindows.map((w) => w.tag)), [project.buffWindows]);
  const groups = useMemo(() => groupBuffLanes(lanes, names, windowedTags, buffMode === 'active'), [lanes, names, windowedTags, buffMode]);
  const field = useMemo(() => fieldSegments(project, duration), [project, duration]);
  const nextAt = mode === 'order' ? (project.actions.length ? lastTime + Math.max(0.05, gap) : 0) : playhead;
  const marker = Math.min(nextAt, tmax);
  const shares = v.summary.members.map((m) => m.fraction);

  const timeAt = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return 0;
    return Math.max(0, ((clientX - r.left) / r.width) * tmax);
  };
  const pushed = (t: number) => (push && t >= push.t0 - 1e-9 ? t + push.delta : t);
  const timeOf = (id: string, fallback: number) => (preview?.id === id && preview.time !== undefined ? preview.time : pushed(fallback));
  const caret = Math.min(tmax, Math.max(0, playhead + (push?.delta ?? 0)));
  const caretPx = labelW + (caret / tmax) * trackW;
  const atHit = useMemo(() => {
    let best: (typeof project.actions)[number] | null = null;
    for (const a of project.actions) if (a.time <= playhead + 0.05 && (!best || a.time >= best.time)) best = a;
    return best;
  }, [project.actions, playhead]);
  const onCaretDown = (e: ReactPointerEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pushRef.current = { t0: playhead };
    setPush({ t0: playhead, delta: 0 });
  };
  const onCaretMove = (e: ReactPointerEvent<HTMLElement>) => {
    const p = pushRef.current;
    if (!p) return;
    setPush({ t0: p.t0, delta: Math.max(minPush(project, p.t0), snap(timeAt(e.clientX)) - p.t0) });
  };
  const onCaretUp = (e: ReactPointerEvent<HTMLElement>) => {
    const p = pushRef.current;
    pushRef.current = null;
    const el = e.currentTarget as HTMLElement;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    const cur = push;
    setPush(null);
    if (p && cur && cur.delta) st().pushFrom(p.t0, cur.delta);
  };

  const begin = (e: ReactPointerEvent<HTMLElement>, d: DragInit) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { ...d, x0: e.clientX, moved: false } as Drag;
  };
  const drag = (e: ReactPointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (!d) return;
    if (!d.moved && Math.abs(e.clientX - d.x0) < DRAG_PX) return;
    d.moved = true;
    const step = e.shiftKey ? SNAP_COARSE : SNAP;
    const t = timeAt(e.clientX);
    if (d.kind === 'action') return setPreview({ id: d.id, time: snap(t - d.grab, step) });
    if (d.mode === 'move') {
      const s = snap(t - d.grab, step);
      return setPreview({ id: d.id, start: s, end: s + (d.end - d.start) });
    }
    if (d.mode === 'start') return setPreview({ id: d.id, start: Math.min(snap(t, step), d.end - MIN_WINDOW), end: d.end });
    return setPreview({ id: d.id, start: d.start, end: Math.max(snap(t, step), d.start + MIN_WINDOW) });
  };
  const finish = (e: ReactPointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    const el = e.currentTarget as HTMLElement;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    const p = preview;
    setPreview(null);
    if (!d) return;
    if (!d.moved) {
      if (d.kind === 'action') st().select(st().selectedActionId === d.id ? null : d.id);
      else st().selectWindow(st().selectedWindowId === d.id ? null : d.id);
      return;
    }
    if (d.kind === 'action' && p?.time !== undefined) {
      st().moveAction(d.id, p.time);
      st().select(d.id);
    } else if (d.kind === 'win' && p?.start !== undefined) {
      st().updateWindow(d.id, { start: p.start, end: p.end });
      st().selectWindow(d.id);
    }
  };
  const onKey = (e: React.KeyboardEvent, kind: 'action' | 'win', id: string, start: number) => {
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
    } else if (e.key === 'Escape') {
      st().select(null);
      st().selectWindow(null);
    }
  };

  const ticks = Array.from({ length: tmax + 1 }, (_, i) => i);
  const title = (r: ActionResult | undefined, a: { time: number; displayName?: string; move: { label: string } }) =>
    `${a.displayName ?? a.move.label} · ${formatDecimal(a.time, 1)} s${r ? ` · ${formatInt(r.avg)} (${formatPercent(r.avg / total)} do time)` : ''}${flatTitle(r)}`;
  /** Dano fixo que o golpe consome (para ver na linha do tempo quem usa qual buff flat). */
  const flatTitle = (r: ActionResult | undefined) => {
    const used = (r?.flatUse ?? []).filter((u) => u.hits > 0);
    return used.length ? ` · dano fixo: ${used.map((u) => `${u.name} ×${u.hits}`).join(', ')}` : '';
  };

  return (
    <Panel bar title="Linha do tempo" aside={<Seg label="Zoom" value={zoom} onChange={setZoom} options={[{ value: 'fit', label: 'Ajustar' }, { value: '1', label: '1×' }, { value: '2', label: '2×' }]} />} className="rt-p0">
      <div className="rt-zoomscroll" ref={wrapRef} onScroll={syncFromTop}>
        <div className="rt-tlw" style={{ width: labelW + trackW }}>
          <div className="rt-caret" style={{ left: caretPx }} data-testid="caret" data-pushing={push ? true : undefined}>
            <span className="grab" role="slider" aria-label="Linha do tempo: arraste para empurrar tudo que está à direita" aria-valuenow={Math.round(caret * 100) / 100} onPointerDown={onCaretDown} onPointerMove={onCaretMove} onPointerUp={onCaretUp} onPointerCancel={onCaretUp} />
            <span className="flag num">{dec(caret, 1)} s{atHit ? ` · ${names[atHit.member]}: ${(atHit.displayName ?? atHit.move.label).replace(`${atHit.move.character} - `, '')}` : ''}{push && push.delta ? ` (${push.delta > 0 ? '+' : ''}${dec(push.delta, 1)} s)` : ''}</span>
          </div>
          {/* Tempo */}
          <div className="rt-lane ruler" style={{ gridTemplateColumns: `${labelW}px ${trackW}px` }}>
            <span className="lname"><span className="rt-lbl">Tempo</span></span>
            <div className="trk" ref={trackRef} onPointerDown={(e) => st().setPlayhead(snap(timeAt(e.clientX)))}>
              {ticks.map((t) => (
                <span key={t} className="tk num" style={{ left: `${x(t)}%`, transform: `translateX(${t === 0 ? '4px' : t === tmax ? '-110%' : '-50%'})` }}>{t} s</span>
              ))}
              <span className="mk num" style={{ left: `${x(marker)}%` }} data-testid="marker">{dec(marker, 1)}</span>
            </div>
          </div>

          {/* Em campo */}
          <div className="rt-lane field" style={{ gridTemplateColumns: `${labelW}px ${trackW}px` }}>
            <span className="lname"><span className="rt-lbl">Em campo</span></span>
            <div className="trk">
              {field.map((f, i) => (
                <span key={i} className="seg" title={names[f.member]} aria-label={`${names[f.member]} em campo`} style={{ left: `${x(pushed(f.start))}%`, width: `calc(${((pushed(f.end) - pushed(f.start)) / tmax) * 100}% - 2px)`, background: v.colors[f.member] }} />
              ))}
            </div>
          </div>

          {/* Uma faixa por personagem */}
          {names.map((name, mi) => {
            const mine = project.actions.filter((a) => a.member === mi);
            const chains = [...new Set(mine.map((a) => a.chainId).filter((c): c is string => !!c))];
            const color = v.colors[mi];
            return (
              <div className="rt-lane" key={name} style={{ gridTemplateColumns: `${labelW}px ${trackW}px`, minHeight: 56 }}>
                <span className="lname">
                  <span className="dot" style={{ background: color }} />
                  <span className="nm" title={name}>{name}</span>
                  <span className="pct">{formatPercent(shares[mi] ?? 0)}</span>
                </span>
                <div className="trk" onPointerDown={(e) => e.target === e.currentTarget && st().setPlayhead(snap(timeAt(e.clientX)))}>
                  {chains.map((cid) => {
                    const list = mine.filter((a) => a.chainId === cid).sort((a, b) => a.time - b.time);
                    const sel = list.some((a) => a.id === selectedActionId);
                    const first = timeOf(list[0].id, list[0].time);
                    const last = timeOf(list[list.length - 1].id, list[list.length - 1].time);
                    const label = `${(list[0].displayName ?? list[0].move.label).replace(`${list[0].move.character} - `, '')} ×${list.length}`;
                    return (
                      <div key={cid}>
                        <div className="rt-chainline" style={{ top: 'calc(50% + 14px)', left: `${x(first)}%`, width: `${x(Math.max(0, last - first))}%`, background: sel ? GOLD : color }} />
                        <span className="rt-chaintag" style={{ top: 'calc(50% + 6px)', left: `calc(${x(first)}% + 10px)`, color: sel ? '#f8de9e' : undefined }}>{label}</span>
                        {list.map((a) => {
                          const full = a.reaction !== 'none';
                          const size = full ? 12 : 10;
                          return (
                            <button
                              key={a.id}
                              type="button"
                              className={`rt-diamond ${full ? 'full' : 'empty'}`}
                              aria-pressed={selectedActionId === a.id}
                              aria-label={`${label}, execução em ${dec(a.time, 1)} s, ${full ? 'com' : 'sem'} reação`}
                              title={title(byId.get(a.id), a)}
                              style={{ top: 'calc(50% + 15px)', left: `${x(timeOf(a.id, a.time))}%`, width: size, height: size, background: full ? color : undefined, borderColor: full ? undefined : color }}
                              onPointerDown={(e) => begin(e, { kind: 'action', id: a.id, grab: timeAt(e.clientX) - a.time })}
                              onPointerMove={drag}
                              onPointerUp={finish}
                              onPointerCancel={finish}
                              onKeyDown={(e) => onKey(e, 'action', a.id, a.time)}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                  {mine.filter((a) => !a.chainId).map((a) => {
                    const res = byId.get(a.id);
                    const size = Math.round(sizeOf(res?.avg ?? 0, maxAvg));
                    const lunar = !!specialOfMove(a.move, a.move.variant, effects[mi]) || res?.kind === 'lunar' || res?.kind === 'stellar';
                    const tag = hitTag({ talent: a.move.talent, hitType: res?.action.move.hitType ?? a.move.talent, label: a.move.label });
                    return (
                      <button
                        key={a.id}
                        type="button"
                        className={`rt-hit${size > 22 ? ' big' : ''}${lunar ? ' lunar' : ''}${atHit?.id === a.id ? ' at-caret' : ''}`}
                        data-flat={(res?.flatUse ?? []).some((u) => u.hits > 0) ? true : undefined}
                        aria-pressed={selectedActionId === a.id}
                        aria-label={`${a.displayName ?? a.move.label} em ${dec(timeOf(a.id, a.time), 1)} s`}
                        title={title(res, a)}
                        style={{ left: `${x(timeOf(a.id, a.time))}%`, minWidth: size, height: size, background: color }}
                        onPointerDown={(e) => begin(e, { kind: 'action', id: a.id, grab: timeAt(e.clientX) - a.time })}
                        onPointerMove={drag}
                        onPointerUp={finish}
                        onPointerCancel={finish}
                        onKeyDown={(e) => onKey(e, 'action', a.id, a.time)}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

        </div>
      </div>
      {scroll.max > 0 && (
        <input
          type="range"
          className="rt-hscroll"
          aria-label="Rolar a linha do tempo na horizontal"
          min={0}
          max={scroll.max}
          step={1}
          value={Math.min(scroll.left, scroll.max)}
          style={{ ['--p' as string]: `${(Math.min(scroll.left, scroll.max) / scroll.max) * 100}%` }}
          onChange={(e) => scrollTo(Number(e.target.value))}
        />
      )}
      {/* A barra de rolagem fica aqui, logo acima de "Buffs no time"; a parte de baixo anda junto com ela. */}
      <div className="rt-zoomscroll rt-zoomlow" ref={lowRef} onWheel={wheelLow}>
        <div className="rt-tlw" style={{ width: labelW + trackW }}>
          <div className="rt-caret low" style={{ left: caretPx }} aria-hidden />
          {/* Buffs no time */}
          <div className="rt-sect rt-stick" style={{ width: wrapW }}>
            <span className="rt-lbl">Buffs no time</span>
            <Seg label="Buffs" value={buffMode} onChange={setBuffMode} options={[{ value: 'group', label: 'Agrupar por quem dá' }, { value: 'active', label: 'Só os ativos' }]} />
          </div>
          {groups.map((g) => (
            <div key={g.name}>
              <div className="rt-giver rt-stick" style={{ width: wrapW }}>
                <span className="dot" style={{ background: g.giver !== null ? v.colors[g.giver] : GOLD }} />
                <span className="nm">{g.name}</span>
                <span className="ct num">{g.lanes.length} {g.lanes.length === 1 ? 'buff' : 'buffs'}</span>
              </div>
              {g.lanes.map((lane) => {
                const wins = project.buffWindows.filter((w) => w.tag === lane.tag);
                const color = lane.giver !== null ? v.colors[lane.giver] : '#c3caea';
                const short = lane.label;
                return (
                  <div className="rt-lane buff" key={lane.tag} style={{ gridTemplateColumns: `${labelW}px ${trackW}px` }}>
                    <span className="lname"><b title={lane.detail}>{short}</b><span>→ {lane.target}</span></span>
                    <div className="trk">
                      {wins.length === 0 && (
                        <div className="rt-nowin">
                          <span>Sem janela · não entra no cálculo</span>
                          <button type="button" className="dz-btn sm ghost" onClick={() => { const id = st().addWindow(lane.tag, 0, duration); if (id) st().setWindowMode(id, 'whole'); }}>Rotação inteira</button>
                          <button type="button" className="dz-btn sm ghost" onClick={() => st().addWindow(lane.tag, snap(playhead))}>Definir tempo</button>
                        </div>
                      )}
                      {wins.map((w) => {
                        const cur = preview?.id === w.id && preview.start !== undefined ? { start: preview.start, end: preview.end ?? w.end } : { start: w.whole ? 0 : pushed(w.start), end: w.whole ? Math.max(duration, tmax) : w.start >= (push?.t0 ?? Infinity) - 1e-9 || w.end > (push?.t0 ?? Infinity) ? pushed(w.end) : w.end };
                        return (
                          <button
                            key={w.id}
                            type="button"
                            className="rt-bar"
                            aria-pressed={selectedWindowId === w.id}
                            aria-label={`${lane.label}, de ${dec(cur.start, 1)} a ${dec(cur.end, 1)} segundos`}
                            title={lane.detail}
                            style={{ left: `${x(Math.min(cur.start, tmax))}%`, width: `${x(Math.max(0, Math.min(cur.end, tmax) - Math.min(cur.start, tmax)))}%`, background: color }}
                            onPointerDown={(e) => begin(e, { kind: 'win', id: w.id, mode: 'move', grab: timeAt(e.clientX) - w.start, start: w.start, end: w.end })}
                            onPointerMove={drag}
                            onPointerUp={finish}
                            onPointerCancel={finish}
                            onKeyDown={(e) => onKey(e, 'win', w.id, w.start)}
                          >
                            <span className="fx">{lane.value}</span>
                            <span className="win num">{w.whole ? 'rotação inteira' : `${dec(cur.start, 1)}–${dec(cur.end, 1)} s`}</span>
                            {!w.whole && (['start', 'end'] as const).map((side) => (
                              <span
                                key={side}
                                className={`edge ${side === 'start' ? 'l' : 'r'}`}
                                onPointerDown={(e) => begin(e, { kind: 'win', id: w.id, mode: side, grab: 0, start: w.start, end: w.end })}
                                onPointerMove={drag}
                                onPointerUp={finish}
                                onPointerCancel={finish}
                              />
                            ))}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {groups.length === 0 && <p className="rt-empty rt-stick" style={{ width: wrapW }}>Nenhum buff {buffMode === 'active' ? 'ativo' : 'de time'} nesta equipe.</p>}
          <div className="rt-help rt-stick" style={{ width: wrapW }}>Arraste golpes e pontas das barras · Shift + setas move 0,5 s · Delete apaga o item selecionado.</div>
        </div>
      </div>
    </Panel>
  );
}

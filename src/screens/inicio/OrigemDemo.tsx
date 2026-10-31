/**
 * "Fio de origem": a demonstração da página inicial. A rotação do time de exemplo numa linha do tempo; ao escolher um golpe,
 * um fio liga o dano a cada buff que o alimenta, e cada buff pode ser tirado para ver quanto o golpe perde.
 * Todos os números vêm do motor (`scripts/make-home-demo.ts` → `demo.json`).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatInt, formatPercent } from '../../ui/format';
import demoJson from './demo.json';
import { buffName, coveringRows, strongestHit, type Demo } from './origemModel';
import './origem.css';

const demo = demoJson as Demo;
const SECONDS = [0, 5, 10, 15];

/** Largura do elemento, acompanhando o redimensionamento (a linha do tempo é desenhada em pixels). */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth || 640);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width) || 640));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const STAR = 'M0 -9 L2.4 -2.4 L9 0 L2.4 2.4 L0 9 L-2.4 2.4 L-9 0 L-2.4 -2.4 Z';

export default function OrigemDemo() {
  const [boxRef, width] = useWidth();
  const [selId, setSelId] = useState(() => strongestHit(demo).id);
  const [offTag, setOffTag] = useState<string | null>(null);
  const hit = demo.hits.find((h) => h.id === selId) ?? demo.hits[0];
  const rows = useMemo(() => coveringRows(demo, hit), [hit]);
  const off = rows.find((r) => r.tag === offTag);
  const shown = off ? off.without : hit.avg;
  const index = demo.hits.indexOf(hit);

  const narrow = width < 520;
  const labelW = narrow ? 58 : 88;
  const laneH = narrow ? 46 : 54;
  const top = 22;
  const padR = 12;
  const height = top + laneH * demo.members.length + 4;
  const x = (t: number) => labelW + (t / demo.duration) * (width - labelW - padR);
  const laneY = (m: number) => top + laneH * m + laneH * 0.42;
  const winY = (m: number) => laneY(m) + 15;

  const go = (d: number) => {
    setOffTag(null);
    setSelId(demo.hits[(index + d + demo.hits.length) % demo.hits.length].id);
  };
  const pick = (id: string) => {
    setOffTag(null);
    setSelId(id);
  };
  const memberOf = demo.members[hit.m];

  return (
    <section className="or-demo" aria-labelledby="or-title">
      <header className="or-head">
        <div>
          <h2 id="or-title">Time de exemplo</h2>
          <p>{demo.members.map((m) => m.name).join(', ')} · {formatInt(demo.dps)} de DPS</p>
        </div>
        <Link className="or-open" to="/projeto/exemplo">Abrir este time</Link>
      </header>

      <div
        className="or-line"
        ref={boxRef}
        tabIndex={0}
        role="group"
        aria-label="Rotação do time. Use as setas para trocar de golpe."
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
        }}
      >
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="presentation">
          {SECONDS.filter((s) => s < demo.duration).map((s) => (
            <g key={s}>
              <line x1={x(s)} x2={x(s)} y1={top - 6} y2={height - 4} className="or-grid" />
              <text x={x(s) + 4} y={12} className="or-sec">{s} s</text>
            </g>
          ))}
          {demo.members.map((m, i) => (
            <g key={m.name}>
              <line x1={labelW} x2={width - padR} y1={laneY(i)} y2={laneY(i)} className="or-lane" />
              <circle cx={10} cy={laneY(i)} r={4} fill={m.color} />
              <text x={22} y={laneY(i) + 4} className="or-name">{m.name}</text>
            </g>
          ))}
          {demo.windows.map((w, i) => {
            if (w.giver === null) return null;
            const covers = rows.some((r) => r.window === w);
            const gone = covers && offTag === w.tag;
            return (
              <rect
                key={i}
                x={x(w.start)}
                y={winY(w.giver) - 3}
                width={Math.max(2, x(w.end) - x(w.start))}
                height={6}
                rx={3}
                fill={demo.members[w.giver].color}
                className={`or-win${covers ? ' on' : ''}${gone ? ' gone' : ''}`}
              />
            );
          })}
          {rows.map((r) => {
            if (r.window.giver === null) return null;
            const x0 = x((r.window.start + r.window.end) / 2);
            const y0 = winY(r.window.giver) + 3;
            const x1 = x(hit.t);
            const y1 = laneY(hit.m);
            const mid = (y0 + y1) / 2;
            return (
              <path
                key={r.tag + selId}
                d={`M${x0} ${y0} C ${x0} ${mid}, ${x1} ${mid}, ${x1} ${y1 + 8}`}
                className={`or-thread${offTag === r.tag ? ' gone' : ''}`}
                stroke={r.giver?.color ?? '#e9c46a'}
                pathLength={1}
              />
            );
          })}
          {demo.hits.map((h) => {
            const cx = x(h.t);
            const cy = laneY(h.m);
            const sel = h.id === selId;
            return (
              <g
                key={h.id}
                className={`or-hit${sel ? ' sel' : ''}`}
                transform={`translate(${cx} ${cy})`}
                role="button"
                aria-label={`${demo.members[h.m].name}, ${h.label}, aos ${h.t.toLocaleString('pt-BR')} segundos`}
                aria-pressed={sel}
                onClick={() => pick(h.id)}
              >
                <circle r={narrow ? 11 : 9} fill="transparent" />
                {h.kind === 'burst' ? <path d={STAR} fill="#e9c46a" /> : <circle r={narrow ? 3.6 : 4.4} fill="#0a0e1c" stroke={demo.members[h.m].color} strokeWidth="1.6" />}
                {sel && <circle r={13} fill="none" stroke="#e9c46a" strokeWidth="1.4" />}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="or-hit-panel">
        <div className="or-hit-top">
          <button type="button" className="or-step" onClick={() => go(-1)} aria-label="Golpe anterior">‹</button>
          <div className="or-hit-name">
            <b style={{ color: memberOf.color }}>{memberOf.name}</b>
            <span>{hit.label}</span>
            <small>aos {hit.t.toLocaleString('pt-BR')} s · golpe {index + 1} de {demo.hits.length}</small>
          </div>
          <button type="button" className="or-step" onClick={() => go(1)} aria-label="Próximo golpe">›</button>
        </div>

        <div className="or-figure" aria-live="polite">
          <strong className={off ? 'cut' : ''}>{formatInt(shown)}</strong>
          {off ? (
            <span className="or-delta">−{formatInt(hit.avg - shown)} sem {off.giver?.name ?? 'o buff'} · {buffName(off.window, off.giver)}</span>
          ) : (
            <span className="or-delta">dano médio com crítico</span>
          )}
        </div>

        {rows.length === 0 ? (
          <p className="or-none">Nenhum buff de time cobre este golpe.</p>
        ) : (
          <ul className="or-rows">
            {rows.map((r) => (
              <li key={r.tag}>
                <button type="button" className={offTag === r.tag ? 'off' : ''} aria-pressed={offTag === r.tag} onClick={() => setOffTag(offTag === r.tag ? null : r.tag)}>
                  <i style={{ background: r.giver?.color }} />
                  <span className="or-who"><b>{r.giver?.name}</b> {buffName(r.window, r.giver)}</span>
                  <span className="or-val">{r.window.value}</span>
                  <span className="or-bar"><u style={{ width: `${Math.min(100, r.effect * 160)}%`, background: r.giver?.color }} /></span>
                  <span className="or-pct">{formatPercent(r.effect, 0)} do golpe</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="or-hint">{rows.length ? 'Toque num buff para tirá-lo e ver o golpe sem ele.' : 'Escolha outro golpe na linha do tempo.'}</p>
      </div>
    </section>
  );
}

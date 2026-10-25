/** Linha final da Rotação: "Dano acumulado na rotação" (curva em degraus, 6 maiores golpes numerados) e "Divisão do dano" (rosca). */
import { useMemo } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { Panel } from '../../design/primitives';
import { effectiveDuration } from '../../engine';
import { axisLabel, damageCurve, hypercarryNote, niceAxis } from '../../features/rotation/screenModel';
import { formatInt, formatPercent } from '../../ui/format';
import { dec } from './ui';

const W = 1000;
const H = 240;

const short = (n: number) => (n >= 1e6 ? `${dec(n / 1e6, 2)} mi` : `${dec(n / 1000, 1)} mil`);

export function Charts({ v }: { v: ProjectView }) {
  const results = v.bundle.optimization.result.actions;
  const duration = Math.max(effectiveDuration(v.project), 0.5);
  const total = v.bundle.optimization.result.totals.avg;
  const curve = useMemo(() => damageCurve(results), [results]);
  const axis = niceAxis(total);
  const X = (t: number) => (t / duration) * W;
  const Y = (val: number) => H - (val / axis.top) * H;

  const path = useMemo(() => {
    let acc = 0;
    let d = `M0,${H}`;
    for (const p of curve) {
      d += ` L${X(p.t).toFixed(1)},${Y(acc).toFixed(1)}`;
      acc = p.total;
      d += ` L${X(p.t).toFixed(1)},${Y(acc).toFixed(1)}`;
    }
    return `${d} L${W},${Y(acc).toFixed(1)}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curve, duration, axis.top]);

  // Os 6 golpes de maior dano, numerados na ordem do tempo.
  const top = useMemo(() => {
    const best = [...results].sort((a, b) => b.avg - a.avg).slice(0, 6).map((r) => r.action.id);
    return curve
      .filter((p) => best.includes(p.actionId))
      .map((p, i) => {
        const r = results.find((x) => x.action.id === p.actionId)!;
        const name = r.action.move.displayName.replace(`${r.action.move.character} - `, '');
        return { n: i + 1, p, r, text: `${r.action.move.character} · ${name} +${short(r.avg)} · ${dec(p.t, 1)} s` };
      });
  }, [curve, results]);

  const xTicks = Array.from({ length: 6 }, (_, i) => (i * duration) / 5);
  const members = v.summary.members;
  const best = members.reduce((b, m) => (m.fraction > b.fraction ? m : b), members[0]);
  const circ = 2 * Math.PI * 60;
  let offset = 0;
  const note = hypercarryNote(members);

  return (
    <section className="rt-final">
      <Panel bar title="Dano acumulado na rotação" aside={<span className="num" style={{ fontSize: 'var(--fs-1)', color: '#a7b0d6' }}>{formatInt(total)} em {dec(duration, 1)} s</span>}>
        <div className="rt-chart">
          <div className="yax">{[...axis.ticks].reverse().map((t) => <span key={t}>{axisLabel(t)}</span>)}</div>
          <div className="plot">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Dano acumulado: ${formatInt(total)} em ${dec(duration, 1)} segundos`}>
              {[1, 2, 3].map((i) => <line key={i} x1="0" x2={W} y1={(H / 4) * i} y2={(H / 4) * i} stroke="#18204a" vectorEffect="non-scaling-stroke" />)}
              <path d={`${path} L${W},${H} Z`} fill="#f1c96b" fillOpacity=".1" />
              <path d={path} fill="none" stroke="#f1c96b" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            </svg>
            {top.map((m) => (
              <span key={m.n} className="rt-mark" style={{ left: `${(m.p.t / duration) * 100}%`, top: `${(Y(m.p.total) / H) * 100}%`, background: v.colors[m.p.member] }}>{m.n}</span>
            ))}
          </div>
          <span />
          <div className="xax">{xTicks.map((t, i) => <span key={i}>{dec(t, t % 1 === 0 ? 0 : 1)} s</span>)}</div>
        </div>
        <div className="rt-legend">
          {top.map((m) => (
            <span key={m.n}><span className="chip" style={{ background: v.colors[m.p.member] }}>{m.n}</span><span className="tx" title={m.text}>{m.text}</span></span>
          ))}
        </div>
      </Panel>

      <Panel bar title="Divisão do dano">
        <div className="rt-donut">
          <svg viewBox="0 0 160 160" width="180" height="180" role="img" aria-label={members.map((m) => `${m.name} ${formatPercent(m.fraction)}`).join(', ')}>
            <circle cx="80" cy="80" r="60" fill="none" stroke="#0a0e1c" strokeWidth="22" />
            {members.map((m, i) => {
              const len = m.fraction * circ;
              const el = <circle key={m.name} cx="80" cy="80" r="60" fill="none" stroke={v.colors[i]} strokeWidth="22" strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset} transform="rotate(-90 80 80)" />;
              offset += len;
              return el;
            })}
          </svg>
          <div className="mid"><b>{formatPercent(best?.fraction ?? 0)}</b><span>{best?.name}</span></div>
        </div>
        <div>
          {members.map((m, i) => (
            <div className="rt-split" key={m.name}>
              <span className="dot" style={{ background: v.colors[i] }} />
              <span>{m.name}</span>
              <span className="num" style={{ color: '#a7b0d6' }}>{formatInt(m.avg)}</span>
              <span className="num p">{formatPercent(m.fraction)}</span>
            </div>
          ))}
        </div>
        {note && <span className="rt-note" style={{ marginTop: 'auto' }}>{note}</span>}
      </Panel>
    </section>
  );
}

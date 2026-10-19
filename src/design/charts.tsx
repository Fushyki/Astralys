/** Gráficos em SVG próprio: dano acumulado em degraus e rosca de participação. Sem biblioteca; legenda e rótulos diretos. */
import { formatDecimal } from '../ui/format';
import './design.css';

export interface CurvePoint {
  t: number;
  total: number;
  color: string;
  /** Marca o ponto com o rótulo (ex.: Supremo). */
  label?: string;
}

const W = 760;
const H = 300;
const PAD = { l: 56, r: 20, t: 28, b: 34 };

export function CumulativeChart({ points, duration, ariaLabel }: { points: CurvePoint[]; duration: number; ariaLabel: string }) {
  const max = Math.max(1, ...points.map((p) => p.total));
  const top = Math.ceil(max / 1e6) * 1e6 || 1e6;
  const tmax = Math.max(duration, ...points.map((p) => p.t), 1);
  const x = (t: number) => PAD.l + (t / tmax) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / top) * (H - PAD.t - PAD.b);

  let path = `M${x(0)},${y(0)}`;
  let prev = 0;
  for (const p of points) {
    path += ` L${x(p.t).toFixed(1)},${y(prev).toFixed(1)} L${x(p.t).toFixed(1)},${y(p.total).toFixed(1)}`;
    prev = p.total;
  }
  path += ` L${x(tmax).toFixed(1)},${y(prev).toFixed(1)}`;
  const area = `${path} L${x(tmax).toFixed(1)},${y(0)} L${x(0)},${y(0)} Z`;

  const steps = Math.min(6, Math.max(1, Math.round(top / 1e6)));
  const yTicks = Array.from({ length: steps + 1 }, (_, i) => (top / steps) * i);
  const xStep = tmax <= 10 ? 1 : 2;
  const xTicks: number[] = [];
  for (let t = 0; t <= tmax + 1e-9; t += xStep) xTicks.push(t);
  const labeled = points.filter((p) => p.label);
  // Rótulos que ficariam por cima do anterior perdem o texto (o ponto e a dica continuam).
  let lastX = -Infinity;
  const showText = labeled.map((p) => {
    const ok = x(p.t) - lastX > 100;
    if (ok) lastX = x(p.t);
    return ok;
  });

  return (
    <svg className="dz-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
      <defs>
        <linearGradient id="cum-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e9c46a" stopOpacity=".28" />
          <stop offset="1" stopColor="#e9c46a" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="grid" />
          <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" className="tick">{formatDecimal(v / 1e6, steps > 4 ? 0 : 1)} mi</text>
        </g>
      ))}
      {xTicks.map((t) => (
        <text key={t} x={x(t)} y={H - 10} textAnchor="middle" className="tick">{t} s</text>
      ))}
      <path d={area} fill="url(#cum-area)" />
      <path d={path} className="curve" />
      {labeled.map((p, i) => {
        const cx = x(p.t);
        const cy = y(p.total);
        return (
          <g key={`${p.t}-${i}`}>
            <title>{`${p.label} · ${formatDecimal(p.t, 1)} s`}</title>
            <circle cx={cx} cy={cy} r={5} fill={p.color} stroke="#0a0e1c" strokeWidth="2" />
            {showText[i] && <text x={Math.min(Math.max(cx, PAD.l + 50), W - PAD.r - 50)} y={cy - 12} textAnchor="middle" className="mark" fill={p.color}>{p.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export interface DonutPart {
  key: string;
  label: string;
  fraction: number;
  color: string;
  value: string;
}

export function Donut({ parts, ariaLabel, format }: { parts: DonutPart[]; ariaLabel: string; format: (f: number) => string }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const big = [...parts].sort((a, b) => b.fraction - a.fraction)[0];
  let offset = 0;
  return (
    <div className="dz-donut">
      <svg viewBox="0 0 200 200" role="img" aria-label={ariaLabel}>
        <circle cx="100" cy="100" r={r} fill="none" stroke="#0a0e1c" strokeWidth="26" />
        {parts.map((p) => {
          const len = Math.max(p.fraction * c, 1.5);
          const el = (
            <circle key={p.key} cx="100" cy="100" r={r} fill="none" stroke={p.color} strokeWidth="26" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} transform="rotate(-90 100 100)">
              <title>{`${p.label}: ${p.value} (${format(p.fraction)})`}</title>
            </circle>
          );
          offset += p.fraction * c;
          return el;
        })}
        {big && <text x="100" y="108" textAnchor="middle" className="center">{format(big.fraction)}</text>}
      </svg>
      <ul>
        {parts.map((p) => (
          <li key={p.key}>
            <i className="dz-dot" style={{ ['--c' as string]: p.color }} />
            <span className="n">{p.label}</span>
            <span className="num v">{p.value}</span>
            <span className="num p">{format(p.fraction)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Página inicial (/): a entrada do Astralys, com poucos textos e dois caminhos. */
import { Link } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import { StarIcon } from '../design/primitives';
import '../design/design.css';
import { ONLINE_ENABLED } from '../online/config';
import './inicio.css';

/** Estrelas do céu (posição em % e tamanho): fixas, para a imagem não mudar a cada visita. */
const SKY: [number, number, number][] = [
  [8, 14, 1.4], [14, 62, 1], [22, 30, 1.2], [31, 82, 1.6], [38, 12, 1], [47, 70, 1.2], [53, 24, 1.8], [60, 90, 1], [66, 8, 1.4], [72, 54, 1],
  [79, 20, 1.2], [86, 76, 1.6], [92, 38, 1], [96, 10, 1.2], [5, 88, 1.2], [27, 50, 0.9], [58, 46, 0.9], [90, 62, 0.9], [44, 40, 0.8], [70, 86, 0.8],
];

/** A estrela do Supremo (viewBox 1440 × 800) e a linha da rotação: pontos [x, y] até ela. */
const STAR: [number, number] = [1030, 430];
const NODES: [number, number][] = [[470, 640], [550, 560], [640, 690], [730, 520], [810, 610], [880, 450], [950, 560]];
/** Curva suave (Catmull-Rom → Bézier) por todos os pontos, terminando subindo até a estrela. */
const CURVE = (() => {
  const p = [...NODES, [STAR[0] - 8, STAR[1] + 40] as [number, number], STAR];
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i], b = p[i], c = p[i + 1], e = p[i + 2] ?? c;
    d += ` C ${b[0] + (c[0] - a[0]) / 6} ${b[1] + (c[1] - a[1]) / 6}, ${c[0] - (e[0] - b[0]) / 6} ${c[1] - (e[1] - b[1]) / 6}, ${c[0]} ${c[1]}`;
  }
  return d;
})();
/** Órbitas ao redor do Supremo: [raio, tracejado, satélites, segundos por volta]. */
const ORBITS: [number, string, number, number][] = [[70, '', 1, 40], [130, '2 7', 2, 70], [200, '', 1, 110], [290, '1 9', 3, 160], [380, '', 2, 220]];
/** Constelação do lado do título (viewBox 1440 × 800). */
const CONST: [number, number][] = [[90, 150], [210, 110], [330, 190], [420, 120], [520, 230], [470, 340]];
export default function Inicio() {
  return (
    <div className="dz in-page">
      <AppHeader />
      <main className="in-hero" aria-labelledby="in-title">
        <div className="in-sky" aria-hidden="true">
          {SKY.map(([x, y, r], i) => (
            <i key={i} style={{ left: `${x}%`, top: `${y}%`, width: r * 3, height: r * 3, animationDelay: `${(i % 7) * 0.6}s` }} />
          ))}
          <svg className="in-arc" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice">
            <path d="M980 -40 A 640 640 0 0 1 1500 520" fill="none" stroke="#18204a" />
            <path d="M1100 -40 A 520 520 0 0 1 1500 380" fill="none" stroke="#18204a" strokeOpacity=".6" />
          </svg>
        </div>

        <div className="in-copy">
          <span className="in-eyebrow"><StarIcon size={14} />Astralys</span>
          <h1 id="in-title">Cada número<br />tem origem.</h1>
          <p>Monte o time, arraste a rotação e veja de onde vem cada buff.</p>
          <div className="in-cta">
            <Link className="in-path gold" to="/novo"><b>Montar um time</b></Link>
            <Link className="in-path" to="/vault"><b>Abrir um time salvo</b></Link>
            {ONLINE_ENABLED && <Link className="in-path ghost" to="/novo?origem=uid"><b>Importar o meu build</b></Link>}
          </div>
          <Link className="in-demo" to="/projeto/exemplo">Ver o time de exemplo ›</Link>
        </div>

        <div className="in-nebula" aria-hidden="true" />
        <svg className="in-const" viewBox="0 0 1440 800" preserveAspectRatio="xMinYMid slice" aria-hidden="true">
          <polyline points={CONST.map((c) => c.join(' ')).join(' ')} fill="none" stroke="#2a3670" strokeDasharray="2 6" />
          {CONST.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 2 : 3.2} fill="#f1c96b" fillOpacity={i % 3 ? 0.4 : 0.8} />)}
          <circle cx="170" cy="470" r="360" fill="none" stroke="#1c2658" /><circle cx="170" cy="470" r="520" fill="none" stroke="#18204a" strokeOpacity=".7" />
        </svg>
        <i className="in-shoot" aria-hidden="true" style={{ top: '14%', left: '58%' }} />
        <i className="in-shoot" aria-hidden="true" style={{ top: '38%', left: '82%', animationDelay: '7s' }} />

        <svg className="in-orbits" viewBox="0 0 1440 800" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id="in-glow">
              <stop offset="0" stopColor="#f1c96b" stopOpacity=".55" />
              <stop offset=".35" stopColor="#f1c96b" stopOpacity=".12" />
              <stop offset="1" stopColor="#f1c96b" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g transform={`translate(${STAR[0]} ${STAR[1]}) scale(1.15)`}>
            <circle r="260" fill="url(#in-glow)" />
            {ORBITS.map(([r, dash, sat, dur], i) => (
              <g key={r}>
                <circle r={r} fill="none" stroke="#2a3670" strokeOpacity={0.9 - i * 0.12} strokeDasharray={dash} />
                <g className="in-spin" style={{ animationDuration: `${dur}s` }}>
                  {Array.from({ length: sat }, (_, k) => {
                    const a = (k / sat) * Math.PI * 2 + i;
                    return <circle key={k} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={k ? 2 : 3.2} fill="#f1c96b" fillOpacity={k ? 0.55 : 0.9} />;
                  })}
                </g>
              </g>
            ))}
            {Array.from({ length: 72 }, (_, k) => {
              const a = (k / 72) * Math.PI * 2, l = k % 6 ? 5 : 11;
              return <line key={k} x1={Math.cos(a) * 440} y1={Math.sin(a) * 440} x2={Math.cos(a) * (440 + l)} y2={Math.sin(a) * (440 + l)} stroke="#2a3670" />;
            })}
          </g>
        </svg>

        <svg className="in-rot" viewBox="0 0 1440 800" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
          <path d={CURVE} fill="none" stroke="#f1c96b" strokeOpacity=".7" strokeWidth="2" />
          {NODES.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={k % 3 === 1 ? 7 : 4.5} fill="#0a0e1c" stroke="#f1c96b" strokeOpacity=".7" strokeWidth="1.2" />)}
          <path d="M0 -34 L8 -8 L34 0 L8 8 L0 34 L-8 8 L-34 0 L-8 -8 Z" transform={`translate(${STAR[0]} ${STAR[1]})`} fill="#f1c96b" />
        </svg>
      </main>
    </div>
  );
}

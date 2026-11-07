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

/** Trilhas da rotação (viewBox 1440 × 800): uma por personagem, y fixo. */
const LANES = [320, 384, 448, 512];
/** Golpes em ordem de tempo: [trilha, x, raio]. O último é o Supremo, a estrela dourada. */
const SEQ: [number, number, number][] = [[0, 600, 4], [1, 676, 3], [2, 748, 5], [1, 830, 3], [3, 902, 4], [2, 972, 3], [1, 1040, 6], [0, 1112, 3], [1, 1178, 4], [2, 1252, 3], [3, 1318, 8]];
/** Órbitas ao redor do Supremo: [raio, tracejado, satélites, segundos por volta]. */
const ORBITS: [number, string, number, number][] = [[70, '', 1, 40], [130, '2 7', 2, 70], [200, '', 1, 110], [290, '1 9', 3, 160], [380, '', 2, 220]];
/** Constelação do lado do título (viewBox 1440 × 800). */
const CONST: [number, number][] = [[90, 150], [210, 110], [330, 190], [420, 120], [520, 230], [470, 340]];
/** Golpe contínuo na trilha 2: pontos pequenos a intervalos iguais. */
const TICKS = Array.from({ length: 9 }, (_, i) => 770 + i * 36);
const arc = ([l1, x1]: [number, number, number], [l2, x2]: [number, number, number]) => {
  const y1 = LANES[l1], y2 = LANES[l2], mx = (x1 + x2) / 2;
  return `M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
};

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
          <g transform={`translate(1318 ${LANES[3]})`}>
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
          <defs>
            <linearGradient id="in-seq" x1="0" x2="1">
              <stop offset="0" stopColor="#f1c96b" stopOpacity=".05" />
              <stop offset="1" stopColor="#f1c96b" stopOpacity=".5" />
            </linearGradient>
          </defs>
          {LANES.map((y) => <line key={y} x1="540" x2="1440" y1={y} y2={y} stroke="#18204a" strokeDasharray="2 9" />)}
          <rect x="830" y={LANES[1] - 9} width="348" height="18" rx="9" fill="#f1c96b" fillOpacity=".04" stroke="#f1c96b" strokeOpacity=".12" />
          <rect x="902" y={LANES[3] - 9} width="230" height="18" rx="9" fill="#f1c96b" fillOpacity=".03" stroke="#f1c96b" strokeOpacity=".1" />
          <line x1="1040" x2="1040" y1="250" y2="580" stroke="#232d5c" strokeDasharray="3 7" />
          {TICKS.map((x) => <circle key={x} cx={x} cy={LANES[2]} r="1.6" fill="#f1c96b" fillOpacity=".3" />)}
          {SEQ.slice(1).map((h, k) => <path key={k} d={arc(SEQ[k], h)} fill="none" stroke="url(#in-seq)" strokeWidth="1.2" />)}
          {SEQ.map(([l, x, r], k) => (k === SEQ.length - 1
            ? <path key={k} d="M0 -22 L5 -5 L22 0 L5 5 L0 22 L-5 5 L-22 0 L-5 -5 Z" transform={`translate(${x} ${LANES[l]})`} fill="#f1c96b" fillOpacity=".75" />
            : <circle key={k} cx={x} cy={LANES[l]} r={r} fill="#0a0e1c" stroke="#f1c96b" strokeOpacity=".5" strokeWidth="1.2" />))}
        </svg>
      </main>
    </div>
  );
}

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

/** Pontos da curva da rotação (viewBox 520 × 360): os golpes ao longo do tempo, terminando na estrela. */
const HITS: [number, number, number][] = [[40, 262, 7], [104, 214, 5], [160, 236, 9], [226, 168, 6], [286, 196, 11], [346, 118, 7], [404, 142, 13]];

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

        <svg className="in-art" viewBox="0 0 520 360" role="img" aria-label="Golpes de uma rotação ao longo do tempo, ligados por uma linha dourada que termina numa estrela">
          <defs>
            <linearGradient id="in-line" x1="0" x2="1">
              <stop offset="0" stopColor="#f1c96b" stopOpacity=".15" />
              <stop offset="1" stopColor="#f1c96b" />
            </linearGradient>
          </defs>
          {[300, 240, 180, 120, 60].map((y) => <line key={y} x1="24" x2="496" y1={y} y2={y} stroke="#18204a" strokeDasharray="2 8" />)}
          <path d="M40 262 C 90 250, 100 206, 104 214 S 140 250, 160 236 S 200 160, 226 168 S 262 214, 286 196 S 326 100, 346 118 S 380 150, 404 142" fill="none" stroke="url(#in-line)" strokeWidth="2" strokeLinecap="round" />
          {HITS.map(([x, y, r], i) => (
            <g key={i}>
              <line x1={x} x2={x} y1={y} y2="320" stroke="#232d5c" strokeDasharray="3 6" />
              <circle cx={x} cy={y} r={r} fill={i === HITS.length - 1 ? '#f1c96b' : '#0c1128'} stroke="#f1c96b" strokeWidth="1.6" />
            </g>
          ))}
          <path d="M404 142 L412 110 L444 102 L412 94 L404 62 L396 94 L364 102 L396 110 Z" transform="translate(40 -4) scale(1.5) translate(-166 -8)" fill="#f1c96b" />
        </svg>
      </main>
    </div>
  );
}

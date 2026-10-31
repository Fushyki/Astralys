/** Página inicial (/): a frase, os caminhos e a demonstração do produto com os números do motor. */
import { Link } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import { ONLINE_ENABLED } from '../online/config';
import OrigemDemo from './inicio/OrigemDemo';
import './inicio.css';

/** Estrelas do céu (posição em % e tamanho): fixas, para a imagem não mudar a cada visita. */
const SKY: [number, number, number][] = [
  [8, 14, 1.4], [14, 62, 1], [22, 30, 1.2], [31, 82, 1.6], [38, 12, 1], [47, 70, 1.2], [53, 24, 1.8], [60, 90, 1], [66, 8, 1.4], [72, 54, 1],
  [79, 20, 1.2], [86, 76, 1.6], [92, 38, 1], [96, 10, 1.2], [5, 88, 1.2], [27, 50, 0.9], [58, 46, 0.9], [90, 62, 0.9], [44, 40, 0.8], [70, 86, 0.8],
];

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
          <h1 id="in-title">Cada número<br />tem origem.</h1>
          <p>Monte o time, arraste a rotação e veja de onde vem cada buff.</p>
          <div className="in-cta">
            <Link className="in-path gold" to="/novo"><b>Montar um time</b></Link>
            <Link className="in-path" to="/vault"><b>Abrir um time salvo</b></Link>
            {ONLINE_ENABLED && <Link className="in-path ghost" to="/novo?origem=uid"><b>Importar o meu build</b></Link>}
          </div>
          <Link className="in-demo" to="/projeto/exemplo">Ver o time de exemplo ›</Link>
        </div>

        <OrigemDemo />
      </main>
    </div>
  );
}

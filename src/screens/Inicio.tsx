/** Página inicial (/): o que o Astralys faz e por onde começar. */
import { Link } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import './inicio.css';

const FEATURES = [
  { title: 'Rotação com buffs no tempo', text: 'Monte a rotação numa linha do tempo, arraste os golpes e veja de onde vem cada buff e quanto ele vale no dano.' },
  { title: 'Build e otimizador', text: 'Edite arma, sets e substats de cada personagem, compare armas e veja a curva do dano conforme os rolls vão para crítico.' },
  { title: 'Recarga de energia', text: 'Descubra a recarga que cada personagem precisa e compare com a do build, com um clique para travar o mínimo.' },
  { title: 'Card para compartilhar', text: 'Gere uma imagem do time com participação no dano, DPS e a rotação, em 4:5, 16:9 ou 9:16.' },
];

export default function Inicio() {
  return (
    <div className="dz">
      <AppHeader />
      <main className="dz-page">
        <section className="in-hero">
          <h1 className="h1">Theorycraft que mostra de onde vem cada número</h1>
          <p className="lead">Equipes, rotações, builds e recarga de energia de Genshin Impact, com dados do Lunaris. Tudo fica salvo no seu navegador.</p>
          <div className="actions">
            <Link className="dz-btn gold" to="/projeto/exemplo">Abrir o exemplo</Link>
            <Link className="dz-btn" to="/vault">Ir ao Vault</Link>
            <Link className="dz-btn" to="/recarga">Calcular recarga</Link>
          </div>
        </section>
        <ul className="dz-grid c4 in-features">
          {FEATURES.map((f) => (
            <li key={f.title} className="dz-panel">
              <h2 className="h2">{f.title}</h2>
              <p>{f.text}</p>
            </li>
          ))}
        </ul>
        <p className="muted small">Você pode importar a planilha de theorycraft (.xlsx) no Vault.</p>
      </main>
    </div>
  );
}

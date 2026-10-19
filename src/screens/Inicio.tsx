/** Página inicial (/): o que o Astralys faz e por onde começar. */
import { Link } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import { ONLINE_ENABLED } from '../online/config';
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
        </section>
        <section className="in-paths" aria-label="Por onde começar">
          <h2 className="h2">O que você quer fazer?</h2>
          <ul className="in-path-list">
            <li>
              <Link className="in-path" to="/novo">
                <b>Montar um time</b>
                <span>Escolha os personagens e veja o dano em 3 passos.</span>
              </Link>
            </li>
            {ONLINE_ENABLED && (
              <li>
                <Link className="in-path" to="/novo?origem=uid">
                  <b>Importar o meu build</b>
                  <span>Use o UID do jogo para trazer arma e artefatos reais.</span>
                </Link>
              </li>
            )}
            <li>
              <Link className="in-path" to="/vault">
                <b>Abrir um time salvo</b>
                <span>Seus times ficam no Vault, cada um como um card.</span>
              </Link>
            </li>
          </ul>
          <p className="muted small">Quer só olhar como funciona? <Link to="/projeto/exemplo">Abra o time de exemplo</Link>. Para recarga de energia sem montar um time, use a <Link to="/recarga">calculadora de recarga</Link>.</p>
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

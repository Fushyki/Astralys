/** Página inicial: o que o Astralys faz e por onde começar. */
import { Link } from 'react-router-dom';
import '../../ui/ast.css';

const FEATURES = [
  {
    title: 'Rotação com buffs no tempo',
    text: 'Monte a rotação numa linha do tempo, arraste os golpes e veja de onde vem cada buff e quanto ele vale no dano.',
  },
  {
    title: 'Build e otimizador',
    text: 'Edite arma, sets e substats do personagem, compare armas e veja a curva do dano conforme os rolls vão para crítico.',
  },
  {
    title: 'Recarga de energia',
    text: 'Descubra a recarga que cada personagem precisa e compare com a do build, com um clique para travar o mínimo.',
  },
  {
    title: 'Card para compartilhar',
    text: 'Gere uma imagem da rotação com participação no dano, builds, DPS e DPR, em formato horizontal ou vertical.',
  },
];

export default function HomePage() {
  return (
    <div className="ast-app">
      <div className="ast-shell ast-home">
        <header className="hero">
          <h1 className="ast-caps">Astralys</h1>
          <p className="lead">Theorycraft de Genshin Impact que mostra de onde vem cada número: equipes, rotações, builds e recarga de energia.</p>
          <div className="cta">
            <Link className="ast-btn" to="/rotacao">Meus projetos</Link>
            <Link className="ast-btn ghost" to="/rotacao/exemplo">Abrir o exemplo</Link>
          </div>
        </header>

        <ul className="features">
          {FEATURES.map((f) => (
            <li key={f.title}>
              <h2 className="ast-caps">{f.title}</h2>
              <p>{f.text}</p>
            </li>
          ))}
        </ul>

        <footer className="note">
          Dados de jogo do Lunaris. Os projetos ficam salvos no seu navegador; você pode importar a planilha de theorycraft (.xlsx) em Meus projetos.
        </footer>
      </div>
    </div>
  );
}

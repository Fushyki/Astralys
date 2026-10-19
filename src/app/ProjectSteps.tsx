/** Barra de passos no rodapé do projeto: em que passo você está, o que fazer nele e o botão do próximo. */
import { Link, useLocation } from 'react-router-dom';
import '../design/design.css';

interface StepInfo {
  n: 1 | 2 | 3 | 4;
  title: string;
  hint: string;
  next?: { label: string; to: string };
  prev?: { label: string; to: string };
}

/** Os passos do projeto, na ordem em que costumam ser feitos. */
export function stepsFor(id: string, firstMember: string): StepInfo[] {
  const base = `/projeto/${id}`;
  const personagens = `${base}/personagem/${encodeURIComponent(firstMember)}`;
  return [
    { n: 1, title: 'Equipe', hint: 'Confira o time e o dano que cada personagem faz.', next: { label: 'Ajustar os personagens', to: personagens } },
    { n: 2, title: 'Personagens', hint: 'Ajuste a arma, os artefatos e os substats de cada um (aba Build).', prev: { label: 'Equipe', to: base }, next: { label: 'Montar a rotação', to: `${base}/rotacao` } },
    { n: 3, title: 'Rotação', hint: 'Coloque os golpes na linha do tempo e ligue os buffs nas janelas em que valem.', prev: { label: 'Personagens', to: personagens }, next: { label: 'Ver o resultado', to: `${base}/time` } },
    { n: 4, title: 'Resultado', hint: 'Pronto! Veja de onde vem o dano e gere o Card para compartilhar.', prev: { label: 'Rotação', to: `${base}/rotacao` }, next: { label: 'Gerar o Card', to: `/card/${id}` } },
  ];
}

/** Qual passo a tela atual é (null nas telas de apoio, como Armas e Recarga). */
export function stepOf(pathname: string, id: string): 1 | 2 | 3 | 4 | null {
  const base = `/projeto/${id}`;
  if (pathname === base || pathname === `${base}/`) return 1;
  if (pathname.startsWith(`${base}/personagem`)) return 2;
  if (pathname.startsWith(`${base}/rotacao`)) return 3;
  if (pathname.startsWith(`${base}/time`)) return 4;
  return null;
}

export function ProjectSteps({ id, firstMember }: { id: string; firstMember: string }) {
  const { pathname } = useLocation();
  const n = stepOf(pathname, id);
  if (n === null) return null;
  const s = stepsFor(id, firstMember)[n - 1];
  return (
    <footer className="dz-stepbar" aria-label="Passos do projeto">
      <div className="txt">
        <span className="lbl">Passo {s.n} de 4 · {s.title}</span>
        <span>{s.hint}</span>
      </div>
      <div className="acts">
        {s.prev && <Link className="dz-btn" to={s.prev.to}>← {s.prev.label}</Link>}
        {s.next && <Link className="dz-btn gold" to={s.next.to}>Próximo passo: {s.next.label}</Link>}
        {s.n === 4 && <Link className="dz-btn" to="/vault">Ir ao Vault</Link>}
      </div>
    </footer>
  );
}

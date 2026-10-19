/** Barra de passos no rodapé do time: em que passo você está, o que fazer nele e o botão do próximo. */
import { Link, useLocation } from 'react-router-dom';
import '../design/design.css';

interface StepInfo {
  n: 1 | 2 | 3;
  title: string;
  hint: string;
  next?: { label: string; to: string };
  prev?: { label: string; to: string };
}

/** Os passos do time, na ordem em que costumam ser feitos. */
export function stepsFor(id: string): StepInfo[] {
  const base = `/projeto/${id}`;
  return [
    { n: 1, title: 'Equipe', hint: 'Confira o time. Toque em um personagem para ajustar a arma, os artefatos e os substats dele.', next: { label: 'Montar a rotação', to: `${base}/rotacao` } },
    { n: 2, title: 'Rotação', hint: 'Coloque os golpes na linha do tempo e ligue os buffs nas janelas em que valem.', prev: { label: 'Equipe', to: base }, next: { label: 'Ver o resultado', to: `${base}/time` } },
    { n: 3, title: 'Resultado', hint: 'Pronto! Veja de onde vem o dano e gere o Card para compartilhar.', prev: { label: 'Rotação', to: `${base}/rotacao` }, next: { label: 'Gerar o Card', to: `/card/${id}` } },
  ];
}

/** Qual passo a tela atual é (null nas telas de apoio, como Armas, Recarga e Otimizador). */
export function stepOf(pathname: string, id: string): 1 | 2 | 3 | null {
  const base = `/projeto/${id}`;
  if (pathname === base || pathname === `${base}/` || pathname.startsWith(`${base}/personagem`)) return 1;
  if (pathname.startsWith(`${base}/rotacao`)) return 2;
  if (pathname.startsWith(`${base}/time`)) return 3;
  return null;
}

export function ProjectSteps({ id }: { id: string; firstMember?: string }) {
  const { pathname } = useLocation();
  const n = stepOf(pathname, id);
  if (n === null) return null;
  const s = stepsFor(id)[n - 1];
  return (
    <footer className="dz-stepbar" aria-label="Passos do time">
      <div className="txt">
        <span className="lbl">Passo {s.n} de 3 · {s.title}</span>
        <span>{s.hint}</span>
      </div>
      <div className="acts">
        {s.prev && <Link className="dz-btn" to={s.prev.to}>← {s.prev.label}</Link>}
        {s.next && <Link className="dz-btn gold" to={s.next.to}>Próximo passo: {s.next.label}</Link>}
        {s.n === 3 && <Link className="dz-btn" to="/vault">Ir aos Times</Link>}
      </div>
    </footer>
  );
}

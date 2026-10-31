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

/** Os passos do time, na ordem em que costumam ser feitos. `member` é o personagem aberto (ou o primeiro). */
export function stepsFor(id: string, member: string): StepInfo[] {
  const base = `/projeto/${id}`;
  const character = `${base}/personagem/${encodeURIComponent(member)}`;
  return [
    { n: 1, title: 'Equipe', hint: 'Confira quem está no time e os buffs que cada um recebe.', next: { label: 'Personagens', to: character } },
    { n: 2, title: 'Personagens', hint: 'Ajuste a arma, os artefatos e os substats de cada personagem (use as abas no topo para trocar de personagem).', prev: { label: 'Equipe', to: base }, next: { label: 'Rotação e buffs', to: `${base}/rotacao` } },
    { n: 3, title: 'Rotação e buffs', hint: 'Coloque os golpes na linha do tempo e ligue os buffs nas janelas em que valem. O dano do time aparece aqui mesmo.', prev: { label: 'Personagens', to: character }, next: { label: 'Gerar card', to: `/card/${id}` } },
  ];
}

/** Qual passo a tela atual é (null nas telas de apoio, como Armas, Recarga e Otimizador). */
export function stepOf(pathname: string, id: string): 1 | 2 | 3 | null {
  const base = `/projeto/${id}`;
  if (pathname === base || pathname === `${base}/`) return 1;
  if (pathname.startsWith(`${base}/personagem`)) return 2;
  if (pathname.startsWith(`${base}/rotacao`)) return 3;
  return null;
}

export function ProjectSteps({ id, member }: { id: string; member: string }) {
  const { pathname } = useLocation();
  const n = stepOf(pathname, id);
  if (n === null) return null;
  const s = stepsFor(id, member)[n - 1];
  return (
    <footer className="dz-stepbar" aria-label="Passos do time">
      <div className="txt">
        <span className="lbl">Passo {s.n} de 3<span className="ttl"> · {s.title}</span></span>
        <span>{s.hint}</span>
      </div>
      <div className="acts">
        {s.prev && <Link className="dz-btn" to={s.prev.to}>← {s.prev.label}</Link>}
        {s.next && <Link className="dz-btn gold" to={s.next.to}>{s.n === 3 ? s.next.label : <><span className="pre">Próximo passo: </span>{s.next.label}</>}</Link>}
      </div>
    </footer>
  );
}

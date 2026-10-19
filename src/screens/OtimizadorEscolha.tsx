/** Otimizador, entrada (/otimizador): escolhe o time (e o personagem) e abre o otimizador dentro dele. */
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import { elementColor } from '../design/elements';
import { CharacterAvatar, Panel } from '../design/primitives';
import { loadGood } from '../features/good/goodStore';
import { useGameData } from '../features/rotation/data';
import { listProjects } from '../features/rotation/persistence';
import './otimizador.css';

export default function OtimizadorEscolha() {
  const navigate = useNavigate();
  const { data } = useGameData();
  const good = useMemo(() => loadGood(), []);
  const items = useMemo(() => listProjects(), []);
  const characters = data?.game.characters ?? [];

  return (
    <div className="dz">
      <AppHeader />
      <main className="dz-page ot">
        <section className="dz-pagehead">
          <div className="titles">
            <span className="lbl">Otimizador de artefatos</span>
            <h1 className="h1">Para qual time e personagem?</h1>
            <span className="muted">Escolha quem otimizar. O dano é medido na rotação do time, com os buffs dos outros.</span>
          </div>
        </section>

        {!good && (
          <Panel title="Primeiro, o inventário">
            <div className="ot-empty">
              <p>O otimizador usa as peças que você tem. Importe o inventário e depois escolha o time.</p>
              <Link className="dz-btn gold" to="/inventario">Importar o inventário</Link>
            </div>
          </Panel>
        )}

        {items.length === 0 ? (
          <div className="ot-empty">
            <p>Você ainda não tem times. Monte um e volte aqui.</p>
            <Link className="dz-btn gold" to="/novo">Novo time</Link>
          </div>
        ) : (
          <div className="oe-list">
            {items.map((p) => (
              <article className="oe-team" key={p.id}>
                <header>
                  <b>{p.name}</b>
                  <Link className="dz-link" to={`/projeto/${p.id}`}>Abrir time</Link>
                </header>
                <div className="who">
                  {p.members.map((name) => {
                    const c = characters.find((x) => x.name === name);
                    return (
                      <button key={name} type="button" className="ot-member" style={{ ['--c' as string]: elementColor(c?.element) }} onClick={() => navigate(`/projeto/${p.id}/otimizador/${encodeURIComponent(name)}`)} aria-label={`Otimizar ${name} em ${p.name}`}>
                        <CharacterAvatar name={name} icon={c?.icon} color={elementColor(c?.element)} size={52} />
                        <span className="n">{name}</span>
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

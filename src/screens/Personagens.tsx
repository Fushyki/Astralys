/** Personagens (/personagens): quem você tem no inventário e em que times cada um está, com atalho para ajustar ou otimizar. */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import { elementColor } from '../design/elements';
import { CharacterAvatar, Segmented } from '../design/primitives';
import { norm } from '../features/good/goodImport';
import { loadGood } from '../features/good/goodStore';
import { useGameData } from '../features/rotation/data';
import { listProjects } from '../features/rotation/persistence';
import './personagens.css';

const ELEMENTS = ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo'];

export default function Personagens() {
  const { data } = useGameData();
  const good = useMemo(() => loadGood(), []);
  const projects = useMemo(() => listProjects(), []);
  const [query, setQuery] = useState('');
  const [element, setElement] = useState('');
  const [scope, setScope] = useState<'meus' | 'todos'>(good ? 'meus' : 'todos');

  const owned = useMemo(() => new Map((good?.characters ?? []).map((c) => [norm(c.key), c])), [good]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.game.characters ?? [])
      .filter((c) => !c.name.startsWith('Aether') && !c.name.startsWith('Lumine'))
      .filter((c) => (scope === 'todos' || owned.has(norm(c.name))) && (!element || c.element === element) && (!q || c.name.toLowerCase().includes(q) || c.namePt.toLowerCase().includes(q)))
      .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
  }, [data, owned, scope, element, query]);

  return (
    <div className="dz">
      <AppHeader />
      <main className="dz-page">
        <section className="dz-pagehead">
          <div className="titles">
            <span className="lbl">Personagens</span>
            <h1 className="h1">{scope === 'meus' ? 'Seus personagens' : 'Todos os personagens'}</h1>
            <span className="muted">{good ? 'Do seu inventário importado.' : 'Importe o inventário para ver só os que você tem.'} Toque em um time para ajustar o build dele lá.</span>
          </div>
          <div className="actions">
            {!good && <Link className="dz-btn gold" to="/inventario">Importar o inventário</Link>}
          </div>
        </section>

        <div className="pe-tools">
          <input className="dz-input" type="search" placeholder="Buscar personagem" aria-label="Buscar personagem" value={query} onChange={(e) => setQuery(e.target.value)} />
          {good && <Segmented label="Quais" value={scope} options={[{ value: 'meus', label: `Meus (${owned.size})` }, { value: 'todos', label: 'Todos' }]} onChange={setScope} />}
          <div className="pe-els" role="group" aria-label="Elemento">
            {ELEMENTS.map((e) => (
              <button key={e} type="button" aria-pressed={element === e} style={{ ['--c' as string]: elementColor(e) }} onClick={() => setElement(element === e ? '' : e)}>{e}</button>
            ))}
          </div>
        </div>

        {!data ? (
          <p className="note" role="status">Carregando os dados do jogo…</p>
        ) : (
          <div className="pe-grid">
            {list.map((c) => {
              const mine = owned.get(norm(c.name));
              const teams = projects.filter((p) => p.members.includes(c.name));
              const weapon = good?.weapons.find((w) => norm(w.location) === norm(c.name));
              const pieces = good?.artifacts.filter((a) => norm(a.location) === norm(c.name)).length ?? 0;
              return (
                <article className="pe-card" key={c.id} style={{ ['--c' as string]: elementColor(c.element) }} data-rarity={c.rarity}>
                  <div className="top"><CharacterAvatar name={c.name} icon={c.icon} color={elementColor(c.element)} size={56} />
                    <div className="meta">
                      <b>{c.name}</b>
                      <span className="muted small">{c.element} · {c.weapon}</span>
                      {mine && <span className="num small">Nv {mine.level ?? '?'} · C{mine.constellation ?? 0}</span>}
                    </div>
                  </div>
                  {mine && (
                    <div className="gear small muted">
                      {weapon ? `${data.game.weapons.find((w) => norm(w.name) === norm(weapon.key))?.name ?? weapon.key} R${weapon.refinement ?? 1}` : 'Sem arma no inventário'} · {pieces}/5 peças
                    </div>
                  )}
                  <div className="teams">
                    {teams.length === 0 && <span className="muted small">Em nenhum time</span>}
                    {teams.slice(0, 4).map((p) => (
                      <Link key={p.id} className="pe-team" to={`/projeto/${p.id}/personagem/${encodeURIComponent(c.name)}`} title={`Abrir ${c.name} em ${p.name}`}>{p.name}</Link>
                    ))}
                    {teams.length > 4 && <span className="muted small">+{teams.length - 4}</span>}
                  </div>
                  {teams.length > 0 && good && (
                    <Link className="dz-link small" to={`/projeto/${teams[0].id}/otimizador/${encodeURIComponent(c.name)}`}>Otimizar artefatos</Link>
                  )}
                </article>
              );
            })}
            {list.length === 0 && <p className="note">Nenhum personagem com esses filtros.</p>}
          </div>
        )}
      </main>
    </div>
  );
}

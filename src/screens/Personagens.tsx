/** Personagens (/personagens): quem você tem no inventário e em que times cada um está, com atalho para ajustar ou otimizar. */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import { elementColor } from '../design/elements';
import { Segmented } from '../design/primitives';
import { splashUrl } from './card/cardParts';
import { norm } from '../features/good/goodImport';
import { loadGood } from '../features/good/goodStore';
import { useGameData } from '../features/rotation/data';
import { listProjects } from '../features/rotation/persistence';
import './personagens.css';
import { ButtonLink } from '../design/Button';

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

  const mix = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of list) m.set(c.element, (m.get(c.element) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [list]);

  return (
    <div className="dz">
      <AppHeader />
      <main className="dz-page">
        <section className="pe-hero">
          <div>
            <span className="k">{scope === 'meus' ? 'Seus personagens' : 'Personagens'}</span>
            <b className="big num">{list.length}</b>
          </div>
          <div className="side">
            <p>{good ? 'Do seu inventário importado.' : 'Importe o inventário para ver só os que você tem.'} Toque em um time para ajustar o build dele lá.</p>
            <div className="mix" role="img" aria-label={mix.map(([e, n]) => `${e} ${n}`).join(', ')}>
              {mix.map(([e, n]) => <i key={e} style={{ flex: n, background: elementColor(e) }} title={`${e}: ${n}`} />)}
            </div>
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
                <article className="pe-card" key={c.id} style={{ ['--c' as string]: elementColor(c.element) }} data-rarity={c.rarity} data-mine={mine ? '' : undefined}>
                  <img className="splash" src={splashUrl(c.icon ?? '')} alt="" loading="lazy" crossOrigin="anonymous" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <div className="info">
                    <span className="el">{c.element} · {c.weapon}</span>
                    <b className="nm">{c.name}</b>
                    {mine ? (
                      <div className="cn"><i className="num">C{mine.constellation ?? 0}</i><span className="num">Nv {mine.level ?? '?'}</span></div>
                    ) : (
                      <span className="st" aria-label={`${c.rarity} estrelas`}>{'★'.repeat(c.rarity)}</span>
                    )}
                    {mine && (
                      <span className="gear">
                        {weapon ? `${data.game.weapons.find((w) => norm(w.name) === norm(weapon.key))?.name ?? weapon.key} R${weapon.refinement ?? 1}` : 'Sem arma no inventário'} · {pieces}/5 peças
                      </span>
                    )}
                    <div className="teams">
                      {teams.length === 0 && <span className="none">Em nenhum time</span>}
                      {teams.slice(0, 3).map((p) => (
                        <Link key={p.id} className="pe-team" to={`/projeto/${p.id}/personagem/${encodeURIComponent(c.name)}`} title={`Abrir ${c.name} em ${p.name}`}>{p.name}</Link>
                      ))}
                      {teams.length > 3 && <span className="none">+{teams.length - 3}</span>}
                    </div>
                    {teams.length > 0 && good && (
                      <ButtonLink variant="ghost" size="sm" to={`/projeto/${teams[0].id}/personagem/${encodeURIComponent(c.name)}?aba=otimizar`}>Otimizar artefatos</ButtonLink>
                    )}
                  </div>
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

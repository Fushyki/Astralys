/** Vault (/vault): todos os times criados, como cartões com a mesma cara dos cartões de personagem da Equipe. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import { elementColor } from '../design/elements';
import { CharacterAvatar } from '../design/primitives';
import { formatInt } from '../ui/format';
import { useGameData } from '../features/rotation/data';
import { downloadProject, importJson, withoutDuplicates, type ImportResult } from '../features/rotation/importFile';
import { projectFromLink, projectLink } from '../features/rotation/projectLink';
import { SAMPLE_ID, cloneProject, deleteStoredProject, listProjects, loadProject, saveProject, sampleForApp } from '../features/rotation/persistence';
import { useProjectCards } from '../features/rotation/useProjectCards';
import { Menu } from '../design/Menu';
import { useSettings } from '../app/settings';
import { copyCardImage } from './card/copyCard';
import { POSTER_SIZE, PosterCard, ScaledPoster } from './card/PosterCard';
import { deleteRemote } from '../online/api';
import { ONLINE_ENABLED } from '../online/config';
import { useSession } from '../online/session';
import { summaryText, syncNow } from '../online/syncNow';
import { NO_FILTERS, filterProjects, type VaultFilters } from '../features/vault/vaultModel';
import './vault.css';
import { Button } from '../design/Button';

const ELEMENTS = ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo'];

export default function Vault() {
  const navigate = useNavigate();
  const { data } = useGameData();
  const [items, setItems] = useState(() => listProjects());
  const [filters, setFilters] = useState<VaultFilters>(NO_FILTERS);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const jsonInput = useRef<HTMLInputElement>(null);

  const refresh = () => setItems(listProjects());
  const characters = data?.game.characters ?? [];
  const characterOf = (name: string) => characters.find((c) => c.name === name);
  const elementOf = (name: string) => characterOf(name)?.element;
  const cards = useProjectCards(items.map((i) => i.id), data, items.map((i) => i.id + i.updatedAt).join());

  const visible = useMemo(() => filterProjects(items, filters, elementOf), [items, filters, characters]);
  const allCharacters = useMemo(() => [...new Set(items.flatMap((p) => p.members))].sort(), [items]);
  const summary = useMemo(() => {
    let best: { name: string; dps: number } | null = null;
    for (const p of visible) {
      const m = cards[p.id];
      if (m && m !== 'error' && (!best || m.dps > best.dps)) best = { name: p.name, dps: m.dps };
    }
    const uses = new Map<string, number>();
    for (const p of visible) for (const n of p.members) uses.set(n, (uses.get(n) ?? 0) + 1);
    const top = [...uses].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
    return { best, top, favorites: visible.filter((p) => p.favorite).length };
  }, [visible, cards]);
  const set = (patch: Partial<VaultFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const edit = (id: string, fn: (p: NonNullable<ReturnType<typeof loadProject>>) => ReturnType<typeof loadProject>) => {
    const p = loadProject(id);
    const next = p && fn(p);
    if (next) saveProject(next);
    refresh();
  };
  const toggleFavorite = (id: string) => edit(id, (p) => ({ ...p, meta: { ...p.meta, favorite: !p.meta.favorite, updatedAt: new Date().toISOString() } }));
  const cardFormat = useSettings((s) => s.cardFormat);
  const [notice, setNotice] = useState<string | null>(null);
  /** Copia a imagem do card do time (no formato escolhido) para a área de transferência. */
  const copyCard = async (id: string, name: string) => {
    const el = document.querySelector<HTMLElement>(`.vt-card[data-id="${id}"] .pc`);
    try {
      if (!el) throw new Error('o card ainda está sendo calculado');
      await copyCardImage(el, cardFormat);
      setNotice(`Card de “${name}” copiado.`);
    } catch (e) {
      setNotice(`Não foi possível copiar o card: ${e instanceof Error ? e.message : String(e)}`);
    }
    setTimeout(() => setNotice(null), 3500);
  };
  const duplicate = (id: string) => edit(id, (p) => cloneProject(p));
  const rename = (id: string, name: string) => {
    setRenaming(null);
    const trimmed = name.trim();
    if (trimmed) edit(id, (p) => (trimmed === p.name ? null : { ...p, name: trimmed, meta: { ...p.meta, ...(p.meta.card?.title ? { card: { ...p.meta.card, title: trimmed } } : {}), updatedAt: new Date().toISOString() } }));
  };
  const token = useSession((st) => st.token);
  const [syncing, setSyncing] = useState(false);
  const sync = async () => {
    if (!token) return;
    setSyncing(true);
    setError(null);
    setNotes([]);
    try {
      const r = await syncNow(token);
      setNotes([summaryText(r)]);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível sincronizar.');
    } finally {
      setSyncing(false);
    }
  };
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const toggleShare = async (id: string) => {
    const current = loadProject(id);
    if (!current || !token) return;
    const next = !current.meta.shared;
    edit(id, (p) => ({ ...p, meta: { ...p.meta, shared: next, updatedAt: new Date().toISOString() } }));
    setError(null);
    setShareMsg(null);
    try {
      await syncNow(token);
      if (next) {
        const link = `${window.location.origin}/p/${id}`;
        let copied = false;
        try {
          await navigator.clipboard.writeText(link);
          copied = true;
        } catch {
          /* sem permissão da área de transferência: o link aparece na tela */
        }
        setShareMsg(`${copied ? 'Link copiado' : 'Link do time'}: ${link}`);
      } else {
        setShareMsg('Compartilhamento desligado: o link deixou de funcionar.');
      }
    } catch (e) {
      edit(id, (p) => ({ ...p, meta: { ...p.meta, shared: !next } }));
      setError(e instanceof Error ? e.message : 'Não foi possível atualizar o compartilhamento.');
    }
  };
  const remove = (id: string) => {
    deleteStoredProject(id);
    if (token) void deleteRemote(token, id).catch(() => undefined);
    setConfirmDelete(null);
    refresh();
  };

  const run = async (fn: () => Promise<ImportResult>) => {
    setBusy(true);
    setError(null);
    setNotes([]);
    try {
      const r = await fn();
      if (!saveProject(r.project)) throw new Error('Não foi possível salvar: o armazenamento do navegador está cheio ou bloqueado.');
      if (r.warnings.length === 0) navigate(`/projeto/${r.project.id}`);
      else {
        refresh();
        setNotes([`"${r.project.name}" foi importado com avisos:`, ...r.warnings]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const createNew = () => navigate('/novo');

  const [linkText, setLinkText] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const importLink = (text: string) =>
    void run(async () => {
      const project = await projectFromLink(text);
      if (!project) throw new Error('Cole um link de time do Astralys (ele tem "#time=").');
      return withoutDuplicates(project, [], data);
    });
  // Abrir um link de time (/vault#time=…) importa o time direto.
  useEffect(() => {
    if (window.location.hash.includes('time=')) {
      importLink(window.location.hash);
      history.replaceState(null, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const copyLink = async (id: string) => {
    const full = loadProject(id);
    if (!full) return;
    try {
      await navigator.clipboard.writeText(await projectLink(full, window.location.origin));
      setNotice('Link do time copiado. Abra-o em outro computador para importar.');
    } catch {
      setNotice('Não foi possível copiar o link.');
    }
    setTimeout(() => setNotice(null), 3500);
  };

  const filtered = filters.query || filters.character || filters.element || filters.favoritesOnly;

  return (
    <div className="dz">
      <AppHeader />
      <main className="dz-page">
        <input ref={jsonInput} type="file" accept=".json,application/json" hidden aria-label="Escolher projeto" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void run(() => importJson(f, data)); }} />
        {ONLINE_ENABLED && (
          <section className="dz-pagehead">
            <div className="actions">
              {ONLINE_ENABLED && (token
                ? <button type="button" className="dz-btn" disabled={syncing} onClick={() => void sync()} title="Envia os times mais novos para a conta e baixa os que só existem nela">{syncing ? 'Sincronizando…' : 'Sincronizar com a conta'}</button>
                : <Link to="/entrar" className="dz-btn" title="Guarde seus times fora deste navegador">Entrar para sincronizar</Link>)}
            </div>
          </section>
        )}

        {error && <p className="dz-error" role="alert">{error}</p>}
        {shareMsg && <p className="dz-error vt-share" role="status">{shareMsg}</p>}
        {notes.length > 0 && <div className="dz-error vt-notes" role="status">{notes.map((n, i) => <p key={i}>{n}</p>)}</div>}

        {notice && <p className="note vt-notice" role="status">{notice}</p>}
        <section className="vt-summary" aria-label="Resumo dos times">
          <div className="vt-stat"><b className="num">{filtered ? `${visible.length} de ${items.length}` : items.length}</b><span>{items.length === 1 ? 'time' : 'times'}</span></div>
          <div className="vt-stat gold"><b className="num">{summary.best ? formatInt(summary.best.dps) : '—'}</b><span>melhor DPS{summary.best ? ` · ${summary.best.name}` : ''}</span></div>
          <button type="button" className="vt-stat vt-statbtn" aria-pressed={filters.favoritesOnly} onClick={() => set({ favoritesOnly: !filters.favoritesOnly })} title="Mostrar só os favoritos"><b className="num">{summary.favorites} <i aria-hidden="true">★</i></b><span>favoritos</span></button>
          {summary.top.length > 0 && (
            <div className="vt-top" role="group" aria-label="Personagens mais usados">
              {summary.top.map(([n, k]) => (
                <button key={n} type="button" className="vt-face" aria-pressed={filters.character === n} title={`${n}: em ${k} ${k === 1 ? 'time' : 'times'}`} aria-label={`Filtrar por ${n}`} onClick={() => set({ character: filters.character === n ? '' : n })}>
                  <CharacterAvatar name={n} icon={characterOf(n)?.icon} color={elementColor(elementOf(n))} size={44} />
                  <em className="num">{k}</em>
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="vt-filters" aria-label="Filtros">
          <input className="dz-input" type="search" placeholder="Buscar por nome ou personagem" aria-label="Buscar times" value={filters.query} onChange={(e) => set({ query: e.target.value })} />
          <select className="dz-input" aria-label="Personagem" value={filters.character} onChange={(e) => set({ character: e.target.value })}>
            <option value="">Todos os personagens</option>
            {allCharacters.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select className="dz-input" aria-label="Elemento" value={filters.element} onChange={(e) => set({ element: e.target.value })}>
            <option value="">Todos os elementos</option>
            {ELEMENTS.map((el) => <option key={el} value={el}>{el}</option>)}
          </select>
          <button type="button" className="dz-btn" aria-pressed={filters.favoritesOnly} onClick={() => set({ favoritesOnly: !filters.favoritesOnly })}>★ Favoritos</button>
          {filtered && <Button variant="ghost" size="sm" onClick={() => setFilters(NO_FILTERS)}>Limpar filtros</Button>}
        </section>

        {visible.length === 0 && (
          <div className="dz-panel vt-empty">
            <h2 className="h2">Nenhum time encontrado</h2>
            <p className="muted">{filtered ? 'Nenhum time bate com esses filtros.' : 'Crie um time ou importe um por link ou arquivo para começar.'}</p>
          </div>
        )}
        {(
          <ul className={`dz-grid c3 vt-list${cardFormat === 'wide' ? ' vt-two' : ''}`}>
            {visible.map((p) => {
              const model = cards[p.id];
              const lead = p.members[0] ? elementColor(elementOf(p.members[0])) : '#e9c46a';
              return (
                <li key={p.id} className="vt-card" data-id={p.id} data-name={p.name} style={{ ['--c' as string]: lead }}>
                  <Link className="vt-poster" to={`/projeto/${p.id}`} aria-label={`Abrir ${p.name}`}>
                    {model && model !== 'error' ? (
                      <ScaledPoster format={cardFormat}><PosterCard model={model} format={cardFormat} /></ScaledPoster>
                    ) : (
                      <div className="vt-wait" style={{ aspectRatio: `${POSTER_SIZE[cardFormat].w} / ${POSTER_SIZE[cardFormat].h}` }}>
                        <div className="vt-faces" aria-hidden="true">
                          {p.members.map((n) => <CharacterAvatar key={n} name={n} icon={characterOf(n)?.icon} color={elementColor(elementOf(n))} size={48} />)}
                        </div>
                        <p className="muted small">{model === 'error' ? 'Não foi possível calcular este time.' : 'Calculando…'}</p>
                      </div>
                    )}
                  </Link>
                  <div className="vt-over">
                    {p.shared && <span className="vt-tag" title="Tem link público">compartilhado</span>}
                    <button type="button" className="dz-iconbtn vt-fav" aria-pressed={p.favorite} aria-label={p.favorite ? `Tirar ${p.name} dos favoritos` : `Favoritar ${p.name}`} onClick={() => toggleFavorite(p.id)}>★</button>
                    <Menu label="⋯" ariaLabel={`Opções de ${p.name}`} className="dz-iconbtn">
                      {(close) =>
                        confirmDelete === p.id ? (
                          <>
                            <span className="dz-menu-note">{p.id === SAMPLE_ID ? 'Voltar ao exemplo original?' : 'Apagar de vez?'}</span>
                            <button type="button" role="menuitem" className="dz-menu-item danger" onClick={() => { close(); remove(p.id); }}>Sim</button>
                            <button type="button" role="menuitem" className="dz-menu-item" onClick={() => setConfirmDelete(null)}>Não</button>
                          </>
                        ) : (
                          <>
                            <Link role="menuitem" className="dz-menu-item" to={`/projeto/${p.id}`} onClick={close}>Abrir</Link>
                            <button type="button" role="menuitem" className="dz-menu-item" onClick={() => { close(); void copyCard(p.id, p.name); }}>Copiar card</button>
                            <Link role="menuitem" className="dz-menu-item" to={`/card/${p.id}`} onClick={close}>Editar o card</Link>
                            <Link role="menuitem" className="dz-menu-item" to={`/comparar?a=${p.id}`} onClick={close}>Comparar</Link>
                            {token && !p.isSample && <button type="button" role="menuitem" className="dz-menu-item" onClick={() => { close(); void toggleShare(p.id); }}>{p.shared ? 'Parar de compartilhar' : 'Compartilhar'}</button>}
                            <button type="button" role="menuitem" className="dz-menu-item" onClick={() => { close(); duplicate(p.id); }}>Duplicar</button>
                            <button type="button" role="menuitem" className="dz-menu-item" onClick={() => { close(); setRenaming(p.id); }}>Renomear</button>
                            <button type="button" role="menuitem" className="dz-menu-item" onClick={() => { close(); void copyLink(p.id); }}>Copiar link</button>
                            <button type="button" role="menuitem" className="dz-menu-item" onClick={() => { close(); const full = loadProject(p.id); if (full) downloadProject(full); }}>Exportar</button>
                            <button type="button" role="menuitem" className="dz-menu-item danger" onClick={() => setConfirmDelete(p.id)}>{p.id === SAMPLE_ID ? 'Restaurar' : 'Apagar'}</button>
                          </>
                        )
                      }
                    </Menu>
                  </div>
                  {renaming === p.id && (
                    <div className="vt-rename">
                      <input
                        className="dz-input"
                        autoFocus
                        defaultValue={p.name}
                        aria-label="Novo nome do time"
                        onBlur={(e) => rename(p.id, e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setRenaming(null); }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
            {!filtered && (
              <li className="vt-card vt-new" aria-label="Novo time">
                <div className="vt-new-body" style={{ aspectRatio: `${POSTER_SIZE[cardFormat].w} / ${POSTER_SIZE[cardFormat].h}` }}>
                  {newOpen ? (
                    <div className="vt-opts">
                      <button type="button" className="vt-opt gold" onClick={createNew}>
                        <i aria-hidden="true">✦</i><span><b>Novo time</b><small>Monte do zero, passo a passo</small></span>
                      </button>
                      <button type="button" className="vt-opt" disabled={busy} onClick={() => jsonInput.current?.click()}>
                        <i aria-hidden="true">⤓</i><span><b>Importar arquivo</b><small>Projeto .json exportado</small></span>
                      </button>
                      <label className="vt-opt vt-optlink">
                        <i aria-hidden="true">∞</i>
                        <span><b>Importar por link</b>
                          <input value={linkText} placeholder="Cole o link do time aqui" aria-label="Link do time" disabled={busy}
                            onChange={(e) => { setLinkText(e.target.value); if (e.target.value.includes('time=')) { importLink(e.target.value); setLinkText(''); } }} />
                        </span>
                      </label>
                      <button type="button" className="vt-close" onClick={() => setNewOpen(false)}>Fechar</button>
                    </div>
                  ) : (
                    <button type="button" className="vt-plus" aria-label="Adicionar time" onClick={() => setNewOpen(true)}>+</button>
                  )}
                </div>
              </li>
            )}
          </ul>
        )}
      </main>
    </div>
  );
}

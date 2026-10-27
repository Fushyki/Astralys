/** Vault (/vault): todos os times criados, como cartões com a mesma cara dos cartões de personagem da Equipe. */
import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import { elementColor } from '../design/elements';
import { CharacterAvatar } from '../design/primitives';
import { useGameData } from '../features/rotation/data';
import { downloadProject, importJson, importXlsx, type ImportResult } from '../features/rotation/importFile';
import { SAMPLE_ID, cloneProject, deleteStoredProject, listProjects, loadProject, saveProject, sampleForApp } from '../features/rotation/persistence';
import { useProjectCards } from '../features/rotation/useProjectCards';
import { Menu } from '../design/Menu';
import { PosterCard, ScaledPoster } from './card/PosterCard';
import { deleteRemote } from '../online/api';
import { ONLINE_ENABLED } from '../online/config';
import { useSession } from '../online/session';
import { summaryText, syncNow } from '../online/syncNow';
import { NO_FILTERS, NO_PATCH, filterProjects, patchesOf, type VaultFilters } from '../features/vault/vaultModel';
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
  const xlsxInput = useRef<HTMLInputElement>(null);
  const jsonInput = useRef<HTMLInputElement>(null);

  const refresh = () => setItems(listProjects());
  const characters = data?.game.characters ?? [];
  const characterOf = (name: string) => characters.find((c) => c.name === name);
  const elementOf = (name: string) => characterOf(name)?.element;
  const cards = useProjectCards(items.map((i) => i.id), data, items.map((i) => i.id + i.updatedAt).join());

  const visible = useMemo(() => filterProjects(items, filters, elementOf), [items, filters, characters]);
  const allCharacters = useMemo(() => [...new Set(items.flatMap((p) => p.members))].sort(), [items]);
  const patches = useMemo(() => patchesOf(items), [items]);
  const hasUnversioned = items.some((p) => !p.gameVersion);
  const set = (patch: Partial<VaultFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const edit = (id: string, fn: (p: NonNullable<ReturnType<typeof loadProject>>) => ReturnType<typeof loadProject>) => {
    const p = loadProject(id);
    const next = p && fn(p);
    if (next) saveProject(next);
    refresh();
  };
  const toggleFavorite = (id: string) => edit(id, (p) => ({ ...p, meta: { ...p.meta, favorite: !p.meta.favorite, updatedAt: new Date().toISOString() } }));
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

  const filtered = filters.query || filters.character || filters.element || filters.favoritesOnly || filters.patch;

  return (
    <div className="dz">
      <AppHeader />
      <main className="dz-page">
        <section className="dz-pagehead">
          <div className="titles">
            <h1 className="h1">Times</h1>
            <span className="muted">{items.length} {items.length === 1 ? 'time salvo' : 'times salvos'} neste navegador. {token ? 'Use "Sincronizar com a conta" para guardá-los também online.' : 'Nada sai do seu navegador.'}</span>
          </div>
          <div className="actions">
            <Menu label="Importar e sincronizar ▾" ariaLabel="Importar e sincronizar">
              {(close) => (
                <>
                  <button type="button" role="menuitem" className="dz-menu-item" disabled={busy || !data} onClick={() => { close(); xlsxInput.current?.click(); }} title="Importa a planilha de theorycraft (abas Time e Rotação)">Importar planilha .xlsx</button>
                  <button type="button" role="menuitem" className="dz-menu-item" disabled={busy} onClick={() => { close(); jsonInput.current?.click(); }} title="Abre um projeto exportado pelo Astralys">Importar projeto .json</button>
                  {ONLINE_ENABLED && (token
                    ? <button type="button" role="menuitem" className="dz-menu-item" disabled={syncing} onClick={() => { close(); void sync(); }} title="Envia os times mais novos para a conta e baixa os que só existem nela">{syncing ? 'Sincronizando…' : 'Sincronizar com a conta'}</button>
                    : <Link to="/entrar" role="menuitem" className="dz-menu-item" onClick={close} title="Guarde seus times fora deste navegador">Entrar para sincronizar</Link>)}
                </>
              )}
            </Menu>
            <button type="button" className="dz-btn gold" onClick={createNew}>Novo time</button>
            <input ref={xlsxInput} type="file" accept=".xlsx,.xlsm" hidden aria-label="Escolher planilha" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f && data) void run(() => importXlsx(f, data)); }} />
            <input ref={jsonInput} type="file" accept=".json,application/json" hidden aria-label="Escolher projeto" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void run(() => importJson(f, data)); }} />
          </div>
        </section>

        {error && <p className="dz-error" role="alert">{error}</p>}
        {shareMsg && <p className="dz-error vt-share" role="status">{shareMsg}</p>}
        {notes.length > 0 && <div className="dz-error vt-notes" role="status">{notes.map((n, i) => <p key={i}>{n}</p>)}</div>}

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
          {(patches.length > 0 || hasUnversioned) && (
            <select className="dz-input" aria-label="Patch" value={filters.patch} onChange={(e) => set({ patch: e.target.value })}>
              <option value="">Todos os patches</option>
              {patches.map((v) => <option key={v} value={v}>Patch {v}</option>)}
              {hasUnversioned && <option value={NO_PATCH}>Sem patch registrado</option>}
            </select>
          )}
          <button type="button" className="dz-btn" aria-pressed={filters.favoritesOnly} onClick={() => set({ favoritesOnly: !filters.favoritesOnly })}>★ Favoritos</button>
          {filtered && <Button variant="ghost" size="sm" onClick={() => setFilters(NO_FILTERS)}>Limpar filtros</Button>}
        </section>

        {visible.length === 0 ? (
          <div className="dz-panel vt-empty">
            <h2 className="h2">Nenhum time encontrado</h2>
            <p className="muted">{filtered ? 'Nenhum time bate com esses filtros.' : 'Crie um time ou importe uma planilha para começar.'}</p>
          </div>
        ) : (
          <ul className="dz-grid c3 vt-list">
            {visible.map((p) => {
              const model = cards[p.id];
              const lead = p.members[0] ? elementColor(elementOf(p.members[0])) : '#e9c46a';
              return (
                <li key={p.id} className="vt-card" data-id={p.id} data-name={p.name} style={{ ['--c' as string]: lead }}>
                  <Link className="vt-poster" to={`/projeto/${p.id}`} aria-label={`Abrir ${p.name}`}>
                    {model && model !== 'error' ? (
                      <ScaledPoster format="portrait"><PosterCard model={model} format="portrait" /></ScaledPoster>
                    ) : (
                      <div className="vt-wait">
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
                            <Link role="menuitem" className="dz-menu-item" to={`/card/${p.id}`} onClick={close}>Editar o card</Link>
                            <Link role="menuitem" className="dz-menu-item" to={`/comparar?a=${p.id}`} onClick={close}>Comparar</Link>
                            {token && !p.isSample && <button type="button" role="menuitem" className="dz-menu-item" onClick={() => { close(); void toggleShare(p.id); }}>{p.shared ? 'Parar de compartilhar' : 'Compartilhar'}</button>}
                            <button type="button" role="menuitem" className="dz-menu-item" onClick={() => { close(); duplicate(p.id); }}>Duplicar</button>
                            <button type="button" role="menuitem" className="dz-menu-item" onClick={() => { close(); setRenaming(p.id); }}>Renomear</button>
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
          </ul>
        )}
      </main>
    </div>
  );
}

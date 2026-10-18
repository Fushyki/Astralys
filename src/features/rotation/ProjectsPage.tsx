/**
 * Meus projetos (o "cofre"): lista os projetos salvos neste navegador, cria cópias, importa a planilha .xlsx ou um
 * JSON exportado, renomeia, exporta e apaga. Tudo fica no navegador (localStorage); nada é enviado a servidor.
 */
import { useRef, useState } from 'react';
import '../../ui/ast.css';
import { Link, useNavigate } from 'react-router-dom';
import { formatInt } from '../../ui/format';
import { useGameData } from './data';
import { downloadProject, importJson, importXlsx, type ImportResult } from './importFile';
import { SAMPLE_ID, cloneProject, deleteStoredProject, listProjects, loadProject, saveProject, type ProjectSummary } from './persistence';

const when = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { data } = useGameData();
  const [items, setItems] = useState<ProjectSummary[]>(() => listProjects());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const xlsxInput = useRef<HTMLInputElement>(null);
  const jsonInput = useRef<HTMLInputElement>(null);
  const refresh = () => setItems(listProjects());

  const finish = (r: ImportResult) => {
    if (!saveProject(r.project)) throw new Error('Não foi possível salvar: o armazenamento do navegador está cheio ou bloqueado.');
    setNotes(r.warnings);
    if (r.warnings.length === 0) navigate(`/rotacao/${r.project.id}`);
    else {
      refresh();
      setNotes([`"${r.project.name}" foi importado com avisos:`, ...r.warnings]);
    }
  };

  const run = async (fn: () => Promise<ImportResult>) => {
    setBusy(true);
    setError(null);
    setNotes([]);
    try {
      finish(await fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const duplicate = (id: string) => {
    const p = loadProject(id);
    if (!p) return;
    const copy = cloneProject(p);
    saveProject(copy);
    refresh();
  };

  const rename = (id: string, name: string) => {
    const p = loadProject(id);
    setRenaming(null);
    const trimmed = name.trim();
    if (!p || !trimmed || trimmed === p.name) return;
    saveProject({ ...p, name: trimmed, meta: { ...p.meta, updatedAt: new Date().toISOString() } });
    refresh();
  };

  const remove = (id: string) => {
    deleteStoredProject(id);
    setConfirmDelete(null);
    refresh();
  };

  return (
    <div className="ast-app">
      <div className="ast-shell">
        <header className="ast-title">
          <h1 className="ast-caps">Meus projetos</h1>
          <span className="ast-sub">Salvos neste navegador</span>
          <Link className="ast-btn" to="/">Voltar ao site</Link>
        </header>

        <div className="ast-toolbar">
          <button type="button" className="ast-btn sm" disabled={busy || !data} onClick={() => xlsxInput.current?.click()} title="Importa a planilha de theorycraft (abas Time e Rotação)">
            Importar planilha .xlsx
          </button>
          <button type="button" className="ast-btn sm" disabled={busy} onClick={() => jsonInput.current?.click()} title="Abre um projeto exportado pelo Astralys">
            Importar projeto .json
          </button>
          <span className="grow">{busy ? 'Importando…' : 'Os projetos não saem do seu navegador.'}</span>
          <input ref={xlsxInput} type="file" accept=".xlsx,.xlsm" hidden aria-label="Escolher planilha" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f && data) void run(() => importXlsx(f, data)); }} />
          <input ref={jsonInput} type="file" accept=".json,application/json" hidden aria-label="Escolher projeto" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void run(() => importJson(f)); }} />
        </div>

        {error && <p className="ast-error" role="alert" style={{ margin: 18 }}>{error}</p>}
        {notes.length > 0 && (
          <div className="ast-notice" role="status" style={{ display: 'block' }}>
            {notes.map((n, i) => (<p key={i} style={{ margin: '2px 0' }}>{n}</p>))}
          </div>
        )}

        <ul className="ast-projects">
          {items.map((p) => (
            <li key={p.id} className="ast-project" data-id={p.id}>
              <div className="top">
                {renaming === p.id ? (
                  <input
                    autoFocus
                    defaultValue={p.name}
                    aria-label="Novo nome do projeto"
                    onBlur={(e) => rename(p.id, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setRenaming(null); }}
                  />
                ) : (
                  <Link className="name" to={`/rotacao/${p.id}`}>{p.name}</Link>
                )}
                {p.isSample && <span className="ast-flag">exemplo</span>}
              </div>
              <p className="meta">
                {p.members.join(', ')} · {formatInt(p.actions)} golpes{p.updatedAt ? ` · ${when(p.updatedAt)}` : ''}
              </p>
              <p className="acts">
                <Link className="ast-link" to={`/rotacao/${p.id}`}>Abrir</Link>
                <button type="button" className="ast-link" onClick={() => duplicate(p.id)}>Duplicar</button>
                <button type="button" className="ast-link" onClick={() => setRenaming(p.id)}>Renomear</button>
                <button type="button" className="ast-link" onClick={() => { const full = loadProject(p.id); if (full) downloadProject(full); }}>Exportar</button>
                {confirmDelete === p.id ? (
                  <>
                    <span className="warn">{p.id === SAMPLE_ID ? 'Voltar ao exemplo original?' : 'Apagar de vez?'}</span>
                    <button type="button" className="ast-link" onClick={() => remove(p.id)}>Sim</button>
                    <button type="button" className="ast-link" onClick={() => setConfirmDelete(null)}>Não</button>
                  </>
                ) : (
                  <button type="button" className="ast-link" onClick={() => setConfirmDelete(p.id)}>{p.id === SAMPLE_ID ? 'Restaurar' : 'Apagar'}</button>
                )}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

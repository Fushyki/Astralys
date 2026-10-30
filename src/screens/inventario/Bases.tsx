/** Bases de dados do inventário (como no Genshin Optimizer) e a prévia da importação: novos, atualizados, iguais e fora do arquivo. */
import { useMemo, useState } from 'react';
import { DEFAULT_IMPORT, applyImport, diffGood, summarize, type ImportOptions } from '../../features/good/goodDiff';
import type { Good } from '../../features/good/goodImport';
import { deleteStoredProject, projectIdsOfDatabase } from '../../features/rotation/persistence';
import { createDatabase, deleteDatabase, listDatabases, loadDatabase, renameDatabase, saveGood, setActiveDatabase, type DatabaseInfo } from '../../features/good/goodStore';
import { formatInt } from '../../ui/format';

const when = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

export function DatabaseList({ activeId, onChange }: { activeId: string | null; onChange: () => void }) {
  const list = listDatabases();
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  if (list.length === 0) return null;
  const download = (d: DatabaseInfo) => {
    const g = loadDatabase(d.id);
    if (!g) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(g)], { type: 'application/json' }));
    a.download = `${d.name.replace(/[^\w.-]+/g, '_')}.GOOD.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <section className="inv-dbs" aria-label="Bases de dados">
      <h2 className="inv-h">Bases de dados</h2>
      <ul>
        {list.map((d) => (
          <li key={d.id} data-active={d.id === activeId ? '' : undefined}>
            <div className="who">
              {editing === d.id ? (
                <input
                  className="dz-input"
                  autoFocus
                  value={name}
                  maxLength={40}
                  aria-label="Nome da base"
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => { renameDatabase(d.id, name); setEditing(null); onChange(); }}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                />
              ) : (
                <b className="nm">{d.name}{d.id === activeId && <i className="on">em uso</i>}</b>
              )}
              <span className="num sub">{formatInt(d.characters)} personagens · {formatInt(d.artifacts)} artefatos · {formatInt(d.weapons)} armas · {when(d.updatedAt)}</span>
            </div>
            <div className="acts">
              {d.id !== activeId && <button type="button" className="dz-btn" onClick={() => { setActiveDatabase(d.id); onChange(); }}>Usar esta</button>}
              <button type="button" className="dz-btn" onClick={() => { setName(d.name); setEditing(d.id); }}>Renomear</button>
              <button type="button" className="dz-btn" onClick={() => download(d)} title="Baixa a base como arquivo GOOD (.json)">Exportar</button>
              <button type="button" className="dz-btn" onClick={() => { const teams = projectIdsOfDatabase(d.id); if (window.confirm(`Excluir a base "${d.name}" e ${teams.length === 1 ? 'o time' : `os ${teams.length} times`} dela? As outras bases não mudam.`)) { teams.forEach(deleteStoredProject); deleteDatabase(d.id); onChange(); } }}>Excluir</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const ROWS = [['artifacts', 'Artefatos'], ['weapons', 'Armas'], ['characters', 'Personagens']] as const;

/** Prévia de um arquivo recém-lido: escolha a base de destino, veja o que muda e confirme. */
export function ImportPreview({ incoming, fileName, activeId, onDone, onCancel }: { incoming: Good; fileName: string; activeId: string | null; onDone: (msg: string) => void; onCancel: () => void }) {
  const list = listDatabases();
  const [target, setTarget] = useState<string>(activeId ?? 'new');
  const [newName, setNewName] = useState(() => fileName.replace(/\.[^.]+$/, '').replace(/\.GOOD$/i, '') || `Base ${list.length + 1}`);
  const [opts, setOpts] = useState<ImportOptions>(DEFAULT_IMPORT);
  const base = useMemo(() => (target === 'new' ? null : loadDatabase(target)), [target]);
  const diff = useMemo(() => diffGood(base, incoming), [base, incoming]);
  const sum = { artifacts: summarize(diff.artifacts), weapons: summarize(diff.weapons), characters: summarize(diff.characters) };
  const set = (k: keyof ImportOptions, v: boolean) => setOpts((o) => ({ ...o, [k]: v }));

  const confirm = () => {
    const result = applyImport(base, incoming, opts);
    const ok = target === 'new' ? createDatabase(newName, result) : saveGood(result, target) && target;
    if (!ok) return onDone('Não foi possível guardar: o armazenamento do navegador está cheio ou bloqueado.');
    setActiveDatabase(typeof ok === 'string' ? ok : target);
    onDone(`Importado em "${target === 'new' ? newName : list.find((d) => d.id === target)?.name}": ${formatInt(result.artifacts.length)} artefatos, ${formatInt(result.weapons.length)} armas e ${formatInt(result.characters.length)} personagens.`);
  };

  return (
    <section className="inv-preview" aria-label="Prévia da importação">
      <h2 className="inv-h">Importar {fileName}</h2>
      <div className="row">
        <label className="dz-field">
          <span>Importar para</span>
          <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Base de destino">
            {list.map((d) => <option key={d.id} value={d.id}>{d.name}{d.id === activeId ? ' (em uso)' : ''}</option>)}
            <option value="new">Nova base…</option>
          </select>
        </label>
        {target === 'new' && (
          <label className="dz-field">
            <span>Nome da nova base</span>
            <input value={newName} maxLength={40} onChange={(e) => setNewName(e.target.value)} aria-label="Nome da nova base" />
          </label>
        )}
      </div>

      <table className="inv-diff">
        <thead><tr><th /><th>Novos</th><th>Atualizados</th><th>Iguais</th><th>Fora do arquivo</th></tr></thead>
        <tbody>
          {ROWS.map(([k, label]) => (
            <tr key={k}>
              <th scope="row">{label}</th>
              <td className="num">{formatInt(sum[k].added)}</td>
              <td className="num">{formatInt(sum[k].updated)}</td>
              <td className="num">{formatInt(sum[k].unchanged)}</td>
              <td className="num" data-warn={sum[k].missing > 0 ? '' : undefined}>{formatInt(sum[k].missing)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {base && (
        <div className="opts">
          <label className="dz-check"><input type="checkbox" checked={opts.updateExisting} onChange={(e) => set('updateExisting', e.target.checked)} /> Atualizar os itens que já existem com a versão do arquivo</label>
          <label className="dz-check"><input type="checkbox" checked={opts.deleteMissingItems} onChange={(e) => set('deleteMissingItems', e.target.checked)} /> Apagar armas e artefatos da base que não estão no arquivo ({formatInt(sum.weapons.missing + sum.artifacts.missing)})</label>
          <label className="dz-check"><input type="checkbox" checked={opts.deleteMissingCharacters} onChange={(e) => set('deleteMissingCharacters', e.target.checked)} /> Apagar personagens da base que não estão no arquivo ({formatInt(sum.characters.missing)})</label>
        </div>
      )}

      <div className="row">
        <button type="button" className="dz-btn gold" onClick={confirm}>Importar</button>
        <button type="button" className="dz-btn" onClick={onCancel}>Cancelar</button>
      </div>
    </section>
  );
}

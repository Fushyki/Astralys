/** Bases de dados do inventário (como no Genshin Optimizer) e a prévia da importação: novos, atualizados, iguais e fora do arquivo. */
import { toast } from '../../app/toast';
import { useMemo, useState } from 'react';
import { DEFAULT_IMPORT, applyImport, diffGood, summarize, type ImportOptions } from '../../features/good/goodDiff';
import type { Good } from '../../features/good/goodImport';
import { deleteStoredProject, projectIdsOfDatabase } from '../../features/rotation/persistence';
import { createDatabase, deleteDatabase, listDatabases, loadDatabase, renameDatabase, saveGood, setActiveDatabase, type DatabaseInfo } from '../../features/good/goodStore';
import { Menu } from '../../design/Menu';
import { formatInt } from '../../ui/format';

const when = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

export const EMPTY_GOOD: Good = { format: 'GOOD', source: 'Astralys', characters: [], weapons: [], artifacts: [] };

/** Barra da base em uso: mostra só a base atual e troca de base por um menu (renomear, exportar, excluir e nova base ficam nele). */
export function BaseBar({ activeId, onChange }: { activeId: string | null; onChange: () => void }) {
  const list = listDatabases();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  if (list.length === 0) return null;
  const active = list.find((d) => d.id === activeId) ?? list[0];
  const exportActive = () => {
    const g = loadDatabase(active.id);
    if (!g) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(g)], { type: 'application/json' }));
    a.download = `${active.name.replace(/[^\w.-]+/g, '_')}.GOOD.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast(`Base exportada: ${a.download}`);
  };
  const remove = () => {
    const teams = projectIdsOfDatabase(active.id);
    if (!window.confirm(`Excluir a base "${active.name}" e ${teams.length === 1 ? 'o time' : `os ${teams.length} times`} dela? As outras bases não mudam.`)) return;
    teams.forEach(deleteStoredProject);
    deleteDatabase(active.id);
    toast(`Base "${active.name}" excluída.`);
    onChange();
  };
  return (
    <section className="inv-basebar" aria-label="Base de dados em uso">
      <span className="k">Base em uso</span>
      {editing ? (
        <input className="dz-input" autoFocus value={name} maxLength={40} aria-label="Nome da base" onChange={(e) => setName(e.target.value)}
          onBlur={() => { renameDatabase(active.id, name); setEditing(false); onChange(); }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditing(false); }} />
      ) : (
        <Menu label={<><b className="nm">{active.name}</b><i aria-hidden="true">▾</i></>} ariaLabel="Trocar de base" className="inv-basebtn" align="left">
          {(close) => (
            <>
              {list.map((d) => (
                <button key={d.id} type="button" role="menuitem" className="dz-menu-item inv-baseitem" aria-current={d.id === active.id ? 'true' : undefined}
                  onClick={() => { close(); if (d.id !== active.id) { setActiveDatabase(d.id); toast(`Base "${d.name}" em uso.`); onChange(); } }}>
                  <b>{d.name}</b>
                  <small className="num">{formatInt(d.artifacts)} artefatos · {formatInt(d.weapons)} armas · {formatInt(d.characters)} personagens</small>
                </button>
              ))}
              <hr className="inv-sep" />
              <button type="button" role="menuitem" className="dz-menu-item" onClick={() => { close(); const id = createDatabase(`Base ${list.length + 1}`, EMPTY_GOOD); if (id) { setActiveDatabase(id); toast('Base nova criada e em uso.'); onChange(); } }}>＋ Nova base vazia</button>
            </>
          )}
        </Menu>
      )}
      <span className="num sub">{formatInt(active.characters)} personagens · {formatInt(active.artifacts)} artefatos · {formatInt(active.weapons)} armas · {when(active.updatedAt)}</span>
      <Menu label="⋯" ariaLabel="Opções da base" className="dz-iconbtn">
        {(close) => (
          <>
            <button type="button" role="menuitem" className="dz-menu-item" onClick={() => { close(); setName(active.name); setEditing(true); }}>Renomear</button>
            <button type="button" role="menuitem" className="dz-menu-item" onClick={() => { close(); exportActive(); }} title="Baixa a base como arquivo GOOD (.json)">Exportar</button>
            <button type="button" role="menuitem" className="dz-menu-item danger" onClick={() => { close(); remove(); }}>Excluir</button>
          </>
        )}
      </Menu>
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

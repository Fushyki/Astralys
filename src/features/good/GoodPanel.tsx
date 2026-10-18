/**
 * Painel "Inventário (GOOD)": importa o arquivo exportado pelo Genshin Optimizer e aplica o build real de um
 * personagem (arma, sets, main stats e a soma exata dos substats) ao membro selecionado.
 */
import { useRef, useState } from 'react';
import { Hint, Panel } from '../../ui/components';
import { formatInt } from '../../ui/format';
import type { LoadedData } from '../rotation/data';
import { useRotationStore } from '../rotation/store';
import { buildFromGood, goodCharacterNames, parseGood, type Good } from './goodImport';
import { clearGood, loadGood, saveGood } from './goodStore';

export function GoodPanel({ data, name, index }: { data: LoadedData; name: string; index: number }) {
  const update = useRotationStore((s) => s.updateMember);
  const [good, setGood] = useState<Good | null>(() => loadGood());
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);

  const onFile = async (file: File) => {
    setError(null);
    setNotes([]);
    try {
      const g = parseGood(JSON.parse(await file.text()));
      if (!saveGood(g)) throw new Error('Não foi possível guardar o inventário: o armazenamento do navegador está cheio ou bloqueado.');
      setGood(g);
    } catch (e) {
      setError(e instanceof SyntaxError ? 'O arquivo não é um JSON válido.' : e instanceof Error ? e.message : String(e));
    }
  };

  const apply = () => {
    if (!good) return;
    try {
      const b = buildFromGood(good, name, data.game);
      update(index, b.patch);
      setNotes([`Build de ${name} aplicado do inventário${b.refinement ? ` (arma R${b.refinement})` : ''}.`, ...b.notes]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const available = good ? goodCharacterNames(good, data.game.characters) : [];
  const has = available.includes(name);

  return (
    <Panel title="Inventário (GOOD)" wide>
      <Hint>
        Importe o arquivo do Genshin Optimizer (Configurações, Baixar dados) para usar o build real dos seus personagens: arma, sets, main stats e a soma exata dos substats das peças equipadas. O arquivo fica só no seu navegador.
      </Hint>
      <div className="ast-full ast-good">
        <div className="acts">
          <button type="button" className="ast-btn sm" onClick={() => input.current?.click()}>
            {good ? 'Trocar o inventário' : 'Importar inventário GOOD'}
          </button>
          {good && (
            <button type="button" className="ast-btn sm" onClick={() => { clearGood(); setGood(null); setNotes([]); }}>Remover o inventário</button>
          )}
          <input ref={input} type="file" accept=".json,application/json" hidden aria-label="Escolher inventário GOOD" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void onFile(f); }} />
        </div>
        {good && (
          <p className="summary">
            {formatInt(good.characters.length)} personagens, {formatInt(good.weapons.length)} armas e {formatInt(good.artifacts.length)} artefatos{good.source ? ` (exportado por ${good.source})` : ''}.
          </p>
        )}
        {good && (
          <div className="acts">
            <button type="button" className="ast-btn" disabled={!has} onClick={apply} title={has ? undefined : `${name} não está neste inventário`}>
              Aplicar o build de {name}
            </button>
            {!has && <span className="ast-hint" style={{ margin: 0 }}>{name} não está neste inventário.</span>}
          </div>
        )}
        {error && <p className="ast-error" role="alert">{error}</p>}
        {notes.length > 0 && (
          <ul className="notes" role="status">
            {notes.map((n, i) => (<li key={i}>{n}</li>))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

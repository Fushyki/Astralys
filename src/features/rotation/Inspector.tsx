/**
 * Inspetor: edita o golpe ou a janela de buff selecionados na linha do tempo e mostra a cascata de multiplicadores
 * do golpe. Os campos numéricos confirmam ao sair do campo ou com Enter (uma entrada no histórico por edição).
 */
import { hitWaterfall, type ActionResult, type ActionRef, type RotationProject } from '../../engine';
import { Hint, Panel } from '../../ui/components';
import { NumberField } from '../../ui/NumberField';
import { formatDecimal, formatInt } from '../../ui/format';
import type { BuffLane } from './buffLanes';
import { useRotationStore } from './store';

const REACTIONS: [ActionRef['reaction'], string][] = [
  ['none', 'Sem reação'],
  ['melt', 'Derreter'],
  ['vaporize', 'Vaporizar'],
  ['spread', 'Espalhar'],
  ['aggravate', 'Intensificar'],
];

function ActionEditor({ action, result, lanes }: { action: ActionRef; result?: ActionResult; lanes: BuffLane[] }) {
  const update = useRotationStore((s) => s.updateAction);
  const setSource = useRotationStore((s) => s.setTagSource);
  const duplicate = useRotationStore((s) => s.duplicateAction);
  const remove = useRotationStore((s) => s.removeAction);
  const label = new Map(lanes.map((l) => [l.tag, l.label]));
  const name = action.displayName ?? `${action.move.character} - ${action.move.label}`;
  const steps = result ? hitWaterfall(result, 'avg') : [];
  const top = steps.reduce((m, s) => Math.max(m, s.value), 0);

  return (
    <>
      <p className="ast-sel-title">{name}</p>
      <div className="ast-fields">
        <NumberField label="Instante" value={action.time} min={0} step={0.1} suffix="s" onCommit={(v) => update(action.id, { time: v })} />
        <NumberField label="Execuções" value={action.executions} min={1} step={1} suffix="×" onCommit={(v) => update(action.id, { executions: Math.round(v) })} />
        <NumberField label="Ajuste de DMG%" value={Math.round(action.dmgAdjust * 1000) / 10} step={0.5} suffix="%" onCommit={(v) => update(action.id, { dmgAdjust: v / 100 })} />
        <label className="ast-field">
          <span>Reação</span>
          <select value={action.reaction} onChange={(e) => update(action.id, { reaction: e.target.value as ActionRef['reaction'] })}>
            {REACTIONS.map(([v, text]) => (
              <option key={v} value={v}>{text}</option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="ast-source">
        <legend>Buffs de time deste golpe</legend>
        <label>
          <input type="radio" name={`src-${action.id}`} checked={action.tagSource === 'windows'} onChange={() => setSource(action.id, 'windows')} />
          Seguir as janelas de buff
        </label>
        <label>
          <input type="radio" name={`src-${action.id}`} checked={action.tagSource === 'manual'} onChange={() => setSource(action.id, 'manual')} />
          Perfil fixo (como na planilha)
        </label>
        <p className="ast-hint" style={{ margin: '6px 0 0' }}>
          {result && result.action.activeTags.length > 0
            ? `Ativos agora: ${result.action.activeTags.map((t) => label.get(t) ?? t).join(', ')}.`
            : 'Nenhum buff de time ativo neste golpe.'}
        </p>
      </fieldset>

      <div className="ast-actions-row">
        <button type="button" className="ast-btn sm" onClick={() => duplicate(action.id)}>Duplicar</button>
        <button type="button" className="ast-btn sm danger" onClick={() => remove(action.id)}>Apagar</button>
      </div>

      {steps.length > 0 && (
        <div className="ast-wf-block">
          <p className="ast-sel-title small">Cascata deste golpe</p>
          <div className="ast-wf">
            {steps.map((s, i) => (
              <div className={`wr${s.factor < 1 ? ' cut' : ''}`} key={s.key}>
                <span>{s.label}</span>
                <span className="tr"><i style={{ width: `${top > 0 ? (s.value / top) * 100 : 0}%` }} /></span>
                <span className="num">{i ? `× ${formatDecimal(s.factor, 3)} = ` : ''}<b>{formatInt(s.value)}</b></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function WindowEditor({ id, project, lanes }: { id: string; project: RotationProject; lanes: BuffLane[] }) {
  const update = useRotationStore((s) => s.updateWindow);
  const remove = useRotationStore((s) => s.removeWindow);
  const w = project.buffWindows.find((x) => x.id === id);
  if (!w) return null;
  const lane = lanes.find((l) => l.tag === w.tag);
  return (
    <>
      <p className="ast-sel-title">Janela: {lane?.label ?? w.tag}</p>
      <div className="ast-fields">
        <NumberField label="Início" value={w.start} min={0} step={0.1} suffix="s" onCommit={(v) => update(w.id, { start: v })} />
        <NumberField label="Fim" value={w.end} min={0} step={0.1} suffix="s" onCommit={(v) => update(w.id, { end: v })} />
      </div>
      {lane && <p className="ast-hint" style={{ whiteSpace: 'pre-line' }}>{lane.detail}</p>}
      <div className="ast-actions-row">
        <button type="button" className="ast-btn sm danger" onClick={() => remove(w.id)}>Apagar janela</button>
      </div>
    </>
  );
}

export function Inspector({ project, results, lanes }: { project: RotationProject; results: ActionResult[]; lanes: BuffLane[] }) {
  const selectedActionId = useRotationStore((s) => s.selectedActionId);
  const selectedWindowId = useRotationStore((s) => s.selectedWindowId);
  const action = project.actions.find((a) => a.id === selectedActionId);
  const result = results.find((r) => r.action.id === selectedActionId);

  return (
    <Panel title="Item selecionado">
      {action ? (
        <ActionEditor action={action} result={result} lanes={lanes} />
      ) : selectedWindowId ? (
        <WindowEditor id={selectedWindowId} project={project} lanes={lanes} />
      ) : (
        <Hint>Clique numa estrela ou numa janela de buff para editar. Aqui aparecem o instante, as execuções, a reação e a cascata de multiplicadores do golpe.</Hint>
      )}
    </Panel>
  );
}

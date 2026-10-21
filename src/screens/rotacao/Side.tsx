/** Coluna direita da Rotação: golpe selecionado (cascata e edição), buffs que o cobrem e a edição de janelas. */
import { useMemo } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { NumberInput, SelectField } from '../../design/fields';
import { Panel } from '../../design/primitives';
import type { ActionRef } from '../../engine';
import { REACTION_LABEL } from '../../features/character/characterModel';
import { coveringBuffs, hitCascade, type LaneInfo } from '../../features/rotation/rotationModel';
import { useRotationStore } from '../../features/rotation/store';
import { formatDecimal, formatInt, formatPercent } from '../../ui/format';

const REACTIONS: ActionRef['reaction'][] = ['none', 'melt', 'vaporize', 'spread', 'aggravate'];
/** '' = elemento padrão do golpe (o do personagem); 'Physical' = golpe sem infusão. */
const ELEMENTS = ['', 'Physical', 'Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo'] as const;
const ELEMENT_LABEL: Record<(typeof ELEMENTS)[number], string> = { '': 'Padrão (do personagem)', Physical: 'Físico', Pyro: 'Pyro', Hydro: 'Hydro', Anemo: 'Anemo', Electro: 'Electro', Dendro: 'Dendro', Cryo: 'Cryo', Geo: 'Geo' };

export function SelectedHit({ v, lanes }: { v: ProjectView; lanes: LaneInfo[] }) {
  const selectedActionId = useRotationStore((s) => s.selectedActionId);
  const selectedWindowId = useRotationStore((s) => s.selectedWindowId);
  const action = v.project.actions.find((a) => a.id === selectedActionId);
  const result = v.bundle.optimization.result.actions.find((r) => r.action.id === selectedActionId);

  if (action && result) return <HitPanels v={v} action={action} result={result} lanes={lanes} />;
  if (selectedWindowId) return <WindowPanel v={v} id={selectedWindowId} lanes={lanes} />;
  return (
    <Panel title="Golpe selecionado">
      <p className="note">Clique num golpe ou numa barra de buff para ver a cascata de multiplicadores, os buffs que o cobrem e editar o instante, as execuções e a reação.</p>
    </Panel>
  );
}

function HitPanels({ v, action, result, lanes }: { v: ProjectView; action: ActionRef; result: ProjectView['bundle']['optimization']['result']['actions'][number]; lanes: LaneInfo[] }) {
  const update = useRotationStore((s) => s.updateAction);
  const setSource = useRotationStore((s) => s.setTagSource);
  const duplicate = useRotationStore((s) => s.duplicateAction);
  const remove = useRotationStore((s) => s.removeAction);
  const steps = hitCascade(result);
  const total = v.bundle.optimization.result.totals.avg;
  const name = action.displayName ?? `${action.move.character} - ${action.move.label}`;
  const covering = useMemo(() => coveringBuffs(v.project, v.resolved, v.bundle, action.id), [v.project, v.resolved, v.bundle, action.id]);
  const topLoss = covering[0]?.loss || 1;
  const label = new Map(lanes.map((l) => [l.tag, l.source]));

  return (
    <>
      <Panel title="Golpe selecionado">
        <div style={{ display: 'grid', gap: 4 }}>
          <span className="rt-hitname">{name}</span>
          <span className="muted small num">
            {formatDecimal(action.time, 1)} s · {result.action.move.hits * action.executions} {result.action.move.hits * action.executions === 1 ? 'hit' : 'hits'} · {REACTION_LABEL[action.reaction]} · {formatPercent(total > 0 ? result.avg / total : 0)} do dano do time
          </span>
        </div>
        <div className="rt-cascade" aria-label="Cascata de multiplicadores">
          {steps.map((s) => (
            <div className="step" key={s.key}>
              <span className="k">{s.label}</span>
              <span className="num m">{s.factor === null ? '' : `×${formatDecimal(s.factor, 3)}`}</span>
              <span className="num v">{formatInt(s.value)}</span>
            </div>
          ))}
          <div className="total">
            <span className="lbl">Dano médio</span>
            <span className="num" data-testid="hit-avg">{formatInt(result.avg)}</span>
          </div>
        </div>
      </Panel>

      <Panel title="Buffs que cobrem este golpe">
        {covering.length === 0 && <p className="note">Nenhum buff de equipe ativo neste golpe.</p>}
        {covering.map((c) => (
          <div key={c.id} style={{ display: 'grid', gap: 4 }}>
            <div className="rt-cov"><span>{c.name}</span><span className="num">+{formatDecimal(c.loss * 100, 1)}%</span></div>
            <div className="dz-bar"><i style={{ width: `${(c.loss / topLoss) * 100}%` }} /></div>
          </div>
        ))}
        <p className="note">Quanto este golpe perde se o buff for desligado.</p>
        {result.action.activeTags.some((t) => label.has(t)) && (
          <p className="note">Fontes ativas: {result.action.activeTags.filter((t) => label.has(t)).map((t) => label.get(t)).join(', ')}.</p>
        )}
      </Panel>

      <Panel title="Editar golpe">
        <div className="pc-form two">
          <NumberInput label="Instante" value={action.time} min={0} step={0.1} suffix="s" onCommit={(x) => update(action.id, { time: x })} />
          <NumberInput label="Execuções" value={action.executions} min={1} step={1} suffix="×" onCommit={(x) => update(action.id, { executions: Math.round(x) })} />
          <NumberInput label="Ajuste de DMG%" value={Math.round(action.dmgAdjust * 1000) / 10} step={0.5} suffix="%" onCommit={(x) => update(action.id, { dmgAdjust: x / 100 })} />
          <SelectField label="Reação" value={action.reaction} onChange={(x) => update(action.id, { reaction: x })} options={REACTIONS.map((r) => ({ value: r, label: REACTION_LABEL[r] }))} />
          <SelectField label="Elemento do dano" value={action.element ?? ''} onChange={(x) => update(action.id, { element: x === '' ? undefined : x })} options={ELEMENTS.map((e) => ({ value: e, label: ELEMENT_LABEL[e] }))} />
        </div>
        <fieldset className="rt-src">
          <legend className="lbl">Buffs de time deste golpe</legend>
          <label className="dz-check"><input type="radio" name={`src-${action.id}`} checked={action.tagSource === 'windows'} onChange={() => setSource(action.id, 'windows')} /> Seguir as janelas de buff</label>
          <label className="dz-check"><input type="radio" name={`src-${action.id}`} checked={action.tagSource === 'manual'} onChange={() => setSource(action.id, 'manual')} /> Perfil fixo (como na planilha)</label>
        </fieldset>
        <div className="pc-acts">
          <button type="button" className="dz-btn sm" onClick={() => duplicate(action.id)}>Duplicar</button>
          <button type="button" className="dz-btn sm" onClick={() => remove(action.id)}>Apagar</button>
        </div>
      </Panel>
    </>
  );
}

function WindowPanel({ v, id, lanes }: { v: ProjectView; id: string; lanes: LaneInfo[] }) {
  const update = useRotationStore((s) => s.updateWindow);
  const remove = useRotationStore((s) => s.removeWindow);
  const w = v.project.buffWindows.find((x) => x.id === id);
  if (!w) return null;
  const lane = lanes.find((l) => l.tag === w.tag);
  return (
    <Panel title={`Janela · ${lane?.label ?? w.tag}`}>
      <div className="pc-form two">
        <NumberInput label="Início" value={w.start} min={0} step={0.1} suffix="s" onCommit={(x) => update(w.id, { start: x })} />
        <NumberInput label="Fim" value={w.end} min={0} step={0.1} suffix="s" onCommit={(x) => update(w.id, { end: x })} />
      </div>
      {lane && <p className="note" style={{ whiteSpace: 'pre-line' }}>{lane.detail}</p>}
      <div className="pc-acts"><button type="button" className="dz-btn sm" onClick={() => remove(w.id)}>Apagar janela</button></div>
    </Panel>
  );
}

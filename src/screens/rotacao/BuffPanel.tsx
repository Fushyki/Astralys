/** Painel "Buff selecionado": rotação inteira, janela (início, duração e fim ligados) ou por golpe (começa depois de + atraso). */
import type { ProjectView } from '../../app/ProjectContext';
import { Button } from '../../design/Button';
import { Panel } from '../../design/primitives';
import { effectiveDuration } from '../../engine';
import { windowMode, type WindowMode } from '../../features/rotation/projectOps';
import type { LaneInfo } from '../../features/rotation/rotationModel';
import { hitTag } from '../../features/rotation/screenModel';
import { useRotationStore } from '../../features/rotation/store';
import { Num, Sel, Seg, dec } from './ui';

export function BuffPanel({ v, lanes }: { v: ProjectView; lanes: LaneInfo[] }) {
  const st = useRotationStore.getState;
  const id = useRotationStore((s) => s.selectedWindowId);
  const w = v.project.buffWindows.find((x) => x.id === id);
  const lane = w ? lanes.find((l) => l.tag === w.tag) : undefined;
  const giver = lane?.giver ?? null;
  const badge = w ? <span className="dz-badge" style={{ background: '#2a1f3a', color: '#c9b5f2' }}>{giver !== null ? v.project.members[giver]?.character : 'Time'}</span> : undefined;

  const body = (() => {
    if (!w || !lane) return <p className="rt-empty">Selecione uma barra de buff na linha do tempo.</p>;
    const mode = windowMode(w);
    const duration = effectiveDuration(v.project);
    const start = w.whole ? 0 : w.start;
    const end = w.whole ? duration : w.end;
    const free = (fn: () => void) => {
      if (mode === 'whole') st().setWindowMode(w.id, 'window');
      fn();
    };
    const sorted = [...v.project.actions].sort((a, b) => a.time - b.time);
    const triggerOptions = sorted.map((a) => {
      const res = v.bundle.optimization.result.actions.find((r) => r.action.id === a.id);
      const tag = hitTag({ talent: a.move.talent, hitType: res?.action.move.hitType ?? a.move.talent, label: a.move.label });
      return { value: a.id, label: `${a.move.character} · ${tag} (${dec(a.time, 1)} s)` };
    });
    const trigger = w.anchor?.actionId ?? '';
    const full = lane.detail.split('\n')[0] || lane.label;
    return (
      <>
        <div className="rt-title">
          <b>{lane.label}</b>
          <span>{full} → {lane.target}</span>
        </div>
        <Seg full label="Tipo de janela" value={mode} onChange={(m: WindowMode) => st().setWindowMode(w.id, m)} options={[{ value: 'whole', label: 'Rotação inteira' }, { value: 'window', label: 'Janela' }, { value: 'anchor', label: 'Por golpe' }]} />
        <div className="rt-three">
          <Num label="Início" value={start} unit="s" min={0} onCommit={(s) => free(() => st().shiftWindow(w.id, s))} />
          <Num label="Duração" value={end - start} unit="s" min={0.1} onCommit={(d) => free(() => st().setWindowLength(w.id, d))} />
          <Num label="Fim" value={end} unit="s" min={0.1} onCommit={(e) => free(() => st().updateWindow(w.id, { end: e }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 110px', gap: 'var(--sp-2)' }}>
          <Sel label="Começa depois de" value={trigger} options={[{ value: '', label: 'Escolha um golpe' }, ...triggerOptions]} onChange={(a) => a && st().setWindowAnchor(w.id, { actionId: a, delay: w.anchor?.delay ?? 0 })} />
          <Num label="Atraso" value={w.anchor?.delay ?? 0} unit="s" sign min={0} onCommit={(d) => trigger && st().setWindowAnchor(w.id, { actionId: trigger, delay: d })} />
        </div>
        <div className="rt-acts">
          <Button variant="secondary" size="sm" onClick={() => st().duplicateWindow(w.id)}>Duplicar janela</Button>
          <button type="button" className="dz-btn sm danger" onClick={() => st().removeWindow(w.id)}>Remover janela</button>
        </div>
      </>
    );
  })();

  return (
    <Panel bar title="Buff selecionado" badge={badge} className="rt-order2 rt-gold">
      {body}
    </Panel>
  );
}

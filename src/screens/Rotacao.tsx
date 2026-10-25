/** Rotação e buffs (/projeto/:id/rotacao): golpes, linha do tempo, golpe e buff selecionados, sequência e gráficos de dano. */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjectView } from '../app/ProjectContext';
import { Button } from '../design/Button';
import { effectiveDuration } from '../engine';
import { realignActions } from '../features/rotation/projectOps';
import { laneInfos } from '../features/rotation/rotationModel';
import { countActions, windowedBuffs } from '../features/rotation/screenModel';
import { useRotationStore } from '../features/rotation/store';
import { formatInt } from '../ui/format';
import { BuffPanel } from './rotacao/BuffPanel';
import { Charts } from './rotacao/Charts';
import { HitPanel } from './rotacao/HitPanel';
import { Moves } from './rotacao/Moves';
import { Sequence } from './rotacao/Sequence';
import { SettingsDialog } from './rotacao/Settings';
import { Timeline } from './rotacao/Timeline';
import { dec } from './rotacao/ui';
import './rotacao.css';

export default function Rotacao() {
  const v = useProjectView();
  const [settings, setSettings] = useState(false);
  const canUndo = useRotationStore((s) => s.past.length > 0);
  const canRedo = useRotationStore((s) => s.future.length > 0);
  const undo = useRotationStore((s) => s.undo);
  const redo = useRotationStore((s) => s.redo);
  const realign = useRotationStore((s) => s.realign);

  const lanes = useMemo(() => laneInfos(v.project, v.resolved), [v.project, v.resolved]);
  const counts = countActions(v.project);
  const buffs = windowedBuffs(v.project);
  // "Apertar a linha" só faz sentido se algum golpe sairia do lugar (há espaços vazios entre eles).
  const canTighten = useMemo(() => {
    if (v.project.actions.length === 0) return false;
    const next = realignActions(v.project);
    const was = new Map(v.project.actions.map((a) => [a.id, a.time]));
    return next.actions.some((a) => Math.abs((was.get(a.id) ?? a.time) - a.time) > 1e-6);
  }, [v.project]);

  // Delete apaga o item selecionado quando o foco não está num campo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName) || e.key !== 'Delete') return;
      const s = useRotationStore.getState();
      if (s.selectedActionId) s.removeAction(s.selectedActionId);
      else if (s.selectedWindowId) s.removeWindow(s.selectedWindowId);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <main className="dz-page">
      <section className="rt-head">
        <div className="titles">
          <h1>Rotação · {dec(effectiveDuration(v.project), 1)} s</h1>
          <span className="sub num">
            {counts.total} golpes{counts.continuous > 0 ? ` (${counts.continuous} contínuo)` : ''} · {buffs} {buffs === 1 ? 'buff' : 'buffs'} com janela
          </span>
        </div>
        <div className="acts">
          <Button variant="secondary" size="sm" onClick={undo} disabled={!canUndo}>Desfazer</Button>
          <Button variant="secondary" size="sm" onClick={redo} disabled={!canRedo}>Refazer</Button>
          <Button variant="secondary" size="sm" onClick={() => realign()} disabled={!canTighten}>Apertar a linha</Button>
          <Link className="dz-btn sm" to={`/comparar?a=${v.id}`}>Comparar A / B</Link>
          <Button variant="secondary" size="sm" onClick={() => setSettings(true)}>Configurações</Button>
        </div>
        <div className="rt-live" aria-live="polite">
          <span className="lbl">DPS ao vivo</span>
          <span className="num" data-testid="live-dps">{formatInt(v.summary.dps)}</span>
        </div>
      </section>

      {v.inSync ? (
        <>
          <div className="rt-grid">
            <Moves v={v} />
            <Timeline v={v} lanes={lanes} />
            <div className="rt-col">
              <HitPanel v={v} />
              <BuffPanel v={v} lanes={lanes} />
            </div>
          </div>
          <div style={{ height: 'var(--panel-gap)' }} />
          <Sequence v={v} lanes={lanes} />
          <div style={{ height: 'var(--panel-gap)' }} />
          <Charts v={v} />
        </>
      ) : (
        <p className="note" role="status">Atualizando a equipe…</p>
      )}

      {settings && <SettingsDialog project={v.project} onClose={() => setSettings(false)} />}
    </main>
  );
}

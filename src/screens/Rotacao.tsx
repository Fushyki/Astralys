/** Rotação e buffs (/projeto/:id/rotacao): linha do tempo editável, paleta de golpes e o golpe selecionado. */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjectView } from '../app/ProjectContext';
import { realignActions } from '../features/rotation/projectOps';
import { laneInfos } from '../features/rotation/rotationModel';
import { useRotationStore } from '../features/rotation/store';
import { formatInt } from '../ui/format';
import { Palette } from './rotacao/Palette';
import { SettingsDialog } from './rotacao/Settings';
import { SelectedHit } from './rotacao/Side';
import { Timeline } from './rotacao/Timeline';
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
  const names = v.project.members.map((m) => m.character);
  const windowed = new Set(v.project.buffWindows.map((w) => w.tag)).size;
  // "Apertar a linha" só faz sentido se algum golpe sairia do lugar (há espaços vazios entre eles).
  const canTighten = useMemo(() => {
    if (v.project.actions.length === 0) return false;
    const next = realignActions(v.project);
    const was = new Map(v.project.actions.map((a) => [a.id, a.time]));
    return next.actions.some((a) => Math.abs((was.get(a.id) ?? a.time) - a.time) > 1e-6);
  }, [v.project]);

  return (
    <main className="dz-page">
      <section className="dz-pagehead">
        <div className="titles">
          <h1 className="h1" style={{ fontSize: 36 }}>Rotação · {v.project.config.rotationDuration.toString().replace('.', ',')} s</h1>
          <span className="num muted">{v.project.actions.length} golpes · {windowed} buffs com janela</span>
        </div>
        <div className="actions rt-actions">
          <button type="button" className="dz-btn" onClick={undo} disabled={!canUndo} title="Ctrl+Z">Desfazer</button>
          <button type="button" className="dz-btn" onClick={redo} disabled={!canRedo} title="Ctrl+Y">Refazer</button>
          <button type="button" className="dz-btn" onClick={() => realign()} disabled={!canTighten} title="Tira os espaços vazios entre os golpes, mantendo a ordem. Ctrl+Z desfaz.">Apertar a linha</button>
          <Link className="dz-btn" to={`/comparar?a=${v.id}`}>Comparar A / B</Link>
          <button type="button" className="dz-btn" onClick={() => setSettings(true)}>Configurações</button>
          <div className="rt-live" aria-live="polite">
            <span className="lbl">DPS ao vivo</span>
            <span className="num" data-testid="live-dps">{formatInt(v.summary.dps)}</span>
          </div>
        </div>
      </section>

      <div className="rt-grid">
        <div className="rt-left">
          <section className="dz-panel">
            {v.inSync ? (
              <Timeline project={v.project} results={v.bundle.optimization.result.actions} names={names} colors={v.colors} lanes={lanes} total={v.summary.avg} />
            ) : (
              <p className="note" role="status">Atualizando a equipe…</p>
            )}
          </section>
          <Palette v={v} />
        </div>
        <aside className="rt-right">
          <SelectedHit v={v} lanes={lanes} />
        </aside>
      </div>

      {settings && <SettingsDialog project={v.project} onClose={() => setSettings(false)} />}
    </main>
  );
}

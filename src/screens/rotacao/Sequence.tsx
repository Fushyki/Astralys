/** Painel "Sequência": a lista dos golpes na ordem em que entram, com seleção, reordenação (⋮⋮) e remoção. */
import { useMemo, useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { Button } from '../../design/Button';
import { SPECIAL_LABEL } from '../../design/damageFamily';
import { Panel } from '../../design/primitives';
import { memberProcs } from '../../engine';
import { specialOfMove } from '../../engine/project';
import { REACTION_LABEL } from '../../features/character/characterModel';
import type { LaneInfo } from '../../features/rotation/rotationModel';
import { sequenceRows, specialOfMoveRef } from '../../features/rotation/screenModel';
import { useRotationStore } from '../../features/rotation/store';
import { dec } from './ui';

const SHOWN = 8;

const Bin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
);

export function Sequence({ v, lanes }: { v: ProjectView; lanes: LaneInfo[] }) {
  const st = useRotationStore.getState;
  const selectedActionId = useRotationStore((s) => s.selectedActionId);
  const [all, setAll] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null);
  const project = v.project;
  const rows = useMemo(() => sequenceRows(project), [project]);
  /** Golpes extras de cada membro (para saber quais são dano Lunar/Estelar). */
  const procCache = useMemo(() => new Map<number, ReturnType<typeof memberProcs>>(), [v.resolved, v.data.game.moves]);
  const procsOf = (i: number) => {
    if (!procCache.has(i)) procCache.set(i, v.resolved.team.members[i] ? memberProcs(v.resolved.team.members[i], v.data.game.moves) : []);
    return procCache.get(i)!;
  };
  const results = v.bundle.optimization.result.actions;
  const laneTags = useMemo(() => new Set(lanes.map((l) => l.tag)), [lanes]);
  // Recolhida, a lista mostra os primeiros golpes e, se estiver fora deles, também a linha do golpe selecionado.
  const selectedRow = rows.find((r) => selectedActionId !== null && r.ids.includes(selectedActionId));
  const shown = all ? rows : selectedRow && selectedRow.index > SHOWN ? [...rows.slice(0, SHOWN), selectedRow] : rows.slice(0, SHOWN);
  const rowKey = (r: (typeof rows)[number]) => r.action.id;
  const picked = rows.filter((r) => checked.has(rowKey(r)));
  const toggle = (k: string) => setChecked((cur) => { const n = new Set(cur); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const removeRows = (list: typeof rows) => {
    st().removeActions(list.flatMap((r) => r.ids));
    setChecked(new Set());
  };
  const indexOf = (id: string) => project.actions.findIndex((a) => a.id === id);

  return (
    <Panel
      bar
      title="Sequência"
      badge={<span className="num" style={{ fontSize: 'var(--fs-1)', color: '#a7b0d6' }}>{rows.length} golpes · arraste ⋮⋮ para reordenar</span>}
      aside={
        <span className="rt-hacts">
          {picked.length > 0 && <button type="button" className="dz-btn sm danger" onClick={() => removeRows(picked)}>Remover selecionados ({picked.length})</button>}
          <Button variant="ghost" size="sm" onClick={() => setChecked(checked.size === rows.length ? new Set() : new Set(rows.map(rowKey)))}>Selecionar todos</Button>
          <Button variant="ghost" size="sm" onClick={() => setAll(!all)}>{all ? 'Mostrar menos' : `Mostrar os ${rows.length}`}</Button>
        </span>
      }
      className="rt-p0"
    >
      <div className="rt-tablewrap">
        <table className="rt-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}><input type="checkbox" aria-label="Selecionar todos" checked={rows.length > 0 && checked.size === rows.length} onChange={() => setChecked(checked.size === rows.length ? new Set() : new Set(rows.map(rowKey)))} /></th>
              <th style={{ width: 28 }} />
              <th style={{ width: 40 }}>#</th>
              <th style={{ width: 80 }}>Tempo</th>
              <th style={{ width: 130 }}>Personagem</th>
              <th>Golpe</th>
              <th style={{ width: 150 }}>Repetição</th>
              <th style={{ width: 60 }}>Hits</th>
              <th style={{ width: 140 }}>Reação</th>
              <th style={{ width: 100 }}>Buffs</th>
              <th style={{ width: 44 }} />
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const a = r.action;
              const res = results.find((x) => x.action.id === a.id);
              const sel = checked.has(rowKey(r));
              const effect = v.resolved.team.members[a.member]?.characterEffect;
              const special = specialOfMoveRef(a.move, specialOfMove(a.move, a.move.variant, effect), procsOf(a.member));
              const reacted = project.actions.find((x) => r.ids.includes(x.id) && x.reaction !== 'none');
              const reaction = special ? SPECIAL_LABEL[special] : reacted ? REACTION_LABEL[reacted.reaction] : '—';
              const active = res ? res.action.activeTags.filter((t) => laneTags.has(t)).length : 0;
              const name = (a.displayName ?? a.move.label).replace(`${a.move.character} - `, '');
              return (
                <tr
                  key={rowKey(r)}
                  className={`${sel ? 'sel' : r.repeat ? 'chain' : ''}${drag?.over === r.index - 1 && drag.from !== r.index - 1 ? ' drop' : ''}`}
                  data-active={selectedActionId !== null && r.ids.includes(selectedActionId)}
                  onDragOver={(e) => { if (drag) { e.preventDefault(); if (drag.over !== r.index - 1) setDrag({ ...drag, over: r.index - 1 }); } }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (drag && drag.from !== r.index - 1) {
                      const from = indexOf(rows[drag.from].action.id);
                      const to = indexOf(a.id);
                      if (from >= 0 && to >= 0) st().reorderActions(from, to);
                    }
                    setDrag(null);
                  }}
                >
                  <td><input type="checkbox" aria-label="Selecionar golpe" checked={sel} onChange={() => toggle(rowKey(r))} /></td>
                  <td className="grip" draggable onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', a.id); setDrag({ from: r.index - 1, over: r.index - 1 }); }} onDragEnd={() => setDrag(null)} aria-label="Arrastar para reordenar" title="Arraste para reordenar">⋮⋮</td>
                  <td className="num" style={{ color: '#7e88b6' }}>{r.index}</td>
                  <td className="num">{dec(a.time, 1)} s</td>
                  <td><span className="cdot" style={{ background: v.colors[a.member] }} /> {a.move.character}</td>
                  <td className="mv" onClick={() => st().select(a.id)}>{name}</td>
                  <td className={`num rep ${r.repeat ? 'on' : 'off'}`}>{r.repeat ? `a cada ${dec(r.repeat.every, 1)} s · ×${r.repeat.count}` : '—'}</td>
                  <td className="num">{res ? res.action.move.hits * a.executions : a.executions}</td>
                  <td>{reaction}</td>
                  <td className="num">{active} de {lanes.length}</td>
                  <td><button type="button" className="rt-ico" aria-label="Remover este golpe" onClick={() => removeRows([r])}><Bin /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

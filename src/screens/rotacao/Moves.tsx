/** Painel "Golpes": como inserir (em ordem ou no instante marcado), abas dos personagens, busca e golpes por talento. */
import { useMemo, useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { Panel } from '../../design/primitives';
import { FamilyBadge, damageColor } from '../../design/damageFamily';
import { specialOfMoveRef } from '../../features/rotation/screenModel';
import { REACTION_ACTIONS, kitElement, memberProcs } from '../../engine';
import { specialOfMove } from '../../engine/project';
import { cleanMoveName } from '../../features/character/characterModel';
import { insertTime } from '../../features/rotation/projectOps';
import { useRotationStore } from '../../features/rotation/store';
import { Num, Seg, Static } from './ui';

const GROUPS = [
  { talent: 'skill', title: 'Habilidade (E)' },
  { talent: 'burst', title: 'Supremo (Q)' },
  { talent: 'normal', title: 'Ataque normal' },
] as const;

export function Moves({ v }: { v: ProjectView }) {
  const [member, setMember] = useState(0);
  const [query, setQuery] = useState('');
  const mode = useRotationStore((s) => s.insertMode);
  const gap = useRotationStore((s) => s.gap);
  const playhead = useRotationStore((s) => s.playhead);
  const setMode = useRotationStore((s) => s.setInsertMode);
  const setGap = useRotationStore((s) => s.setGap);
  const insert = useRotationStore((s) => s.insertAction);

  const names = v.project.members.map((m) => m.character);
  const character = names[member] ?? names[0];
  const charInfo = v.data.game.characters.find((c) => c.name === character);
  const kitMode = v.resolved.team.config.elementMode === 'kit';
  const infusion = v.resolved.team.members[member]?.normalInfusion;
  const effect = v.resolved.team.members[member]?.characterEffect;
  const colorOf = (m: { talent: string; hitType: string; label: string; variant: number }) =>
    damageColor(kitMode && charInfo ? kitElement(charInfo, m, infusion) : charInfo?.element, specialOfMove(m, m.variant, effect)) ?? 'var(--el-physical)';

  const next = insertTime(v.project, { mode, gap, marker: playhead, member });

  const q = query.trim().toLowerCase();
  const moves = useMemo(
    () => v.data.game.moves.filter((m) => m.character === character && (!q || m.label.toLowerCase().includes(q) || (m.labelPt ?? '').toLowerCase().includes(q))),
    [v.data.game.moves, character, q],
  );
  const procs = useMemo(() => {
    const m = v.resolved.team.members[member];
    return m ? memberProcs(m, v.data.game.moves).filter((p) => !q || p.proc.label.toLowerCase().includes(q) || p.origin.toLowerCase().includes(q)) : [];
  }, [v.resolved, v.data.game.moves, member, q]);
  const reactions = useMemo(() => REACTION_ACTIONS.filter((r) => !q || r.label.toLowerCase().includes(q) || 'reação'.includes(q) || (q.includes('swirl') && r.key.includes('swirl'))), [q]);

  return (
    <Panel bar title="Golpes" className="rt-moves">
      <div className="rt-mv-box">
        <span className="rt-lbl">Como inserir</span>
        <Seg full label="Como inserir" value={mode} onChange={setMode} options={[{ value: 'order', label: 'Em ordem (no fim)' }, { value: 'marker', label: 'No instante marcado' }]} />
        <div className="rt-two">
          <Num label="Espaço entre golpes" value={gap} unit="s" onCommit={setGap} min={0.05} />
          <Static label="Próximo golpe entra em" className="gold">{next.toFixed(1).replace('.', ',')}<span className="u">s</span></Static>
        </div>
        <span className="rt-note">Cada clique coloca o golpe depois do último, já com o espaço definido. Nada fica sobreposto.</span>
      </div>

      <div className="rt-tabs" role="tablist" aria-label="Personagem">
        {names.map((n, i) => (
          <button key={n} type="button" role="tab" aria-selected={i === member} title={n} style={{ ['--c' as string]: v.colors[i] }} onClick={() => setMember(i)}>
            <i /> {n.length > 8 ? `${n.slice(0, 6)}.` : n}
          </button>
        ))}
      </div>
      <input className="rt-search" type="search" placeholder="Buscar golpe…" aria-label="Buscar golpe" value={query} onChange={(e) => setQuery(e.target.value)} />

      <div className="rt-mvs">
        {GROUPS.map((g) => {
          const items = moves.filter((m) => m.talent === g.talent);
          if (items.length === 0) return null;
          return (
            <div className="rt-mvgroup" key={g.talent}>
              <span className="rt-lbl">{g.title}</span>
              {items.map((m) => {
                const label = `${cleanMoveName(m.labelPt ?? m.label)}${m.variants > 1 ? ` (${m.variant + 1}/${m.variants})` : ''}`;
                const lunar = specialOfMove(m, m.variant, effect)?.startsWith('lunar');
                return (
                  <button
                    key={m.id}
                    type="button"
                    className="rt-mv"
                    title={m.label}
                    style={{ ['--c' as string]: colorOf(m) }}
                    onClick={() => insert({ member, move: { character: m.character, talent: m.talent, label: m.label, variant: m.variant }, displayName: `${m.character} - ${label}` })}
                  >
                    <span className="dot" />
                    <span className="n">{label}</span>
                    {lunar && <span className="dz-badge" style={{ background: 'var(--dmg-lunar-bg)', color: 'var(--dmg-lunar)' }}>Lunar</span>}
                    <span className="plus" aria-hidden="true">+</span>
                  </button>
                );
              })}
            </div>
          );
        })}
        {procs.length > 0 && (
          <div className="rt-mvgroup">
            <span className="rt-lbl">Golpes extras</span>
            {procs.map((p) => (
              <button
                key={p.key}
                type="button"
                className="rt-mv"
                title={`${p.origin}${p.proc.note ? `: ${p.proc.note}` : ''}`}
                style={{ ['--c' as string]: damageColor(undefined, p.proc.special?.reaction) ?? v.colors[member] }}
                onClick={() => insert({ member, move: { character, talent: 'proc', label: p.key, variant: 0 }, displayName: `${character} - ${p.proc.label}` })}
              >
                <span className="dot" /><span className="n">{p.proc.label}</span><FamilyBadge special={p.proc.special?.reaction} /><span className="plus" aria-hidden="true">+</span>
              </button>
            ))}
          </div>
        )}
        {reactions.length > 0 && (
          <div className="rt-mvgroup">
            <span className="rt-lbl" title="Dano da própria reação (Maestria e bônus de reação deste personagem)">Reações (dano da reação)</span>
            {reactions.map((r) => (
              <button
                key={r.key}
                type="button"
                className="rt-mv"
                style={{ ['--c' as string]: damageColor(undefined, specialOfMoveRef({ talent: 'reaction', label: r.key }, undefined, [])) ?? v.colors[member] }}
                onClick={() => insert({ member, move: { character, talent: 'reaction', label: r.key, variant: 0 }, displayName: `${character} - ${r.label}` })}
              >
                <span className="dot" /><span className="n">{r.label}</span><FamilyBadge special={specialOfMoveRef({ talent: 'reaction', label: r.key }, undefined, [])} /><span className="plus" aria-hidden="true">+</span>
              </button>
            ))}
          </div>
        )}
        {moves.length === 0 && procs.length === 0 && reactions.length === 0 && <p className="rt-empty">Nenhum golpe encontrado.</p>}
      </div>
    </Panel>
  );
}

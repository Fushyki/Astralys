/** Paleta de golpes: chips por personagem; clicar insere o golpe no instante marcado na régua. */
import { useMemo, useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { Panel } from '../../design/primitives';
import { cleanMoveName } from '../../features/character/characterModel';
import { useRotationStore } from '../../features/rotation/store';
import { formatDecimal } from '../../ui/format';

const TALENT_ORDER = ['skill', 'burst', 'normal'] as const;
const SHOWN = 14;

export function Palette({ v }: { v: ProjectView }) {
  const [member, setMember] = useState(0);
  const [query, setQuery] = useState('');
  const [all, setAll] = useState(false);
  const playhead = useRotationStore((s) => s.playhead);
  const add = useRotationStore((s) => s.addAction);
  const names = v.project.members.map((m) => m.character);
  const character = names[member] ?? names[0];

  const moves = useMemo(() => {
    const q = query.trim().toLowerCase();
    return v.data.game.moves
      .filter((m) => m.character === character && (!q || m.label.toLowerCase().includes(q) || (m.labelPt ?? '').toLowerCase().includes(q)))
      .sort((a, b) => TALENT_ORDER.indexOf(a.talent) - TALENT_ORDER.indexOf(b.talent));
  }, [v.data.game.moves, character, query]);
  const list = all || query ? moves : moves.slice(0, SHOWN);

  return (
    <Panel title={`Inserir em ${formatDecimal(playhead, 1)} s`} aside={<input className="dz-input" style={{ maxWidth: 220 }} type="search" placeholder="Buscar golpe" aria-label="Buscar golpe" value={query} onChange={(e) => setQuery(e.target.value)} />}>
      <div className="rt-pal-tabs" role="tablist" aria-label="Personagem da paleta">
        {names.map((n, i) => (
          <button key={n} type="button" role="tab" aria-selected={i === member} style={{ ['--c' as string]: v.colors[i] }} onClick={() => setMember(i)}>
            <i /> {n}
          </button>
        ))}
      </div>
      <div className="rt-chips">
        {list.length === 0 && <p className="note">Nenhum golpe encontrado.</p>}
        {list.map((m) => {
          const label = `${cleanMoveName(m.labelPt ?? m.label)}${m.variants > 1 ? ` (${m.variant + 1}/${m.variants})` : ''}`;
          return (
            <button
              key={m.id}
              type="button"
              className="chip"
              style={{ ['--c' as string]: v.colors[member] }}
              title={m.label}
              onClick={() =>
                add({
                  member,
                  move: { character: m.character, talent: m.talent, label: m.label, variant: m.variant },
                  displayName: `${m.character} - ${label}`,
                  time: playhead,
                })
              }
            >
              {m.talent === 'skill' ? 'E · ' : m.talent === 'burst' ? 'Q · ' : ''}{label}
            </button>
          );
        })}
      </div>
      {!query && moves.length > SHOWN && (
        <button type="button" className="dz-link" style={{ alignSelf: 'flex-start' }} onClick={() => setAll(!all)}>
          {all ? 'Mostrar só os principais' : `Mostrar os ${moves.length} golpes`}
        </button>
      )}
    </Panel>
  );
}

/**
 * Paleta de golpes: lista os golpes de dano do personagem escolhido e insere o clicado no instante do marcador.
 */
import { useMemo, useState } from 'react';
import type { Move } from '../../data/schema';
import type { RotationProject } from '../../engine';
import { Hint, Panel } from '../../ui/components';
import { formatDecimal } from '../../ui/format';
import { useRotationStore } from './store';
import type { MemberRow } from './summary';

const HIT_LABEL: Record<string, string> = { normal: 'normal', charged: 'carregado', plunge: 'imersivo', skill: 'E', burst: 'Q' };
const TALENT_ORDER = ['normal', 'skill', 'burst'] as const;
const TALENT_TITLE: Record<string, string> = { normal: 'Ataque normal', skill: 'Habilidade elemental', burst: 'Supremo' };

export function Palette({ project, moves, members }: { project: RotationProject; moves: Move[]; members: MemberRow[] }) {
  const [member, setMember] = useState(0);
  const [query, setQuery] = useState('');
  const playhead = useRotationStore((s) => s.playhead);
  const add = useRotationStore((s) => s.addAction);

  const character = project.members[member]?.character;
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const mine = moves.filter((m) => m.character === character && (!q || m.label.toLowerCase().includes(q) || (m.labelPt ?? '').toLowerCase().includes(q)));
    return TALENT_ORDER.map((t) => ({ talent: t, items: mine.filter((m) => m.talent === t) })).filter((g) => g.items.length > 0);
  }, [moves, character, query]);

  return (
    <Panel title="Paleta de golpes">
      <Hint>Escolha o personagem e clique num golpe para inseri-lo em {formatDecimal(playhead)} s. Para mudar o instante, clique na régua da linha do tempo.</Hint>
      <div className="ast-tabs" role="tablist" aria-label="Personagem">
        {members.map((m, i) => (
          <button key={m.name} type="button" role="tab" aria-selected={i === member} className="ast-tab" onClick={() => setMember(i)} style={{ ['--c' as string]: m.color }}>
            <i /> {m.name}
          </button>
        ))}
      </div>
      <input type="search" className="ast-search" placeholder="Buscar golpe" aria-label="Buscar golpe" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="ast-moves">
        {groups.length === 0 && <p className="ast-hint">Nenhum golpe encontrado.</p>}
        {groups.map((g) => (
          <div key={g.talent}>
            <p className="ast-sel-title small">{TALENT_TITLE[g.talent]}</p>
            {g.items.map((m) => (
              <button
                key={m.id}
                type="button"
                className="ast-move"
                onClick={() =>
                  add({
                    member,
                    move: { character: m.character, talent: m.talent, label: m.label, variant: m.variant },
                    displayName: `${m.character} - ${m.labelPt ?? m.label}${m.variants > 1 ? ` (${m.variant + 1}/${m.variants})` : ''}`,
                    time: playhead,
                  })
                }
              >
                <span title={m.label}>{m.labelPt ?? m.label}{m.variants > 1 ? ` (${m.variant + 1}/${m.variants})` : ''}</span>
                <em>{HIT_LABEL[m.hitType]}{m.hits > 1 ? ` · ${m.hits} hits` : ''}</em>
              </button>
            ))}
          </div>
        ))}
      </div>
    </Panel>
  );
}

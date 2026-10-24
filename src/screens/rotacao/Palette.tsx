/** Paleta de golpes: chips por personagem; clicar insere o golpe no instante marcado na régua. */
import { useMemo, useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { Panel } from '../../design/primitives';
import { FamilyBadge, damageColor } from '../../design/damageFamily';
import { specialOfMove } from '../../engine/project';
import { elementColor } from '../../design/elements';
import { REACTION_ACTIONS, kitElement, memberProcs } from '../../engine';
import { cleanMoveName } from '../../features/character/characterModel';
import { useRotationStore } from '../../features/rotation/store';
import { formatDecimal } from '../../ui/format';
import { Button } from '../../design/Button';

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
  /** Cor do elemento do golpe: o do personagem (os golpes só mudam de elemento por escolha na rotação). */
  const charInfo = v.data.game.characters.find((c) => c.name === character);
  const charElement = charInfo?.element;
  const kitMode = v.resolved.team.config.elementMode === 'kit';
  const infusion = v.resolved.team.members[member]?.normalInfusion;
  /** Elemento do golpe: pelo kit (Físico no ataque normal de arma) ou o do personagem no modo antigo. */
  const effect = v.resolved.team.members[member]?.characterEffect;
  const specialOf = (m: { talent: string; label: string; variant: number }) => specialOfMove(m, m.variant, effect);
  const colorOfMove = (m: { talent: string; hitType: string; label: string; variant: number }) =>
    damageColor(kitMode && charInfo ? kitElement(charInfo, m, infusion) : charElement, specialOf(m)) ?? elementColor('Physical');

  const moves = useMemo(() => {
    const q = query.trim().toLowerCase();
    return v.data.game.moves
      .filter((m) => m.character === character && (!q || m.label.toLowerCase().includes(q) || (m.labelPt ?? '').toLowerCase().includes(q)))
      .sort((a, b) => TALENT_ORDER.indexOf(a.talent) - TALENT_ORDER.indexOf(b.talent));
  }, [v.data.game.moves, character, query]);
  const list = all || query ? moves : moves.slice(0, SHOWN);
  // Golpes extras de arma, set, passivas e constelações deste membro (escala fixa, sem nível de talento).
  const procs = useMemo(() => {
    const m = v.resolved.team.members[member];
    const q = query.trim().toLowerCase();
    return m ? memberProcs(m, v.data.game.moves).filter((p) => !q || p.proc.label.toLowerCase().includes(q) || p.origin.toLowerCase().includes(q)) : [];
  }, [v.resolved, v.data.game.moves, member, query]);
  // Reações que o membro dispara: dano da própria reação, com a Maestria e os bônus de reação dele.
  const reactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REACTION_ACTIONS.filter((r) => !q || r.label.toLowerCase().includes(q) || 'reação'.includes(q));
  }, [query]);

  return (
    <Panel title={`Inserir em ${formatDecimal(playhead, 1)} s`} aside={<input className="dz-input" style={{ maxWidth: 220 }} type="search" placeholder="Buscar golpe" aria-label="Buscar golpe" value={query} onChange={(e) => setQuery(e.target.value)} />}>
      <div className="rt-pal-tabs" role="tablist" aria-label="Personagem da paleta">
        {names.map((n, i) => (
          <button key={n} type="button" role="tab" aria-selected={i === member} style={{ ['--c' as string]: v.colors[i] }} onClick={() => setMember(i)}>
            <i /> {n}
          </button>
        ))}
      </div>
      <p className="note" style={{ margin: 0 }}>A barra colorida de cada golpe é o elemento do dano ({kitMode ? 'pelo kit; branco = Físico' : `${charElement ?? '—'}, modo antigo`}). Troque o elemento de um golpe em Editar golpe.</p>
      <div className="rt-chips">
        {list.length === 0 && procs.length === 0 && <p className="note">Nenhum golpe encontrado.</p>}
        {procs.map((p) => (
          <button
            key={p.key}
            type="button"
            className="chip"
            style={{ ['--c' as string]: elementColor(p.proc.element ?? charElement) }}
            title={`${p.origin}${p.proc.note ? `: ${p.proc.note}` : ''}`}
            onClick={() => add({ member, move: { character, talent: 'proc', label: p.key, variant: 0 }, displayName: `${character} - ${p.proc.label}`, time: playhead })}
          >
            + · {p.proc.label}
          </button>
        ))}
        {(all || query) && reactions.map((r) => (
          <button
            key={`r-${r.key}`}
            type="button"
            className="chip"
            style={{ ['--c' as string]: v.colors[member] }}
            title="Dano da própria reação (Maestria e bônus de reação deste personagem)"
            onClick={() => add({ member, move: { character, talent: 'reaction', label: r.key, variant: 0 }, displayName: `${character} - ${r.label}`, time: playhead })}
          >
            ⚛ · {r.label}
          </button>
        ))}
        {list.map((m) => {
          const label = `${cleanMoveName(m.labelPt ?? m.label)}${m.variants > 1 ? ` (${m.variant + 1}/${m.variants})` : ''}`;
          return (
            <button
              key={m.id}
              type="button"
              className="chip"
              style={{ ['--c' as string]: colorOfMove(m) }}
              title={m.talent !== 'normal' && ['normal', 'charged', 'plunge'].includes(m.hitType) ? `${m.label}: golpe de Ataque Normal feito durante a habilidade ou o supremo (usa o nível dessa habilidade)` : m.label}
              onClick={() =>
                add({
                  member,
                  move: { character: m.character, talent: m.talent, label: m.label, variant: m.variant },
                  displayName: `${m.character} - ${label}`,
                  time: playhead,
                })
              }
            >
              {m.talent === 'skill' ? 'E · ' : m.talent === 'burst' ? 'Q · ' : ''}{label} <FamilyBadge special={specialOf(m)} />
            </button>
          );
        })}
      </div>
      {!query && (moves.length > SHOWN || reactions.length > 0) && (
        <Button variant="ghost" size="sm" style={{ alignSelf: 'flex-start' }} onClick={() => setAll(!all)}>
          {all ? 'Mostrar só os principais' : `Mostrar os ${moves.length} golpes e as reações`}
        </Button>
      )}
    </Panel>
  );
}

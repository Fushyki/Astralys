/**
 * Popup para escolher o golpe que o otimizador vai maximizar. Os golpes vêm agrupados por tipo de dano (normal, carregado,
 * imersivo, habilidade, supremo), cada tipo com a sua cor; o nome do golpe usa a cor do elemento do dano (branco = Físico).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Character, Move } from '../../data/schema';
import { Button } from '../../design/Button';
import { elementColor } from '../../design/elements';
import { kitElement, type ElementOrPhysical } from '../../engine';
import { FamilyBadge, damageColor } from '../../design/damageFamily';
import { specialOfMove } from '../../engine/project';
import type { CharacterEffect } from '../../effects/schema';
import { displayName } from '../../features/character/characterModel';

export type DamageKind = 'normal' | 'charged' | 'plunge' | 'skill' | 'burst';

/** Cores dos tipos de dano (guia visual: etiquetas de golpe). */
export const KIND_STYLE: Record<DamageKind, { label: string; bg: string; fg: string }> = {
  normal: { label: 'Normal', bg: '#1e2a5a', fg: '#b9c6ff' },
  charged: { label: 'Carregado', bg: '#173f48', fg: '#9fe3ee' },
  plunge: { label: 'Imersivo', bg: '#262c46', fg: '#c9cfea' },
  skill: { label: 'Habilidade', bg: '#3a1e16', fg: '#f7a783' },
  burst: { label: 'Supremo', bg: '#3a3016', fg: '#f1c96b' },
};
const ORDER: DamageKind[] = ['normal', 'charged', 'plunge', 'skill', 'burst'];

/** Tipo de dano do golpe: o talento manda na habilidade e no supremo; no ataque normal vale o tipo do golpe. */
export function kindOf(m: Pick<Move, 'talent' | 'hitType'>): DamageKind {
  if (m.talent === 'skill') return 'skill';
  if (m.talent === 'burst') return 'burst';
  return m.hitType === 'charged' ? 'charged' : m.hitType === 'plunge' ? 'plunge' : 'normal';
}

export function KindBadge({ kind, extra }: { kind: DamageKind; extra?: string }) {
  const st = KIND_STYLE[kind];
  return <span className="mp-badge" style={{ background: st.bg, color: st.fg }}>{st.label}{extra ? ` · ${extra}` : ''}</span>;
}

/** Texto extra da etiqueta: golpe de ataque normal feito durante a habilidade ou o supremo. */
export const inStateNote = (m: Pick<Move, 'talent' | 'hitType'>): string | undefined =>
  m.talent !== 'normal' && ['normal', 'charged', 'plunge'].includes(m.hitType) ? 'ataque normal no modo' : undefined;

export interface MovePickerProps {
  moves: Move[];
  current?: string;
  character: Pick<Character, 'name' | 'element' | 'weapon'>;
  /** 'kit' = elemento pelo kit do jogo; senão, o do personagem. */
  elementMode: 'kit' | 'character';
  infusion?: ElementOrPhysical;
  effect?: Pick<CharacterEffect, 'specialMoves'>;
  onPick: (id: string) => void;
  onClose: () => void;
}

export function MovePickerDialog({ moves, current, character, elementMode, infusion, effect, onPick, onClose }: MovePickerProps) {
  const [query, setQuery] = useState('');
  const [off, setOff] = useState<Set<DamageKind>>(new Set());
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    search.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const items = useMemo(
    () =>
      moves.map((m) => ({
        m,
        kind: kindOf(m),
        special: specialOfMove(m, 0, effect),
        name: displayName(m),
        element: elementMode === 'kit' ? kitElement(character, m, infusion) : (character.element as ElementOrPhysical),
      })),
    [moves, character, elementMode, infusion, effect],
  );
  const q = query.trim().toLowerCase();
  const shown = items.filter((i) => !off.has(i.kind) && (!q || i.name.toLowerCase().includes(q) || i.m.label.toLowerCase().includes(q)));
  const toggle = (k: DamageKind) => setOff((cur) => { const n = new Set(cur); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  return (
    <div className="dz-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dz-dialog wide mp-dialog" role="dialog" aria-modal="true" aria-label="Escolher o golpe a otimizar">
        <header>
          <h2 className="h2">Golpe a otimizar</h2>
          <Button variant="secondary" size="sm" onClick={onClose}>Fechar</Button>
        </header>
        <div className="mp-tools">
          <input ref={search} className="dz-input" type="search" placeholder="Nome do golpe" aria-label="Buscar golpe" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="mp-kinds" role="group" aria-label="Tipo de dano">
            {ORDER.filter((k) => items.some((i) => i.kind === k)).map((k) => {
              const st = KIND_STYLE[k];
              const on = !off.has(k);
              return (
                <button key={k} type="button" aria-pressed={on} onClick={() => toggle(k)} style={on ? { background: st.bg, color: st.fg, borderColor: st.fg } : undefined}>
                  {st.label} <span className="num">{items.filter((i) => i.kind === k).length}</span>
                </button>
              );
            })}
          </div>
          <span className="muted small">Mostrando {shown.length} de {items.length} golpes · nome na cor do elemento, branco = Físico, ☾ Lunar e ✦ Estelar têm cor própria</span>
        </div>
        <div className="mp-grid">
          {shown.length === 0 && <p className="note">Nenhum golpe encontrado.</p>}
          {shown.map(({ m, kind, name, element, special }) => {
            const st = KIND_STYLE[kind];
            return (
              <button key={m.id} type="button" className="mp-card" data-current={m.id === current} onClick={() => onPick(m.id)} style={{ ['--k' as string]: st.fg, ['--kb' as string]: st.bg }}>
                <span className="n" style={{ color: damageColor(element, special) }}>{name}{m.hits > 1 ? <i className="muted"> · {m.hits}×</i> : null}</span>
                <span className="meta">
                  <KindBadge kind={kind} extra={inStateNote(m)} />
                  {special ? <FamilyBadge special={special} long /> : <span className="el" style={{ color: element === 'Physical' ? undefined : elementColor(element) }}>{element === 'Physical' ? 'Físico' : element}</span>}
                </span>
                {m.id === current && <span className="cur">escolhido</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

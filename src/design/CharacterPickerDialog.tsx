/** Diálogo para escolher um personagem (busca e filtro por elemento). Fecha com Esc ou clicando fora. */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Character, Element } from '../data/schema';
import { CharacterAvatar } from './primitives';
import { elementColor } from './elements';
import './design.css';

const ELEMENTS: Element[] = ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo'];
const WEAPON_LABEL: Record<string, string> = { Sword: 'Espada', Claymore: 'Montante', Polearm: 'Lança', Catalyst: 'Catalisador', Bow: 'Arco' };

export function CharacterPickerDialog({
  title,
  note,
  characters,
  exclude,
  onPick,
  onClear,
  clearLabel = 'Deixar a vaga vazia',
  onClose,
}: {
  title: string;
  note?: string;
  characters: Character[];
  exclude: string[];
  onPick: (name: string) => void;
  /** Se informado, mostra o botão que esvazia a vaga (tira o personagem do time). */
  onClear?: () => void;
  clearLabel?: string;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [element, setElement] = useState<Element | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return characters
      .filter((c) => !exclude.includes(c.name) && (!element || c.element === element) && (!q || c.name.toLowerCase().includes(q) || c.namePt.toLowerCase().includes(q)))
      .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
  }, [characters, exclude, element, query]);

  return (
    <div className="dz-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dz-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2 className="h2">{title}</h2>
          <button type="button" className="dz-btn sm" onClick={onClose}>Fechar</button>
        </header>
        {note && <p className="note">{note}</p>}
        <div className="tools">
          <input ref={searchRef} className="dz-input" type="search" placeholder="Buscar personagem" aria-label="Buscar personagem" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="dz-seg" role="group" aria-label="Elemento">
            <button type="button" aria-pressed={element === null} onClick={() => setElement(null)}>Todos</button>
            {ELEMENTS.map((el) => (
              <button key={el} type="button" aria-pressed={element === el} onClick={() => setElement(element === el ? null : el)}>{el}</button>
            ))}
          </div>
          {onClear && <button type="button" className="dz-btn sm" onClick={onClear}>{clearLabel}</button>}
        </div>
        <div className="grid">
          {list.length === 0 && <p className="note">Nenhum personagem encontrado.</p>}
          {list.map((c) => (
            <button key={c.id} type="button" className="pick" onClick={() => onPick(c.name)}>
              <CharacterAvatar name={c.name} icon={c.icon} color={elementColor(c.element)} size={44} />
              <span className="n">{c.name}</span>
              <span className="m">{c.rarity}★ · {WEAPON_LABEL[c.weapon] ?? c.weapon}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

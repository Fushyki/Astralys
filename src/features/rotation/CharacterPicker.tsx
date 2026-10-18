/**
 * Diálogo para escolher um personagem (busca e filtro por elemento). Fecha com Esc ou clicando fora.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Character, Element } from '../../data/schema';
import { ELEMENT_COLOR } from '../../ui/format';

const ELEMENTS: Element[] = ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo'];
const WEAPON_LABEL: Record<string, string> = { Sword: 'Espada', Claymore: 'Montante', Polearm: 'Lança', Catalyst: 'Catalisador', Bow: 'Arco' };

export function CharacterPicker({
  title,
  note,
  characters,
  exclude,
  onPick,
  onClose,
}: {
  title: string;
  note?: string;
  characters: Character[];
  exclude: string[];
  onPick: (name: string) => void;
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
    <div className="ast-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ast-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2 className="ast-caps">{title}</h2>
          <button type="button" className="ast-btn sm" onClick={onClose}>Fechar</button>
        </header>
        {note && <p className="ast-hint" style={{ padding: '0 16px' }}>{note}</p>}
        <div className="ast-dialog-tools">
          <input ref={searchRef} type="search" placeholder="Buscar personagem" aria-label="Buscar personagem" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="ast-tabs" role="group" aria-label="Elemento">
            <button type="button" className="ast-tab" aria-pressed={element === null} onClick={() => setElement(null)}>Todos</button>
            {ELEMENTS.map((el) => (
              <button key={el} type="button" className="ast-tab" aria-pressed={element === el} onClick={() => setElement(element === el ? null : el)} style={{ ['--c' as string]: ELEMENT_COLOR[el] }}>
                <i /> {el}
              </button>
            ))}
          </div>
        </div>
        <div className="ast-pick-grid">
          {list.length === 0 && <p className="ast-hint">Nenhum personagem encontrado.</p>}
          {list.map((c) => (
            <button key={c.id} type="button" className="ast-pick" onClick={() => onPick(c.name)} style={{ ['--c' as string]: ELEMENT_COLOR[c.element] }}>
              <i />
              <span>{c.name}</span>
              <em>{c.rarity}★ · {WEAPON_LABEL[c.weapon] ?? c.weapon}</em>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

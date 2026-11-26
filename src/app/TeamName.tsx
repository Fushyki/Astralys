/** Nome do time na faixa do time: um clique vira o campo de edição; Enter ou sair do campo grava, Esc desiste. */
import { useRef, useState } from 'react';

export function TeamName({ name, onRename }: { name: string; onRename: (next: string) => void }) {
  const [editing, setEditing] = useState(false);
  // O campo que some ainda dispara o "blur": a marca diz se o texto vale.
  const cancelled = useRef(false);
  if (!editing) {
    return (
      <button type="button" className="name" title={`${name} · clique para renomear`} aria-label={`Renomear o time: ${name}`} onClick={() => { cancelled.current = false; setEditing(true); }}>
        {name}
      </button>
    );
  }
  return (
    <input
      className="name dz-input"
      aria-label="Nome do time"
      defaultValue={name}
      maxLength={120}
      autoFocus
      onFocus={(e) => e.currentTarget.select()}
      onBlur={(e) => {
        setEditing(false);
        const next = e.currentTarget.value.trim();
        if (!cancelled.current && next && next !== name) onRename(next);
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== 'Escape') return;
        e.preventDefault();
        cancelled.current = e.key === 'Escape';
        e.currentTarget.blur();
      }}
    />
  );
}

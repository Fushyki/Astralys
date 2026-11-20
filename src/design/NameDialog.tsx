/** Diálogo do Astralys para pedir um texto curto (no lugar do `window.prompt` do navegador). */
import { useEffect, useRef, useState } from 'react';
import { Button } from './Button';

interface Props {
  title: string;
  label: string;
  hint?: string;
  initial?: string;
  confirm: string;
  maxLength?: number;
  /** Texto já sem espaços nas pontas (pode ser vazio: o nome é opcional). */
  onSubmit: (value: string) => void;
  onClose: () => void;
}

export function NameDialog({ title, label, hint, initial = '', confirm, maxLength = 40, onSubmit, onClose }: Props) {
  const [value, setValue] = useState(initial);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
    input.current?.select();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="dz-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="dz-dialog dz-ask" role="dialog" aria-modal="true" aria-label={title} onSubmit={(e) => { e.preventDefault(); onSubmit(value.trim()); }}>
        <header>
          <h2 className="h2">{title}</h2>
          <Button variant="secondary" size="sm" onClick={onClose}>Fechar</Button>
        </header>
        <div className="dz-ask-body">
          <label className="dz-field">
            <span>{label}</span>
            <input ref={input} className="dz-input" value={value} maxLength={maxLength} onChange={(e) => setValue(e.target.value)} />
          </label>
          {hint && <p className="muted small">{hint}</p>}
        </div>
        <footer className="dz-ask-foot">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit">{confirm}</Button>
        </footer>
      </form>
    </div>
  );
}

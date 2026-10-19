/** Menu suspenso simples (botão que abre uma lista de ações). Fecha ao clicar fora, ao escolher ou com Esc. */
import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface MenuProps {
  /** Conteúdo do botão (texto ou ícone). */
  label: ReactNode;
  /** Nome acessível do botão. */
  ariaLabel: string;
  /** Classe do botão (ex.: `dz-btn` ou `dz-iconbtn`). */
  className?: string;
  align?: 'left' | 'right';
  /** Itens: use `onPick` para fechar o menu depois de uma ação. */
  children: (close: () => void) => ReactNode;
}

export function Menu({ label, ariaLabel, className = 'dz-btn', align = 'right', children }: MenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <span ref={root} className="dz-menu">
      <button ref={button} type="button" className={className} aria-haspopup="menu" aria-expanded={open} aria-label={ariaLabel} onClick={() => setOpen((o) => !o)}>
        {label}
      </button>
      {open && (
        <div className={`dz-menu-list ${align}`} role="menu" aria-label={ariaLabel}>
          {children(() => setOpen(false))}
        </div>
      )}
    </span>
  );
}

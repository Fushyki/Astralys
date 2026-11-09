/** Mostra os avisos de `toast()`, empilhados no canto de baixo. Um por vez some sozinho; o × fecha na hora. */
import { useToasts } from './toast';

export function Toaster() {
  const { items, dismiss } = useToasts();
  return (
    <div className="dz-toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`dz-toast${t.kind === 'error' ? ' error' : ''}`} role={t.kind === 'error' ? 'alert' : 'status'}>
          <i aria-hidden="true">{t.kind === 'error' ? '!' : '✓'}</i>
          <span>{t.text}</span>
          <button type="button" aria-label="Fechar aviso" onClick={() => dismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

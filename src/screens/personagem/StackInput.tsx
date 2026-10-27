/** Quantidade de stacks/pontos: botões − e +, e o número pode ser digitado (Enter ou sair do campo confirma; vale de 0 ao máximo). */
import { useEffect, useState } from 'react';
import '../talentos.css';

export function StackInput({ value, max, disabled, label, step = 1, onChange }: { value: number; max: number; disabled?: boolean; label: string; step?: number; onChange: (n: number) => void }) {
  // `step` > 1: a tela mostra a unidade real (ex.: segundos 0, 2, 4…) e a quantidade guardada são os passos.
  const shown = (n: number) => String(Math.round(n * step * 100) / 100);
  const [text, setText] = useState(shown(value));
  useEffect(() => setText(shown(value)), [value, step]); // eslint-disable-line react-hooks/exhaustive-deps
  const commit = () => {
    const n = Number(text.replace(',', '.'));
    if (!Number.isFinite(n) || text.trim() === '') return setText(shown(value));
    const next = Math.min(max, Math.max(0, Math.round(n / step)));
    setText(shown(next));
    if (next !== value) onChange(next);
  };
  return (
    <>
      <button type="button" aria-label="Menos" disabled={disabled || value <= 0} onClick={(e) => { e.preventDefault(); onChange(value - 1); }}>−</button>
      <b className="num">
        <input
          className="stack-in"
          inputMode="numeric"
          aria-label={label}
          disabled={disabled}
          size={Math.max(2, shown(max).length)}
          value={text}
          onChange={(e) => setText(e.target.value.replace(/[^\d]/g, '').slice(0, shown(max).length + 1))}
          onBlur={commit}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <small>/{shown(max)}</small>
      </b>
      <button type="button" aria-label="Mais" disabled={disabled || value >= max} onClick={(e) => { e.preventDefault(); onChange(value + 1); }}>+</button>
    </>
  );
}

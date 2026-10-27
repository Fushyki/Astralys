/** Quantidade de stacks/pontos: botões − e +, e o número pode ser digitado (Enter ou sair do campo confirma; vale de 0 ao máximo). */
import { useEffect, useState } from 'react';
import '../talentos.css';

export function StackInput({ value, max, disabled, label, onChange }: { value: number; max: number; disabled?: boolean; label: string; onChange: (n: number) => void }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    const n = Number(text.replace(',', '.'));
    if (!Number.isFinite(n) || text.trim() === '') return setText(String(value));
    const next = Math.min(max, Math.max(0, Math.round(n)));
    setText(String(next));
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
          size={Math.max(2, String(max).length)}
          value={text}
          onChange={(e) => setText(e.target.value.replace(/[^\d]/g, '').slice(0, String(max).length + 1))}
          onBlur={commit}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <small>/{max}</small>
      </b>
      <button type="button" aria-label="Mais" disabled={disabled || value >= max} onClick={(e) => { e.preventDefault(); onChange(value + 1); }}>+</button>
    </>
  );
}

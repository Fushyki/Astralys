/** Peças pequenas da tela Rotação: controle segmentado, campo numérico com vírgula e select no formato do mockup. */
import { useEffect, useState, type ReactNode } from 'react';

export function Seg<T extends string>({ value, options, onChange, label, full }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string; full?: boolean }) {
  return (
    <div className={`rt-seg${full ? ' full' : ''}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

const show = (v: number, digits: number) => v.toFixed(digits).replace('.', ',');

/** Campo numérico: mostra vírgula, grava ao sair do campo ou com Enter. */
export function Num({ label, value, onCommit, unit, digits = 1, className = '', sign, min, ariaLabel }: {
  label?: string; value: number; onCommit: (v: number) => void; unit?: string; digits?: number; className?: string; sign?: boolean; min?: number; ariaLabel?: string;
}) {
  const text = (sign && value > 0 ? '+' : '') + show(value, digits);
  const [draft, setDraft] = useState(text);
  useEffect(() => setDraft(text), [text]);
  const commit = () => {
    const n = Number(draft.replace(',', '.').replace('+', ''));
    if (!Number.isFinite(n) || (min !== undefined && n < min)) return setDraft(text);
    if (Math.abs(n - value) > 1e-9) onCommit(n);
    else setDraft(text);
  };
  const input = (
    <span className={`rt-inp num ${className}`}>
      <input
        value={draft}
        inputMode="decimal"
        aria-label={ariaLabel ?? label}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); e.stopPropagation(); }}
      />
      {unit && <span className="u">{unit}</span>}
    </span>
  );
  return label ? <label className="rt-fld">{label}{input}</label> : input;
}

export function Sel<T extends string>({ label, value, options, onChange, className = '', ariaLabel }: {
  label?: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; className?: string; ariaLabel?: string;
}) {
  const input = (
    <span className={`rt-inp ${className}`}>
      <select value={value} aria-label={ariaLabel ?? label} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="u" aria-hidden="true">▾</span>
    </span>
  );
  return label ? <label className="rt-fld">{label}{input}</label> : input;
}

export function Static({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return <div className="rt-fld">{label}<span className={`rt-inp num ${className}`}>{children}</span></div>;
}

export const sec = (t: number) => `${show(t, 1)} s`;
export const dec = show;

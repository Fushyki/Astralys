/** Campos de formulário do design: numérico que confirma ao sair/Enter, e lista de opções. */
import type { KeyboardEvent } from 'react';
import './design.css';

/** Confirma ao sair do campo ou com Enter (uma edição = uma entrada no histórico). Valor inválido volta ao anterior. */
export function NumberInput({
  label,
  value,
  min,
  max,
  step,
  suffix,
  disabled,
  invalid,
  onCommit,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step: number;
  suffix?: string;
  disabled?: boolean;
  invalid?: boolean;
  onCommit: (v: number) => void;
}) {
  const commit = (el: HTMLInputElement) => {
    const v = Number(el.value.replace(',', '.'));
    if (Number.isFinite(v) && v !== value) onCommit(v);
    else el.value = String(value);
  };
  return (
    <label className="dz-field">
      <span>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          key={String(value)}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          defaultValue={value}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onBlur={(e) => commit(e.currentTarget)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        {suffix ? <em style={{ fontStyle: 'normal', color: 'var(--muted)' }}>{suffix}</em> : null}
      </span>
    </label>
  );
}

export function SelectField<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <label className="dz-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

import type { KeyboardEvent } from 'react';

/**
 * Campo numérico que confirma ao sair do campo ou com Enter (uma edição = uma entrada no histórico).
 * Valor inválido volta ao anterior. A chave refaz o campo quando o valor muda por outro caminho (desfazer, arrastar).
 */
export function NumberField({
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
    <label className="ast-field">
      <span>{label}</span>
      <span className="in">
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
        {suffix ? <em>{suffix}</em> : null}
      </span>
    </label>
  );
}

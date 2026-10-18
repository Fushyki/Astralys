/** Componentes básicos do tema do editor (cartões, indicadores, barras). */
import type { CSSProperties, ReactNode } from 'react';

/** `wide` ocupa a linha inteira e distribui o conteúdo em colunas (listas longas). */
export function Panel({ title, children, wide }: { title: string; children: ReactNode; wide?: boolean }) {
  return (
    <section className={wide ? 'ast-panel ast-wide' : 'ast-panel'}>
      <h2 className="ast-caps">{title}</h2>
      <div className="body">{children}</div>
    </section>
  );
}

/** Indicador com nome, valor, unidade e uma frase que explica como é calculado. */
export function Kpi({ label, value, unit, description }: { label: string; value: ReactNode; unit: string; description: string }) {
  return (
    <div className="ast-kpi">
      <span className="k ast-caps">{label}</span>
      <span className="v">{value}</span>
      <span className="u">{unit}</span>
      <span className="d">{description}</span>
    </div>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="ast-hint">{children}</p>;
}

/** Linha com rótulo, valor e barra proporcional (0 a 100). */
export function BarRow({ label, value, percent, color, flag }: { label: string; value: string; percent: number; color?: string; flag?: string }) {
  return (
    <div className="ast-row">
      <span>
        {label}
        {flag ? <span className="ast-flag">{flag}</span> : null}
      </span>
      <span className="v">{value}</span>
      <div className="ast-track">
        <i style={{ width: `${Math.min(100, Math.max(0, percent))}%`, ...(color ? ({ '--c': color } as CSSProperties) : {}) }} />
      </div>
    </div>
  );
}

export interface StackPart {
  label: string;
  fraction: number;
  color: string;
}

/** Barra empilhada com legenda. As partes devem somar 1. */
export function StackedBar({ parts, format }: { parts: StackPart[]; format: (fraction: number) => string }) {
  return (
    <>
      <div className="ast-stack" role="img" aria-label={parts.map((p) => `${p.label} ${format(p.fraction)}`).join(', ')}>
        {parts.map((p) => (
          <i key={p.label} style={{ width: `${p.fraction * 100}%`, background: p.color }} />
        ))}
      </div>
      <div className="ast-legend">
        {parts.map((p) => (
          <div className="li" key={p.label}>
            <span className="sw" style={{ background: p.color }} />
            <span>{p.label}</span>
            <span className="v">{format(p.fraction)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

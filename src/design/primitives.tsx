/** Componentes base do design (Panel, KpiCard, Chip, Segmented, CharacterAvatar, linhas e barras). */
import { useState, type CSSProperties, type ReactNode } from 'react';
import './design.css';

const css = (vars: Record<string, string | number | undefined>): CSSProperties => vars as CSSProperties;

export function Panel({ title, aside, children, className, style }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <section className={`dz-panel${className ? ` ${className}` : ''}`} style={style}>
      {(title || aside) && (
        <div className="head">
          {title ? <h2 className="h2">{title}</h2> : <span />}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="h2">{children}</h2>;
}

export function KpiCard({ label, value, hint, tone, small }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'gold'; small?: boolean }) {
  return (
    <div className="dz-kpi">
      <span className="lbl">{label}</span>
      <span className={`v${tone === 'gold' ? ' gold' : ''}${small ? ' sm' : ''}`}>{value}</span>
      {hint && <span className="d">{hint}</span>}
    </div>
  );
}

export function Chip({ children, tone, warn, title }: { children: ReactNode; tone?: string; warn?: boolean; title?: string }) {
  return (
    <span className={`dz-chip${warn ? ' warn' : ''}${tone ? ' tone' : ''}`} style={tone ? css({ '--tone': tone }) : undefined} title={title}>
      {children}
    </span>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: ReactNode; disabled?: boolean }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="dz-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} disabled={o.disabled} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

const IMAGE_BASE = 'https://api.lunaris.moe/data/assets/avataricon';

/** O Lunaris traz o ícone de gacha (faixa 320x1024); o ícone quadrado do rosto tem o mesmo nome sem "Gacha_". */
export const faceIconUrl = (icon: string) => `${IMAGE_BASE}/${icon.replace('UI_Gacha_AvatarIcon_', 'UI_AvatarIcon_')}.webp`;

/** Retrato do Lunaris; sem imagem (ou se falhar) mostra a inicial na cor do elemento. */
export function CharacterAvatar({ name, icon, color, size = 64 }: { name: string; icon?: string; color: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="dz-avatar" style={css({ '--c': color, '--s': `${size}px` })} aria-hidden="true">
      {icon && !failed ? <img src={faceIconUrl(icon)} alt="" loading="lazy" crossOrigin="anonymous" onError={() => setFailed(true)} /> : name.charAt(0)}
    </span>
  );
}

export function StatRow({ label, value, base }: { label: ReactNode; value: ReactNode; base?: ReactNode }) {
  return (
    <div className="dz-row">
      <span className="k">{label}</span>
      <span>
        {base ? <span className="base">{base}</span> : null}
        <span className="v">{value}</span>
      </span>
    </div>
  );
}

export function BarRow({ label, value, percent, color, flag, dot }: { label: ReactNode; value: ReactNode; percent: number; color?: string; flag?: ReactNode; dot?: boolean }) {
  return (
    <div className="dz-barrow">
      <span className="name">
        {dot && color ? <i className="dz-dot" style={css({ '--c': color })} /> : null}
        {label}
        {flag}
      </span>
      <div className="dz-bar"><i style={css({ width: `${Math.min(100, Math.max(0.5, percent))}%`, '--c': color })} /></div>
      <span className="val">{value}</span>
    </div>
  );
}

export interface StackPart {
  key: string;
  label: string;
  fraction: number;
  color: string;
}

export function StackedBar({ parts, format, legend = true }: { parts: StackPart[]; format: (f: number) => string; legend?: boolean }) {
  const total = parts.reduce((s, p) => s + p.fraction, 0) || 1;
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div className="dz-stack" role="img" aria-label={parts.map((p) => `${p.label} ${format(p.fraction)}`).join(', ')}>
        {parts.map((p) => (
          <i key={p.key} style={css({ flexGrow: Math.max(p.fraction / total, 0.004), '--c': p.color })} title={`${p.label}: ${format(p.fraction)}`} />
        ))}
      </div>
      {legend && (
        <div className="dz-legend">
          {parts.map((p) => (
            <span key={p.key} className="num">
              <i className="dz-dot" style={css({ '--c': p.color })} />
              {p.label} {format(p.fraction)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function StateCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="dz">
      <div className="dz-state">
        <h1 className="h2">{title}</h1>
        {children}
      </div>
    </div>
  );
}

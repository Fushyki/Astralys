/**
 * Peças do estilo de filtros do Genshin Optimizer: cabeçalho de seção com selo de contagem, chips de stat
 * (verde = ligado, cinza = desligado, cor própria no cálice) e slider duplo de nível.
 */
import type { CSSProperties, ReactNode } from 'react';
import './filtros.css';

/** Sigla curta de cada stat (no lugar do ícone do jogo). */
export const STAT_TAG: Record<string, string> = {
  hp: 'HP', atk: 'ATK', def: 'DEF', hp_: 'HP%', atk_: 'ATK%', def_: 'DEF%', eleMas: 'EM', enerRech_: 'ER', critRate_: 'CR', critDMG_: 'CD', heal_: 'Cura',
  pyro_dmg_: 'Pyro', hydro_dmg_: 'Hydro', cryo_dmg_: 'Cryo', electro_dmg_: 'Electro', anemo_dmg_: 'Anemo', geo_dmg_: 'Geo', dendro_dmg_: 'Dendro', physical_dmg_: 'Fís.',
};

/** Cor do chip de cálice por elemento (variáveis de src/design/tokens.css). */
export const STAT_COLOR: Record<string, string> = {
  pyro_dmg_: 'var(--el-pyro)', hydro_dmg_: 'var(--el-hydro)', cryo_dmg_: 'var(--el-cryo)', electro_dmg_: 'var(--el-electro)', anemo_dmg_: 'var(--el-anemo)',
  geo_dmg_: 'var(--el-geo)', dendro_dmg_: 'var(--el-dendro)', physical_dmg_: 'var(--el-physical)',
};

/** Título de seção com o selo de contagem ao lado, ex.: "Sets [12/20]". */
export function SecHead({ title, count, total, aside }: { title: ReactNode; count?: number; total?: number; aside?: ReactNode }) {
  return (
    <div className="fx-head">
      <b>{title}</b>
      {count !== undefined && <span className="fx-badge num">{total !== undefined ? `${count}/${total}` : count}</span>}
      {aside && <span className="fx-aside">{aside}</span>}
    </div>
  );
}

/** Chip pequeno: sigla do stat + número. `color` pinta o chip ligado (senão, verde). */
export function StatChip({ tag, n, on, color, label, onClick, className }: { tag: ReactNode; n?: number | string; on: boolean; color?: string; label?: string; onClick?: () => void; className?: string }) {
  const style = color ? ({ ['--fx-c' as string]: color } as CSSProperties) : undefined;
  const body = (
    <>
      <i>{tag}</i>
      {n !== undefined && <span className="num">{n}</span>}
    </>
  );
  return onClick ? (
    <button type="button" className={`fx-chip${className ? ` ${className}` : ''}`} style={style} aria-pressed={on} title={label} aria-label={label} onClick={onClick}>{body}</button>
  ) : (
    <span className={`fx-chip static${className ? ` ${className}` : ''}`} style={style} data-on={on} title={label}>{body}</span>
  );
}

/** Slider duplo (mínimo e máximo no mesmo trilho). */
export function DualRange({ min, max, low, high, onChange, label }: { min: number; max: number; low: number; high: number; onChange: (low: number, high: number) => void; label: string }) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  return (
    <div className="fx-range" style={{ ['--lo' as string]: `${pct(low)}%`, ['--hi' as string]: `${pct(high)}%` } as CSSProperties}>
      <span className="num fx-end">{low}</span>
      <div className="fx-track">
        <i />
        <input type="range" min={min} max={max} step={1} value={low} aria-label={`${label}: mínimo`} onChange={(e) => onChange(Math.min(Number(e.target.value), high), high)} />
        <input type="range" min={min} max={max} step={1} value={high} aria-label={`${label}: máximo`} onChange={(e) => onChange(low, Math.max(Number(e.target.value), low))} />
      </div>
      <span className="num fx-end">{high}</span>
    </div>
  );
}

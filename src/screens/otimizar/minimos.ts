/** Mínimos nos stats finais do otimizador: quais existem, como mostrar e qual o equipado não atinge. */
import type { FinalStats } from '../../engine';
import { formatDecimal, formatInt } from '../../ui/format';

export type MinKey = 'er' | 'cr' | 'cd' | 'em' | 'hp' | 'atk' | 'def';

export const MIN_DEFS: { k: MinKey; label: string; pct: boolean }[] = [
  { k: 'er', label: 'Recarga', pct: true },
  { k: 'cr', label: 'Taxa crítica', pct: true },
  { k: 'cd', label: 'Dano crítico', pct: true },
  { k: 'em', label: 'Maestria', pct: false },
  { k: 'hp', label: 'HP', pct: false },
  { k: 'atk', label: 'ATK', pct: false },
  { k: 'def', label: 'DEF', pct: false },
];

/** O stat final na unidade do mínimo (porcentagem em pontos, o resto em número). */
export function statOf(s: FinalStats, k: MinKey): number {
  return k === 'er' ? s.er * 100 : k === 'cr' ? s.critRate * 100 : k === 'cd' ? s.critDmg * 100 : s[k];
}

export const formatMin = (k: MinKey, n: number): string => (MIN_DEFS.find((d) => d.k === k)!.pct ? `${formatDecimal(n, 1)}%` : formatInt(n));

/** Mínimos ativos (campo preenchido e válido), na ordem de `MIN_DEFS`. */
export function activeMins(mins: Record<MinKey, string>): { k: MinKey; label: string; value: number }[] {
  return MIN_DEFS.flatMap((d) => {
    const raw = mins[d.k].trim();
    const value = Number(raw.replace(',', '.'));
    return raw !== '' && Number.isFinite(value) ? [{ k: d.k, label: d.label, value }] : [];
  });
}

/** O primeiro mínimo que os stats não atingem, ou null se atingem todos. */
export function firstUnmet(mins: Record<MinKey, string>, s: FinalStats): { k: MinKey; label: string; value: number; have: number } | null {
  for (const m of activeMins(mins)) {
    const have = statOf(s, m.k);
    if (have < m.value - 1e-9) return { ...m, have };
  }
  return null;
}

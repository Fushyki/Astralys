import { ELEMENT_COLORS } from '../design/elements';

/** Formatação de números no padrão brasileiro. */
const intFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export const formatInt = (n: number): string => intFmt.format(Math.round(n));

export function formatDecimal(n: number, digits = 1): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** 0.5527 → "55,3%" */
export const formatPercent = (fraction: number, digits = 1): string => `${formatDecimal(fraction * 100, digits)}%`;

/** Cor de cada elemento no tema escuro do editor. */
export const ELEMENT_COLOR: Record<string, string> = ELEMENT_COLORS;

/** 216599 → "216,6k"; 3790496 → "3,79M". */
export function compact(n: number): string {
  if (n >= 1e6) return `${formatDecimal(n / 1e6, 2)}M`;
  if (n >= 1e3) return `${formatDecimal(n / 1e3, 1)}k`;
  return formatDecimal(n, 0);
}

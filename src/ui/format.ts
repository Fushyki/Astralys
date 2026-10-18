/** Formatação de números no padrão brasileiro. */
const intFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export const formatInt = (n: number): string => intFmt.format(Math.round(n));

export function formatDecimal(n: number, digits = 1): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** 0.5527 → "55,3%" */
export const formatPercent = (fraction: number, digits = 1): string => `${formatDecimal(fraction * 100, digits)}%`;

/** Cor de cada elemento no tema escuro do editor. */
export const ELEMENT_COLOR: Record<string, string> = {
  Pyro: '#ff8a4c',
  Hydro: '#5fb3ff',
  Anemo: '#5fe0c1',
  Electro: '#c39bff',
  Dendro: '#9bdb5a',
  Cryo: '#8fdcff',
  Geo: '#e5c05a',
  Physical: '#c9c9d6',
};

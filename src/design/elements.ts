/** Cores dos elementos (tokens.css) e a variação escura para o segundo personagem do mesmo elemento. */
export const ELEMENT_COLORS: Record<string, string> = {
  Pyro: '#f08a5d',
  Cryo: '#8fd3e8',
  Electro: '#c49cf2',
  Hydro: '#5fa8f5',
  Anemo: '#6fd6b3',
  Geo: '#e7b75c',
  Dendro: '#a5cf5a',
  Physical: '#c9cfea',
};

const DARK: Record<string, string> = {
  Pyro: '#b85f3a',
  Cryo: '#5e9db0',
  Electro: '#8e6cc0',
  Hydro: '#3f7fc4',
  Anemo: '#4da58a',
  Geo: '#b08a3f',
  Dendro: '#7fa03f',
};

export const elementColor = (element: string | null | undefined): string => (element ? ELEMENT_COLORS[element] ?? '#e9c46a' : '#e9c46a');

/** Uma cor por membro: o segundo (e seguintes) do mesmo elemento ganha a variação escura. */
export function memberColors(elements: (string | null | undefined)[]): string[] {
  const seen = new Map<string, number>();
  return elements.map((el) => {
    const key = el ?? '';
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    return n === 0 ? elementColor(el) : DARK[key] ?? elementColor(el);
  });
}

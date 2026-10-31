/** Modelo puro da demonstração da página inicial: quais buffs cobrem um golpe e quanto dele some sem cada um. Dados de `demo.json` (gerado pelo motor). */

export interface DemoMember { name: string; color: string }
export interface DemoHit { id: string; t: number; m: number; kind: string; label: string; avg: number; rows: { tag: string; effect: number }[] }
export interface DemoWindow { tag: string; giver: number | null; name: string; value: string; start: number; end: number }
export interface Demo { members: DemoMember[]; duration: number; dps: number; total: number; hits: DemoHit[]; windows: DemoWindow[] }

/** Nome do buff sem repetir o dono ("ATK fixo Bennett" → "ATK fixo"). */
export const buffName = (w: DemoWindow, giver: DemoMember | null): string => (giver && w.name.endsWith(` ${giver.name}`) ? w.name.slice(0, -giver.name.length - 1) : w.name);

export interface CoveringRow {
  tag: string;
  /** Fração do golpe que some sem o buff. */
  effect: number;
  /** Dano médio do golpe sem este buff (só ele fora; os outros continuam). */
  without: number;
  window: DemoWindow;
  giver: DemoMember | null;
}

/** Buffs que cobrem o golpe, do que mais pesa para o que menos pesa. A janela é a que contém o instante do golpe. */
export function coveringRows(demo: Demo, hit: DemoHit): CoveringRow[] {
  return hit.rows
    .map((r) => {
      const window = demo.windows.find((w) => w.tag === r.tag && w.start <= hit.t && hit.t < w.end);
      if (!window) return null;
      return { tag: r.tag, effect: r.effect, without: hit.avg * (1 - r.effect), window, giver: window.giver === null ? null : demo.members[window.giver] ?? null };
    })
    .filter((r): r is CoveringRow => r !== null)
    .sort((a, b) => b.effect - a.effect);
}

/** O golpe que abre a demonstração: o de maior dano. */
export const strongestHit = (demo: Demo): DemoHit => demo.hits.reduce((best, h) => (h.avg > best.avg ? h : best), demo.hits[0]);

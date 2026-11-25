/** Tipos do módulo gerado por scripts/go-talentos/build.mjs (fichas do Genshin Optimizer). */
export interface GoMember {
  key: string;
  element: string;
  level: number;
  constellation: number;
  ascension: number;
  talents: { normal: number; skill: number; burst: number };
  /** Atributos que vêm do build (arma e artefatos), nas chaves do GO; percentuais como fração. */
  stats: Record<string, number>;
  conditionals: Record<string, string>;
}
export interface GoRequest {
  active: string;
  hitMode: 'hit' | 'avgHit' | 'critHit';
  enemy: { level: number; res: Record<string, number> };
  team: GoMember[];
}
export interface GoRow { label: string; value: number | string; unit: string; element: string; team: boolean }
export type GoBlock =
  | { kind: 'text'; text: string }
  | { kind: 'rows'; rows: GoRow[] }
  | { kind: 'cond'; owner: string; card: string; id: string; title: string; team: boolean; value: string; options: { value: string; label: string }[]; rows: GoRow[] };
export interface GoTalents {
  cards: { key: string; blocks: GoBlock[] }[];
  fromTeam: { key: string; blocks: GoBlock[] }[];
  stats: { atk: number; hp: number; def: number; em: number };
}
export const supported: string[];
export function computeTalents(req: GoRequest): GoTalents;

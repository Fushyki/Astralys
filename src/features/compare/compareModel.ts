/**
 * Comparação A/B de dois projetos: diferença de DPS e DPR e, personagem a personagem, de dano, participação e build.
 * Função pura sobre os modelos do card (que já resumem cada projeto).
 */
import type { CardMember, CardModel } from '../card/cardModel';

export interface MemberDiff {
  name: string;
  a: CardMember | null;
  b: CardMember | null;
  /** Variação do dano médio de B contra A, em fração (0,1 = +10%); null se o personagem não está nos dois. */
  avgChange: number | null;
}

export interface Comparison {
  /** Variação de B contra A, em fração; null se A é zero. */
  dpsChange: number | null;
  dprChange: number | null;
  durationChange: number;
  members: MemberDiff[];
  /** Qual projeto rende mais em DPR ('a', 'b' ou 'tie' com diferença abaixo de 0,01%). */
  winner: 'a' | 'b' | 'tie';
}

const change = (a: number, b: number): number | null => (a > 0 ? b / a - 1 : null);

export function compareModels(a: CardModel, b: CardModel): Comparison {
  const names = [...a.members.map((m) => m.name), ...b.members.map((m) => m.name).filter((n) => !a.members.some((m) => m.name === n))];
  const members = names.map((name) => {
    const ma = a.members.find((m) => m.name === name) ?? null;
    const mb = b.members.find((m) => m.name === name) ?? null;
    return { name, a: ma, b: mb, avgChange: ma && mb ? change(ma.avg, mb.avg) : null };
  });
  const dprChange = change(a.dpr, b.dpr);
  const winner = dprChange === null || Math.abs(dprChange) < 1e-4 ? 'tie' : dprChange > 0 ? 'b' : 'a';
  return {
    dpsChange: change(a.dps, b.dps),
    dprChange,
    durationChange: b.duration - a.duration,
    members,
    winner,
  };
}

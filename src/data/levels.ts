/**
 * Stats base do personagem em qualquer nível (1 a 90). O Lunaris só traz o nível 90; a curva de nível e os bônus de ascensão vêm do
 * Genshin Optimizer (`scripts/sync-levels.ts` → `levels.json`): stat = base × curva[nível] + bônus[ascensão].
 */
import type { Character } from './schema';

export interface LevelChar {
  hp: [number, string];
  atk: [number, string];
  def: [number, string];
  asc: { hp: number[]; atk: number[]; def: number[]; special?: number[] };
}
export interface LevelsData {
  curves: Record<string, number[]>;
  chars: Record<string, LevelChar>;
}

export const MAX_CHARACTER_LEVEL = 90;
/** Níveis em que o personagem pode estar ascendido (20, 40, 50, 60, 70, 80). */
export const ASCENSION_CAPS = [20, 40, 50, 60, 70, 80];

/** Ascensão (0 a 6) de um nível: assume ascendido nos níveis-limite (Lv. 40 = A2, Lv. 90 = A6). */
export const ascensionAt = (level: number): number => ASCENSION_CAPS.filter((c) => c <= level).length;

export const hasLevelData = (name: string, levels?: LevelsData): boolean => !!levels?.chars[name];

/** O personagem com os stats base do nível pedido (sem dados ou no nível 90, devolve o mesmo objeto). */
export function characterAtLevel(character: Character, level: number, levels?: LevelsData): Character {
  const lv = Math.min(MAX_CHARACTER_LEVEL, Math.max(1, Math.round(level)));
  const data = levels?.chars[character.name];
  if (!levels || !data || lv === MAX_CHARACTER_LEVEL) return character;
  const asc = ascensionAt(lv);
  const raw = (k: 'hp' | 'atk' | 'def', l: number, a: number) => data[k][0] * levels.curves[data[k][1]][l] + data.asc[k][a];
  // Ancorado no Lunaris: o nível 90 continua sendo exatamente o dado dele (Aloy e o Viajante têm base diferente no GO).
  const base = { hp: character.baseHp, atk: character.baseAtk, def: character.baseDef };
  const stat = (k: 'hp' | 'atk' | 'def') => (raw(k, lv, asc) * base[k]) / raw(k, MAX_CHARACTER_LEVEL, 6);
  const top = data.asc.special?.[6];
  return {
    ...character,
    baseHp: stat('hp'),
    baseAtk: stat('atk'),
    baseDef: stat('def'),
    ...(character.ascension && top ? { ascension: { ...character.ascension, value: (character.ascension.value * (data.asc.special![asc] ?? 0)) / top } } : {}),
  };
}

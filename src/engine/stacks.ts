/** Buffs com stacks ou pontos: os números do JSON valem para o máximo; a escolha do usuário escala tudo em `stats`. */
import type { CharacterBuff, CharacterEffect } from '../effects/schema';

const scaleNumbers = <T,>(value: T, k: number): T => {
  if (typeof value === 'number') return (value * k) as unknown as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, scaleNumbers(v, k)])) as T;
  return value;
};

/** Quantos stacks valem para o buff (entre 0 e o máximo; sem escolha, o máximo). */
export const stacksOf = (b: Pick<CharacterBuff, 'stacks'>, chosen: number | undefined): number =>
  b.stacks ? Math.min(b.stacks.max, Math.max(0, Math.round(chosen ?? b.stacks.max))) : 0;

export function scaleBuffStacks(b: CharacterBuff, chosen: number | undefined): CharacterBuff {
  if (!b.stacks || !b.stats) return b;
  const n = stacksOf(b, chosen);
  return n === b.stacks.max ? b : { ...b, stats: scaleNumbers(b.stats, n / b.stacks.max) };
}

export function withStacks(effect: CharacterEffect | undefined, chosen: Record<string, number> | undefined): CharacterEffect | undefined {
  if (!effect || !chosen || !effect.buffs.some((b) => b.stacks && chosen[b.id] !== undefined)) return effect;
  return { ...effect, buffs: effect.buffs.map((b) => scaleBuffStacks(b, chosen[b.id])) };
}

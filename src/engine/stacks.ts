/** Buffs com stacks ou pontos: os números do JSON valem para o máximo; a escolha do usuário escala o que depende dos stacks. */
import type { CharacterBuff, CharacterEffect } from '../effects/schema';

const scaleNumbers = <T,>(value: T, k: number): T => {
  if (typeof value === 'number') return (value * k) as unknown as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, scaleNumbers(v, k)])) as T;
  return value;
};

/** Quantos stacks valem para o buff (entre 0 e o máximo; sem escolha, o máximo). */
export const stacksOf = (b: Pick<CharacterBuff, 'stacks'>, chosen: number | undefined): number =>
  b.stacks ? Math.min(b.stacks.max, Math.max(0, Math.round(chosen ?? b.stacks.default ?? b.stacks.max))) : 0;

/** Fração do valor máximo para `n` stacks: a tabela do efeito (10/20/30/48%) ou em linha reta (n / max). */
export const stackFraction = (stacks: NonNullable<CharacterBuff['stacks']>, n: number): number => stacks.table?.[n] ?? n / stacks.max;

/** Escala tudo que depende dos stacks: os stats, a conversão por ponto, o dano fixo por ponto e a redução de RES/DEF. */
export function scaleBuffStacks(b: CharacterBuff, chosen: number | undefined): CharacterBuff {
  if (!b.stacks) return b;
  const n = stacksOf(b, chosen);
  if (n === b.stacks.max) return b;
  const k = stackFraction(b.stacks, n);
  return {
    ...b,
    ...(b.stats ? { stats: scaleNumbers(b.stats, k) } : {}),
    ...(b.convert ? { convert: { ...b.convert, perPoint: b.convert.perPoint * k } } : {}),
    // O teto por golpe (capPerHit) não muda com os stacks: é o máximo do efeito inteiro.
    ...(b.flat?.length ? { flat: b.flat.map((f) => ({ ...f, perPoint: f.perPoint * k })) } : {}),
    ...(b.resShred ? { resShred: { ...b.resShred, value: b.resShred.value * k } } : {}),
    ...(b.defShred ? { defShred: b.defShred * k } : {}),
  };
}

export function withStacks(effect: CharacterEffect | undefined, chosen: Record<string, number> | undefined): CharacterEffect | undefined {
  const key = (b: CharacterBuff) => b.stacks?.of ?? b.id;
  const changes = (b: CharacterBuff) => !!b.stacks && (chosen?.[key(b)] !== undefined || b.stacks.default !== undefined);
  if (!effect || !effect.buffs.some(changes)) return effect;
  return { ...effect, buffs: effect.buffs.map((b) => scaleBuffStacks(b, chosen?.[key(b)])) };
}

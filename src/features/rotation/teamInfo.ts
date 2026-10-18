/**
 * Informações derivadas da equipe para a interface (sem React): ressonância elemental e cobertura de efeitos.
 */
import type { Element } from '../../data/schema';
import type { EffectsData, MemberRef } from '../../engine';

export interface ResonanceInfo {
  element: Element;
  /** O motor calcula o efeito desta ressonância. */
  applied: boolean;
  text: string;
}

/**
 * Cada elemento com 2 ou mais personagens dá ressonância. Só a de Pyro (+25% ATK) tem efeito numérico confirmado
 * na planilha de referência; as outras são listadas como "ainda não calculadas" em vez de inventar valores.
 */
export function resonanceOf(elements: Element[]): ResonanceInfo[] {
  const count = new Map<Element, number>();
  for (const e of elements) count.set(e, (count.get(e) ?? 0) + 1);
  return [...count.entries()]
    .filter(([, n]) => n >= 2)
    .map(([element]) => ({
      element,
      applied: element === 'Pyro',
      text: element === 'Pyro' ? '+25% de ATK para toda a equipe, já aplicado' : 'o efeito ainda não é calculado pelo motor',
    }));
}

export interface EffectCoverage {
  weaponHasEffect: boolean;
  primarySetHasEffect: boolean | null;
  secondarySetHasEffect: boolean | null;
  characterHasEffect: boolean;
}

/** Quais partes do build têm efeito numérico cadastrado (sem ele, só os stats base valem). */
export function effectCoverage(member: MemberRef, effects: EffectsData): EffectCoverage {
  const setCovered = (name?: string) => (name ? effects.sets.some((s) => s.set === name) : null);
  return {
    weaponHasEffect: effects.weapons.some((w) => w.weapon === member.weapon),
    primarySetHasEffect: setCovered(member.primarySet),
    secondarySetHasEffect: setCovered(member.secondarySet),
    characterHasEffect: effects.characters.some((c) => c.character === member.character),
  };
}

/** Passivas sem efeito cadastrado, em texto, para avisar o usuário. Lista vazia = tudo coberto. */
export function missingEffects(member: MemberRef, effects: EffectsData): string[] {
  const c = effectCoverage(member, effects);
  const out: string[] = [];
  if (!c.weaponHasEffect) out.push(`arma ${member.weapon}`);
  if (c.primarySetHasEffect === false) out.push(`set ${member.primarySet}`);
  if (c.secondarySetHasEffect === false) out.push(`set ${member.secondarySet}`);
  return out;
}

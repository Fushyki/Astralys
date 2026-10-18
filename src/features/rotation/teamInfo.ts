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

const RESONANCE_TEXT: Record<Element, { applied: boolean; text: string }> = {
  Pyro: { applied: true, text: '+25% de ATK para toda a equipe, já aplicado' },
  Hydro: { applied: true, text: '+25% de HP máximo para toda a equipe, já aplicado' },
  Cryo: { applied: true, text: '+15% de Taxa Crítica (contra inimigos sob Cryo, assumido sempre), já aplicado' },
  Dendro: { applied: true, text: '+50 de Maestria Elemental, já aplicado (os bônus depois de reações não entram)' },
  Geo: { applied: true, text: '-20% de RES Geo do inimigo, já aplicado (o +15% de DMG com escudo não entra)' },
  Electro: { applied: false, text: 'não muda stats (só recupera energia), então não afeta o dano' },
  Anemo: { applied: false, text: 'não muda stats (estamina, velocidade e recarga de habilidade), então não afeta o dano' },
};

/** Cada elemento com 2 ou mais personagens dá ressonância; o texto diz o que o motor calcula. */
export function resonanceOf(elements: Element[]): ResonanceInfo[] {
  const count = new Map<Element, number>();
  for (const e of elements) count.set(e, (count.get(e) ?? 0) + 1);
  return [...count.entries()]
    .filter(([, n]) => n >= 2)
    .map(([element]) => ({ element, ...RESONANCE_TEXT[element] }));
}

export interface EffectCoverage {
  weaponHasEffect: boolean;
  primarySetHasEffect: boolean | null;
  secondarySetHasEffect: boolean | null;
  /** O build usa 4 peças do set principal, mas o bônus de 4 peças ainda não está cadastrado. */
  fourPieceMissing: boolean;
  characterHasEffect: boolean;
}

/** Quais partes do build têm efeito numérico cadastrado (sem ele, só os stats base valem). */
export function effectCoverage(member: MemberRef, effects: EffectsData): EffectCoverage {
  const setCovered = (name?: string) => (name ? effects.sets.some((s) => s.set === name && (s.twoPiece || s.fourPiece)) : null);
  return {
    weaponHasEffect: effects.weapons.some((w) => w.weapon === member.weapon),
    primarySetHasEffect: setCovered(member.primarySet),
    secondarySetHasEffect: setCovered(member.secondarySet),
    fourPieceMissing:
      !!member.primarySet && !member.secondarySet && member.fourPiece !== false && !effects.sets.some((s) => s.set === member.primarySet && s.fourPiece),
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
  if (c.fourPieceMissing && c.primarySetHasEffect !== false) out.push(`4 peças de ${member.primarySet}`);
  return out;
}

/**
 * Informações derivadas da equipe para a interface (sem React): ressonância elemental e cobertura de efeitos.
 */
import type { Element } from '../../data/schema';
import type { CharacterEffect } from '../../effects/schema';
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
  const setCovered = (name?: string) => (name ? effects.sets.some((s) => s.set === name && (s.twoPiece || s.fourPiece || s.noDamage)) : null);
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

export type EffectStatus = 'full' | 'partial' | 'none' | 'missing';

export const EFFECT_STATUS_LABEL: Record<EffectStatus, string> = {
  full: 'No cálculo',
  partial: 'Parcial',
  none: 'Sem efeito no dano',
  missing: 'Ainda fora do cálculo',
};

/** Estado de uma arma ou set: completo, parcial (uma parte mexe em dano e não entra), só utilidade, ou sem cadastro. */
export function effectStatus(effect: { noDamage?: boolean; partial?: boolean } | undefined): EffectStatus {
  if (!effect) return 'missing';
  if (effect.partial) return 'partial';
  if (effect.noDamage) return 'none';
  return 'full';
}

export interface KitRow {
  /** 'A1', 'A4' ou 'C1' a 'C6'. */
  label: string;
  /** modeled = tem número no cálculo; boost = +3 de nível de talento; utility = só energia, cura, CD; partial = parte fora; missing = sem cadastro. */
  status: 'modeled' | 'boost' | 'utility' | 'partial' | 'missing';
  note: string;
}

const KIT_SOURCES = [
  { label: 'A1', src: 'p1' },
  { label: 'A4', src: 'p2' },
  { label: 'C1', src: 'const1' },
  { label: 'C2', src: 'const2' },
  { label: 'C3', src: 'const3' },
  { label: 'C4', src: 'const4' },
  { label: 'C5', src: 'const5' },
  { label: 'C6', src: 'const6' },
] as const;

/** O que o cálculo faz com cada passiva de ascensão e cada constelação do personagem. */
export function kitCoverage(
  effect: CharacterEffect | undefined,
  boosts: { c3: string | null; c5: string | null } | undefined,
): KitRow[] {
  const TALENT = { normal: 'ataque normal', skill: 'habilidade', burst: 'supremo' } as Record<string, string>;
  return KIT_SOURCES.map(({ label, src }) => {
    const buffs = (effect?.buffs ?? []).filter((b) => (src.startsWith('const') ? b.minConstellation === Number(src.slice(5)) : b.id.toLowerCase().startsWith(label.toLowerCase()) || b.label.includes(label)));
    const boost = src === 'const3' ? boosts?.c3 : src === 'const5' ? boosts?.c5 : null;
    const note = (effect?.notes ?? []).find((n) => n.src === src);
    const procs = (effect?.procs ?? []).filter((p) => p.src === src);
    if (buffs.length || procs.length) {
      const extra = note?.kind === 'partial' ? ` ${note.note}` : '';
      const texts = [...buffs.map((b) => b.note ?? b.label), ...procs.map((p) => `Golpe extra na paleta da rotação: ${p.note ?? p.label}`)];
      return { label, status: note?.kind === 'partial' ? 'partial' : 'modeled', note: texts.join(' ') + extra };
    }
    if (boost) return { label, status: 'boost', note: `+3 de nível no ${TALENT[boost] ?? boost}.` };
    if (note) return { label, status: note.kind === 'utility' ? 'utility' : 'partial', note: note.note };
    return { label, status: 'missing', note: 'Ainda sem cadastro.' };
  });
}

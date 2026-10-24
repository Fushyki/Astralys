/** Textos dos talentos, passivas e constelações (Lunaris em português), carregados só quando a aba Talentos abre. */
import { useQuery } from '@tanstack/react-query';

export interface TalentText {
  name: string;
  icon: string;
  description: string;
}
export interface CharacterTalents {
  character: string;
  skills: (TalentText & { talent: 'normal' | 'skill' | 'burst' })[];
  passives: (TalentText & { id: string })[];
  constellations: (TalentText & { n: number })[];
}

export function useTalents() {
  return useQuery({
    queryKey: ['talents'],
    queryFn: async () => (await import('../../data/generated/talents.json')).default as unknown as CharacterTalents[],
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** A que talento, passiva ou constelação um buff curado pertence (pelo id do buff: a1, a4, c2, c2s, burst, skill…). */
export type BuffHome = { kind: 'passive'; id: 'p1' | 'p2' } | { kind: 'const'; n: number } | { kind: 'talent'; talent: 'normal' | 'skill' | 'burst' } | { kind: 'other' };

export function buffHome(id: string): BuffHome {
  const a = /^a(\d)/.exec(id);
  if (a) return a[1] === '1' ? { kind: 'passive', id: 'p1' } : a[1] === '4' ? { kind: 'passive', id: 'p2' } : { kind: 'other' };
  const c = /^c(\d)/.exec(id);
  if (c) return { kind: 'const', n: Number(c[1]) };
  if (id === 'normal' || id === 'skill' || id === 'burst') return { kind: 'talent', talent: id };
  return { kind: 'other' };
}

export const skillIconUrl = (icon: string) => `https://api.lunaris.moe/data/assets/skills/${icon}.webp`;

/** Textos dos talentos, passivas e constelações (Lunaris em português), carregados só quando a aba Talentos abre. */
import { useQuery } from '@tanstack/react-query';

export interface TalentText {
  name: string;
  icon: string;
  description: string;
}
export interface CharacterTalents {
  character: string;
  skills: (TalentText & { talent: 'normal' | 'skill' | 'burst'; params?: { label: string; values: string[] }[] })[];
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

/** Quebra um chip de buff ("+40% DMG", "ATK fixo +810", "+120 EM") em nome e valor. */
export function splitChip(chip: string): { name: string; value: string } {
  const first = /^([+\-−][\d.,]+%?)\s+(.+)$/.exec(chip);
  if (first) return { name: first[2].trim(), value: first[1] };
  const second = /^(.+?)\s+([+\-−][\d.,]+%?)$/.exec(chip);
  if (second) return { name: second[1].trim(), value: second[2] };
  return { name: chip, value: '' };
}

/** Linhas de parâmetro (duração, recarga, Stamina…) de um talento no nível pedido (1 a 15). */
export function paramRows(params: { label: string; values: string[] }[] | undefined, level: number): { label: string; value: string }[] {
  return (params ?? []).map((p) => ({ label: p.label, value: (p.values[Math.min(p.values.length, Math.max(1, level)) - 1] ?? '').replace(/\./g, ',') }));
}

/** Textos dos talentos, passivas e constelações (Lunaris em português): um arquivo por personagem, pedido pela tela dele. */
import { useQuery } from '@tanstack/react-query';
import type { CharacterBuff } from '../../effects/schema';
import { formatDecimal } from '../../ui/format';

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

export function useTalents(characterId: string) {
  return useQuery({
    queryKey: ['talents', characterId],
    queryFn: async () => (await import('../rotation/dataFiles')).appFile<CharacterTalents | null>(`talents/${characterId}`),
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
  // Escudo de Jade do Zhongli: vem da habilidade.
  if (id === 'shield') return { kind: 'talent', talent: 'skill' };
  const t = /^(normal|skill|burst)(-|$)/.exec(id);
  if (t) return { kind: 'talent', talent: t[1] as 'normal' | 'skill' | 'burst' };
  return { kind: 'other' };
}

/**
 * Ids do motor que a caixa de uma condição liga e desliga. A redução de RES/DEF tem id próprio: sem ele a caixa não a tirava
 * do cálculo.
 */
export function conditionIds(index: number, b: CharacterBuff): string[] {
  const shred = b.timed
    ? b.resShred || b.defShred ? [`cbuff-shred-${index}-${b.id}`] : []
    : [...(b.resShred ? [`cbuff-res-${index}-${b.id}`] : []), ...(b.defShred ? [`cbuff-def-${index}-${b.id}`] : [])];
  const other = !!(b.stats || b.flat?.length || b.moveMult || b.convert || b.onMove) || shred.length === 0;
  // Fonte estática (só dele, sempre) ou buff de time (faixa ou regra).
  const main = !b.timed && b.scope === 'self' && b.stats ? `m${index}:cbuff-${b.id}` : `cbuff-${index}-${b.id}`;
  return [...(other ? [main] : []), ...shred];
}

const ELEMENT_PT: Record<string, string> = { Physical: 'Físico' };
const percent = (f: number) => `${formatDecimal(f * 100, 1).replace(/,0$/, '')}%`;
const listOf = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}` : items[0]);

/** Linhas da redução de RES e DEF do inimigo. `now` é o buff já com time, nível e stacks (ausente = o time não cumpre a regra). */
export function shredRows(raw: CharacterBuff, now: CharacterBuff | undefined): { name: string; value: string }[] {
  const none = 'não vale neste time';
  return [
    ...(raw.resShred ? [{ name: `RES ${listOf(raw.resShred.elements.map((e) => ELEMENT_PT[e] ?? e))} do inimigo`, value: now?.resShred ? `−${percent(now.resShred.value)}` : none }] : []),
    ...(raw.defShred ? [{ name: 'DEF do inimigo', value: now?.defShred ? `−${percent(now.defShred)}` : none }] : []),
  ];
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

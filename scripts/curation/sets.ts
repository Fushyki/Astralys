/**
 * Curadoria dos bônus de 4 peças: de onde sai cada número (parâmetro do Lunaris ou literal da descrição) e o que foi
 * assumido. Só entram efeitos que o motor sabe aplicar; o resto fica de fora e a `note` diz o que falta.
 */
import type { Element } from '../../src/data/schema';
import type { BuffCur, FlatCur } from './gear';

/** Um parâmetro do Lunaris (`p` = índice, `x` = multiplicador, ex.: stacks) ou um literal tirado da descrição. */
export type Val = number | { p: number; x?: number } | { lit: number } | { re: string; x?: number };

export interface FourCuration {
  atkPct?: Val;
  dmgPct?: Val;
  critRate?: Val;
  critDmg?: Val;
  em?: Val;
  hpPct?: Val;
  defPct?: Val;
  meltBonus?: Val;
  byType?: Partial<Record<'normal' | 'charged' | 'plunge' | 'skill' | 'burst', Val>>;
  team?: { atkPct?: Val; dmgPct?: Val; em?: Val };
  er?: Val;
  critRateByType?: Partial<Record<'normal' | 'charged' | 'plunge' | 'skill' | 'burst', Val>>;
  critDmgByType?: Partial<Record<'normal' | 'charged' | 'plunge' | 'skill' | 'burst', Val>>;
  /** Conversões, regras de time e faixas (mesmo formato dos buffs de arma). */
  buffs?: BuffCur[];
  flat?: FlatCur[];
  /** Só energia, cura, recarga ou resistência: nada a calcular em dano. */
  noDamage?: true;
  /** Parte que mexe em dano (reação, Lunar, Estelar, golpe extra) ainda fora do cálculo. */
  partial?: true;
  /** Trecho que TEM de aparecer na descrição do 4 peças. */
  expect?: string;
  resShred?: { value: Val; elements: Element[] };
  /** Suposições e o que não entra no cálculo. */
  note: string;
}

export const FOUR_PIECE: Record<string, FourCuration> = {
  'Brave Heart': { dmgPct: { p: 0 }, note: 'Assume inimigo com mais de 50% de HP.' },
  'Martial Artist': {
    byType: { normal: { p: 2 }, charged: { p: 2 } },
    note: 'Assume o bônus de 8 s depois da habilidade sempre ativo.',
  },
  'Blizzard Strayer': { critRate: { p: 0 }, note: 'Assume inimigo sob Cryo. Os +20% extras contra inimigo congelado NÃO entram.' },
  Thundersoother: { dmgPct: { p: 0 }, note: 'Assume inimigo sob Electro.' },
  Lavawalker: { dmgPct: { p: 0 }, note: 'Assume inimigo sob Pyro.' },
  'Glacier and Snowfield': {
    dmgPct: { p: 3 },
    meltBonus: { p: 1 },
    note: 'Assume o +30% de dano Cryo do Supremo (10 s) sempre ativo. Os +100% de Supercondutor NÃO entram.',
  },
  'Retracing Bolide': { byType: { normal: { p: 0 }, charged: { p: 0 } }, note: 'Assume personagem protegido por escudo.' },
  'Heart of Depth': { byType: { normal: { p: 0 }, charged: { p: 0 } }, note: 'Assume o bônus de 15 s depois da habilidade sempre ativo.' },
  'Tenacity of the Millelith': {
    team: { atkPct: { p: 0 } },
    note: 'ATK da equipe por 3 s depois da habilidade: só vale nas janelas de buff. A força do escudo NÃO entra.',
  },
  'Pale Flame': {
    atkPct: { p: 0, x: 2 },
    note: 'Assume 2 stacks (9% cada). O dobro do bônus de dano Físico de 2 peças com 2 stacks NÃO entra.',
  },
  'Vermillion Hereafter': {
    atkPct: { p: 1 },
    note: 'Só os 8% de ATK do Supremo. Os +10% por perda de HP (até 4 vezes) NÃO entram.',
  },
  'Deepwood Memories': {
    resShred: { value: { p: 0 }, elements: ['Dendro'] },
    note: 'Reduz a RES Dendro do inimigo em 30% (assume sempre ativo).',
  },
  'Desert Pavilion Chronicle': {
    byType: { normal: { p: 1 }, charged: { p: 1 }, plunge: { p: 1 } },
    note: 'Assume o bônus de 15 s depois do ataque carregado sempre ativo. A velocidade de ataque NÃO entra.',
  },
  "Nymph's Dream": {
    atkPct: { p: 3 },
    dmgPct: { p: 6 },
    note: 'Assume 3 stacks de Mirrored Nymph (ATK +25% e dano Hydro +15%).',
  },
  'Marechaussee Hunter': { critRate: { p: 0, x: 3 }, note: 'Assume 3 stacks de +12% de Taxa Crítica (variação de HP).' },
  'Golden Troupe': { byType: { skill: { p: 0 } }, note: 'Só os +25% de dano da habilidade em campo. Os +25% fora de campo NÃO entram.' },
  'Fragment of Harmonic Whimsy': { dmgPct: { p: 0, x: 3 }, note: 'Assume 3 stacks de +18% de dano (Bond of Life).' },
  'Unfinished Reverie': { dmgPct: { lit: 0.5 }, note: 'Assume o bônus máximo de 50% de dano (fora de combate ou com inimigo em Queimadura).' },
  "Long Night's Oath": { byType: { plunge: { p: 3, x: 5 } }, note: 'Assume 5 stacks de +15% de dano do ataque imersivo.' },
  'A Day Carved From Rising Winds': { atkPct: { p: 1 }, note: 'Só o +25% de ATK. O efeito extra de "Witch\'s Homework" NÃO entra.' },
  'Nighttime Whispers in the Echoing Woods': {
    dmgPct: { p: 1 },
    note: 'Assume +20% de dano Geo depois da habilidade sempre ativo. O aumento com escudo de Cristalizar NÃO entra.',
  },
  "Vourukasha's Glow": {
    byType: { skill: { p: 0 }, burst: { p: 0 } },
    note: 'Só os +10% de dano de habilidade e Supremo. O aumento por levar dano (até 5 stacks) NÃO entra.',
  },
};

/** Curadoria de passivas e constelações, lote 5 (Nod-Krai recentes e Viajantes). Regras em `characters2.ts`. */
import type { BuffCuration } from './characters';

/** Os Viajantes (Aether e Lumine) têm os mesmos textos por elemento: a curadoria é gerada para os dois. */
const TRAVELER: Record<string, BuffCuration[]> = {
  Anemo: [
    { id: 'c6', label: 'Viajante C6', src: 'const6', scope: 'self', timed: false, resShred: { value: { lit: 0.2 }, elements: ['Anemo'] }, expect: 'Anemo RES decreased by 20%', note: 'Assume a redução de RES Anemo do Gust Surge sempre ativa. A do elemento absorvido não entra.' },
  ],
  Geo: [
    { id: 'c1', label: 'Viajante C1', src: 'const1', scope: 'team', timed: true, stats: { critRate: { lit: 0.1 } }, expect: 'CRIT Rate increased by 10%', note: '+10% de Taxa Crítica da equipe dentro do raio de Wake of Earth: ligue nas janelas.' },
  ],
  Electro: [
    { id: 'c2', label: 'Viajante C2', src: 'const2', scope: 'self', timed: false, resShred: { value: { p: 1, x: -1 }, elements: ['Electro'] }, expect: 'decrease their Electro RES by 15%', note: 'Assume a redução de RES Electro (8 s) sempre ativa.' },
  ],
  Dendro: [
    { id: 'a1', label: 'Viajante A1', src: 'p1', scope: 'team', timed: true, stats: { em: { p: 0, x: 10 } }, expect: 'increasing the Elemental Mastery of active character(s) within its AoE by 6', note: 'Assume 10 níveis de Luz de Lótus (+60 de Maestria) dentro da área da Lâmpada: ligue nas janelas.' },
    { id: 'c6', label: 'Viajante C6', src: 'const6', scope: 'team', timed: true, forElements: ['Dendro'], stats: { dmgPct: { p: 0 } }, expect: 'Dendro DMG Bonus of the character under the effect of Overflowing Lotuslight', note: '+12% de DMG Dendro do personagem sob a Luz de Lótus: ligue nas janelas. O bônus extra do elemento transfigurado não entra.' },
  ],
  Pyro: [
    { id: 'c1', label: 'Viajante C1', src: 'const1', scope: 'team', timed: true, stats: { dmgPct: { lit: 0.06 } }, expect: 'the current active character deals 6% increased DMG', note: '+6% de DMG do personagem em campo com o Limiar ativo: ligue nas janelas. Os +9% extras com Bênção Nightsoul não entram.' },
    { id: 'c4', label: 'Viajante C4', src: 'const4', scope: 'self', timed: true, forElements: ['Pyro'], stats: { dmgPct: { lit: 0.2 } }, expect: 'the Traveler gains 20% Pyro DMG Bonus for 9s', note: '+20% de DMG Pyro por 9 s depois do Supremo: ligue nas janelas.' },
  ],
};

const forTraveler = (name: string, element: string): [string, BuffCuration[]] => [`${name} (${element})`, TRAVELER[element]];

export const CHARACTERS_5: Record<string, BuffCuration[]> = {
  ...Object.fromEntries(['Aether', 'Lumine'].flatMap((n) => Object.keys(TRAVELER).map((e) => forTraveler(n, e)))),
  Linnea: [
    { id: 'a1', label: 'Linnea A1', src: 'p1', scope: 'self', timed: false, resShred: { value: { p: 0 }, elements: ['Geo'] }, expect: 'the Geo RES of opponents near Lumi will decrease by 15%', note: 'Assume a redução de RES Geo perto da Lumi sempre ativa. A redução extra do Moonsign Ascendant Gleam não entra.' },
    { id: 'c2', label: 'Linnea C2', src: 'const2', scope: 'team', timed: true, forElements: ['Hydro', 'Geo'], stats: { critDmg: { p: 0 } }, expect: 'all Hydro and Geo party members have their CRIT DMG increased by 40%', note: '+40% de Dano Crítico de Hydro e Geo por 8 s depois do Moondrift Harmony: ligue nas janelas.' },
  ],
  Prune: [
    { id: 'c2', label: 'Prune C2', src: 'const2', scope: 'self', timed: true, stats: { atkPct: { p: 2 } }, expect: "Prune's ATK can be increased by up to 40%", note: 'Assume o teto de +40% de ATK durante o Supremo: ligue nas janelas.' },
  ],
  Mitya: [
    { id: 'c1', label: 'Mitya C1', src: 'const1', scope: 'team', timed: true, stats: { critDmg: { p: 0 } }, expect: "your own active character's CRIT DMG is increased by 40%", note: '+40% de Dano Crítico do personagem em campo com o Núcleo de Detecção presente: ligue nas janelas.' },
    { id: 'c2res', label: 'Mitya C2 (RES)', src: 'const2', scope: 'self', timed: false, resShred: { value: { p: 0 }, elements: ['Cryo', 'Electro'] }, expect: 'have their Cryo RES and Electro RES decreased by 20%', note: 'Assume a redução de RES Cryo e Electro no Campo Polar sempre ativa.' },
    { id: 'c2em', label: 'Mitya C2 (Maestria)', src: 'const2', scope: 'team', timed: true, stats: { em: { p: 1 } }, expect: 'All nearby party members gain 123 Elemental Mastery', note: '+123 de Maestria da equipe com o Núcleo em Estado Estável: ligue nas janelas. No estado Sobrecarregado seria +234 só para o personagem em campo.' },
  ],
  Valeriy: [
    { id: 'c2', label: 'Valeriy C2', src: 'const2', scope: 'team', timed: true, stats: { em: { p: 1 } }, expect: 'gain 100 Elemental Mastery for 18s', note: '+100 de Maestria da equipe por 18 s depois da habilidade: ligue nas janelas.' },
  ],
  Vodyanitsa: [
    { id: 'a1', label: 'Vodyanitsa A1', src: 'p1', scope: 'self', timed: false, resShred: { value: { p: 0 }, elements: ['Anemo'] }, expect: "opponents' Anemo RES by 35%", note: 'Assume a redução de RES Anemo (6 s) sempre ativa.' },
    { id: 'c2', label: 'Vodyanitsa C2', src: 'const2', scope: 'team', timed: true, forElements: ['Hydro', 'Cryo'], stats: { critDmg: { p: 0 } }, expect: 'CRIT DMG from Hydro DMG and Cryo DMG dealt by your own currently active party member by 50%', note: '+50% de Dano Crítico Hydro/Cryo por 5 s: ligue nas janelas. Até a C5 vale só para o personagem em campo; a C6 estende a todos.' },
    { id: 'c6', label: 'Vodyanitsa C6', src: 'const6', scope: 'team', timed: true, forElements: ['Hydro', 'Cryo'], stats: { dmgPct: { p: 1 } }, expect: 'Hydro DMG and Cryo DMG dealt are increased by 60%', note: '+60% de DMG Hydro/Cryo da equipe enquanto a Canção das Eras Passadas estiver ativa: ligue nas janelas.' },
  ],
  Vesna: [
    { id: 'c2', label: 'Vesna C2', src: 'const2', scope: 'self', timed: true, stats: { atkPct: { p: 0 } }, expect: "Vesna's ATK is increased by 40%", note: '+40% de ATK com o máximo de stacks de Ação Disciplinar (modo Armed for Action): ligue nas janelas.' },
  ],
};

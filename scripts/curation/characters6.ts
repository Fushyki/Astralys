/**
 * Curadoria de passivas e constelações, lote 6: conversões de stat (`convert`). O valor é `coeficiente × stat da fonte`
 * calculado pelo motor com os rolls otimizados (ver `BuffConvertSchema`). Mesmas regras de `characters2.ts`.
 */
import type { BuffCuration } from './characters';

export const CHARACTERS_6: Record<string, BuffCuration[]> = {
  'Kaedehara Kazuha': [
    { id: 'a4', label: 'Kazuha A4', src: 'p2', scope: 'team', timed: true, convert: { from: 'em', perPoint: { p: 0 }, to: ['dmgPct'] }, expect: 'Elemental DMG Bonus to the element absorbed by Swirl for every point of Elemental Mastery', note: '+0,04% de DMG do elemento absorvido por ponto de Maestria dele, por 8 s depois do Espalhar: ligue nas janelas em que o elemento bate com o de quem ataca.' },
    { id: 'c6', label: 'Kazuha C6', src: 'const6', scope: 'self', timed: true, convert: { from: 'em', perPoint: { p: 0 }, to: ['normal', 'charged', 'plunge'] }, expect: 'each point of Elemental Mastery will increase the DMG dealt by Kaedehara Kazuha', note: '+0,2% de DMG de Normal/Carregado/Plunging por ponto de Maestria, por 5 s depois da habilidade ou Supremo: ligue nas janelas.' },
  ],
  Sucrose: [
    { id: 'a4', label: 'Sucrose A4', src: 'p2', scope: 'others', timed: true, convert: { from: 'em', perPoint: { p: 0 }, to: ['em'] }, expect: "equal to 20% of Sucrose's Elemental Mastery", note: '+20% da Maestria da Sucrose para os demais por 8 s depois da habilidade ou Supremo: ligue nas janelas.' },
  ],
  'Raiden Shogun': [
    { id: 'a4', label: 'Raiden A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'er', perPoint: { p: 2, x: 100 }, threshold: 1, to: ['dmgPct'] }, expect: 'grants her', note: '+0,4% de DMG Electro por 1% de Recarga acima de 100%, sempre. A energia extra do Musou Isshin não entra.' },
  ],
  Mona: [
    { id: 'a4', label: 'Mona A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'er', perPoint: { p: 1 }, to: ['dmgPct'] }, expect: 'equivalent to 20% of her Energy Recharge rate', note: 'DMG Hydro = 20% da Recarga total (ex.: 200% de Recarga dá +40%), sempre.' },
  ],
  Tighnari: [
    { id: 'a4', label: 'Tighnari A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'em', perPoint: { p: 0 }, cap: { p: 1 }, to: ['charged'] }, expect: 'his Charged Attack and Fashioner\'s Tanglevine Shaft DMG are increased by 0.06%', note: '+0,06% de DMG de Ataque Carregado por ponto de Maestria, teto de 60%, sempre. O Tanglevine Shaft (Supremo) não entra.' },
  ],
  'Yae Miko': [
    { id: 'a4', label: 'Yae A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'em', perPoint: { p: 0 }, to: ['skill'] }, expect: 'will increase Sesshou Sakura DMG by 0.15%', note: '+0,15% de DMG da habilidade (Sesshou Sakura) por ponto de Maestria, sempre.' },
  ],
  Noelle: [
    { id: 'c6', label: 'Noelle C6', src: 'const6', scope: 'self', timed: true, convert: { from: 'def', perPoint: { p: 0 }, to: ['atkFlat'] }, expect: "increases Noelle's ATK by an additional 50% of her DEF", note: '+50% da DEF dela como ATK fixo durante o Supremo: ligue nas janelas.' },
  ],
  Nilou: [
    { id: 'c6cr', label: 'Nilou C6 (Taxa Crítica)', src: 'const6', scope: 'self', timed: false, convert: { from: 'hp', perPoint: { p: 0, x: 0.001 }, cap: { p: 2 }, to: ['critRate'] }, expect: 'For every 1,000 points of Max HP', note: '+0,6% de Taxa Crítica a cada 1.000 de HP máximo, teto de 30%, sempre.' },
    { id: 'c6cd', label: 'Nilou C6 (Dano Crítico)', src: 'const6', scope: 'self', timed: false, convert: { from: 'hp', perPoint: { p: 1, x: 0.001 }, cap: { p: 3 }, to: ['critDmg'] }, expect: 'CRIT Rate and CRIT DMG will increase by 0.6% and 1.2%', note: '+1,2% de Dano Crítico a cada 1.000 de HP máximo, teto de 60%, sempre.' },
  ],
  Nahida: [
    { id: 'a1', label: 'Nahida A1', src: 'p1', scope: 'others', timed: true, convert: { from: 'em', source: 'highestEm', perPoint: { p: 0 }, cap: { p: 1 }, to: ['em'] }, expect: 'increased by 25% of the Elemental Mastery of the party member with the highest Elemental Mastery', note: '+25% da maior Maestria do time (teto de 250) para os demais dentro do campo do Supremo: ligue nas janelas.' },
  ],
  Chevreuse: [
    { id: 'a4', label: 'Chevreuse A4', src: 'p2', scope: 'others', timed: true, forElements: ['Pyro', 'Electro'], convert: { from: 'hp', perPoint: { p: 0, x: 0.001 }, cap: { p: 2 }, to: ['atkPct'] }, expect: 'gain 1% increased ATK for every 1,000 Max HP', note: '+1% de ATK por 1.000 de HP máximo dela (teto de 40%) para os Pyro e Electro por 30 s: ligue nas janelas.' },
  ],
};

/** Buffs que dependem da composição do time (`team`). */
export const CHARACTERS_7: Record<string, BuffCuration[]> = {
  Lynette: [
    { id: 'a1', label: 'Lynette A1', src: 'p1', scope: 'team', timed: true, stats: { atkPct: { lit: 1 } }, team: { scale: { of: 'distinct', table: [{ p: 1 }, { p: 2 }, { p: 3 }, { p: 4 }] } }, expect: "when there are 1/2/3/4 Elemental Types in the party, all party members' ATK will be increased by 8%/12%/16%/20%", note: '+8/12/16/20% de ATK da equipe conforme o nº de elementos diferentes no time, por 10 s depois da habilidade: ligue nas janelas.' },
  ],
  Escoffier: [
    { id: 'a4', label: 'Escoffier A4', src: 'p2', scope: 'self', timed: false, resShred: { value: { lit: 1 }, elements: ['Hydro', 'Cryo'] }, team: { scale: { of: ['Hydro', 'Cryo'], table: [{ p: 0 }, { p: 1 }, { p: 2 }, { p: 3 }] } }, expect: 'decrease the Hydro RES and Cryo RES of any opponents hit by her Elemental Skill', note: 'Redução de RES Hydro e Cryo de 5/10/15/55% conforme o nº de Hydro e Cryo no time (a Escoffier conta), sempre ativa.' },
  ],
  Chevreuse: [
    { id: 'a1', label: 'Chevreuse A1', src: 'p1', scope: 'self', timed: false, resShred: { value: { p: 0 }, elements: ['Pyro', 'Electro'] }, team: { only: ['Pyro', 'Electro'], eachOf: ['Pyro', 'Electro'] }, expect: 'the Pyro and Electro RES of the opponent(s) affected by this Overloaded reaction will be decreased by 40%', note: 'Só com time de Pyro e Electro (ao menos um de cada). Assume a redução de RES Pyro e Electro (6 s, depois de Sobrecarregar) sempre ativa.' },
  ],
};

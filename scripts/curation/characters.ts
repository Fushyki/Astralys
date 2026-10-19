/**
 * Curadoria de passivas e constelações com efeito numérico em dano. Cada número vem de um parâmetro do Lunaris
 * (`p` = índice em `params` da passiva/constelação indicada em `src`, `x` = multiplicador, ex.: stacks) ou de um
 * literal que só aparece na descrição (`lit`). `expect` trava se o texto do Lunaris mudar.
 *
 * Regras de modelagem: buffs de equipe e os que dependem de condição (`timed: true`) viram faixas na linha do tempo,
 * ligadas por você nas janelas em que valem; só o que é do próprio personagem e sempre vale fica estático.
 */
import type { Element } from '../../src/data/schema';
import type { ConvertTarget } from '../../src/effects/schema';
import type { Val } from './sets';

export type Src = 'p1' | 'p2' | 'p3' | 'const1' | 'const2' | 'const3' | 'const4' | 'const5' | 'const6';

export interface BuffCuration {
  id: string;
  label: string;
  src: Src;
  scope: 'self' | 'others' | 'team';
  timed: boolean;
  forElements?: Element[];
  stats?: {
    atkPct?: Val; dmgPct?: Val; critRate?: Val; critDmg?: Val; em?: Val; hpPct?: Val; defPct?: Val;
    byType?: Partial<Record<'normal' | 'charged' | 'plunge' | 'skill' | 'burst', Val>>;
  };
  resShred?: { value: Val; elements: Element[] };
  /** Bônus que depende de um stat da fonte (ver `BuffConvertSchema`). Substitui `stats`. */
  convert?: {
    from: 'atk' | 'hp' | 'def' | 'em' | 'er';
    source?: 'self' | 'highestEm';
    perPoint: Val;
    threshold?: Val;
    cap?: Val;
    to: ConvertTarget[];
  };
  expect: string;
  note: string;
}

export const CHARACTERS: Record<string, BuffCuration[]> = {
  'Raiden Shogun': [
    { id: 'c4', label: 'Raiden C4', src: 'const4', scope: 'others', timed: true, stats: { atkPct: { p: 0 } }, expect: 'gain 30% bonus ATK', note: 'ATK da equipe (menos a Raiden) por 10 s depois do Supremo: ligue nas janelas.' },
  ],
  Xiangling: [
    { id: 'a4', label: 'Xiangling A4', src: 'p2', scope: 'self', timed: true, stats: { atkPct: { p: 0 } }, expect: 'increases ATK by 10%', note: 'ATK ao pegar a pimenta (10 s): ligue nas janelas.' },
    { id: 'c1', label: 'Xiangling C1', src: 'const1', scope: 'self', timed: false, resShred: { value: { p: 0 }, elements: ['Pyro'] }, expect: 'Pyro RES reduced by 15%', note: 'Assume a redução de RES Pyro (6 s) sempre ativa.' },
    { id: 'c6', label: 'Xiangling C6', src: 'const6', scope: 'team', timed: true, forElements: ['Pyro'], stats: { dmgPct: { p: 0 } }, expect: 'Pyro DMG Bonus', note: '+15% de DMG Pyro durante o Pyronado: ligue nas janelas. Só personagens Pyro recebem.' },
  ],
  Yelan: [
    { id: 'a4', label: 'Yelan A4', src: 'p2', scope: 'team', timed: true, stats: { dmgPct: { lit: 0.5 } }, expect: 'deals 1% more DMG', note: 'Assume o máximo de +50% de DMG do personagem ativo (cresce 3,5% por segundo): ligue nas janelas.' },
    { id: 'c4', label: 'Yelan C4', src: 'const4', scope: 'team', timed: true, stats: { hpPct: { p: 0, x: 4 } }, expect: 'Max HP by 10%', note: 'Assume 4 inimigos marcados (+40% de HP máximo) por 25 s: ligue nas janelas.' },
  ],
  'Hu Tao': [
    { id: 'a1', label: 'Hu Tao A1', src: 'p1', scope: 'others', timed: true, stats: { critRate: { p: 0 } }, expect: 'CRIT Rate increased by 12%', note: '+12% de Taxa Crítica da equipe (menos a Hu Tao) por 8 s depois do Paramita: ligue nas janelas.' },
    { id: 'a4', label: 'Hu Tao A4', src: 'p2', scope: 'self', timed: true, stats: { dmgPct: { p: 1 } }, expect: 'Pyro DMG Bonus is increased by 33%', note: '+33% de DMG Pyro com HP a 50% ou menos: ligue nas janelas.' },
    { id: 'c4', label: 'Hu Tao C4', src: 'const4', scope: 'others', timed: true, stats: { critRate: { p: 0 } }, expect: 'CRIT Rate increased by 12%', note: '+12% de Taxa Crítica da equipe por 15 s depois de derrotar inimigo com Blood Blossom: ligue nas janelas.' },
  ],
  Ganyu: [
    { id: 'a1', label: 'Ganyu A1', src: 'p1', scope: 'self', timed: true, stats: { critRate: { p: 1 } }, expect: 'CRIT Rate of subsequent Frostflake Arrows', note: '+20% de Taxa Crítica nas flechas seguintes (5 s): ligue nas janelas.' },
    { id: 'a4', label: 'Ganyu A4', src: 'p2', scope: 'team', timed: true, forElements: ['Cryo'], stats: { dmgPct: { p: 0 } }, expect: '20% Cryo DMG Bonus to active party members', note: '+20% de DMG Cryo dentro do Celestial Shower: ligue nas janelas. Só personagens Cryo recebem.' },
    { id: 'c1', label: 'Ganyu C1', src: 'const1', scope: 'self', timed: false, resShred: { value: { p: 0, x: -1 }, elements: ['Cryo'] }, expect: "decrease opponents' Cryo RES by 15%", note: 'Assume a redução de RES Cryo (6 s) sempre ativa.' },
  ],
  'Kamisato Ayaka': [
    { id: 'a1', label: 'Ayaka A1', src: 'p1', scope: 'self', timed: true, stats: { byType: { normal: { p: 0 }, charged: { p: 0 } } }, expect: 'Normal and Charged Attacks deal 30% increased DMG', note: '+30% de DMG de Normal/Carregado por 6 s depois da habilidade: ligue nas janelas.' },
    { id: 'a4', label: 'Ayaka A4', src: 'p2', scope: 'self', timed: true, stats: { dmgPct: { p: 1 } }, expect: 'Gains 18% Cryo DMG Bonus', note: '+18% de DMG Cryo por 10 s depois do Senho: ligue nas janelas.' },
  ],
  Xingqiu: [
    { id: 'a4', label: 'Xingqiu A4', src: 'p2', scope: 'self', timed: false, stats: { dmgPct: { lit: 0.2 } }, expect: 'Hydro DMG Bonus', note: '+20% de DMG Hydro, sempre.' },
    { id: 'c2', label: 'Xingqiu C2', src: 'const2', scope: 'self', timed: false, resShred: { value: { lit: 0.15 }, elements: ['Hydro'] }, expect: 'Decreases the Hydro RES of opponents', note: 'Assume a redução de RES Hydro (4 s) sempre ativa.' },
  ],
  Albedo: [
    { id: 'a4', label: 'Albedo A4', src: 'p2', scope: 'team', timed: true, stats: { em: { p: 0 } }, expect: 'Elemental Mastery of nearby party members by 125', note: '+125 de Maestria da equipe por 10 s depois do Supremo: ligue nas janelas.' },
  ],
  Diluc: [
    { id: 'a4', label: 'Diluc A4', src: 'p2', scope: 'self', timed: true, stats: { dmgPct: { p: 1 } }, expect: 'Diluc gains 20% Pyro DMG Bonus', note: '+20% de DMG Pyro durante a infusão do Supremo: ligue nas janelas.' },
    { id: 'c1', label: 'Diluc C1', src: 'const1', scope: 'self', timed: true, stats: { dmgPct: { p: 0 } }, expect: 'Diluc deals 15% more DMG', note: '+15% de DMG contra inimigos com mais de 50% de HP: ligue nas janelas.' },
    { id: 'c2', label: 'Diluc C2', src: 'const2', scope: 'self', timed: true, stats: { atkPct: { p: 0, x: 3 } }, expect: 'his ATK increases by 10%', note: 'Assume 3 stacks de +10% de ATK (ao levar dano): ligue nas janelas.' },
  ],
  Klee: [
    { id: 'c1', label: 'Klee C1', src: 'const1', scope: 'self', timed: true, stats: { atkPct: { p: 1 } }, expect: "Klee's ATK is increased by 60%", note: '+60% de ATK por 12 s depois das faíscas: ligue nas janelas.' },
  ],
  'Yae Miko': [
    { id: 'c4', label: 'Yae C4', src: 'const4', scope: 'team', timed: true, forElements: ['Electro'], stats: { dmgPct: { p: 0 } }, expect: 'Electro DMG Bonus of all nearby party members is increased by 20%', note: '+20% de DMG Electro por 5 s depois dos raios das Sakuras: ligue nas janelas. Só personagens Electro recebem.' },
  ],
  Eula: [
    { id: 'c1', label: 'Eula C1', src: 'const1', scope: 'self', timed: true, stats: { dmgPct: { p: 0 } }, expect: 'Physical DMG is increased by 30%', note: '+30% de DMG Físico (vale para todo o dano dela) por 6 s por stack gasto: ligue nas janelas.' },
  ],
  Alhaitham: [
    { id: 'c2', label: 'Alhaitham C2', src: 'const2', scope: 'self', timed: true, stats: { em: { p: 0, x: 4 } }, expect: 'Elemental Mastery will be increased by 50', note: 'Assume 4 stacks de +50 de Maestria: ligue nas janelas.' },
  ],
  Gorou: [
    { id: 'a1', label: 'Gorou A1', src: 'p1', scope: 'team', timed: true, stats: { defPct: { p: 0 } }, expect: "DEF is increased by 25%", note: '+25% de DEF da equipe por 12 s depois da habilidade: ligue nas janelas. Só importa para quem escala com DEF.' },
  ],
  Shenhe: [
    { id: 'a1', label: 'Shenhe A1', src: 'p1', scope: 'team', timed: true, forElements: ['Cryo'], stats: { dmgPct: { p: 0 } }, expect: 'gains 15% Cryo DMG Bonus', note: '+15% de DMG Cryo para o personagem ativo no campo: ligue nas janelas. Só personagens Cryo recebem.' },
    { id: 'a4', label: 'Shenhe A4', src: 'p2', scope: 'team', timed: true, stats: { byType: { skill: { p: 0 }, burst: { p: 0 } } }, expect: 'Elemental Skill and Elemental Burst DMG increased by 15%', note: '+15% de DMG de habilidade e Supremo por 10 s (versão "toque"): ligue nas janelas. A versão "segurar" NÃO está modelada.' },
    { id: 'c2', label: 'Shenhe C2', src: 'const2', scope: 'team', timed: true, forElements: ['Cryo'], stats: { critDmg: { lit: 0.15 } }, expect: 'deal 15% increased Cryo CRIT DMG', note: '+15% de Dano Crítico Cryo no campo dela: ligue nas janelas.' },
  ],
  'Yun Jin': [
    { id: 'c2', label: 'Yun Jin C2', src: 'const2', scope: 'team', timed: true, stats: { byType: { normal: { p: 0 } } }, expect: "Normal Attack DMG is increased by 15%", note: '+15% de DMG de Ataque Normal da equipe por 12 s: ligue nas janelas.' },
  ],
  Thoma: [
    { id: 'c6', label: 'Thoma C6', src: 'const6', scope: 'team', timed: true, stats: { byType: { normal: { p: 0 }, charged: { p: 0 }, plunge: { p: 0 } } }, expect: "Normal, Charged, and Plunging Attacks is increased by 15%", note: '+15% de DMG de Normal/Carregado/Imersivo por 6 s: ligue nas janelas.' },
  ],
  Nilou: [
    { id: 'c2', label: 'Nilou C2', src: 'const2', scope: 'self', timed: false, resShred: { value: { p: 0 }, elements: ['Hydro'] }, expect: "Hydro RES will be decreased by 35%", note: 'Assume a redução de RES Hydro (10 s) sempre ativa. A de Dendro (após Floração) NÃO entra.' },
  ],
  Neuvillette: [
    { id: 'a4', label: 'Neuvillette A4', src: 'p2', scope: 'self', timed: false, stats: { dmgPct: { p: 0 } }, expect: 'gain 0.6% Hydro DMG Bonus', note: 'Assume HP alto: o teto de +30% de DMG Hydro, sempre.' },
  ],
  Wriothesley: [
    { id: 'a4', label: 'Wriothesley A4', src: 'p2', scope: 'self', timed: true, stats: { atkPct: { p: 0, x: 5 } }, expect: "Each stack will increase Wriothesley's ATK by 6%", note: 'Assume 5 stacks de +6% de ATK (variação de HP): ligue nas janelas.' },
  ],
  Lyney: [
    { id: 'a4', label: 'Lyney A4', src: 'p2', scope: 'self', timed: false, stats: { dmgPct: { lit: 0.6 } }, expect: 'Increases the DMG dealt by 60%', note: 'Assume inimigo sob Pyro (+60% de DMG). Os +20% por outro personagem Pyro NÃO entram.' },
    { id: 'c2', label: 'Lyney C2', src: 'const2', scope: 'self', timed: true, stats: { critDmg: { p: 0, x: 3 } }, expect: 'increase his CRIT DMG by 20%', note: 'Assume 3 stacks de +20% de Dano Crítico: ligue nas janelas.' },
    { id: 'c4', label: 'Lyney C4', src: 'const4', scope: 'self', timed: false, resShred: { value: { p: 0 }, elements: ['Pyro'] }, expect: 'Pyro RES will be decreased by 20%', note: 'Assume a redução de RES Pyro (6 s) sempre ativa.' },
  ],
  Clorinde: [
    { id: 'c6', label: 'Clorinde C6', src: 'const6', scope: 'self', timed: true, stats: { critRate: { p: 0 }, critDmg: { p: 1 } }, expect: 'CRIT Rate will be increased by 10%', note: '+10% de Taxa Crítica e +70% de Dano Crítico por 12 s depois da habilidade: ligue nas janelas.' },
  ],
  Navia: [
    { id: 'c4', label: 'Navia C4', src: 'const4', scope: 'self', timed: false, resShred: { value: { p: 0 }, elements: ['Geo'] }, expect: 'Geo RES will be decreased by 20%', note: 'Assume a redução de RES Geo (8 s) sempre ativa.' },
  ],
  Kinich: [
    { id: 'c2', label: 'Kinich C2', src: 'const2', scope: 'self', timed: false, resShred: { value: { p: 0 }, elements: ['Dendro'] }, expect: 'decrease their Dendro RES by 30%', note: 'Assume a redução de RES Dendro (6 s) sempre ativa.' },
  ],
  Chiori: [
    { id: 'a4', label: 'Chiori A4', src: 'p2', scope: 'self', timed: true, stats: { dmgPct: { p: 0 } }, expect: 'Chiori will gain 20% Geo DMG Bonus', note: '+20% de DMG Geo por 20 s depois de um construto Geo: ligue nas janelas.' },
  ],
};

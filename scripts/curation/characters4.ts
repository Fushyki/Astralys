/** Curadoria de passivas e constelações, lote 4 (Natlan, Nod-Krai e personagens novos). Regras em `characters2.ts`. */
import type { BuffCuration } from './characters';

export const CHARACTERS_4: Record<string, BuffCuration[]> = {
  Mualani: [
    { id: 'c4', label: 'Mualani C4', src: 'const4', scope: 'self', timed: false, stats: { byType: { burst: { p: 1 } } }, expect: 'Boomsharka-laka deals 75% increased DMG', note: '+75% de DMG do Supremo, sempre.' },
  ],
  Xilonen: [
    { id: 'a1', label: 'Xilonen A1', src: 'p1', scope: 'self', timed: true, stats: { byType: { normal: { p: 1 }, plunge: { p: 1 } } }, expect: 'Normal and Plunging Attacks deal 30% increased DMG', note: '+30% de DMG de Normal/Plunging com menos de 2 Amostras alteradas no Nightsoul: ligue nas janelas.' },
    { id: 'c2geo', label: 'Xilonen C2 (Geo)', src: 'const2', scope: 'team', timed: true, forElements: ['Geo'], stats: { dmgPct: { p: 3 } }, expect: 'Geo: DMG dealt +50%', note: '+50% de DMG para personagens Geo com a Amostra Geo ativa: ligue nas janelas.' },
    { id: 'c2pyro', label: 'Xilonen C2 (Pyro)', src: 'const2', scope: 'team', timed: true, forElements: ['Pyro'], stats: { atkPct: { p: 0 } }, expect: 'Pyro: ATK +45%', note: '+45% de ATK para personagens Pyro com a Amostra Pyro ativa: ligue nas janelas.' },
    { id: 'c2hydro', label: 'Xilonen C2 (Hydro)', src: 'const2', scope: 'team', timed: true, forElements: ['Hydro'], stats: { hpPct: { p: 1 } }, expect: 'Hydro: Max HP +45%', note: '+45% de HP máximo para personagens Hydro com a Amostra Hydro ativa: ligue nas janelas.' },
    { id: 'c2cryo', label: 'Xilonen C2 (Cryo)', src: 'const2', scope: 'team', timed: true, forElements: ['Cryo'], stats: { critDmg: { p: 2 } }, expect: 'Cryo: CRIT DMG +60%', note: '+60% de Dano Crítico para personagens Cryo com a Amostra Cryo ativa: ligue nas janelas.' },
  ],
  Ororon: [
    { id: 'c2', label: 'Ororon C2', src: 'const2', scope: 'self', timed: true, forElements: ['Electro'], stats: { dmgPct: { p: 0 } }, expect: 'Gain 8% Electro DMG Bonus', note: '+8% de DMG Electro por 9 s depois do Supremo (1 inimigo atingido): ligue nas janelas. Cada inimigo extra soma +8% até 32%.' },
    { id: 'c6', label: 'Ororon C6', src: 'const6', scope: 'team', timed: true, stats: { atkPct: { p: 0, x: 3 } }, expect: "active character's ATK is increased by 10%", note: 'Assume 3 stacks (+30% de ATK do personagem em campo): ligue nas janelas.' },
  ],
  'Lan Yan': [
    { id: 'c4', label: 'Lan Yan C4', src: 'const4', scope: 'team', timed: true, stats: { em: { p: 0 } }, expect: 'increases by 60 for 12s', note: '+60 de Maestria da equipe por 12 s depois do Supremo: ligue nas janelas.' },
  ],
  'Yumemizuki Mizuki': [
    { id: 'a4', label: 'Mizuki A4', src: 'p2', scope: 'self', timed: true, stats: { em: { p: 0 } }, expect: 'her Elemental Mastery will increase by 100 for 4s', note: '+100 de Maestria por 4 s quando aliados acertam com outro elemento: ligue nas janelas.' },
    { id: 'c2', label: 'Mizuki C2', src: 'const2', scope: 'self', timed: false, resShred: { value: { p: 1 }, elements: ['Pyro', 'Hydro', 'Cryo', 'Electro', 'Anemo'] }, expect: 'of nearby opponents are lowered by 20%', note: 'Assume a redução de RES (Pyro, Hydro, Cryo, Electro e Anemo) durante o Dreamdrifter sempre ativa. O bônus de DMG por Maestria não entra.' },
  ],
  Varesa: [
    { id: 'a4', label: 'Varesa A4', src: 'p2', scope: 'self', timed: true, stats: { atkPct: { p: 0, x: 2 } }, expect: "Varesa's ATK increases by 35% for 12s", note: 'Assume 2 stacks (+70% de ATK) depois de Nightsoul Burst: ligue nas janelas.' },
    { id: 'c4', label: 'Varesa C4', src: 'const4', scope: 'self', timed: true, stats: { byType: { burst: { p: 2 } } }, expect: 'this instance of her Elemental Burst Guardian Vent! deals 100% increased DMG', note: '+100% de DMG do Supremo com Fiery Passion ou Apex Drive ativo: ligue nas janelas.' },
  ],
  Ifa: [
    { id: 'a4', label: 'Ifa A4', src: 'p2', scope: 'self', timed: true, stats: { em: { p: 0 } }, expect: "Ifa's Elemental Mastery increases by 80 for 10s", note: '+80 de Maestria por 10 s depois de um Nightsoul Burst: ligue nas janelas.' },
    { id: 'c4', label: 'Ifa C4', src: 'const4', scope: 'self', timed: true, stats: { em: { p: 0 } }, expect: 'Ifa gains 100 Elemental Mastery for 15s', note: '+100 de Maestria por 15 s depois do Supremo: ligue nas janelas.' },
  ],
  Skirk: [
    { id: 'c2', label: 'Skirk C2', src: 'const2', scope: 'self', timed: true, stats: { atkPct: { p: 2 } }, expect: 'her ATK is increased by 70%', note: '+70% de ATK por 12,5 s depois do Havoc: Extinction no modo Sete Fases: ligue nas janelas.' },
  ],
  Flins: [
    { id: 'c4', label: 'Flins C4', src: 'const4', scope: 'self', timed: false, stats: { atkPct: { p: 0 } }, expect: "Flins's ATK is increased by 20%", note: '+20% de ATK, sempre. O aumento da Maestria por ATK não entra.' },
  ],
  Aino: [
    { id: 'c1', label: 'Aino C1', src: 'const1', scope: 'team', timed: true, stats: { em: { p: 0 } }, expect: 'Elemental Mastery will be increased by 80', note: '+80 de Maestria dela e do personagem em campo por 15 s depois da habilidade ou Supremo: ligue nas janelas.' },
  ],
  Nefer: [
    { id: 'a1', label: 'Nefer A1', src: 'p1', scope: 'self', timed: true, stats: { em: { p: 2 } }, stacks: { max: 5, unit: 'stacks de Véu da Falsidade', levels: [{ lit: 0 }, { lit: 0 }, { p: 2 }, { p: 2 }, { p: 2 }] }, expect: "Nefer's Elemental Mastery will be increased by 100 for 8s", note: '+100 de Maestria por 8 s com 3 stacks de Véu da Falsidade (Ascendant Gleam): ligue nas janelas.' },
    { id: 'c4', label: 'Nefer C4', src: 'const4', scope: 'self', timed: false, resShred: { value: { p: 2 }, elements: ['Dendro'] }, expect: 'Dendro RES decreased by 20%', note: 'Assume a redução de RES Dendro durante o Shadow Dance sempre ativa.' },
  ],
  Durin: [
    { id: 'a1', label: 'Durin A1', src: 'p1', scope: 'self', timed: false, resShred: { value: { p: 0 }, elements: ['Pyro'] }, expect: 'Pyro RES, and the RES for the corresponding Element involved in the reaction, are decreased by 20%', note: 'Assume a redução de RES Pyro (forma Dragão da Chama Branca) sempre ativa. A do elemento da reação não entra.' },
    { id: 'c2', label: 'Durin C2', src: 'const2', scope: 'team', timed: true, forElements: ['Pyro'], stats: { dmgPct: { p: 2 } }, expect: 'gain a 50% increase to their Pyro DMG', note: '+50% de DMG Pyro por 6 s depois de uma reação: ligue nas janelas. O bônus do elemento da reação não entra.' },
    { id: 'c4', label: 'Durin C4', src: 'const4', scope: 'self', timed: false, stats: { byType: { burst: { p: 2 } } }, expect: "Elemental Burst DMG is increased by 40%", note: '+40% de DMG do Supremo, sempre.' },
  ],
  Jahoda: [
    { id: 'a4', label: 'Jahoda A4', src: 'p2', scope: 'team', timed: true, stats: { em: { p: 0 } }, expect: 'Elemental Mastery will be increased by 100 for 6s', note: '+100 de Maestria do personagem curado (HP acima de 70%) por 6 s: ligue nas janelas.' },
  ],
  Columbina: [
    { id: 'a1', label: 'Columbina A1', src: 'p1', scope: 'self', timed: true, stats: { critRate: { p: 0, x: 3 } }, expect: 'increasing her CRIT Rate by 5%', note: 'Assume 3 stacks (+15% de Taxa Crítica) por 10 s: ligue nas janelas.' },
  ],
  Illuga: [
    { id: 'a1', label: 'Illuga A1', src: 'p1', scope: 'others', timed: true, forElements: ['Geo'], stats: { critRate: { p: 0 }, critDmg: { p: 1 } }, expect: 'CRIT Rate increases by 5% and CRIT DMG increases by 10%', note: '+5% de Taxa e +10% de Dano Crítico Geo dos demais por 20 s depois da habilidade ou Supremo: ligue nas janelas. Só personagens Geo recebem.' },
    { id: 'c6', label: 'Illuga C6 (diferença)', src: 'const6', scope: 'others', timed: true, forElements: ['Geo'], stats: { critRate: { lit: 0.05 }, critDmg: { lit: 0.2 } }, expect: 'CRIT Rate is increased by 10%, CRIT DMG is increased by 30%', note: 'A C6 troca o bônus da A1 por +10% de Taxa e +30% de Dano Crítico; este buff soma só a diferença (+5% e +20%) sobre o da A1. Ligue nas mesmas janelas.' },
  ],
  Varka: [
    { id: 'a4', label: 'Varka A4', src: 'p2', scope: 'self', timed: true, stats: { byType: { normal: { p: 1, x: 4 }, charged: { p: 1, x: 4 } } }, expect: 'by 7.5% for 8s', note: 'Assume 4 stacks (+30% de DMG de Normal/Carregado): ligue nas janelas.' },
    { id: 'c4', label: 'Varka C4', src: 'const4', scope: 'team', timed: true, forElements: ['Anemo'], stats: { dmgPct: { p: 0 } }, expect: 'gain a 20% Anemo DMG Bonus', note: '+20% de DMG Anemo por 10 s depois de um Espalhar: ligue nas janelas. O bônus do elemento absorvido não entra.' },
    { id: 'c6', label: 'Varka C6', src: 'const6', scope: 'self', timed: true, stats: { critDmg: { p: 1, x: 4 } }, expect: 'increase Varka\'s CRIT DMG by 20%', note: 'Assume 4 stacks de Azure Fang\'s Oath (+80% de Dano Crítico): ligue nas janelas.' },
  ],
  Lohen: [
    { id: 'a4', label: 'Lohen A4 (própria)', src: 'p2', scope: 'self', timed: true, stats: { atkPct: { p: 1 } }, expect: "Lohen's ATK is increased by 15%", note: '+15% de ATK por 8 s depois de aliado causar reação Cryo: ligue nas janelas.' },
    { id: 'a4o', label: 'Lohen A4 (aliado)', src: 'p2', scope: 'others', timed: true, stats: { atkPct: { p: 0 } }, expect: "that character's ATK is increased by 15%", note: '+15% de ATK do aliado que causou a reação Cryo por 8 s: ligue nas janelas.' },
    { id: 'c2', label: 'Lohen C2', src: 'const2', scope: 'others', timed: true, stats: { em: { p: 1 } }, expect: 'increase the Elemental Mastery of other nearby party members by 200', note: '+200 de Maestria dos demais por 8 s depois do golpe da Lâmina do Mal: ligue nas janelas.' },
  ],
};

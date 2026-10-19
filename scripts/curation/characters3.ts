/** Curadoria de passivas e constelações, lote 3 (Liyue/Inazuma/Sumeru/Fontaine/Natlan iniciais). Regras em `characters2.ts`. */
import type { BuffCuration } from './characters';

export const CHARACTERS_3: Record<string, BuffCuration[]> = {
  Collei: [
    { id: 'c4', label: 'Collei C4', src: 'const4', scope: 'others', timed: true, stats: { em: { p: 0 } }, expect: 'Elemental Mastery by 60 for 12s', note: '+60 de Maestria dos demais por 12 s depois do Supremo: ligue nas janelas.' },
  ],
  Tighnari: [
    { id: 'a1', label: 'Tighnari A1', src: 'p1', scope: 'self', timed: true, stats: { em: { p: 0 } }, expect: 'Elemental Mastery is increased by 50 for 4s', note: '+50 de Maestria por 4 s depois de uma Flecha de Guirlanda: ligue nas janelas.' },
    { id: 'c2', label: 'Tighnari C2', src: 'const2', scope: 'self', timed: true, stats: { dmgPct: { p: 0 } }, expect: 'gains 20% Dendro DMG Bonus', note: '+20% de DMG Dendro com inimigos dentro do campo da Mina: ligue nas janelas.' },
    { id: 'c4', label: 'Tighnari C4', src: 'const4', scope: 'team', timed: true, stats: { em: { p: 0 } }, expect: 'gain 60 Elemental Mastery for 8s', note: '+60 de Maestria da equipe por 8 s depois do Supremo: ligue nas janelas. Os +60 extras por reação não entram.' },
  ],
  Cyno: [
    { id: 'a1', label: 'Cyno A1', src: 'p1', scope: 'self', timed: true, stats: { byType: { skill: { p: 0 } } }, expect: 'increasing the DMG of this Secret Rite: Chasmic Soulfarer by 35%', note: '+35% de DMG da habilidade com o Julgamento ativo: ligue nas janelas. Os 3 raios extras não entram.' },
    { id: 'c2', label: 'Cyno C2', src: 'const2', scope: 'self', timed: true, stats: { dmgPct: { p: 0, x: 5 } }, expect: 'Electro DMG Bonus will increase by 10%', note: 'Assume 5 stacks (+50% de DMG Electro) por 4 s depois de acertos Normais: ligue nas janelas.' },
  ],
  Nahida: [
    { id: 'c4', label: 'Nahida C4', src: 'const4', scope: 'self', timed: true, stats: { em: { p: 0 } }, expect: 'Nahida\'s Elemental Mastery will be increased by 100/120/140/160', note: 'Assume 1 inimigo marcado pelas Sementes (+100 de Maestria): ligue nas janelas.' },
  ],
  Wanderer: [
    { id: 'a1pyro', label: 'Wanderer A1 (Pyro)', src: 'p1', scope: 'self', timed: true, stats: { atkPct: { p: 0 } }, expect: 'Pyro: ATK increases by 30%', note: '+30% de ATK no estado Windfavored se a habilidade tocou Pyro: ligue nas janelas.' },
    { id: 'a1cryo', label: 'Wanderer A1 (Cryo)', src: 'p1', scope: 'self', timed: true, stats: { critRate: { p: 2 } }, expect: 'Cryo: CRIT Rate increases by 20%', note: '+20% de Taxa Crítica no estado Windfavored se a habilidade tocou Cryo: ligue nas janelas.' },
  ],
  Faruzan: [
    { id: 'c6', label: 'Faruzan C6', src: 'const6', scope: 'team', timed: true, forElements: ['Anemo'], stats: { critDmg: { p: 0 } }, expect: 'have 40% increased CRIT DMG', note: '+40% de Dano Crítico Anemo de quem está sob o Benefício do Vento: ligue nas janelas. Só personagens Anemo recebem.' },
  ],
  Yaoyao: [
    { id: 'c1', label: 'Yaoyao C1', src: 'const1', scope: 'team', timed: true, forElements: ['Dendro'], stats: { dmgPct: { p: 1 } }, expect: 'gain 15% Dendro DMG Bonus for 8s', note: '+15% de DMG Dendro por 8 s depois da explosão dos rabanetes: ligue nas janelas. Só personagens Dendro recebem.' },
  ],
  Kaveh: [
    { id: 'a4', label: 'Kaveh A4', src: 'p2', scope: 'self', timed: true, stats: { em: { p: 1, x: 4 } }, expect: 'Elemental Mastery will increase by 25', note: 'Assume 4 stacks (+100 de Maestria) durante o Painted Dome: ligue nas janelas.' },
  ],
  Baizhu: [
    { id: 'a1', label: 'Baizhu A1', src: 'p1', scope: 'self', timed: false, stats: { dmgPct: { p: 2 } }, expect: 'Baizhu gains 25% Dendro DMG Bonus', note: '+25% de DMG Dendro com o personagem em campo acima de 50% de HP (assumido sempre).' },
    { id: 'c4', label: 'Baizhu C4', src: 'const4', scope: 'team', timed: true, stats: { em: { p: 0 } }, expect: 'increase all nearby party members\' Elemental Mastery by 80', note: '+80 de Maestria da equipe por 15 s depois do Supremo: ligue nas janelas.' },
  ],
  Lynette: [
    { id: 'c6', label: 'Lynette C6', src: 'const6', scope: 'self', timed: true, forElements: ['Anemo'], stats: { dmgPct: { p: 0 } }, expect: '20% Anemo DMG Bonus', note: '+20% de DMG Anemo por 6 s depois do Enigma Thrust: ligue nas janelas.' },
  ],
  Freminet: [
    { id: 'c4', label: 'Freminet C4', src: 'const4', scope: 'self', timed: true, stats: { atkPct: { p: 0, x: 2 } }, expect: 'his ATK will be increased by 9%', note: 'Assume 2 stacks (+18% de ATK): ligue nas janelas.' },
    { id: 'c6', label: 'Freminet C6', src: 'const6', scope: 'self', timed: true, stats: { critDmg: { p: 0, x: 3 } }, expect: 'his CRIT DMG will be increased by 12%', note: 'Assume 3 stacks (+36% de Dano Crítico): ligue nas janelas.' },
  ],
  Chevreuse: [
    { id: 'c6', label: 'Chevreuse C6', src: 'const6', scope: 'team', timed: true, forElements: ['Pyro', 'Electro'], stats: { dmgPct: { p: 2, x: 3 } }, expect: 'gain a 20% Pyro DMG Bonus and Electro DMG Bonus', note: 'Assume 3 stacks (+60% de DMG Pyro/Electro) por 8 s depois da cura: ligue nas janelas. Só personagens Pyro/Electro recebem.' },
  ],
  Gaming: [
    { id: 'a4', label: 'Gaming A4', src: 'p2', scope: 'self', timed: true, stats: { byType: { plunge: { p: 2 } } }, expect: 'Plunging Attack: Charmed Cloudstrider will deal 20% more DMG', note: '+20% de DMG do Plunging da habilidade com HP de 50% ou mais: ligue nas janelas.' },
    { id: 'c2', label: 'Gaming C2', src: 'const2', scope: 'self', timed: true, stats: { atkPct: { p: 0 } }, expect: 'his ATK will be increased by 20% for 5s', note: '+20% de ATK por 5 s depois de cura com overflow: ligue nas janelas.' },
  ],
  Xianyun: [
    { id: 'c2', label: 'Xianyun C2', src: 'const2', scope: 'self', timed: true, stats: { atkPct: { p: 0 } }, expect: "Xianyun's ATK will be increased by 20% for 15s", note: '+20% de ATK por 15 s depois do Skyladder: ligue nas janelas.' },
  ],
  Sigewinne: [
    { id: 'a1', label: 'Sigewinne A1', src: 'p1', scope: 'self', timed: true, forElements: ['Hydro'], stats: { dmgPct: { p: 3 } }, expect: 'gains an 8% Hydro DMG Bonus', note: '+8% de DMG Hydro por 18 s depois da habilidade: ligue nas janelas. O dano fixo por Convalescência não entra.' },
  ],
  Arlecchino: [
    { id: 'a4', label: 'Arlecchino A4', src: 'p3', scope: 'self', timed: false, stats: { dmgPct: { p: 0 } }, expect: 'gains a 40% Pyro DMG Bonus', note: '+40% de DMG Pyro em combate, sempre.' },
  ],
  Sethos: [
    { id: 'c2', label: 'Sethos C2', src: 'const2', scope: 'self', timed: true, stats: { dmgPct: { p: 0, x: 2 } }, expect: 'Sethos gains a 15% Electro DMG Bonus', note: 'Assume 2 stacks (+30% de DMG Electro): ligue nas janelas.' },
    { id: 'c4', label: 'Sethos C4', src: 'const4', scope: 'team', timed: true, stats: { em: { p: 0 } }, expect: 'gain 80 Elemental Mastery for 10s', note: '+80 de Maestria da equipe por 10 s (acertando 2 ou mais inimigos): ligue nas janelas.' },
  ],
  Emilie: [
    { id: 'c1', label: 'Emilie C1', src: 'const1', scope: 'self', timed: false, stats: { byType: { skill: { p: 1 } } }, expect: 'Increases the DMG dealt by Fragrance Extraction', note: '+20% de DMG da habilidade, sempre. O Cleardew Cologne da A1 não entra.' },
    { id: 'c2', label: 'Emilie C2', src: 'const2', scope: 'self', timed: false, resShred: { value: { p: 0 }, elements: ['Dendro'] }, expect: "Dendro RES is decreased by 30%", note: 'Assume a redução de RES Dendro (10 s) sempre ativa.' },
  ],
  Kachina: [
    { id: 'a1', label: 'Kachina A1', src: 'p1', scope: 'self', timed: true, forElements: ['Geo'], stats: { dmgPct: { p: 0 } }, expect: "Kachina's Geo DMG Bonus increases by 20% for 12s", note: '+20% de DMG Geo por 12 s depois de um Nightsoul Burst: ligue nas janelas.' },
  ],
};

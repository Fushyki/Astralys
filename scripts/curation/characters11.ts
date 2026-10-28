/**
 * Curadoria de passivas e constelações, lote 11 (Escoffier a Valeriy): Natlan e Fontaine novos, Nod-Krai. ATK, HP e DEF
 * fixos de buff (`atkFlat`...), ignorar DEF e conversões. Mesmas regras de `characters.ts`.
 */
import type { BuffCuration } from './characters';

export const CHARACTERS_15: Record<string, BuffCuration[]> = {
  Escoffier: [
    { id: 'c1', label: 'Escoffier C1', src: 'const1', scope: 'team', timed: true, forElements: ['Cryo'], stats: { critDmg: { p: 0 } }, team: { only: ['Cryo', 'Hydro'] }, expect: 'Cryo DMG CRIT DMG increased by 60%', note: '+60% de Dano Crítico do dano Cryo da equipe por 15 s (só com 4 membros Hydro ou Cryo): ligue na janela. Só personagens Cryo recebem.' },
  ],
  Skirk: [
    { id: 'a4n', label: 'Skirk A4 (Normal)', src: 'p2', scope: 'self', timed: true, stats: { baseMultByType: { normal: { p: 3 } } }, stacks: { max: 3, unit: "stacks de Death's Crossing", levels: [{ p: 1 }, { p: 2 }, { p: 3 }] }, expect: 'Death\'s Crossing', note: 'Assume 3 stacks: o Normal no Seven-Phase Flash causa 110%/120%/170% do dano ORIGINAL (multiplica o dano base, não soma ao DMG%): ligue na janela.' },
    { id: 'a4b', label: 'Skirk A4 (Supremo)', src: 'p2', scope: 'self', timed: true, stats: { baseMultByType: { burst: { p: 6 } } }, stacks: { max: 3, of: 'a4n', levels: [{ p: 4 }, { p: 5 }, { p: 6 }] }, expect: 'Death\'s Crossing', note: 'Assume 3 stacks: o Supremo (Havoc: Ruin) causa 105%/115%/160% do dano ORIGINAL (multiplica o dano base): ligue na janela.' },
    { id: 'c4', label: 'Skirk C4', src: 'const4', scope: 'self', timed: true, stats: { atkPct: { p: 2 } }, stacks: { max: 3, of: 'a4n', levels: [{ p: 0 }, { p: 1 }, { p: 2 }] }, expect: "Each Death's Crossing stack also increases Skirk's ATK by 10%/20%/40%", note: 'Assume 3 stacks (+40% de ATK): ligue na janela.' },
  ],
  Ineffa: [
    { id: 'a4', label: 'Ineffa A4', src: 'p2', scope: 'team', timed: true, convert: { from: 'atk', perPoint: { p: 0 }, to: ['em'] }, expect: "Elemental Mastery by 6% of Ineffa's ATK", note: '+6% do ATK dela como Maestria para ela e o personagem ativo por 20 s: ligue na janela (entra para toda a equipe).' },
  ],
  Lauma: [
    { id: 'a4', label: 'Lauma A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'em', perPoint: { p: 0 }, cap: { p: 1 }, to: ['skill'] }, expect: 'DMG dealt by her Elemental Skill is increased by 0.04%', note: '+0,04% de DMG da habilidade por ponto de Maestria, até 32%.' },
  ],
  Flins: [
    { id: 'a4', label: 'Flins A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'atk', perPoint: { p: 0 }, cap: { p: 1 }, to: ['em'] }, expect: "Flins's Elemental Mastery is increased by 8% of his ATK", note: 'Maestria = 8% do ATK, até 160.' },
  ],
  Aino: [
    { id: 'a4', label: 'Aino A4', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Supremo por Maestria', sourceStat: 'EM', perPoint: { p: 0 }, hitTypes: ['burst'] }], expect: "Elemental Burst DMG is increased by 50% of her Elemental Mastery", note: 'Soma 50% da Maestria ao dano base do Supremo.' },
  ],
  Durin: [
    { id: 'a4', label: 'Durin A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'atk', perPoint: { p: 0, x: 0.01 }, cap: { p: 1 }, to: ['burst'] }, expect: 'increase the DMG dealt by 3% of the original DMG for every 100 ATK', note: '+3% de DMG do Supremo por 100 de ATK, até 75% (assume os 10 stacks).' },
    { id: 'c6', label: 'Durin C6', src: 'const6', scope: 'self', timed: true, stats: { defIgnore: { p: 0 } }, expect: "Durin's Elemental Burst DMG ignores 30% of opponents' DEF", note: 'Ignora 30% da DEF do inimigo no Supremo: ligue só na janela do Supremo. A redução extra de DEF não entra.' },
  ],
  Columbina: [
    { id: 'c2', label: 'Columbina C2', src: 'const2', scope: 'self', timed: true, stats: { hpPct: { p: 1 } }, expect: 'increases her Max HP by 40% for 8s', note: '+40% de HP máximo por 8 s depois do Gravity Interference: ligue na janela.' },
  ],
  Zibai: [
    { id: 'a4d', label: 'Zibai A4 (DEF)', src: 'p2', scope: 'self', timed: false, stats: { defPct: { p: 0 } }, team: { scale: { of: 'same', table: [1, 2, 3] } }, expect: "Other Geo party members increase Zibai's DEF by 15% each", note: '+15% de DEF por outro membro Geo do time.' },
    { id: 'a4e', label: 'Zibai A4 (Maestria)', src: 'p2', scope: 'self', timed: false, stats: { em: { p: 1 } }, team: { scale: { of: ['Hydro'], table: [1, 2, 3] } }, expect: 'Hydro party members increase her Elemental Mastery by 60 each', note: '+60 de Maestria por membro Hydro do time.' },
  ],
  Varka: [
    { id: 'a1', label: 'Varka A1', src: 'p1', scope: 'self', timed: false, convert: { from: 'atk', perPoint: { p: 0, x: 0.001 }, cap: { p: 1 }, to: ['dmgPct'] }, expect: "every 1,000 points of Varka's ATK will grant Varka a 10% Anemo DMG Bonus", note: '+10% de DMG por 1.000 de ATK, até 25% (vale para o dano do elemento dele; o elemento extra do time não é somado).' },
  ],
  Linnea: [
    { id: 'c4', label: 'Linnea C4', src: 'const4', scope: 'team', timed: true, stats: { defPct: { p: 1 } }, expect: 'increase the DEF of Linnea and your current active character by 25%', note: '+25% de DEF dela e do personagem ativo por 5 s depois do Moondrift Harmony: ligue na janela.' },
    { id: 'a4', label: 'Linnea A4', src: 'p2', scope: 'team', timed: true, convert: { from: 'def', perPoint: { p: 0 }, to: ['em'] }, expect: "Increase in Elemental Mastery is based on 5% of Linnea's DEF", note: 'Maestria = 5% da DEF dela para o personagem ativo (ou ela mesma): entra como buff de equipe, ligue só em quem recebe.' },
  ],
  Nicole: [
    { id: 'a1', label: 'Nicole A1', src: 'p1', scope: 'others', timed: true, stats: { atkFlat: { p: 2 } }, expect: 'increasing their ATK by an additional 300', note: '+300 de ATK dos aliados observados por 3 s no campo (Guidance of Theosis): ligue na janela.' },
    { id: 'c2', label: 'Nicole C2', src: 'const2', scope: 'others', timed: true, stats: { atkFlat: { p: 0 } }, expect: 'increases ATK by an additional 300', note: '+300 de ATK extra do Grace of Kenosis (fora do limite do bônus): ligue na janela. A redução de RES não entra.' },
    { id: 'c6', label: 'Nicole C6', src: 'const6', scope: 'team', timed: true, stats: { defIgnore: { p: 0 } }, expect: "DMG dealt by characters with Guidance of Theosis will ignore 40% of opponents' DEF", note: 'Ignora 40% da DEF do inimigo para quem tem Guidance of Theosis: ligue na janela.' },
  ],
  Prune: [
    { id: 'a4', label: 'Prune A4', src: 'p2', scope: 'others', timed: true, convert: { from: 'atk', perPoint: { p: 0 }, threshold: { p: 3 }, cap: { p: 2 }, to: ['dmgPct'] }, expect: 'Tolling Rally', note: '+0,025% de DMG por ponto de ATK dela acima de 2.000, até 50%, para os aliados por 5 s: ligue na janela.' },
    { id: 'c6', label: 'Prune C6', src: 'const6', scope: 'others', timed: true, stats: { atkFlat: { p: 1 } }, expect: 'gain 350 ATK for 5s', note: '+350 de ATK dos aliados depois de uma reação: ligue na janela.' },
  ],
  Sandrone: [
    { id: 'a4', label: 'Sandrone A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'atk', perPoint: { p: 0, x: 1 }, cap: { p: 1 }, to: ['em'] }, expect: 'Every 100 ATK will increase her Elemental Mastery by 8', note: 'Maestria = 8 por 100 de ATK, até 160.' },
  ],
  Mitya: [
    { id: 'a4', label: 'Mitya A4', src: 'p2', scope: 'self', timed: true, stats: { critRate: { p: 0, x: 4 } }, expect: "Mitya's CRIT Rate increases by 5% for 15s", note: 'Assume 4 stacks (+20% de Taxa Crítica) depois de criar Gradient Beacons: ligue na janela.' },
  ],
};

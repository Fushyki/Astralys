/**
 * Curadoria de passivas e constelações, lote 8 (Mona a Yun Jin): ignorar DEF (`defIgnore`), dano fixo por DEF/HP
 * (`flat`) e conversões por HP. Mesmas regras de `characters.ts`.
 */
import type { BuffCuration } from './characters';

export const CHARACTERS_12: Record<string, BuffCuration[]> = {
  'Hu Tao': [
    { id: 'c6', label: 'Hu Tao C6', src: 'const6', scope: 'self', timed: true, stats: { critRate: { p: 3 } }, expect: 'CRIT Rate is increased by 100%', note: '+100% de Taxa Crítica por 10 s quando o HP cai abaixo de 25%: ligue na janela em que isso acontece.' },
  ],
  'Kaedehara Kazuha': [
    { id: 'c2', label: 'Kazuha C2', src: 'const2', scope: 'team', timed: true, stats: { em: { p: 0 } }, expect: "Increases Kaedehara Kazuha's own Elemental Mastery by 200", note: '+200 de Maestria dele e de quem está no campo do Kazuha Slash: ligue na janela.' },
  ],
  Yanfei: [
    { id: 'a1', label: 'Yanfei A1', src: 'p1', scope: 'self', timed: true, stats: { dmgPct: { p: 0, x: 3 } }, expect: "each Scarlet Seal will increase Yanfei's Pyro DMG Bonus by 5%", note: 'Assume 3 Selos gastos no Carregado (+15% de DMG Pyro por 6 s): ligue na janela do Carregado.' },
    { id: 'c6', label: 'Yanfei C6', src: 'const6', scope: 'self', timed: true, stats: { dmgPct: { p: 0 } }, expect: 'Increases the maximum number of Scarlet Seals by 1', note: 'O 4º Selo soma +5% de DMG Pyro ao A1: ligue junto com o A1.' },
  ],
  Thoma: [
    { id: 'a4', label: 'Thoma A4', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Fiery Collapse por HP', sourceStat: 'HP', perPoint: { p: 0 }, hitTypes: ['burst'] }], expect: "increased by 2.2% of Thoma's Max HP", note: 'Soma 2,2% do HP máximo ao dano base do Supremo (Fiery Collapse), em cada golpe do Supremo.' },
  ],
  'Raiden Shogun': [
    { id: 'c2', label: 'Raiden C2', src: 'const2', scope: 'self', timed: true, stats: { defIgnore: { p: 0 } }, expect: "ignore 60% of opponents' DEF", note: 'Ignora 60% da DEF do inimigo durante o Musou Isshin: ligue só na janela do Supremo (vale para todos os golpes dela dentro da janela).' },
  ],
  Sayu: [
    { id: 'c2', label: 'Sayu C2', src: 'const2', scope: 'self', timed: true, stats: { byType: { skill: { lit: 0.66 } } }, expect: 'The maximum DMG increase possible through this method is 66%', note: 'Assume o bônus máximo (+66%) do Fuufuu Whirlwind Kick segurando o Windwheel: ligue na janela.' },
  ],
  Gorou: [
    { id: 'a4s', label: 'Gorou A4 (habilidade)', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Habilidade por DEF', sourceStat: 'DEF', perPoint: { p: 0 }, hitTypes: ['skill'] }], expect: 'Skill DMG increased by 156% of DEF', note: 'Soma 156% da DEF ao dano base da habilidade (Inuzaka All-Round Defense).' },
    { id: 'a4b', label: 'Gorou A4 (Supremo)', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Supremo por DEF', sourceStat: 'DEF', perPoint: { p: 1 }, hitTypes: ['burst'] }], expect: 'Skill DMG and Crystal Collapse DMG increased by 15.6% of DEF', note: 'Soma 15,6% da DEF ao dano base do Supremo (Juuga) e do Crystal Collapse.' },
    { id: 'c6', label: 'Gorou C6', src: 'const6', scope: 'team', timed: true, forElements: ['Geo'], stats: { critDmg: { p: 2 } }, expect: "CRIT DMG of all nearby party members' Geo DMG", note: 'Assume o nível Crunch (+40% de Dano Crítico do dano Geo) por 12 s: ligue na janela. Só personagens Geo recebem.' },
  ],
  'Arataki Itto': [
    { id: 'a4', label: 'Itto A4', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Arataki Kesagiri por DEF', sourceStat: 'DEF', perPoint: { p: 0 }, hitTypes: ['charged'] }], expect: "Arataki Kesagiri DMG is increased by 35% of Arataki Itto's DEF", note: 'Soma 35% da DEF ao dano base do Arataki Kesagiri (o Carregado dele).' },
  ],
  'Yae Miko': [
    { id: 'c1', label: 'Yae C1', src: 'const1', scope: 'team', timed: true, forElements: ['Electro'], stats: { dmgPct: { p: 1 } }, expect: 'gain a 50% Electro DMG and Stellar-Conduct DMG Bonus', note: '+50% de DMG Electro da equipe por 10 s depois de Supercondutor ou Estelar-Condução: ligue na janela. Só personagens Electro recebem; o bônus do dano Estelar não entra.' },
    { id: 'c2', label: 'Yae C2', src: 'const2', scope: 'team', timed: true, stats: { em: { p: 6 } }, expect: "Elemental Mastery will also be increased by 60/90/120/200 points", note: 'Assume Sesshou Sakura no nível 4 (+200 de Maestria dela e de quem está no campo): ligue na janela. No nível 1 a 3 o valor é 60, 90 e 120.' },
    { id: 'c6', label: 'Yae C6', src: 'const6', scope: 'self', timed: true, stats: { defIgnore: { p: 0 } }, expect: "attacks will ignore 60% of the opponents' DEF", note: 'Os Sesshou Sakura ignoram 60% da DEF: ligue só nas janelas da habilidade (vale para todos os golpes dela dentro da janela). O Dano Crítico Estelar não entra.' },
  ],
  'Shikanoin Heizou': [
    { id: 'c6', label: 'Heizou C6', src: 'const6', scope: 'self', timed: true, stats: { critRateByType: { skill: { p: 0, x: 4 } }, critDmgByType: { skill: { p: 1 } } }, expect: 'Each Declension stack will increase the CRIT Rate of the Heartstopper Strike unleashed by 4%', note: 'Assume 4 stacks (+16% de Taxa Crítica) e Convicção (+32% de Dano Crítico) no Heartstopper Strike (habilidade): ligue na janela.' },
  ],
  Yelan: [
    { id: 'a1', label: 'Yelan A1', src: 'p1', scope: 'self', timed: false, stats: { hpPct: { lit: 1 } }, team: { scale: { of: 'distinct', table: [{ p: 0 }, { p: 1 }, { p: 2 }, { p: 3 }] } }, expect: "Yelan's Max HP is increased by 6%/12%/18%/30%", note: 'HP máximo por número de elementos diferentes no time (6%, 12%, 18%, 30%).' },
  ],
  Kirara: [
    { id: 'a4s', label: 'Kirara A4 (habilidade)', src: 'p2', scope: 'self', timed: false, convert: { from: 'hp', perPoint: { p: 0, x: 0.001 }, to: ['skill'] }, expect: 'Every 1,000 Max HP Kirara possesses will increase the DMG dealt by Meow-teor Kick', note: '+0,4% de DMG da habilidade por 1.000 de HP máximo.' },
    { id: 'a4b', label: 'Kirara A4 (Supremo)', src: 'p2', scope: 'self', timed: false, convert: { from: 'hp', perPoint: { p: 1, x: 0.001 }, to: ['burst'] }, expect: 'the DMG dealt by Secret Art: Surprise Dispatch by 0.3%', note: '+0,3% de DMG do Supremo por 1.000 de HP máximo.' },
  ],
};

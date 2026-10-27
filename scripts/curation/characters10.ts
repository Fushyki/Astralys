/**
 * Curadoria de passivas e constelações, lote 10 (Charlotte a Lan Yan): personagens de Fontaine e de Natlan, com dano
 * fixo por EM/DEF/HP/ATK e buffs de Taxa e Dano Crítico por golpe. Mesmas regras de `characters.ts`.
 *
 * Mavuika, Citlali, Iansan e Bennett vêm da planilha de referência: no modo `compat: 'planilha'` só valem os buffs com
 * faixa (`timed: true`), então o gabarito do exemplo não muda.
 */
import type { BuffCuration } from './characters';

export const CHARACTERS_14: Record<string, BuffCuration[]> = {
  Charlotte: [
    { id: 'c2', label: 'Charlotte C2', src: 'const2', scope: 'self', timed: true, stats: { atkPct: { p: 0 } }, stacks: { max: 3, unit: 'inimigos atingidos', default: 1, levels: [{ p: 0 }, { p: 1 }, { p: 2 }] }, expect: "Charlotte's own ATK will be increased by 10%/20%/30%", note: 'Assume 1 inimigo atingido pelo Monsieur Verite (+10% de ATK por 12 s): ligue na janela. Com 2 e 3 inimigos o valor é 20% e 30%.' },
    { id: 'c4', label: 'Charlotte C4', src: 'const4', scope: 'self', timed: true, stats: { byType: { skill: { p: 0 } } }, expect: 'it will deal 10% more DMG', note: '+10% de DMG da habilidade contra inimigo marcado (Snappy Silhouette ou Focused Impression): ligue na janela.' },
  ],
  Furina: [
    { id: 'a4', label: 'Furina A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'hp', perPoint: { p: 0, x: 0.001 }, cap: { p: 1 }, to: ['skill'] }, expect: "Salon Members' DMG dealt by 0.7%", note: '+0,7% de DMG da habilidade (Salon Members) por 1.000 de HP máximo, até 28%.' },
    { id: 'c2', label: 'Furina C2', src: 'const2', scope: 'self', timed: true, stats: { hpPct: { p: 4 } }, expect: 'Her maximum Max HP increase is 140%', note: 'Assume o aumento máximo de HP (+140%, com Fanfare muito acima do limite): ligue na janela do Supremo.' },
  ],
  Navia: [
    { id: 'a1', label: 'Navia A1', src: 'p1', scope: 'self', timed: true, stats: { byType: { normal: { p: 0 }, charged: { p: 0 }, plunge: { p: 0 } } }, expect: 'will be increased by 40%', note: '+40% de DMG de Normal, Carregado e Imersivo por 4 s depois da habilidade: ligue na janela. A conversão para Geo não entra.' },
    { id: 'a4', label: 'Navia A4', src: 'p2', scope: 'self', timed: false, stats: { atkPct: { p: 0 } }, team: { scale: { of: ['Pyro', 'Electro', 'Cryo', 'Hydro'], table: [1, 2, 2] } }, expect: 'Navia gains 20% increased ATK', note: '+20% de ATK por membro Pyro, Electro, Cryo ou Hydro do time (até 2).' },
    { id: 'c2', label: 'Navia C2', src: 'const2', scope: 'self', timed: true, stats: { critRateByType: { skill: { p: 0, x: 3 } } }, expect: 'increase the CRIT Rate of this Ceremonial Crystalshot instance by 12%', note: 'Assume 3 stacks de Crystal Shrapnel gastos (+36% de Taxa Crítica na habilidade): ligue na janela. O tiro do canhão não entra.' },
  ],
  Xianyun: [
    { id: 'c6', label: 'Xianyun C6', src: 'const6', scope: 'self', timed: true, stats: { critDmgByType: { plunge: { p: 2 } } }, stacks: { max: 3, unit: 'Skyladders', levels: [{ p: 0 }, { p: 1 }, { p: 2 }] }, expect: 'the CRIT DMG of a Driftcloud Wave created in this instance of Cloud Transmogrification will be increased by 15%/35%/70%', note: 'Assume 3 Skyladders (+70% de Dano Crítico do Driftcloud Wave): ligue na janela.' },
  ],
  Chiori: [
    { id: 'c6', label: 'Chiori C6', src: 'const6', scope: 'self', timed: false, flat: [{ name: 'Normal por DEF', sourceStat: 'DEF', perPoint: { p: 1 }, hitTypes: ['normal'] }], expect: 'the DMG dealt by Chiori\'s own Normal Attacks is increased by an amount equal to 235% of her own DEF', note: 'Soma 235% da DEF ao dano base de cada Normal.' },
  ],
  Sigewinne: [
    { id: 'c2', label: 'Sigewinne C2', src: 'const2', scope: 'self', timed: false, resShred: { value: { p: 1 }, elements: ['Hydro'] }, expect: 'Hydro RES will be decreased by 35% for 8s', note: 'Assume a redução de RES Hydro do inimigo (35%, 8 s) sempre ativa.' },
    { id: 'c6', label: 'Sigewinne C6', src: 'const6', scope: 'self', timed: true, convert: { from: 'hp', perPoint: { p: 0, x: 0.001 }, cap: { p: 3 }, to: ['critRate'] }, expect: 'Every 1,000 Max HP she has will increase CRIT Rate by 0.4% and CRIT DMG by 2.2%', note: '+0,4% de Taxa Crítica por 1.000 de HP máximo (até 20%) por 15 s: ligue na janela da habilidade (vale para todos os golpes dela na janela).' },
    { id: 'c6d', label: 'Sigewinne C6 (Dano Crítico)', src: 'const6', scope: 'self', timed: true, convert: { from: 'hp', perPoint: { p: 1, x: 0.001 }, cap: { p: 4 }, to: ['critDmg'] }, expect: 'Every 1,000 Max HP she has will increase CRIT Rate by 0.4% and CRIT DMG by 2.2%', note: '+2,2% de Dano Crítico por 1.000 de HP máximo (até 110%) por 15 s: ligue na janela da habilidade.' },
  ],
  Sethos: [
    { id: 'a4', label: 'Sethos A4', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Shadowpiercing Shot por Maestria', sourceStat: 'EM', perPoint: { p: 1 }, hitTypes: ['charged'], stacks: 4 }], expect: "increasing the DMG dealt by Shadowpiercing Shots by 700% of Sethos's Elemental Mastery", note: 'Soma 700% da Maestria ao dano base dos 4 primeiros Shadowpiercing Shots (Carregados).' },
    { id: 'c1', label: 'Sethos C1', src: 'const1', scope: 'self', timed: false, stats: { critRateByType: { charged: { p: 0 } } }, expect: 'The CRIT Rate of Shadowpiercing Shot is increased by 15%', note: '+15% de Taxa Crítica nos Shadowpiercing Shots (Carregados).' },
  ],
  Clorinde: [
    { id: 'a1', label: 'Clorinde A1', src: 'p1', scope: 'self', timed: false, flat: [{ name: 'Dark-Shattering Flame (3 stacks)', sourceStat: 'ATK', perPoint: { p: 2, x: 3 }, cap: { p: 1 }, hitTypes: ['normal', 'burst'] }], stacks: { max: 3, unit: 'stacks de Dark-Shattering Flame' }, expect: 'Electro DMG dealt by Clorinde\'s Normal Attacks and Last Lightfall will be increased by 20% of Clorinde\'s ATK', note: 'Soma 20% do ATK por stack (assume 3 stacks = 60%) ao dano base dos Normais e do Last Lightfall, com teto de 1.800 por golpe.' },
    { id: 'a4', label: 'Clorinde A4', src: 'p2', scope: 'self', timed: true, stats: { critRate: { p: 2, x: 2 } }, expect: 'her CRIT Rate will increase by 10%', note: 'Assume 2 stacks (+20% de Taxa Crítica) com o Bond of Life em 100% ou mais: ligue na janela.' },
    { id: 'c2', label: 'Clorinde C2', src: 'const2', scope: 'self', timed: false, flat: [{ name: 'Dark-Shattering Flame (C2)', sourceStat: 'ATK', perPoint: { lit: 0.3 }, cap: { lit: 900 }, hitTypes: ['normal', 'burst'] }], stacks: { max: 3, of: 'a1' }, expect: 'Electro DMG dealt by Clorinde\'s Normal Attacks and Last Lightfall will be increased by 30% of Clorinde\'s ATK', note: 'O A1 melhorado: 30% do ATK por stack (90% com 3) e teto de 2.700. Soma a diferença (+30% do ATK e +900 de teto) ao A1.' },
    { id: 'c4', label: 'Clorinde C4', src: 'const4', scope: 'self', timed: true, stats: { byType: { burst: { lit: 2 } } }, expect: 'Every 1% of her current Bond of Life will increase Last Lightfall DMG by 2%', note: 'Assume o máximo (+200% de DMG do Last Lightfall): ligue na janela do Supremo.' },
  ],
  Emilie: [
    { id: 'a4', label: 'Emilie A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'atk', perPoint: { p: 0, x: 0.001 }, cap: { p: 1 }, to: ['dmgPct'] }, expect: 'with every 1,000 ATK increasing DMG dealt by 15%', note: '+15% de DMG por 1.000 de ATK, até 36%, contra inimigo em Queimadura (assumido).' },
  ],
  Kachina: [
    { id: 'a4', label: 'Kachina A4', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Turbo Twirly por DEF', sourceStat: 'DEF', perPoint: { p: 0 }, hitTypes: ['skill'] }], expect: "Turbo Twirly's DMG is increased by 20% of Kachina's DEF", note: 'Soma 20% da DEF ao dano base da habilidade (Turbo Twirly).' },
    { id: 'c4', label: 'Kachina C4', src: 'const4', scope: 'self', timed: true, stats: { defPct: { p: 0 } }, stacks: { max: 4, unit: 'inimigos no campo', default: 1, levels: [{ p: 0 }, { p: 1 }, { p: 2 }, { p: 3 }] }, expect: 'gains 8%/12%/16%/20% increased DEF', note: 'Assume 1 inimigo (+8% de DEF): ligue na janela. Com 4 ou mais inimigos é 20%.' },
  ],
  Kinich: [
    { id: 'a4', label: 'Kinich A4', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Scalespiker Cannon por ATK', sourceStat: 'ATK', perPoint: { p: 1, x: 2 }, hitTypes: ['skill'], stacks: 1 }], stacks: { max: 2, unit: "stacks de Hunter's Experience" }, expect: 'each stack consumed increasing the DMG dealt by this Cannon shot by 320%', note: 'Soma 640% do ATK (2 stacks de 320%) ao primeiro golpe da habilidade (o Scalespiker Cannon).' },
    { id: 'c1', label: 'Kinich C1', src: 'const1', scope: 'self', timed: false, stats: { critDmgByType: { skill: { p: 2 } } }, expect: "Scalespiker Cannon's CRIT DMG is increased by 100%", note: '+100% de Dano Crítico no Scalespiker Cannon (aqui conta nos golpes de habilidade dele).' },
    { id: 'c4', label: 'Kinich C4', src: 'const4', scope: 'self', timed: false, stats: { byType: { burst: { p: 2 } } }, expect: 'Hail to the Almighty Dragonlord deals 70% more DMG', note: '+70% de DMG do Supremo (Hail to the Almighty Dragonlord).' },
  ],
  Mualani: [
    { id: 'a4', label: 'Mualani A4', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Boomsharka-laka por HP', sourceStat: 'HP', perPoint: { p: 3 }, hitTypes: ['burst'], stacks: 1 }], stacks: { max: 3, unit: "stacks de Wavechaser's Exploits", levels: [{ p: 1 }, { p: 2 }, { p: 3 }] }, expect: 'increase the DMG of this Boomsharka-laka by 15%/30%/45% of her Max HP', note: 'Soma 45% do HP máximo (3 stacks) ao dano base do Boomsharka-laka (Supremo).' },
    { id: 'c1', label: 'Mualani C1', src: 'const1', scope: 'self', timed: false, flat: [{ name: "Sharky's Surging Bite por HP", sourceStat: 'HP', perPoint: { p: 0 }, hitTypes: ['skill'], stacks: 1 }], expect: "increased by 66% of Mualani's Max HP", note: 'Soma 66% do HP máximo ao primeiro golpe da habilidade (Sharky\'s Surging Bite), com a regra de dano decrescente do Surfshark Wavebreaker NÃO aplicada.' },
  ],
  Xilonen: [
    { id: 'a4', label: 'Xilonen A4', src: 'p2', scope: 'self', timed: true, stats: { defPct: { p: 1 } }, expect: "Xilonen's DEF is increased by 20% for 15s", note: '+20% de DEF por 15 s depois do Nightsoul Burst de um aliado: ligue na janela.' },
    { id: 'c6', label: 'Xilonen C6', src: 'const6', scope: 'self', timed: false, flat: [{ name: 'Normal e Imersivo por DEF', sourceStat: 'DEF', perPoint: { lit: 3 }, hitTypes: ['normal', 'plunge'] }], expect: 'Xilonen deals 300% of her DEF as increased Normal and Plunging Attack DMG', note: 'Soma 300% da DEF ao dano base dos Normais e Imersivos (assume o Imperishable Night sempre ativo).' },
  ],
  Mavuika: [
    { id: 'a1', label: 'Mavuika A1', src: 'p1', scope: 'self', timed: true, stats: { atkPct: { p: 0 } }, expect: "Mavuika's ATK increases by 30% for 10s", note: '+30% de ATK por 10 s depois de um Nightsoul Burst de aliado: ligue na janela.' },
    { id: 'a4', label: 'Mavuika A4', src: 'p2', scope: 'team', timed: true, stats: { dmgPct: { lit: 0.4 } }, stacks: { max: 200, unit: 'pontos de Fighting Spirit' }, expect: 'The maximum increase obtainable this way is 40%', note: '+0,2% de DMG de quem está em campo por ponto de Fighting Spirit usado no Supremo (até 200 = +40%): a quantidade é escolha sua (padrão: 200). Liga na janela; no jogo ele decai em 20 s (a C4 tira o decaimento).' },
    { id: 'c1', label: 'Mavuika C1', src: 'const1', scope: 'self', timed: true, stats: { atkPct: { p: 2 } }, expect: 'she gains 40% ATK for 8s after gaining Fighting Spirit', note: '+40% de ATK por 8 s depois de ganhar Fighting Spirit: ligue na janela.' },
    { id: 'c4', label: 'Mavuika C4', src: 'const4', scope: 'team', timed: true, stats: { dmgPct: { p: 0 } }, expect: 'an additional 10% DMG Bonus will be gained', note: '+10% de DMG de quem está em campo (o bônus do A4 deixa de decair): ligue junto com o A4.' },
  ],
  Citlali: [
    { id: 'a1', label: 'Citlali A1', src: 'p1', scope: 'self', timed: false, resShred: { value: { p: 2 }, elements: ['Pyro', 'Hydro'] }, expect: 'the Pyro and Hydro RES of opponents affected by that reaction decreases by 20% for 12s', note: 'Assume a redução de RES Pyro e Hydro do inimigo (20%, 12 s depois de Congelar ou Derreter) sempre ativa.' },
    { id: 'a4s', label: 'Citlali A4 (habilidade)', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Frostfall Storm por Maestria', sourceStat: 'EM', perPoint: { p: 0 }, hitTypes: ['skill'] }], expect: "Itzpapa's Frostfall Storm DMG is increased by 90% of Citlali's Elemental Mastery", note: 'Soma 90% da Maestria ao dano base da habilidade (Frostfall Storm).' },
    { id: 'a4b', label: 'Citlali A4 (Supremo)', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Ice Storm por Maestria', sourceStat: 'EM', perPoint: { p: 1 }, hitTypes: ['burst'] }], expect: 'Ice Storm DMG is increased by 1200% of Citlali\'s Elemental Mastery', note: 'Soma 1.200% da Maestria ao dano base do Supremo (Ice Storm).' },
    { id: 'c2em', label: 'Citlali C2 (Maestria)', src: 'const2', scope: 'self', timed: false, stats: { em: { p: 0 } }, expect: 'Citlali gains 125 Elemental Mastery', note: '+125 de Maestria dela.' },
    { id: 'c2team', label: 'Citlali C2 (aliados)', src: 'const2', scope: 'others', timed: true, stats: { em: { p: 1 } }, expect: 'gain 250 Elemental Mastery', note: '+250 de Maestria dos aliados protegidos pelo Opal Shield ou seguidos pelo Itzpapa: ligue na janela.' },
    { id: 'c2r', label: 'Citlali C2 (RES)', src: 'const2', scope: 'self', timed: false, resShred: { value: { p: 3 }, elements: ['Pyro', 'Hydro'] }, expect: 'have their Pyro and Hydro RES additionally decreased by 20% for 12s', note: 'Soma mais 20% de redução de RES Pyro e Hydro ao A1 (assume sempre ativa).' },
    { id: 'c6t', label: 'Citlali C6 (equipe)', src: 'const6', scope: 'team', timed: true, forElements: ['Pyro', 'Hydro'], stats: { dmgPct: { p: 0, x: 40 } }, stacks: { max: 40, unit: 'pontos de Cifra' }, expect: 'a 1.5% Pyro and Hydro DMG Bonus', note: 'Assume 40 pontos de Cifra (+60% de DMG Pyro e Hydro da equipe): ligue na janela. Os pontos sobem durante o Itzpapa.' },
    { id: 'c6s', label: 'Citlali C6 (dela)', src: 'const6', scope: 'self', timed: true, stats: { dmgPct: { p: 2, x: 40 } }, stacks: { max: 40, unit: 'pontos de Cifra' }, expect: 'increase the DMG Citlali deals by 2.5%', note: 'Assume 40 pontos de Cifra (+100% de DMG dela): ligue na janela.' },
  ],
  Iansan: [
    { id: 'a1', label: 'Iansan A1', src: 'p1', scope: 'self', timed: true, stats: { atkPct: { p: 0 } }, expect: 'her ATK is increased by 20%', note: '+20% de ATK por 15 s (Precise Movement): ligue na janela.' },
    { id: 'c2', label: 'Iansan C2', src: 'const2', scope: 'others', timed: true, stats: { atkPct: { p: 0 } }, expect: "increase your current active character's ATK by 30%", note: '+30% de ATK do personagem ativo com a Iansan fora de campo: ligue na janela.' },
    { id: 'c6', label: 'Iansan C6', src: 'const6', scope: 'team', timed: true, stats: { dmgPct: { p: 2 } }, expect: 'increases the DMG dealt by your current active character by 25% for 3s', note: '+25% de DMG do personagem ativo por 3 s (Extreme Force): ligue na janela.' },
  ],
  Varesa: [
    { id: 'a1', label: 'Varesa A1', src: 'p1', scope: 'self', timed: false, flat: [{ name: 'Rainbow Crash por ATK', sourceStat: 'ATK', perPoint: { p: 1 }, hitTypes: ['plunge'], stacks: 1 }], expect: 'the shockwave DMG dealt when she hits the ground is increased by 50% of her ATK', note: 'Soma 180% do ATK (no estado Fiery Passion; sem ele são 50%) ao dano base da primeira onda de choque do Imersivo.' },
  ],
  'Lan Yan': [
    { id: 'a4s', label: 'Lan Yan A4 (habilidade)', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Swallow-Wisp por Maestria', sourceStat: 'EM', perPoint: { p: 0 }, hitTypes: ['skill'] }], expect: 'deal increased DMG equal to 309% and 774% of Lan Yan\'s Elemental Mastery respectively', note: 'Soma 309% da Maestria ao dano base da habilidade.' },
    { id: 'a4b', label: 'Lan Yan A4 (Supremo)', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Lustrous Moonrise por Maestria', sourceStat: 'EM', perPoint: { p: 1 }, hitTypes: ['burst'] }], expect: 'deal increased DMG equal to 309% and 774% of Lan Yan\'s Elemental Mastery respectively', note: 'Soma 774% da Maestria ao dano base do Supremo.' },
  ],
};

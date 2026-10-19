/**
 * Curadoria de passivas e constelações, lote 9 (Yun Jin a Neuvillette): conversões por HP/EM, dano fixo por HP/EM/DEF
 * e buffs de Taxa e Dano Crítico por golpe. Mesmas regras de `characters.ts`.
 */
import type { BuffCuration } from './characters';

export const CHARACTERS_13: Record<string, BuffCuration[]> = {
  'Yun Jin': [
    { id: 'c4', label: 'Yun Jin C4', src: 'const4', scope: 'self', timed: true, stats: { defPct: { p: 0 } }, expect: 'her DEF is increased by 20% for 12s', note: '+20% de DEF por 12 s depois de Cristalizar: ligue na janela (o dano dela escala com DEF).' },
  ],
  'Kuki Shinobu': [
    { id: 'a4', label: 'Shinobu A4', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Sanctifying Ring por Maestria', sourceStat: 'EM', perPoint: { p: 1 }, hitTypes: ['skill'] }], expect: 'DMG dealt is increased by 25% of Elemental Mastery', note: 'Soma 25% da Maestria ao dano base da habilidade (Sanctifying Ring). A cura não entra.' },
    { id: 'c6', label: 'Shinobu C6', src: 'const6', scope: 'self', timed: true, stats: { em: { p: 2 } }, expect: 'she will gain 150 Elemental Mastery for 15s', note: '+150 de Maestria por 15 s quando o HP cai abaixo de 25%: ligue na janela.' },
  ],
  'Kamisato Ayato': [
    { id: 'namisen', label: 'Ayato: Namisen', src: 'kit', scope: 'self', timed: false, kit: { talent: 'skill', key: 'Namisen DMG Bonus' }, flat: [{ name: 'Namisen por HP', sourceStat: 'HP', perPoint: { lit: 4 }, hitTypes: ['normal'] }], expect: 'Namisen', note: 'Soma (% do HP máximo por stack do nível da habilidade) × 4 stacks ao dano base dos Normais (Shunsuiken) dentro do estado da habilidade. Assume os 4 stacks cheios (no jogo eles sobem a cada golpe).' },
    { id: 'namisen-c2', label: 'Ayato C2: 5º stack', src: 'kit', minConstellation: 2, scope: 'self', timed: false, kit: { talent: 'skill', key: 'Namisen DMG Bonus' }, flat: [{ name: 'Namisen (5º stack)', sourceStat: 'HP', perPoint: { lit: 1 }, hitTypes: ['normal'] }], expect: 'Namisen', note: 'O 5º stack do Namisen (C2).' },
    { id: 'c2', label: 'Ayato C2', src: 'const2', scope: 'self', timed: true, stats: { hpPct: { p: 1 } }, expect: 'his Max HP is increased by 50%', note: '+50% de HP máximo com 3 ou mais stacks de Namisen: ligue na janela do estado da habilidade.' },
  ],
  Nilou: [
    { id: 'a1', label: 'Nilou A1', src: 'p1', scope: 'team', timed: true, stats: { em: { p: 1 } }, team: { only: ['Dendro', 'Hydro'], eachOf: ['Dendro', 'Hydro'] }, expect: 'increase the Elemental Mastery of all nearby characters by 100', note: '+100 de Maestria da equipe (10 s) quando o time só tem Dendro e Hydro (ao menos um de cada): ligue na janela. No jogo vale quando eles são atingidos por Dendro.' },
    { id: 'c4', label: 'Nilou C4', src: 'const4', scope: 'self', timed: true, stats: { byType: { burst: { p: 1 } } }, expect: 'Listening Spring will be increased by 50% for 8s', note: '+50% de DMG do Supremo por 8 s: ligue na janela.' },
  ],
  Candace: [
    { id: 'a4', label: 'Candace A4', src: 'p2', scope: 'team', timed: true, convert: { from: 'hp', perPoint: { p: 0, x: 0.001 }, to: ['normal'] }, expect: "increased DMG to opponents for every 1,000 points of Candace's Max HP", note: '+0,5% de DMG de Normal por 1.000 de HP máximo da Candace para quem está sob a Prayer of the Crimson Crown: ligue na janela do Supremo.' },
    { id: 'c2', label: 'Candace C2', src: 'const2', scope: 'self', timed: true, stats: { hpPct: { p: 0 } }, expect: "Candace's Max HP will be increased by 20% for 15s", note: '+20% de HP máximo por 15 s depois da habilidade segurada: ligue na janela.' },
  ],
  Nahida: [
    { id: 'a4', label: 'Nahida A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'em', perPoint: { p: 2 }, threshold: { p: 0 }, cap: { p: 2, x: 800 }, to: ['skill'] }, expect: 'Each point of Nahida\'s Elemental Mastery beyond 200 will grant 0.1% Bonus DMG', note: '+0,1% de DMG da habilidade (Tri-Karma Purification) por ponto de Maestria acima de 200, até 80%. A Taxa Crítica (0,03% por ponto, até 24%) não entra.' },
    { id: 'c2', label: 'Nahida C2', src: 'const2', scope: 'self', timed: false, defShred: { p: 1 }, expect: 'DEF is decreased by 30%', note: 'Assume a redução de DEF do inimigo (30%, 8 s depois de Quicken, Aggravate ou Spread) sempre ativa. O crítico das reações de Dendro não entra.' },
  ],
  Layla: [
    { id: 'a4', label: 'Layla A4', src: 'p2', scope: 'self', timed: false, flat: [{ name: 'Shooting Stars por HP', sourceStat: 'HP', perPoint: { p: 0 }, hitTypes: ['skill'] }], expect: "increased by 1.5% of Layla's Max HP", note: 'Soma 1,5% do HP máximo ao dano base de cada Shooting Star (habilidade).' },
    { id: 'c6', label: 'Layla C6', src: 'const6', scope: 'self', timed: false, stats: { byType: { skill: { p: 1 }, burst: { p: 1 } } }, expect: 'deal 40% increased DMG', note: '+40% de DMG da habilidade (Shooting Stars) e do Supremo (Starlight Slugs).' },
  ],
  Wanderer: [
    { id: 'c2', label: 'Wanderer C2', src: 'const2', scope: 'self', timed: true, stats: { byType: { burst: { p: 1 } } }, expect: 'will see its DMG increased by 4% per point', note: 'Assume o bônus máximo de +200% de DMG do Supremo (depende dos pontos Kuugoryoku gastos): ligue na janela.' },
  ],
  Yaoyao: [
    { id: 'c4', label: 'Yaoyao C4', src: 'const4', scope: 'self', timed: true, convert: { from: 'hp', perPoint: { p: 0 }, cap: { p: 2 }, to: ['em'] }, expect: 'increased based on 0.3% of her Max HP', note: 'Maestria = 0,3% do HP máximo (até 120) por 8 s: ligue na janela.' },
  ],
  Alhaitham: [
    { id: 'a4', label: 'Alhaitham A4', src: 'p2', scope: 'self', timed: false, convert: { from: 'em', perPoint: { p: 0 }, cap: { p: 1 }, to: ['skill', 'burst'] }, expect: 'increase the DMG dealt by Projection Attacks', note: '+0,1% de DMG da habilidade (Projection Attacks) e do Supremo por ponto de Maestria, até 100%.' },
    { id: 'c6', label: 'Alhaitham C6', src: 'const6', scope: 'self', timed: true, stats: { critRate: { p: 0 }, critDmg: { p: 1 } }, expect: 'his CRIT Rate and CRIT DMG will increase by 10% and 70%', note: '+10% de Taxa Crítica e +70% de Dano Crítico por 6 s quando gera Espelhos com o limite cheio: ligue na janela.' },
  ],
  Dehya: [
    { id: 'c1h', label: 'Dehya C1 (HP)', src: 'const1', scope: 'self', timed: false, stats: { hpPct: { p: 0 } }, expect: "Dehya's Max HP is increased by 20%", note: '+20% de HP máximo.' },
    { id: 'c1s', label: 'Dehya C1 (habilidade)', src: 'const1', scope: 'self', timed: false, flat: [{ name: 'Molten Inferno por HP', sourceStat: 'HP', perPoint: { p: 1 }, hitTypes: ['skill'] }], expect: "Molten Inferno's DMG will be increased by 3.6% of her Max HP", note: 'Soma 3,6% do HP máximo ao dano base da habilidade (Molten Inferno).' },
    { id: 'c1b', label: 'Dehya C1 (Supremo)', src: 'const1', scope: 'self', timed: false, flat: [{ name: 'Leonine Bite por HP', sourceStat: 'HP', perPoint: { p: 2 }, hitTypes: ['burst'] }], expect: "Leonine Bite's DMG will be increased by 6% of her Max HP", note: 'Soma 6% do HP máximo ao dano base do Supremo (Leonine Bite).' },
    { id: 'c6', label: 'Dehya C6', src: 'const6', scope: 'self', timed: false, stats: { critRateByType: { burst: { p: 0 } }, critDmgByType: { burst: { p: 1 } } }, expect: 'The CRIT Rate of Leonine Bite is increased by 10%', note: '+10% de Taxa Crítica e +15% de Dano Crítico no Supremo (assume o stack de Dano Crítico ativo).' },
  ],
  Lynette: [
    { id: 'a4', label: 'Lynette A4', src: 'p2', scope: 'self', timed: true, stats: { byType: { burst: { p: 0 } } }, expect: "Lynette's Elemental Burst will deal 15% more DMG", note: '+15% de DMG do Supremo depois da Conversão Elemental da caixa: ligue na janela.' },
  ],
  Freminet: [
    { id: 'a4', label: 'Freminet A4', src: 'p2', scope: 'self', timed: true, stats: { byType: { skill: { p: 0 } } }, expect: 'the DMG dealt by Pressurized Floe: Shattering Pressure will be increased by 40% for 5s', note: '+40% de DMG da habilidade por 5 s depois de Estilhaçar: ligue na janela.' },
  ],
  Wriothesley: [
    { id: 'a1', label: 'Wriothesley A1', src: 'p1', scope: 'self', timed: true, stats: { byType: { charged: { p: 1 } } }, expect: 'will deal 50% increased DMG', note: '+50% de DMG do Carregado (Rebuke: Vaulting Fist) com HP abaixo de 60%: ligue só nesse Carregado.' },
    { id: 'c6', label: 'Wriothesley C6', src: 'const6', scope: 'self', timed: true, stats: { critRateByType: { charged: { p: 0 } }, critDmgByType: { charged: { p: 1 } } }, expect: 'The CRIT Rate of Rebuke: Vaulting Fist will be increased by 10%, and its CRIT DMG by 80%', note: '+10% de Taxa Crítica e +80% de Dano Crítico no Carregado Rebuke: ligue só nele. O gelo extra não entra.' },
  ],
  Neuvillette: [
    { id: 'a1', label: 'Neuvillette A1', src: 'p1', scope: 'self', timed: true, stats: { byType: { charged: { p: 2 } } }, expect: 'to deal 110%/125%/160% of its original DMG', note: 'Assume 3 stacks de Past Draconic Glories (+60% de DMG do Carregado): ligue na janela.' },
    { id: 'c2', label: 'Neuvillette C2', src: 'const2', scope: 'self', timed: true, stats: { critDmgByType: { charged: { p: 0, x: 3 } } }, expect: 'increase the CRIT DMG of Charged Attack: Equitable Judgment by 14%', note: 'Assume 3 stacks (+42% de Dano Crítico do Carregado): ligue na janela.' },
  ],
};

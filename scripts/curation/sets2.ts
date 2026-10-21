/**
 * Curadoria dos bônus de 4 peças que faltavam (lote 2). Mesmas regras de `sets.ts`; `noDamage` = só energia, cura,
 * resistência ou recarga de habilidade; `partial` = uma parte que mexe em dano (reação, Lunar, Estelar, golpe extra)
 * ainda fora do cálculo.
 */
import type { FourCuration } from './sets';

const LUNAR = 'Depende das mecânicas Lunar, Estelar ou Moonsign, que o motor ainda não modela.';

export const FOUR_PIECE_2: Record<string, FourCuration> = {
  'Resolution of Sojourner': { critRateByType: { charged: { p: 0 } }, expect: 'Charged Attack CRIT Rate by 30%', note: '+30% de Taxa Crítica só do Carregado.' },
  "Defender's Will": { noDamage: true, expect: 'Elemental RES to that corresponding element', note: 'Só RES elemental própria: não muda o dano.' },
  'Tiny Miracle': { noDamage: true, expect: 'Incoming elemental DMG increases corresponding Elemental RES', note: 'Só RES elemental ao levar dano: não muda o dano.' },
  Berserker: { critRate: { p: 0 }, expect: 'When HP is below 70%, CRIT Rate increases by an additional 24%', note: 'Assume HP abaixo de 70% (+24% de Taxa Crítica) sempre ativo.' },
  Gambler: { noDamage: true, expect: 'remove Elemental Skill CD', note: 'Só reinicia a recarga da habilidade ao derrotar um inimigo: não muda os stats.' },
  'The Exile': { noDamage: true, expect: 'regenerates 2 Energy for all party members', note: 'Só energia: use a calculadora de Recarga.' },
  Scholar: { noDamage: true, expect: 'gives 3 Energy to all party members', note: 'Só energia: use a calculadora de Recarga.' },
  'Maiden Beloved': { noDamage: true, expect: 'increases healing received by all party members by 20%', note: 'Só cura recebida: não muda o dano.' },
  'Viridescent Venerer': { reactionBonus: { swirl: { p: 0 } }, partial: true, expect: 'Increases Swirl reaction DMG dealt by 60%', note: '+60% de dano de Redemoinho (tabela de reações). A redução de 40% da RES do elemento espalhado (depende do elemento do Redemoinho, que a rotação ainda não tem) e o bônus Estelar NÃO entram.' },
  "Wanderer's Troupe": { buffs: [{ id: 'carregado', label: 'Carregado (Catalisador ou Arco)', stats: { byType: { charged: { p: 0 } } }, team: { onlyWeapons: ['Catalyst', 'Bow'] } }], expect: 'Increases Charged Attack DMG by 35%', note: 'Só vale para quem usa Catalisador ou Arco (o 4 peças é ignorado para os outros tipos de arma).' },
  'Thundering Fury': {
    reactionBonus: { overloaded: { p: 0 }, electrocharged: { p: 0 }, superconduct: { p: 0 }, hyperbloom: { p: 0 }, aggravate: { p: 2 } },
    partial: true,
    expect: 'Increases the DMG caused by Overloaded',
    note: '+40% de Sobrecarga, Eletrocarregado, Supercondutor e Hiperflorescer (tabela de reações) e +20% no bônus de Intensificar (nos golpes com Intensificar). A redução de recarga da habilidade só muda a rotação. O bônus de Lunar-Carregado e Estelar-Conduct NÃO entra (mecânica Lunar/Estelar ainda não modelada).',
  },
  'Bloodstained Chivalry': { buffs: [{ id: 'carregado', label: 'Carregado depois de derrotar', timed: true, stats: { byType: { charged: { p: 1 } } } }], expect: 'After defeating an opponent, increases Charged Attack DMG by 50%', note: '+50% de DMG do Carregado por 10 s depois de derrotar um inimigo: faixa na linha do tempo, ligue na janela.' },
  'Archaic Petra': { buffs: [{ id: 'geo', label: 'DMG do elemento do fragmento', scope: 'team', timed: true, stats: { dmgPct: { p: 0 } } }], partial: true, expect: 'all party members gain a 35% DMG Bonus for that particular element', note: '+35% de DMG elemental da equipe por 10 s depois de pegar um fragmento de Cristalizar: faixa na linha do tempo. Só um elemento por vez; ligue em quem tem o elemento do fragmento.' },
  'Emblem of Severed Fate': { buffs: [{ id: 'er-burst', label: 'DMG do Supremo por Recarga', convert: { from: 'er', perPoint: { p: 0 }, cap: { p: 1 }, to: ['burst'] } }], expect: 'Increases Elemental Burst DMG by 25% of Energy Recharge', note: 'DMG do Supremo = 25% da Recarga total, até 75%.' },
  'Husk of Opulent Dreams': { defPct: { p: 2, x: 4 }, dmgPct: { p: 3, x: 4 }, expect: 'Curiosity effect', note: 'Assume os 4 stacks de Curiosity (+24% de DEF e +24% de DMG Geo). O DMG Geo vale como DMG% geral: use em personagens Geo.' },
  'Ocean-Hued Clam': { partial: true, expect: 'Sea-Dyed Foam', note: 'O dano extra por cura (Sea-Dyed Foam) NÃO entra: o motor não acompanha cura.' },
  'Echoes of an Offering': { partial: true, expect: 'Valley Rite', note: 'O bônus do Normal por chance (36%, +70% do ATK) NÃO entra: depende de chance.' },
  'Gilded Dreams': {
    buffs: [
      { id: 'mesmo', label: 'ATK por aliado do mesmo elemento', timed: true, stats: { atkPct: { p: 0 } }, team: { scale: { of: 'same', table: [1, 2, 3] } } },
      { id: 'outro', label: 'Maestria por aliado de outro elemento', timed: true, stats: { em: { p: 1 } }, team: { scale: { of: 'different', table: [1, 2, 3] } } },
    ],
    expect: 'Elemental Type of the other party members',
    note: 'Faixas de 8 s depois de uma reação: ATK por aliado do mesmo elemento e Maestria por aliado de elemento diferente (até 3 cada). Ligue nas janelas.',
  },
  'Flower of Paradise Lost': {
    reactionBonus: { bloom: [{ p: 0 }, { p: 0, x: 1 }], hyperbloom: [{ p: 1 }, { p: 1, x: 1 }], burgeon: [{ p: 2 }, { p: 2, x: 1 }] },
    partial: true,
    expect: 'Bloom, Hyperbloom, and Burgeon reaction DMG are increased by 40%',
    note: 'Assume os 4 stacks: 40% × (1 + 4 × 25%) = +80% de Florescer, Hiperflorescer e Brotar (tabela de reações). O bônus de Lunar-Florescer NÃO entra (mecânica Lunar ainda não modelada).',
  },
  'Song of Days Past': { partial: true, expect: 'Yearning effect', note: 'O bônus de dano por cura acumulada (Yearning) NÃO entra: o motor não acompanha cura.' },
  'Finale of the Deep Galleries': { byType: { normal: { p: 0 }, burst: { p: 1 } }, expect: 'has 0 Elemental Energy, Normal Attack DMG is increased by 60%', note: 'Assume 0 de energia: +60% de DMG do Normal e do Supremo. No jogo o efeito de um deixa de valer por 6 s depois do outro.' },
  "Night of the Sky's Unveiling": { partial: true, expect: 'Lunar Reactions', note: LUNAR },
  "Silken Moon's Serenade": { partial: true, expect: 'Gleaming Moon', note: LUNAR },
  'Aubade of Morningstar and Moon': { partial: true, expect: 'Lunar Reaction DMG is increased by 20%', note: LUNAR },
  'Celestial Gift': { partial: true, expect: "Witch's Homework", note: 'Depende do Hexerei: Secret Rite, que o motor ainda não modela.' },
  'Disenchantment in Deep Shadow': { partial: true, expect: 'Increases Superconduct Reaction DMG by 80%', note: LUNAR },
  'Scarlet Proof': { buffs: [{ id: 'taxa', label: 'Taxa Crítica depois de Espalhar Estelar', timed: true, stats: { critRate: { p: 0 } } }], partial: true, expect: 'CRIT Rate by 16%', note: '+16% de Taxa Crítica por 10 s depois de um Estelar-Swirl: faixa na linha do tempo. O dano de reação Estelar NÃO entra.' },
  'Heart of the Furnace': { buffs: [{ id: 'atk', label: 'ATK depois de reação Estelar', timed: true, stats: { atkPct: { p: 0 } } }], partial: true, expect: 'Increases the equipping character\'s ATK by 12%', note: '+12% de ATK por 12 s depois de uma reação Estelar: faixa na linha do tempo. O bônus de dano Estelar NÃO entra.' },
};

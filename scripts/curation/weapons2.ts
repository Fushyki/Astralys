/**
 * Curadoria das armas que faltavam (lote 2). Mesma regra de `weapons.ts`: número = parâmetro do Lunaris (`p`),
 * literal da descrição (`lit`) ou regex sobre o texto de cada refinamento (`re`). `expect` trava se o Lunaris mudar.
 *
 * Convenções:
 *  - `noDamage`: a passiva só mexe em energia, cura, estamina ou recarga de habilidade.
 *  - `partial`: uma parte que mexe em dano (golpe extra de proc, reação, Lunar/Estelar/Moonsign/Hexerei) NÃO entra.
 *  - Stacks e condições são assumidos no máximo/sempre ativos, como nas armas do lote 1; a `note` diz o que foi assumido.
 */
import { ALWAYS, LIYUE, NATLAN, type BuffCur, type GearCur } from './gear';

const fav = (): GearCur => ({ noDamage: true, expect: 'CRIT Hits have a 60% chance to generate', note: 'Só gera partículas de energia: não muda o dano. A Recarga entra pela calculadora de Recarga.' });
const sac = (): GearCur => ({ noDamage: true, expect: 'chance to end its own CD', note: 'Só reinicia a recarga da habilidade (chance): não muda os stats. Pode render uma habilidade a mais na rotação, que você coloca na linha do tempo.' });
const symbolsEm = (): GearCur => ({
  em: { p: 4, x: 3 },
  expect: "Stoic's Symbol",
  note: `Assume 3 Símbolos consumidos (+Maestria por Símbolo) e o efeito Roused ativo. ${ALWAYS} A energia devolvida não entra.`,
});
const struggle = (): GearCur => ({
  atkPct: { p: 3, x: 3 },
  dmgPct: { p: 4, x: 3 },
  expect: "Unity's Symbol",
  note: `Assume 3 Símbolos consumidos (+ATK% e +DMG% elemental por Símbolo) e o efeito Struggle ativo. ${ALWAYS}`,
});
const lithic = (): GearCur => ({
  buffs: [{ id: 'liyue', label: 'Membros de Liyue', stats: { atkPct: { p: 0 }, critRate: { p: 1 } }, team: { scale: { of: { names: LIYUE }, table: [1, 2, 3, 4] } } }],
  expect: 'hails from Liyue',
  note: 'Conta os OUTROS membros de Liyue do time (até 4). A lista de personagens de Liyue está em scripts/curation/gear.ts.',
});
const evenstar = (): GearCur => ({
  buffs: [
    { id: 'em-atk', label: 'ATK por Maestria', convert: { from: 'em', perPoint: { p: 1 }, to: ['atkFlat'] } },
    { id: 'em-atk-time', label: 'ATK por Maestria (equipe)', scope: 'others', timed: true, convert: { from: 'em', perPoint: { p: 1, x: 0.3 }, to: ['atkFlat'] } },
  ],
  expect: 'as bonus ATK for 12s',
  note: 'ATK fixo = 24% (R1) da Maestria do dono, sempre ativo. Os 30% para a equipe valem só nas janelas de buff. Vários exemplares da arma não se somam aqui.',
});
const partyEnergyBurst = (): GearCur => ({
  buffs: [{ id: 'energia', label: 'DMG do Supremo por energia do time', convert: { from: 'partyEnergy', perPoint: { p: 0, x: 0.01 }, cap: { p: 1 }, to: ['burst'] } }],
  expect: "party's combined maximum Energy capacity",
  note: 'Soma a energia do Supremo dos 4 membros (Mavuika e Skirk, que não usam barra de energia, contam 0).',
});
const noPassive = (note: string): GearCur => ({ noDamage: true, note });

const TRAVELER = 'Sem passiva no Lunaris (arma de missão ou do Viajante): só ATK base e substat.';

export const WEAPONS_2: Record<string, GearCur> = {
  // ---- Espadas ----
  'Favonius Sword': fav(),
  'The Flute': { procs: [{ id: 'onda', label: "The Flute: onda", scale: { atk: { p: 1 } }, element: 'Physical' }], expect: 'Gaining 5 Harmonics', note: 'Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). Onda de 100% (R1) a 200% (R5) do ATK, Física, a cada 5 Harmonias (5 acertos de Normal/Carregado). O Genshin Optimizer usa 200% fixo; vale o Lunaris (confirmado pelo Davi).' },
  'Sacrificial Sword': sac(),
  'Prototype Rancour': { atkPct: { p: 0, x: 4 }, defPct: { p: 0, x: 4 }, expect: 'increase ATK and DEF by', note: 'Assume 4 stacks de ATK e DEF.' },
  'The Black Sword': { byType: { normal: { p: 0 }, charged: { p: 0 } }, expect: 'Increases DMG dealt by Normal and Charged Attacks by', note: 'Só o DMG de Normal e Carregado. A cura ao acertar crítico não entra.' },
  'The Alley Flash': { dmgPct: { p: 0 }, expect: 'Increases DMG dealt by the character equipping this weapon by', note: 'Assume que o personagem não levou dano (o bônus cai por 5 s ao levar).' },
  'Sword of Descension': noPassive(TRAVELER),
  'Festering Desire': { byType: { skill: { p: 0 } }, critRateByType: { skill: { p: 1 } }, expect: 'Elemental Skill DMG by', note: 'DMG e Taxa Crítica só da habilidade.' },
  'Amenoma Kageuchi': { noDamage: true, expect: 'Succession Seed', note: 'Só devolve energia depois do Supremo: não muda o dano.' },
  'Cinnabar Spindle': {
    flat: [{ name: 'DMG da habilidade por DEF', sourceStat: 'DEF', perPoint: { p: 0 }, cap: { p: 1 }, hitTypes: ['skill'] }],
    expect: 'Elemental Skill DMG is increased by',
    note: 'Soma 40% (R1) da DEF ao dano base de cada golpe de habilidade, limitado pelo teto do Lunaris. A condição "uma vez por 1,5 s" não limita aqui: vale em cada golpe.',
  },
  'Kagotsurube Isshin': noPassive(TRAVELER),
  "Xiphos' Moonlight": {
    buffs: [
      { id: 'er', label: 'Recarga por Maestria', convert: { from: 'em', perPoint: { p: 1, x: 0.01 }, to: ['er'] } },
      { id: 'er-time', label: 'Recarga por Maestria (equipe)', scope: 'others', timed: true, convert: { from: 'em', perPoint: { p: 1, x: 0.0003 }, to: ['er'] } },
    ],
    expect: 'Energy Recharge for each point of Elemental Mastery',
    note: 'Recarga = 0,036% (R1) por ponto de Maestria, sempre ativa; a equipe recebe 30% disso nas janelas de buff.',
  },
  'Prized Isshin Blade': noPassive(TRAVELER),
  'Toukabou Shigure': { dmgPct: { p: 1 }, expect: 'Cursed Parasol', note: 'Assume o inimigo marcado (Cursed Parasol) sempre.' },
  'Finale of the Deep': { atkPct: { p: 0 }, partial: true, expect: 'Bond of Life', note: `${ALWAYS} O ATK extra por Bond of Life limpo (até 150) NÃO entra.` },
  "The Dockhand's Assistant": symbolsEm(),
  'Sword of Narzissenkreuz': { procs: [{ id: 'rajada', label: "Narzissenkreuz: rajada", scale: { atk: { p: 0 } }, element: 'Physical' }], expect: 'Pneuma or Ousia', note: 'Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). Rajada de 160% (R1) do ATK, Física (Genshin Optimizer), a cada 12 s, só para quem não tem Arkhe.' },
  'Sturdy Bone': {
    flat: [{ name: 'DMG do Normal por ATK', sourceStat: 'ATK', perPoint: { p: 1 }, hitTypes: ['normal'], stacks: 18 }],
    expect: 'Sprint or Alternate Sprint Stamina Consumption decreased',
    note: 'Soma 16% (R1) do ATK ao dano base dos 18 primeiros golpes Normais (depois de correr). Assume a corrida feita antes.',
  },
  'Flute of Ezpitzal': { defPct: { p: 0 }, expect: 'increases DEF by', note: 'Só a DEF depois da habilidade (assumida ativa).' },
  'Calamity of Eshu': {
    byType: { normal: { p: 0 }, charged: { p: 0 } },
    critRateByType: { normal: { p: 1 }, charged: { p: 1 } },
    expect: 'protected by a Shield',
    note: 'Assume o personagem protegido por escudo o tempo todo.',
  },
  "Serenity's Call": { hpPct: { p: 0 }, partial: true, expect: 'increases Max HP by', note: 'Só os +16% (R1) de HP depois de reação. O extra do Moonsign: Ascendant Gleam NÃO entra.' },
  "Moonweaver's Dawn": {
    byType: { burst: { p: 0 } },
    buffs: [
      { id: 'e60', label: 'Supremo de até 60 de energia', stats: { byType: { burst: { p: 1 } } }, team: { maxBurstEnergy: 60 } },
      { id: 'e40', label: 'Supremo de até 40 de energia', stats: { byType: { burst: [{ p: 2 }, { p: 1, x: -1 }] } }, team: { maxBurstEnergy: 40 } },
    ],
    expect: "Energy Capacity does not exceed 60/40",
    note: 'DMG do Supremo base e o extra conforme o custo de energia do Supremo do dono (até 60: +16%; até 40: +28%, R1).',
  },
  "Heretic's Molten Blade": { atkPct: { p: 2 }, expect: 'Gleam of First Light', note: 'Usa o MÍNIMO do ATK (18% no R1); o valor real vai até o dobro conforme a distância percorrida.' },
  Emberwell: { atkPct: { p: 0 }, partial: true, expect: "ATK by 16% for 12s", note: 'Só o ATK depois de reação. O dano de reação Estelar NÃO entra (mecânica nova ainda não modelada).' },
  'New Bough': { atkPct: { p: 3, x: 3 }, em: { p: 5, x: 3 }, partial: true, expect: 'Verdant', note: 'Assume 3 stacks de ATK e Maestria. A versão "Radiance: Stellar Glimmer" NÃO entra.' },
  'Silver Light': { em: { p: 0, x: 2 }, expect: 'Elemental Mastery by', note: 'Assume 2 stacks.' },
  'Splendor of Tranquil Waters': {
    byType: { skill: { p: 0, x: 3 } },
    hpPct: { p: 3, x: 2 },
    expect: 'current HP increases or decreases',
    note: `3 stacks de DMG da habilidade e 2 de HP (quando o HP de aliados muda). ${ALWAYS}`,
  },
  'Peak Patrol Song': {
    defPct: { p: 0, x: 2 },
    dmgPct: { p: 2, x: 2 },
    buffs: [
      { id: 'def-time', label: 'DMG elemental por DEF (equipe)', scope: 'team', timed: true, convert: { from: 'def', perPoint: { p: 5, x: 0.001 }, cap: { p: 5, x: 3.2 }, to: ['dmgPct'] } },
    ],
    expect: 'Ode to Flowers',
    note: 'Assume os 2 stacks (DEF e DMG elemental). O DMG elemental da equipe (8% por 1.000 de DEF, até 25,6%) vale nas janelas de buff.',
  },
  Azurelight: { atkPct: [{ p: 0 }, { p: 2 }], critDmg: { p: 3 }, expect: 'when the equipping character has 0 Energy', note: 'Assume a janela depois da habilidade COM 0 de energia (logo após o Supremo): ATK duplicado e Dano Crítico.' },
  'Athame Artis': {
    critDmgByType: { burst: { p: 0 } },
    atkPct: { p: 2 },
    buffs: [{ id: 'time', label: 'ATK dos aliados', scope: 'others', timed: true, stats: { atkPct: { p: 3 } } }],
    partial: true,
    expect: 'Blade of the Daylight Hours',
    note: 'Dano Crítico do Supremo e ATK do dono (assumido ativo); o ATK dos aliados (3 s) vale nas janelas de buff. O bônus de Hexerei NÃO entra.',
  },
  'Lightbearing Moonshard': { defPct: { lit: 0.2 }, partial: true, expect: 'Lunar-Crystallize', note: 'Só a DEF. O dano de Lunar-Cristalizar (+64% no R1) NÃO entra (mecânica Lunar ainda não modelada).' },
  'Whitelake Frostfeather': { atkPct: { p: 1, x: 3 }, partial: true, expect: 'Lake-Hued Lament', note: 'Só o ATK (3 stacks). O dano crítico e a energia da reação Estelar NÃO entram.' },
  'Exaiphanes Blade': { atkPct: { p: 0 }, expect: 'Traveler equips', note: 'Só o ATK (assumido ativo). A energia devolvida não entra.' },
  'Beyond the Chrysalis': { critDmg: { p: 0 }, partial: true, expect: 'Winds of Devotion', note: 'Só o Dano Crítico da fase Devotion (assumida ativa). O dano Estelar-Swirl e a energia NÃO entram.' },

  // ---- Montantes ----
  'Favonius Greatsword': fav(),
  'The Bell': { dmgPct: { p: 2 }, expect: 'While protected by a shield', note: 'Assume o escudo ativo o tempo todo. A força do escudo não entra.' },
  'Sacrificial Greatsword': sac(),
  Rainslasher: { dmgPct: { p: 0 }, expect: 'affected by Hydro or Electro', note: 'Assume o inimigo sob Hydro ou Electro.' },
  'Prototype Archaic': { procs: [{ id: 'golpe', label: "Prototype Archaic: golpe", scale: { atk: { p: 1 } }, element: 'Physical' }], expect: 'additional 240% ATK DMG', note: 'Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). 240% (R1) do ATK, Físico, com 50% de chance a cada 15 s.' },
  Whiteblind: { atkPct: { p: 0, x: 4 }, defPct: { p: 0, x: 4 }, expect: 'increase ATK and DEF by', note: 'Assume 4 stacks de ATK e DEF.' },
  'Lithic Blade': lithic(),
  'Snow-Tombed Starsilver': { procs: [{ id: 'icicle', label: "Icicle", scale: { atk: { p: 1 } }, element: 'Physical' }, { id: 'icicle-cryo', label: "Icicle (inimigo sob Cryo)", scale: { atk: { p: 2 } }, element: 'Physical' }], expect: 'Everfrost Icicle', note: 'Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). Icicle Físico: 80% (R1) do ATK, ou 200% contra inimigo sob Cryo; 60% de chance a cada 10 s.' },
  'Luxurious Sea-Lord': { byType: { burst: { p: 0 } }, procs: [{ id: 'atum', label: "Sea-Lord: atum", scale: { atk: { p: 2 } }, element: 'Physical' }], expect: 'huge onrush of tuna', note: 'DMG do Supremo. Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). Atum de 100% (R1) do ATK, Físico, a cada 15 s.' },
  'Katsuragikiri Nagamasa': { byType: { skill: { p: 0 } }, expect: 'Increases Elemental Skill DMG by', note: 'Só o DMG da habilidade. A energia devolvida não entra.' },
  'Makhaira Aquamarine': evenstar(),
  'Forest Regalia': { em: { p: 0 }, expect: 'Leaf of Consciousness', note: 'Assume a Folha coletada e a Maestria ativa.' },
  'Talking Stick': { atkPct: { p: 4 }, dmgPct: { p: 5 }, expect: 'affected by Pyro', note: 'Assume o personagem afetado por Pyro (ATK) E por Hydro, Cryo, Electro ou Dendro (DMG), os dois ativos. No jogo isso exige reações dos dois tipos.' },
  "\"Ultimate Overlord's Mega Magic Sword\"": { atkPct: [{ p: 0 }, { p: 2 }], expect: 'ATK increased by', note: 'Assume todas as Melusines ajudadas: bônus máximo (12% + 12% no R1).' },
  'Portable Power Saw': symbolsEm(),
  'Fruitful Hook': {
    critRateByType: { plunge: { p: 0 } },
    byType: { normal: { p: 1 }, charged: { p: 1 }, plunge: { p: 1 } },
    expect: 'Plunging Attack CRIT Rate',
    note: 'Taxa Crítica do Imersivo e DMG de Normal, Carregado e Imersivo (assumido depois de um Imersivo).',
  },
  'Earth Shaker': { byType: { skill: { p: 0 } }, expect: 'Pyro-related reaction', note: 'Assume reação relacionada a Pyro causada por um aliado.' },
  'Flame-Forged Insight': { em: { p: 1 }, expect: 'restore 12 Elemental Energy', note: 'Assume a reação (Eletrocarregado, Florescer, Cristalizar...) feita e a Maestria ativa. A energia não entra.' },
  'Master Key': { em: { p: 0 }, partial: true, expect: 'Moonsign: Ascendant Gleam', note: 'Só os +60 (R1) de Maestria depois de reação. O extra do Moonsign NÃO entra.' },
  'Forged by the Golden Melody': { atkPct: { p: 0 }, partial: true, expect: 'Harmonic Movement', note: 'Só o +ATK (a primeira fase do ciclo de 10 s). Maestria e dano Estelar NÃO entram.' },
  'Blade of Atonement': { em: { p: 0 }, partial: true, expect: 'Stellar Glimmer', note: 'Só a Maestria depois de reação. O ATK da reação Estelar NÃO entra.' },
  Verdict: {
    atkPct: { re: 'Increases ATK by (\\d+(?:\\.\\d+)?)%' },
    byType: { skill: { p: 0, x: 2 } },
    expect: 'Elemental Shards from Crystallize',
    note: 'ATK e 2 Selos (+DMG da habilidade). Assume Cristalizar ou Lunar-Cristalizar para os 2 Selos.',
  },

  // ---- Lanças ----
  'Prototype Starglitter': { byType: { normal: { p: 0, x: 2 }, charged: { p: 0, x: 2 } }, expect: 'Normal and Charged Attack DMG by', note: 'Assume 2 stacks depois da habilidade.' },
  'Crescent Pike': {
    flat: [{ name: 'Dano extra de Normal e Carregado por ATK', sourceStat: 'ATK', perPoint: { p: 0 }, hitTypes: ['normal', 'charged'] }],
    expect: 'additional DMG equal to 20% of ATK',
    note: 'Soma 20% (R1) do ATK ao dano base de Normal e Carregado, assumindo uma partícula coletada nos últimos 5 s.',
  },
  Deathmatch: { atkPct: { p: 1 }, expect: 'at least 2 opponents nearby', note: 'Assume 1 inimigo (ATK +24% no R1). Com 2 ou mais inimigos o ATK é menor e a DEF sobe.' },
  'Lithic Spear': lithic(),
  'Favonius Lance': fav(),
  'Dragonspine Spear': { procs: [{ id: 'icicle', label: "Icicle", scale: { atk: { p: 1 } }, element: 'Physical' }, { id: 'icicle-cryo', label: "Icicle (inimigo sob Cryo)", scale: { atk: { p: 2 } }, element: 'Physical' }], expect: 'Everfrost Icicle', note: 'Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). Icicle Físico: 80% (R1) do ATK, ou 200% contra inimigo sob Cryo; 60% de chance a cada 10 s.' },
  '"The Catch"': { byType: { burst: { p: 0 } }, critRateByType: { burst: { p: 1 } }, expect: 'Elemental Burst DMG by', note: 'DMG e Taxa Crítica só do Supremo.' },
  "Wavebreaker's Fin": partyEnergyBurst(),
  'Missive Windspear': { atkPct: { p: 0 }, em: { p: 1 }, expect: 'after an Elemental Reaction', note: 'Assume reação feita e os bônus ativos.' },
  'Ballad of the Fjords': {
    buffs: [{ id: '3el', label: '3 elementos diferentes', stats: { em: { p: 0 } }, team: { minDistinct: 3 } }],
    expect: '3 different Elemental Types',
    note: 'Só vale com 3 ou mais elementos diferentes no time.',
  },
  'Rightful Reward': { noDamage: true, expect: 'When the wielder is healed, restore', note: 'Só devolve energia quando curado: não muda o dano.' },
  'Dialogues of the Desert Sages': { noDamage: true, expect: 'When the wielder performs healing, restore', note: 'Só devolve energia ao curar: não muda o dano.' },
  "Prospector's Drill": struggle(),
  'Mountain-Bracing Bolt': { byType: { skill: [{ p: 1 }, { p: 2 }] }, expect: 'increases Elemental Skill DMG by', note: 'DMG da habilidade base e o extra depois da habilidade de um aliado (assumido ativo).' },
  "Prospector's Shovel": { reactionBonus: { electrocharged: { p: 0 } }, partial: true, expect: 'Electro-Charged DMG is increased', note: '+48% (R1) de dano de Eletrocarregado (tabela de reações). O bônus de Lunar-Carregado NÃO entra (mecânica Lunar ainda não modelada).' },
  "Sacrificer's Staff": { atkPct: { p: 1, x: 3 }, er: { p: 2, x: 3 }, expect: 'ATK is increased by', note: 'Assume 3 stacks de ATK e Recarga.' },
  Frostbreath: { atkPct: { p: 0 }, expect: 'Cryo or Hydro-related elemental reaction', note: 'Assume reação Cryo ou Hydro e o ATK ativo. A energia dos aliados não entra.' },
  'Song of the Vigil': { noDamage: true, partial: true, expect: 'regenerates 4 Elemental Energy', note: 'Só energia e ATK de reação Estelar (mecânica nova ainda não modelada).' },
  'Staff of the Scarlet Sands': {
    buffs: [{ id: 'em-atk', label: 'ATK por Maestria', convert: { from: 'em', perPoint: [{ p: 0 }, { p: 1, x: 3 }], to: ['atkFlat'] } }],
    expect: 'of their Elemental Mastery as bonus ATK',
    note: 'ATK fixo = 52% da Maestria (R1) + 3 stacks de 28% (depois da habilidade), sempre ativo.',
  },
  'Bloodsoaked Ruins': { partial: true, expect: 'Lunar-Charged DMG', note: 'O dano Lunar-Carregado e o Dano Crítico da reação NÃO entram (mecânica Lunar ainda não modelada).' },
  'Disaster and Remorse': {
    byType: { normal: { p: 2 }, charged: { p: 2 }, skill: { p: 3 }, burst: { p: 3 } },
    partial: true,
    expect: 'Path of Conflict',
    note: 'Assume Unforgivable (Normal e Carregado) e Irreparable (habilidade e Supremo) ativos juntos. O bônus de Hexerei NÃO entra.',
  },

  // ---- Catalisadores ----
  'Favonius Codex': fav(),
  'The Widsith': {
    buffs: [
      { id: 'recitativo', label: 'Recitativo', timed: true, stats: { atkPct: { p: 0 } } },
      { id: 'aria', label: 'Ária', timed: true, stats: { dmgPct: { p: 1 } } },
      { id: 'interludio', label: 'Interlúdio', timed: true, stats: { em: { p: 2 } } },
    ],
    expect: 'random theme song',
    note: 'A música é sorteada: cada uma vira uma faixa na linha do tempo (ATK, DMG elemental ou Maestria) para você escolher qual vale em cada janela.',
  },
  'Sacrificial Fragments': sac(),
  'Solar Pearl': { byType: { normal: { p: 0 }, skill: { p: 0 }, burst: { p: 0 } }, expect: 'Normal Attack hits increase Elemental Skill and Elemental Burst DMG', note: 'Assume Normal, habilidade e Supremo se alimentando (todos com o bônus).' },
  'Prototype Amber': { noDamage: true, expect: 'regenerates 4 Energy every 2s', note: 'Só energia e cura: não muda o dano.' },
  'Eye of Perception': { procs: [{ id: 'raio', label: "Eye of Perception: raio", scale: { atk: { p: 2 } }, element: 'Physical' }], expect: 'Bolt of Perception', note: 'Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). Raio de 240% (R1) do ATK, Físico (Genshin Optimizer), 50% de chance a cada 12 s; quica até 4 vezes entre inimigos.' },
  'Wine and Song': { atkPct: { p: 0 }, expect: 'increases ATK by', note: 'Assume correr antes (ATK ativo). A estamina não entra.' },
  Frostbearer: { procs: [{ id: 'icicle', label: "Icicle", scale: { atk: { p: 1 } }, element: 'Physical' }, { id: 'icicle-cryo', label: "Icicle (inimigo sob Cryo)", scale: { atk: { p: 2 } }, element: 'Physical' }], expect: 'Everfrost Icicle', note: 'Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). Icicle Físico: 80% (R1) do ATK, ou 200% contra inimigo sob Cryo; 60% de chance a cada 10 s.' },
  'Hakushin Ring': {
    buffs: [
      { id: 'elemental', label: 'DMG elemental depois de reação Electro', scope: 'team', timed: true, forElements: ['Electro'], stats: { dmgPct: { p: 0 } } },
      { id: 'pyro', label: 'DMG Pyro (Sobrecarga)', scope: 'team', timed: true, forElements: ['Pyro'], stats: { dmgPct: { p: 0 } } },
      { id: 'hydro', label: 'DMG Hydro (Eletrocarregado)', scope: 'team', timed: true, forElements: ['Hydro'], stats: { dmgPct: { p: 0 } } },
      { id: 'cryo', label: 'DMG Cryo (Supercondutor)', scope: 'team', timed: true, forElements: ['Cryo'], stats: { dmgPct: { p: 0 } } },
      { id: 'dendro', label: 'DMG Dendro (Catalisar)', scope: 'team', timed: true, forElements: ['Dendro'], stats: { dmgPct: { p: 0 } } },
      { id: 'anemo', label: 'DMG Anemo (Redemoinho Electro)', scope: 'team', timed: true, forElements: ['Anemo'], stats: { dmgPct: { p: 0 } } },
      { id: 'geo', label: 'DMG Geo (Cristalizar Electro)', scope: 'team', timed: true, forElements: ['Geo'], stats: { dmgPct: { p: 0 } } },
    ],
    expect: 'triggers an Electro elemental reaction',
    note: 'Faixas de 6 s de DMG elemental: uma para os membros Electro e uma para o outro elemento de cada reação Electro (Pyro, Hydro, Cryo, Dendro, Anemo, Geo). Ligue nas janelas a faixa da reação que acontece (os bônus não se somam no jogo).',
  },
  'Wandering Evenstar': evenstar(),
  'Fruit of Fulfillment': { em: { p: 1, x: 5 }, atkPct: { p: 0, x: 5 }, expect: 'Wax and Wane', note: 'Assume 5 stacks (+Maestria e −5% de ATK por stack, ATK negativo).' },
  'Sacrificial Jade': { hpPct: { p: 2 }, em: { p: 3 }, expect: 'not on the field for more than 5s', note: 'Assume o personagem fora de campo por mais de 5 s e o bônus ativo.' },
  'Flowing Purity': { dmgPct: [{ p: 0 }, { p: 4 }], expect: 'Bond of Life', note: 'DMG elemental base e o máximo do Bond of Life limpo (assumido).' },
  'Ballad of the Boundless Blue': { byType: { normal: { p: 2, x: 3 }, charged: { p: 3, x: 3 } }, expect: 'Normal Attack DMG will be increased', note: 'Assume 3 stacks.' },
  'Ash-Graven Drinking Horn': { procs: [{ id: 'golpe', label: "Ash-Graven: golpe", scale: { hp: { p: 0 } }, element: 'Physical' }], expect: 'AoE DMG equal to 40% of Max HP', note: 'Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). 40% (R1) do HP máximo, Físico (Genshin Optimizer), a cada 15 s.' },
  'Waveriding Whirl': {
    hpPct: { p: 1 },
    buffs: [{ id: 'hydro', label: 'Membros Hydro', stats: { hpPct: { p: 4 } }, team: { scale: { of: ['Hydro'], table: [1, 2] } } }],
    expect: 'Hydro Elemental Type character',
    note: 'HP depois da habilidade e +HP por membro Hydro do time (até 2, contando o dono).',
  },
  'Ring of Yaxche': {
    buffs: [{ id: 'hp-normal', label: 'DMG do Normal por HP', convert: { from: 'hp', perPoint: { p: 0, x: 0.001 }, cap: { p: 1 }, to: ['normal'] } }],
    expect: 'Jade-Forged Crown',
    note: 'DMG do Normal = 0,6% (R1) por 1.000 de HP máximo, até o teto do Lunaris. Assume a habilidade usada antes.',
  },
  'Etherlight Spindlelute': { em: { p: 0 }, expect: 'Elemental Mastery is increased by', note: 'Assume a habilidade usada nos últimos 20 s.' },
  'Blackmarrow Lantern': { reactionBonus: { bloom: { p: 0 } }, partial: true, expect: 'Bloom DMG is increased', note: '+48% (R1) de dano de Florescer (tabela de reações). O bônus de Lunar-Florescer NÃO entra (mecânica Lunar ainda não modelada).' },
  'Dawning Frost': { em: [{ p: 0 }, { p: 2 }], expect: 'For 10s after a Charged Attack hits', note: 'Assume Carregado e habilidade acertados (as duas Maestrias ativas).' },
  'Clash of Kings': { atkPct: { p: 0 }, em: { p: 1 }, expect: 'Laws of the Board', note: 'ATK e Maestria depois da habilidade (assumidos ativos).' },
  'Echoes of the Heart': { em: { p: 0 }, partial: true, expect: 'Stellar Glimmer', note: 'Só a Maestria depois de reação. O dano Estelar NÃO entra.' },
  "Winter's Heavy Heart": {
    buffs: [
      { id: 'cryo', label: 'Maestria por membro Cryo', stats: { em: { p: 0 } }, team: { scale: { of: ['Cryo'], table: [1, 2, 3, 4] } } },
      { id: 'electro', label: 'ATK por membro Electro', stats: { atkPct: { p: 1 } }, team: { scale: { of: ['Electro'], table: [1, 2, 3, 4] } } },
    ],
    expect: 'Silver-Tinged Blood Pact',
    note: 'Conta os membros Cryo (Maestria) e Electro (ATK) do time, contando o dono. A versão "Radiance: Stellar Glimmer" NÃO entra.',
  },
  'Everlasting Moonglow': {
    flat: [{ name: 'DMG do Normal por HP', sourceStat: 'HP', perPoint: { p: 1 }, hitTypes: ['normal'] }],
    expect: 'Normal Attack DMG is increased by 1% of the Max HP',
    note: 'Soma 1% (R1) do HP máximo ao dano base do Normal. A cura e a energia não entram.',
  },
  'A Thousand Floating Dreams': {
    buffs: [
      { id: 'mesmo', label: 'Maestria por aliado do mesmo elemento', stats: { em: { p: 0 } }, team: { scale: { of: 'same', table: [1, 2, 3] } } },
      { id: 'outro', label: 'DMG elemental por aliado de outro elemento', stats: { dmgPct: { p: 1 } }, team: { scale: { of: 'different', table: [1, 2, 3] } } },
      { id: 'aura', label: 'Maestria dos aliados', scope: 'others', timed: true, stats: { em: { p: 2 } } },
    ],
    expect: 'Party members other than the equipping character will provide',
    note: 'Até 3 stacks de cada tipo (mesmo elemento: Maestria; elemento diferente: DMG elemental). A Maestria dos aliados vale nas janelas de buff.',
  },
  'Cashflow Supervision': {
    atkPct: { re: 'ATK is increased by (\\d+(?:\\.\\d+)?)%' },
    byType: { normal: { p: 2, x: 3 }, charged: { p: 3, x: 3 } },
    partial: true,
    expect: 'When current HP increases or decreases',
    note: 'ATK e 3 stacks de Normal e Carregado (HP mudando, assumido). O dano Estelar-Conduct NÃO entra.',
  },
  'Tome of the Eternal Flow': {
    hpPct: { re: 'HP is increased by (\\d+(?:\\.\\d+)?)%' },
    byType: { charged: { p: 2, x: 3 } },
    expect: 'When current HP increases or decreases',
    note: 'HP e 3 stacks de DMG do Carregado (HP mudando, assumido). A energia não entra.',
  },
  "Crane's Echoing Call": {
    buffs: [{ id: 'imersivo', label: 'DMG do Imersivo da equipe', scope: 'team', timed: true, stats: { byType: { plunge: { p: 2 } } } }],
    expect: "Plunging Attacks will deal",
    note: 'Faixa de DMG do Imersivo para a equipe (depois de um Imersivo do dono). A energia devolvida não entra.',
  },
  'Sunny Morning Sleep-In': { em: [{ p: 0 }, { p: 1 }, { p: 2 }], expect: 'Elemental Mastery increases by', note: 'Assume Swirl, habilidade e Supremo acertados: as três Maestrias ativas.' },
  'Vivid Notions': {
    atkPct: { p: 0 },
    critDmgByType: { plunge: [{ p: 2 }, { p: 3 }] },
    expect: "Dawn's First Hue",
    note: 'ATK e Dano Crítico do Imersivo (os dois efeitos, Dawn e Twilight, assumidos juntos).',
  },
  "Nightweaver's Looking Glass": {
    em: [{ p: 0 }, { p: 2 }],
    buffs: [{ id: 'florescer', label: 'Florescer da equipe', scope: 'team', timed: true, stats: { reactionBonus: { bloom: { p: 4 }, hyperbloom: { p: 5 }, burgeon: { p: 5 } } } }],
    partial: true,
    expect: 'Prayer of the Far North',
    note: 'A Maestria dos dois efeitos (assumidos ativos) e, com os dois, +120% de Florescer e +80% de Hiperflorescer e Brotar para a equipe (faixa na linha do tempo; vale na tabela de reações). O bônus de Lunar-Florescer NÃO entra (mecânica Lunar ainda não modelada).',
  },
  "Nocturne's Curtain Call": {
    hpPct: [{ re: 'Max HP increases by (\\d+(?:\\.\\d+)?)%' }, { p: 0 }],
    partial: true,
    expect: 'Bountiful Sea',
    note: 'HP base e o extra depois de reação Lunar (assumido ativo). O Dano Crítico das reações Lunares NÃO entra.',
  },
  'Hymn of the Maelstrom': {
    hpPct: { p: 0, x: 3 },
    buffs: [{ id: 'hp-atk', label: 'ATK por HP (equipe)', scope: 'team', convert: { from: 'hp', perPoint: { p: 2, x: 0.001 }, threshold: { p: 1 }, cap: { p: 3 }, to: ['atkPct'] } }],
    partial: true,
    expect: 'Vatsamonga',
    note: 'HP (3 stacks) e +ATK por HP acima de 40.000 para o membro ativo. O aumento de 75% depois de Congelado ou Swirl Estelar NÃO entra.',
  },
  'Starsealed Edict': {
    critDmg: { re: 'Increases CRIT DMG by (\\d+(?:\\.\\d+)?)%' },
    em: [{ p: 0 }, { p: 1, x: 3 }],
    partial: true,
    expect: 'Crystal Compounding',
    note: 'Dano Crítico, Maestria e 3 stacks de Law of Combustion. O Dano Crítico Estelar-Conduct NÃO entra.',
  },

  // ---- Arcos ----
  'Favonius Warbow': fav(),
  'Sacrificial Bow': sac(),
  'Prototype Crescent': { atkPct: { p: 1 }, expect: 'weak points', note: 'Assume o ponto fraco acertado (ATK ativo).' },
  'Compound Bow': { atkPct: { p: 0, x: 4 }, expect: 'increase ATK by', note: 'Assume 4 stacks de ATK. A velocidade de ataque não entra.' },
  'The Viridescent Hunt': { procs: [{ id: 'ciclone', label: "Viridescent Hunt: ciclone (1 acerto)", scale: { atk: { p: 1 } }, element: 'Physical' }], expect: 'generate a Cyclone', note: 'Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). Cada acerto do ciclone vale 40% (R1) do ATK, Físico; são 8 acertos em 4 s (use 8 execuções), 50% de chance a cada 14 s.' },
  'Alley Hunter': { dmgPct: { p: 0, x: 10 }, expect: 'in the party but not on the field', note: 'Assume o DMG máximo (20% no R1, personagem fora de campo). Cai depois de 4 s em campo.' },
  'Fading Twilight': { dmgPct: [{ p: 1, x: 0.333333 }, { p: 2, x: 0.333333 }, { p: 3, x: 0.333333 }], expect: 'Evengleam', note: 'Usa a MÉDIA dos três estados (6/10/14% no R1), que se alternam a cada 7 s.' },
  'Mitternachts Waltz': { byType: { normal: { p: 0 }, skill: { p: 2 } }, expect: 'Normal Attack hits on opponents increase Elemental Skill DMG', note: 'Assume Normal e habilidade se alimentando (os dois bônus ativos).' },
  Predator: noPassive('Sem passiva no Lunaris (o bônus é só para a Aloy): só ATK base e substat.'),
  "Mouun's Moon": partyEnergyBurst(),
  "King's Squire": { em: { p: 0 }, procs: [{ id: 'final', label: "King's Squire: golpe final", scale: { atk: { p: 2 } } }], expect: 'Teachings of the Forest', note: 'Maestria (assumida ativa). Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). Golpe final de 100% (R1) do ATK, do elemento do personagem, quando o efeito acaba.' },
  'End of the Line': { procs: [{ id: 'flowrider', label: "End of the Line: Flowrider", scale: { atk: { p: 0 } } }], expect: 'Flowrider', note: 'Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). 80% (R1) do ATK, do elemento do personagem, até 3 vezes depois da habilidade.' },
  'Scion of the Blazing Sun': { byType: { charged: { p: 3 } }, procs: [{ id: 'flecha', label: "Scion: Sunfire Arrow", scale: { atk: { p: 1 } } }], expect: 'Heartsearer', note: '+28% (R1) de DMG do Carregado (inimigo marcado). Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). Flecha de 60% (R1) do ATK, do elemento do personagem, a cada 10 s.' },
  'Song of Stillness': { dmgPct: { p: 0 }, expect: 'After the wielder is healed', note: 'Assume o personagem curado e o bônus ativo.' },
  Cloudforged: { em: { p: 0, x: 2 }, expect: 'Elemental Energy is decreased', note: 'Assume 2 stacks (depois de gastar energia).' },
  'Range Gauge': struggle(),
  'Flower-Wreathed Feathers': { byType: { charged: { p: 2, x: 6 } }, expect: 'Aimed Shots', note: 'Assume 6 stacks de DMG do Carregado (mira longa).' },
  'Chain Breaker': {
    buffs: [
      { id: 'atk', label: 'ATK por aliado de Natlan ou de outro elemento', stats: { atkPct: { p: 0 } }, team: { scale: { of: { names: NATLAN, orDifferent: true }, table: [1, 2, 3] } } },
      { id: 'em', label: 'Maestria com 3 aliados', stats: { em: { p: 1 } }, team: { scale: { of: { names: NATLAN, orDifferent: true }, table: [0, 0, 1] } } },
    ],
    expect: 'from Natlan or who has a different Elemental Type',
    note: 'Conta os OUTROS membros de Natlan ou de elemento diferente (até 3). A lista de Natlan está em scripts/curation/gear.ts.',
  },
  'Sequence of Solitude': { procs: [{ id: 'golpe', label: "Sequence of Solitude: golpe", scale: { hp: { p: 0 } } }], expect: 'AoE DMG equal to 40% of Max HP', note: 'Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). 40% (R1) do HP máximo, do elemento do personagem (Genshin Optimizer), a cada 15 s.' },
  'Snare Hook': { em: { p: 0 }, partial: true, expect: 'Moonsign: Ascendant Gleam', note: 'Só os +60 (R1) de Maestria depois de reação. O extra do Moonsign NÃO entra.' },
  "Rainbow Serpent's Rain Bow": { atkPct: { p: 1 }, expect: 'off-field', note: 'Assume o ATK ativo (depois de acertar fora de campo).' },
  'Jade Vista': {
    buffs: [
      { id: 'mesmo', label: 'Maestria por aliado do mesmo elemento', stats: { em: { p: 1 } }, team: { scale: { of: 'same', table: [1, 2, 3] } } },
      { id: 'outro', label: 'ATK por aliado de outro elemento', stats: { atkPct: { p: 0 } }, team: { scale: { of: 'different', table: [1, 2, 3] } } },
    ],
    expect: 'party member other than the equipping character',
    note: 'Conta os 3 OUTROS membros: mesmo elemento dá Maestria e elemento diferente dá ATK.',
  },
  'Covenant of Frost and Snow': { em: { p: 0 }, expect: 'Elemental Mastery is increased by', note: 'Assume a habilidade usada nos últimos 12 s.' },
  'Breezeborne Refrain': { er: { p: 0 }, partial: true, expect: 'Hymn of the Pure', note: 'Só a Recarga. O DMG Estelar da equipe NÃO entra.' },
  'Silvershower Heartstrings': {
    hpPct: { p: 2 },
    critRateByType: { burst: { p: 6 } },
    expect: 'Remedy',
    note: 'Assume os 3 stacks (HP máximo) e a Taxa Crítica do Supremo ativa.',
  },
  "Astral Vulture's Crimson Plumage": {
    atkPct: { p: 0 },
    buffs: [
      { id: 'carregado', label: 'DMG do Carregado por aliado de outro elemento', stats: { byType: { charged: { p: 2 } } }, team: { scale: { of: 'different', table: [1, 2.4, 2.4] } } },
      { id: 'supremo', label: 'DMG do Supremo por aliado de outro elemento', stats: { byType: { burst: { p: 4 } } }, team: { scale: { of: 'different', table: [1, 2.4, 2.4] } } },
    ],
    expect: 'Swirl or Stellar Swirl',
    note: 'ATK depois de Swirl (assumido). Com 1 aliado de outro elemento vale o primeiro valor; com 2 ou mais, 2,4 vezes (48% e 24% no R1).',
  },
  'The Daybreak Chronicles': {
    byType: { normal: { p: 1 }, skill: { p: 1 }, burst: { p: 1 } },
    partial: true,
    expect: 'Stirring Dawn Breeze',
    note: 'Assume o DMG máximo (60% no R1) em Normal, habilidade e Supremo, sempre. No jogo ele cai 10% por segundo em combate e sobe 10% por acerto. O bônus de Hexerei NÃO entra.',
  },
};

export type { BuffCur };

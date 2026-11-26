/**
 * Revisão das passivas ativáveis de todas as armas (#58): as partes que ficavam fora do cálculo, os seletores de stacks
 * que faltavam e as armas de 3 estrelas. Fórmulas conferidas na ficha do Genshin Optimizer.
 * Convenção: condição comum de combate entra sempre ativa (com caixa no bloco da arma); condição rara, "dobro" e bônus
 * para a equipe viram faixa (`timed`), que só vale nas janelas ligadas.
 */
import type { BuffCur, GearCur } from './gear';

/** "Com escudo o ATK dobra": segue os stacks escolhidos. */
const shielded = (): GearCur => ({
  atkPct: { p: 1, x: 5 },
  buffs: [{ id: 'escudo', label: 'Dobro com escudo', timed: true, stacks: { max: 5, of: 'stacks' }, stats: { atkPct: { p: 1, x: 5 } } }],
  expect: 'Scoring hits on opponents increases ATK by',
  note: 'Stacks de ATK (5 por padrão); o dobro com escudo é uma faixa.',
});
const against = (expect: string, note: string): GearCur => ({ dmgPct: { p: 0 }, expect, note });
const heal = (expect: string): GearCur => ({ noDamage: true, expect, note: 'Só cura: não muda o dano.' });
const physical = (id: string, label: string, p: number): GearCur['procs'] => [{ id, label, scale: { atk: { p } }, element: 'Physical' }];
const flatEm = (name: string, p: number, hitTypes: ('normal' | 'charged' | 'skill')[], stacks: number) => [{ name, sourceStat: 'EM' as const, perPoint: { p }, hitTypes, stacks }];
const hpToAtk = (id: string, label: string, p: number, more: Partial<BuffCur> = {}): BuffCur => ({ id, label, convert: { from: 'hp', perPoint: { p }, to: ['atkFlat'] }, ...more });

export const WEAPONS_3: Record<string, GearCur> = {
  // ---- 3 estrelas ----
  'Cool Steel': against('Hydro or Cryo', 'Assume o inimigo sob Hydro ou Cryo.'),
  'Bloodtainted Greatsword': against('Pyro or Electro', 'Assume o inimigo sob Pyro ou Electro.'),
  'Magic Guide': against('Hydro or Electro', 'Assume o inimigo sob Hydro ou Electro.'),
  'Raven Bow': against('Hydro or Pyro', 'Assume o inimigo sob Hydro ou Pyro.'),
  'Harbinger of Dawn': { critRate: { p: 0 }, expect: 'HP is above 90%', note: 'Assume HP acima de 90%.' },
  'Dark Iron Sword': { atkPct: { p: 0 }, expect: 'ATK is increased by', note: 'Assume a reação Electro feita (12 s).' },
  'Skyrider Sword': { atkPct: { p: 0 }, expect: 'increase in ATK', note: 'Assume o Supremo usado (15 s). A velocidade não entra.' },
  'Emerald Orb': { atkPct: { p: 0 }, expect: 'ATK is increased by', note: 'Assume a reação Hydro feita (12 s).' },
  'Twin Nephrite': { atkPct: { p: 0 }, expect: 'ATK by', note: 'Assume um inimigo derrotado (15 s). A velocidade não entra.' },
  'Skyrider Greatsword': { atkPct: { p: 0, x: 4 }, expect: 'increase ATK by', note: 'Stacks de ATK (4 por padrão).' },
  'White Tassel': { byType: { normal: { p: 0 } }, expect: 'Normal Attack DMG by', note: 'Valor fixo.' },
  'Ferrous Shadow': { buffs: [{ id: 'hp-baixo', label: 'HP abaixo de 70% (Carregado)', timed: true, stats: { byType: { charged: { p: 1 } } } }], expect: 'HP falls below', note: 'Só com HP abaixo de 70%: faixa.' },
  'Black Tassel': { buffs: [{ id: 'slimes', label: 'Contra slimes', timed: true, stats: { dmgPct: { p: 0 } } }], expect: 'against slimes', note: 'Só contra slimes: faixa.' },
  "Sharpshooter's Oath": { buffs: [{ id: 'ponto-fraco', label: 'Acerto no ponto fraco', timed: true, stats: { dmgPct: { p: 0 } } }], expect: 'weak spots', note: 'Só no ponto fraco: faixa.' },
  Slingshot: { byType: { normal: { p: 1 }, charged: { p: 1 } }, expect: 'within 0.3s', note: 'Assume o acerto em até 0,3 s (perto). Mais longe o jogo tira 10%: isso não entra.' },
  'Fillet Blade': { procs: physical('golpe', 'Fillet Blade: dano extra', 1), expect: 'chance to deal', note: 'Golpe extra na paleta da rotação (50% de chance a cada 15 s).' },
  'Debate Club': { procs: physical('golpe', 'Debate Club: dano extra', 0), expect: 'additional DMG equal to', note: 'Golpe extra na paleta da rotação (até 1 a cada 3 s depois da habilidade).' },
  Halberd: { procs: physical('golpe', 'Halberd: dano extra', 0), expect: 'additional', note: 'Golpe extra na paleta da rotação (1 a cada 10 s de Normal).' },
  Messenger: { procs: physical('golpe', 'Messenger: ponto fraco (sempre crítico)', 0), expect: 'weak points', note: 'Golpe extra na paleta da rotação (1 a cada 10 s). No jogo ele sempre é crítico: leia o valor crítico.' },
  "Traveler's Handy Sword": heal('restores'),
  'White Iron Greatsword': heal('restores'),
  'Otherworldly Story': heal('recovers'),
  'Recurve Bow': heal('restores'),

  // ---- Espadas ----
  Absolution: {
    critDmg: { p: 0 },
    // Padrão 0: só quem tem Vínculo (Bond of Life) acumula.
    buffs: [{ id: 'vinculo', label: 'DMG por aumento do Vínculo', stacks: { max: 3, default: 0 }, stats: { dmgPct: { p: 1, x: 3 } } }],
    expect: 'Bond of Life',
    note: 'Dano Crítico e os stacks de DMG por Vínculo (0 por padrão: escolha se o personagem tem Vínculo).',
  },
  'Summit Shaper': shielded(),
  'Wolf-Fang': {
    byType: { skill: { p: 0 }, burst: { p: 0 } },
    buffs: [
      { id: 'taxa-hab', label: 'Taxa Crítica da habilidade', stacks: { max: 4 }, stats: { critRateByType: { skill: { p: 3, x: 4 } } } },
      { id: 'taxa-sup', label: 'Taxa Crítica do Supremo', stacks: { max: 4 }, stats: { critRateByType: { burst: { p: 6, x: 4 } } } },
    ],
    expect: 'DMG dealt by Elemental Skill and Elemental Burst is increased by',
    note: 'DMG de habilidade e Supremo e os stacks de Taxa Crítica de cada um (4 por padrão).',
  },
  'Finale of the Deep': {
    atkPct: { p: 0 },
    buffs: [{ id: 'vinculo', label: 'ATK ao limpar o Vínculo', timed: true, convert: { from: 'hp', perPoint: { p: 3, x: 0.25 }, cap: { p: 4 }, to: ['atkFlat'] } }],
    expect: 'Bond of Life',
    note: 'ATK depois da habilidade; o ATK por Vínculo limpo (até 150 no R1) é faixa.',
  },
  'Fleuve Cendre Ferryman': { er: { p: 1 }, critRateByType: { skill: { p: 0 } }, expect: 'increases Energy Recharge by', note: 'Taxa Crítica da habilidade e Recarga (5 s depois da habilidade, assumida ativa).' },
  'Freedom-Sworn': {
    dmgPct: { p: 0 },
    team: { atkPct: { p: 4 } },
    buffs: [{ id: 'cancao', label: 'Canção da Resistência (Normal, Carregado e Imersivo)', scope: 'team', timed: true, stats: { byType: { normal: { p: 3 }, charged: { p: 3 }, plunge: { p: 3 } } } }],
    expect: 'Increases DMG by',
    note: 'DMG próprio sempre ativo. O ATK e o DMG da equipe vêm de 2 Sigils: faixas.',
  },
  'Primordial Jade Cutter': { hpPct: { p: 0 }, buffs: [hpToAtk('hp-atk', 'ATK por HP máximo', 1)], expect: 'HP increased by', note: 'HP e ATK por HP máximo.' },
  'Key of Khaj-Nisut': {
    hpPct: { p: 0 },
    buffs: [
      { id: 'em-hp', label: 'Maestria por HP', stacks: { max: 3 }, convert: { from: 'hp', perPoint: { p: 1, x: 3 }, to: ['em'] } },
      { id: 'em-time', label: 'Maestria da equipe (3 stacks)', scope: 'team', timed: true, convert: { from: 'hp', perPoint: { p: 4 }, to: ['em'] } },
    ],
    expect: 'HP increased by',
    note: 'HP e Maestria por HP (stacks, 3 por padrão); a Maestria da equipe é faixa.',
  },
  'Light of Foliar Incision': { critRate: { p: 0 }, flat: flatEm('DMG por Maestria', 1, ['normal', 'skill'], 28), expect: 'CRIT Rate is increased by', note: 'Taxa Crítica e o dano extra por Maestria no Normal e na habilidade (28 acertos).' },
  'Uraku Misugiri': {
    byType: { normal: { p: 1 }, skill: { p: 2 } },
    defPct: { p: 0 },
    buffs: [{ id: 'geo', label: 'Dobro depois de dano Geo', timed: true, stats: { byType: { normal: { p: 1 }, skill: { p: 2 } } } }],
    expect: 'Normal Attack DMG is increased by',
    note: 'Valores base; o dobro depois de dano Geo é faixa.',
  },

  // ---- Montantes ----
  'The Unforged': shielded(),
  'Memory of Dust': shielded(),
  "Wolf's Gravestone": { atkPct: { p: 0 }, buffs: [{ id: 'lobo', label: 'ATK da equipe (inimigo com pouca vida)', scope: 'team', timed: true, stats: { atkPct: { p: 1 } } }], expect: 'Increases ATK by', note: 'ATK sempre; o da equipe (inimigo abaixo de 30% de HP) é faixa.' },
  'Redhorn Stonethresher': { defPct: { p: 0 }, flat: [{ name: 'DMG do Normal e Carregado por DEF', sourceStat: 'DEF', perPoint: { p: 1 }, hitTypes: ['normal', 'charged'] }], expect: 'DEF is increased by', note: 'DEF e o dano extra por DEF no Normal e no Carregado.' },
  'Gest of the Mighty Wolf': {
    dmgPct: { p: 1, x: 4 },
    buffs: [{ id: 'hex', label: 'Dano Crítico (Hexerei)', team: { hexerei: 2 }, stacks: { max: 4, of: 'stacks' }, stats: { critDmg: { p: 2, x: 4 } } }],
    expect: 'DMG dealt is increased by',
    note: "Stacks de Four Winds' Hymn (4 por padrão); com Hexerei: Secret Rite, também Dano Crítico.",
  },
  'A Teaspoon of Transcendence': {
    atkPct: { p: 0 },
    buffs: [{ id: 'estelar', label: 'Transcendence (Estelar)', stacks: { max: 3 }, stats: { reactionBonus: { stellarconduct: { p: 1, x: 3 }, stellarswirl: { p: 1, x: 3 } } } }],
    expect: 'ATK is increased by',
    note: 'ATK e os stacks de DMG Estelar (3 por padrão).',
  },
  'Akuoumaru': {
    buffs: [{ id: 'energia', label: 'DMG do Supremo por energia do time', convert: { from: 'partyEnergy', perPoint: { p: 0, x: 0.01 }, cap: { p: 1 }, to: ['burst'] } }],
    expect: 'Elemental Burst DMG of the character',
    note: 'Soma a energia do Supremo dos 4 membros (Mavuika e Skirk, que não usam barra de energia, contam 0).',
  },
  "\"Ultimate Overlord's Mega Magic Sword\"": {
    atkPct: { p: 0 },
    buffs: [{ id: 'melusinas', label: 'ATK das Melusines', stacks: { max: 12, unit: 'Melusines' }, stats: { atkPct: { p: 2 } } }],
    expect: 'ATK increased by',
    note: 'ATK e o bônus das Melusines ajudadas (12 por padrão).',
  },
  "Heretic's Molten Blade": {
    atkPct: { p: 2 },
    buffs: [{ id: 'distancia', label: 'ATK extra pela distância', stacks: { max: 18, default: 0, unit: 'passos' }, stats: { atkPct: { p: 2 } } }],
    expect: 'Gleam of First Light',
    note: 'ATK mínimo (18% no R1) e o extra pela distância (0 por padrão; 18 passos dobram).',
  },

  // ---- Lanças ----
  'Vortex Vanquisher': shielded(),
  'Staff of Homa': {
    hpPct: { p: 0 },
    buffs: [hpToAtk('hp-atk', 'ATK por HP máximo', 1), hpToAtk('hp-baixo', 'ATK extra com HP abaixo de 50%', 2, { timed: true })],
    expect: 'HP increased by',
    note: 'HP e ATK por HP máximo; o extra com HP abaixo de 50% é faixa.',
  },
  'Calamity Queller': {
    dmgPct: { p: 0 },
    atkPct: { p: 2, x: 6 },
    buffs: [{ id: 'fora', label: 'Dobro fora de campo', timed: true, stacks: { max: 6, of: 'stacks' }, stats: { atkPct: { p: 2, x: 6 } } }],
    expect: 'All Elemental DMG Bonus',
    note: 'Stacks de Consummation (6 por padrão); o dobro fora de campo é faixa.',
  },
  'Lumidouce Elegy': { atkPct: { p: 0 }, dmgPct: { p: 1, x: 2 }, expect: 'ATK increased by', note: 'ATK e os stacks de DMG com Queimadura (2 por padrão).' },

  // ---- Catalisadores ----
  "Kagura's Verity": {
    byType: { skill: { p: 0, x: 3 } },
    dmgPct: { p: 2 },
    buffs: [{ id: 'estelar', label: 'Kagura Dance (Estelar-Conduct)', stacks: { max: 3, of: 'stacks' }, stats: { reactionBonus: { stellarconduct: { p: 2, x: 3 } } } }],
    expect: 'Kagura Dance',
    note: 'Stacks (3 por padrão) de DMG da habilidade e de Estelar-Conduct e o DMG elemental dos 3 stacks.',
  },
  "Jadefall's Splendor": {
    buffs: [{ id: 'hp-dmg', label: 'DMG elemental por HP máximo', convert: { from: 'hp', perPoint: { p: 0, x: 0.001 }, cap: { p: 1 }, to: ['dmgPct'] } }],
    expect: 'Elemental DMG Bonus for their corresponding Elemental Type',
    note: 'DMG elemental por HP máximo, até o teto (12% no R1), depois do Supremo ou de um escudo.',
  },

  // ---- Arcos ----
  Hamayumi: {
    byType: { normal: { p: 0 }, charged: { p: 1 } },
    buffs: [{ id: 'cheio', label: 'Dobro com a energia cheia', timed: true, stats: { byType: { normal: { p: 0 }, charged: { p: 1 } } } }],
    expect: 'Increases Normal Attack DMG by',
    note: 'Valor base; o dobro com 100% de energia é faixa.',
  },
  'Elegy for the End': {
    em: { p: 0 },
    buffs: [{ id: 'cancao', label: 'Canção da Despedida (equipe)', scope: 'team', timed: true, stats: { em: { p: 3 }, atkPct: { p: 4 } } }],
    expect: 'Increases Elemental Mastery by',
    note: 'Maestria própria; o buff de 4 Sigils da equipe é faixa.',
  },
  "Hunter's Path": { dmgPct: { p: 0 }, flat: flatEm('DMG do Carregado por Maestria', 1, ['charged'], 12), expect: 'All Elemental DMG Bonus', note: 'DMG elemental e o dano extra por Maestria no Carregado (12 acertos).' },
  'The First Great Magic': {
    byType: { charged: { p: 0 } },
    buffs: [
      { id: 'atk', label: 'ATK (Gimmick do portador)', stats: { atkPct: { p: 1 } } },
      { id: 'atk-aliados', label: 'ATK por aliado do mesmo elemento', team: { scale: { of: 'same', table: [1, 2] } }, stats: { atkPct: { p: 1 } } },
    ],
    expect: 'DMG dealt by Charged Attacks increased by',
    note: 'DMG do Carregado e o ATK por membros do mesmo elemento (contando o portador, até 3).',
  },
  'Golden Frostbound Oath': {
    defPct: { p: 4 },
    buffs: [
      { id: 'favor', label: "Frost Fae's Favor (Geo e Lunar-Cristalizar)", timed: true, forElements: ['Geo'], stats: { dmgPct: { p: 1 }, reactionBonus: { lunarcrystallize: { p: 1 } } } },
      { id: 'mischief-geo', label: "Frost Fae's Mischief (DMG Geo dos aliados)", scope: 'others', timed: true, forElements: ['Geo'], stats: { dmgPct: { p: 1, x: 0.5 } } },
      { id: 'mischief-lc', label: "Frost Fae's Mischief (Lunar-Cristalizar dos aliados)", scope: 'others', timed: true, stats: { reactionBonus: { lunarcrystallize: { p: 1, x: 0.5 } } } },
    ],
    expect: 'Increase DEF by',
    note: 'DEF; os bônus de Geo e Lunar-Cristalizar (do portador e dos aliados) são faixas.',
  },
};

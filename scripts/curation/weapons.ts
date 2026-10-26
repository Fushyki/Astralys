/**
 * Curadoria das passivas de armas: de onde sai cada número (parâmetro `p` do Lunaris, multiplicado por `x` quando há
 * stacks) e o que foi assumido. Os parâmetros mudam a cada refinamento, então o mesmo mapeamento gera R1 a R5.
 * `expect` é um trecho que TEM de aparecer na descrição do R1: protege contra o Lunaris mudar a ordem dos parâmetros.
 */
import type { Val } from './sets';
import type { ProcCur } from './gear';

export type Sum = Val | Val[];

export interface WeaponCuration {
  atkPct?: Sum;
  dmgPct?: Sum;
  critRate?: Sum;
  critDmg?: Sum;
  em?: Sum;
  er?: Sum;
  hpPct?: Sum;
  defPct?: Sum;
  byType?: Partial<Record<'normal' | 'charged' | 'plunge' | 'skill' | 'burst', Sum>>;
  /** Buff que a arma dá à equipe inteira (vale nas janelas de buff). */
  team?: { atkPct?: Sum; dmgPct?: Sum; em?: Sum };
  /** Golpes extras (ver `ProcCur` em gear.ts). */
  procs?: ProcCur[];
  expect: string;
  note: string;
}

const STACKS = 'Assume os stacks máximos sempre ativos.';

const blackcliff = (): WeaponCuration => ({
  atkPct: { p: 0, x: 3 },
  expect: 'ATK is increased by 12% for 30s',
  note: 'Assume 3 stacks de ATK (derrotar inimigos) sempre ativos.',
});
const royal = (): WeaponCuration => ({
  critRate: { p: 0, x: 5 },
  expect: 'Upon damaging an opponent, increases CRIT Rate by',
  note: 'Melhor caso: 5 stacks de Taxa Crítica ativos (um acerto crítico remove todos, então o valor real é menor).',
});

export const WEAPONS: Record<string, WeaponCuration> = {
  // ---- Espadas ----
  'Aquila Favonia': { atkPct: { p: 0 }, procs: [{ id: 'falcao', label: "Aquila Favonia: falcão", scale: { atk: { p: 2 } }, element: 'Physical' }], expect: 'ATK is increased by', note: 'ATK. Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). Dano em área de 200% (R1) do ATK, Físico, ao levar dano (a cada 15 s). A cura não muda o dano.' },
  'Skyward Blade': { critRate: { p: 0 }, procs: [{ id: 'lamina', label: "Skyward Blade: dano extra (1 acerto)", scale: { atk: { p: 3 } }, element: 'Physical' }], expect: 'CRIT Rate increased by', note: 'Taxa Crítica. Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). Cada acerto de Normal/Carregado nos 12 s depois do Supremo soma 20% (R1) do ATK como dano Físico à parte (Genshin Optimizer). A velocidade não entra.' },
  'Freedom-Sworn': {
    dmgPct: { p: 0 },
    team: { atkPct: { p: 4 } },
    expect: 'Increases DMG by',
    note: 'DMG próprio sempre ativo. O ATK da equipe vem de reações (2 Sigils): vale só nas janelas de buff. Os +% de Normal/Carregado/Imersivo da equipe NÃO entram.',
  },
  'Summit Shaper': { atkPct: { p: 1, x: 5 }, expect: 'Scoring hits on opponents increases ATK by', note: `${STACKS} (5 stacks; sem o dobro com escudo).` },
  'Mistsplitter Reforged': {
    dmgPct: [{ p: 0 }, { p: 3 }],
    expect: 'Elemental DMG Bonus for all elements',
    note: 'Assume 3 stacks do Emblema (+28% de dano do elemento do personagem) sempre ativos, além dos 12% base.',
  },
  'Haran Geppaku Futsu': {
    dmgPct: { p: 0 },
    byType: { normal: { p: 3, x: 2 } },
    expect: 'All Elemental DMG Bonus',
    note: 'Assume 2 stacks de Wavespike consumidos pela habilidade (+40% de Ataque Normal), sempre ativos.',
  },
  'Uraku Misugiri': {
    byType: { normal: { p: 1 }, skill: { p: 2 } },
    defPct: { p: 0 },
    expect: 'Normal Attack DMG is increased by',
    note: 'Valores base. O dobro depois de dano Geo da equipe NÃO entra.',
  },
  'Primordial Jade Cutter': { hpPct: { p: 0 }, expect: 'HP increased by', note: 'Só o HP. O bônus de ATK (1,2% do HP máximo) NÃO entra.' },
  'Key of Khaj-Nisut': { hpPct: { p: 0 }, expect: 'HP increased by', note: 'Só o HP. A Maestria Elemental por HP máximo NÃO entra.' },
  'Light of Foliar Incision': { critRate: { p: 0 }, expect: 'CRIT Rate is increased by', note: 'Só a Taxa Crítica. O dano extra por Maestria NÃO entra.' },
  'Blackcliff Longsword': blackcliff(),
  'Royal Longsword': royal(),
  'Iron Sting': { dmgPct: { p: 0, x: 2 }, expect: 'increases all DMG by', note: 'Assume 2 stacks de +DMG sempre ativos.' },
  'Lion\'s Roar': { dmgPct: { p: 0 }, expect: 'Increases DMG against opponents affected by Pyro or Electro', note: 'Assume inimigo sob Pyro ou Electro.' },
  'Sapwood Blade': { em: { p: 0 }, expect: 'a Leaf of Consciousness', note: 'Assume a Folha coletada e a Maestria ativa (limitado a uma a cada 20 s no jogo).' },
  'Fleuve Cendre Ferryman': { er: { p: 1 }, expect: 'increases Energy Recharge by', note: 'Só a Recarga (5 s depois da habilidade, assumida ativa). A Taxa Crítica de habilidade NÃO entra.' },

  // ---- Montantes ----
  'Skyward Pride': { dmgPct: { p: 0 }, procs: [{ id: 'lamina', label: "Skyward Pride: lâmina de vácuo", scale: { atk: { p: 1 } }, element: 'Physical' }], expect: 'Increases all DMG by', note: 'DMG geral. Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). Lâmina de vácuo de 80% (R1) do ATK, Física, até 8 depois do Supremo.' },
  'Song of Broken Pines': {
    atkPct: { p: 0 },
    team: { atkPct: { p: 4 } },
    expect: 'Increases ATK by',
    note: 'ATK próprio sempre ativo. O ATK da equipe (4 Sigils) vale só nas janelas de buff.',
  },
  'The Unforged': { atkPct: { p: 1, x: 5 }, expect: 'Scoring hits on opponents increases ATK by', note: `${STACKS} (5 stacks; sem o dobro com escudo).` },
  'Redhorn Stonethresher': { defPct: { p: 0 }, expect: 'DEF is increased by', note: 'Só o DEF. O dano de Normal/Carregado por DEF NÃO entra.' },
  'Fang of the Mountain King': {
    byType: { skill: { p: 2, x: 6 }, burst: { p: 2, x: 6 } },
    expect: 'Canopy\'s Favor',
    note: 'Melhor caso: 6 stacks de Canopy\'s Favor ativos em habilidade e Supremo.',
  },
  'Gest of the Mighty Wolf': { dmgPct: { p: 1, x: 4 }, expect: 'DMG dealt is increased by', note: 'Assume 4 stacks de Four Winds\' Hymn. O CRIT DMG com Hexerei NÃO entra.' },
  'A Teaspoon of Transcendence': { atkPct: { p: 0 }, expect: 'ATK is increased by', note: 'Só o ATK. O bônus Estelar NÃO entra.' },
  'Blackcliff Slasher': blackcliff(),
  'Royal Greatsword': royal(),
  'Mailed Flower': { atkPct: { p: 1 }, em: { p: 2 }, expect: 'their ATK and Elemental Mastery will be increased by', note: 'Assume o bônus de 8 s depois da habilidade sempre ativo.' },
  'Tidal Shadow': { atkPct: { p: 0 }, expect: 'After the wielder is healed, ATK will be increased by', note: 'Assume o bônus depois de ser curado sempre ativo.' },
  'Akuoumaru': { byType: { burst: { p: 1 } }, expect: 'Elemental Burst DMG of the character', note: 'Assume o teto de +40% de dano de Supremo (energia máxima da equipe alta).' },

  // ---- Lanças ----
  'Staff of Homa': { hpPct: { p: 0 }, expect: 'HP increased by', note: 'Só o HP. O ATK por HP máximo NÃO entra.' },
  'Skyward Spine': { critRate: { p: 0 }, procs: [{ id: 'lamina', label: "Skyward Spine: lâmina de vácuo", scale: { atk: { p: 3 } }, element: 'Physical' }], expect: 'Increases CRIT Rate by', note: 'Taxa Crítica. Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). Lâmina de vácuo de 40% (R1) do ATK, Física, 50% de chance a cada 2 s. A velocidade não entra.' },
  'Vortex Vanquisher': { atkPct: { p: 1, x: 5 }, expect: 'Scoring hits on opponents increases ATK by', note: `${STACKS} (5 stacks; sem o dobro com escudo).` },
  'Primordial Jade Winged-Spear': {
    atkPct: { p: 0, x: 7 },
    dmgPct: { p: 1 },
    expect: 'increases ATK by',
    note: 'Assume 7 stacks de ATK e o +12% de DMG que vem com eles.',
  },
  'Calamity Queller': {
    dmgPct: { p: 0 },
    atkPct: { p: 2, x: 6 },
    expect: 'All Elemental DMG Bonus',
    note: 'Assume 6 stacks de Consummation (ATK). O dobro fora de campo NÃO entra.',
  },
  'Crimson Moon\'s Semblance': { dmgPct: [{ p: 2 }, { p: 4 }], expect: 'Bond of Life', note: 'Assume o Bond of Life de 30% do HP máximo ativo (+12% e +24% de DMG).' },
  'Lumidouce Elegy': { atkPct: { p: 0 }, expect: 'ATK increased by', note: 'Só o ATK. O DMG com Queimadura e a energia NÃO entram.' },
  'Symphonist of Scents': { atkPct: { p: 0 }, expect: 'ATK is increased by', note: 'Só o ATK base. O bônus fora de campo e o "Sweet Echoes" NÃO entram.' },
  'Fractured Halo': { atkPct: { p: 0 }, buffs: [{ id: 'edict', label: 'Electrifying Edict (DMG Lunar-Carregado da equipe)', scope: 'team', timed: true, stats: { reactionBonus: { lunarcharged: { p: 2 } } } }], expect: 'ATK is increased by', note: 'Assume o ATK depois de habilidade/Supremo sempre ativo. Electrifying Edict: +40% (R1) de DMG Lunar-Carregado da equipe por 20 s depois de criar um escudo com o ATK ativo: faixa, ligue nas janelas.' },
  'Blackcliff Pole': blackcliff(),
  'Royal Spear': royal(),
  "Dragon's Bane": { dmgPct: { p: 0 }, expect: 'Increases DMG against opponents affected by Hydro or Pyro', note: 'Assume inimigo sob Hydro ou Pyro.' },
  'Kitain Cross Spear': { byType: { skill: { p: 0 } }, expect: 'Increases Elemental Skill DMG by', note: 'Só o DMG de habilidade. A energia NÃO entra.' },
  'Moonpiercer': { atkPct: { p: 0 }, expect: 'a Leaf of Revival', note: 'Assume a Folha coletada e o ATK ativo (limitado a uma a cada 20 s no jogo).' },
  'Footprint of the Rainbow': { defPct: { p: 0 }, expect: 'increases DEF by', note: 'Assume o DEF de 15 s depois da habilidade sempre ativo.' },
  'Tamayuratei no Ohanashi': { atkPct: { p: 0 }, expect: 'Increase ATK by', note: 'Assume o ATK de 10 s depois da habilidade sempre ativo.' },

  // ---- Catalisadores ----
  'Skyward Atlas': { dmgPct: { p: 0 }, procs: [{ id: 'nuvem', label: "Skyward Atlas: nuvem (1 ataque)", scale: { atk: { p: 2 } }, element: 'Physical' }], expect: 'Increases Elemental DMG Bonus by', note: 'DMG elemental. Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). Cada ataque das nuvens vale 160% (R1) do ATK, Físico (Genshin Optimizer); duram 15 s, 50% de chance a cada 30 s.' },
  'Lost Prayer to the Sacred Winds': { dmgPct: { p: 1, x: 4 }, expect: 'Elemental DMG Bonus every', note: 'Assume 4 stacks (+32% no R1) ativos.' },
  'Memory of Dust': { atkPct: { p: 1, x: 5 }, expect: 'Scoring hits on opponents increases ATK by', note: `${STACKS} (5 stacks; sem o dobro com escudo).` },
  "Jadefall's Splendor": { dmgPct: { p: 1 }, expect: 'Elemental DMG Bonus for their corresponding Elemental Type', note: 'Assume o teto de +12% de DMG elemental (HP máximo alto) por 3 s depois do Supremo.' },
  "Kagura's Verity": {
    byType: { skill: { p: 0, x: 3 } },
    dmgPct: { p: 2 },
    expect: 'Kagura Dance',
    note: 'Assume 3 stacks (+36% de dano de habilidade e +12% de DMG elemental). O bônus Estelar NÃO entra.',
  },
  "Tulaytullah's Remembrance": { byType: { normal: { p: 1, x: 10 } }, expect: 'Normal Attack DMG will increase by', note: 'Assume o máximo de +48% (R1) de dano de Ataque Normal na janela.' },
  "Surf's Up": {
    hpPct: { p: 0 },
    byType: { normal: { p: 4, x: 4 } },
    expect: 'Scorching Summer',
    note: 'Assume 4 stacks de Scorching Summer (+48% de Ataque Normal no R1) ativos.',
  },
  "Starcaller's Watch": { team: { dmgPct: { p: 0 } }, expect: 'Mirror of Night', note: 'O +DMG vale para o personagem ativo, só nas janelas de buff. Os +100 de Maestria NÃO entram.' },
  'Reliquary of Truth': { critRate: { p: 5 }, em: { p: 0 }, expect: 'Secret of Lies', note: 'Assume a Maestria depois da habilidade sempre ativa. O CRIT DMG de Lunar-Floração NÃO entra.' },
  "Angelos' Heptades": { atkPct: { p: 0 }, expect: 'ATK is increased by', note: 'Só o ATK. O DMG do personagem ativo por ATK NÃO entra.' },
  'Mappa Mare': { dmgPct: { p: 0, x: 2 }, expect: 'Elemental DMG Bonus for', note: 'Assume 2 stacks de DMG elemental ativos.' },
  'Oathsworn Eye': { er: { p: 0 }, expect: 'Increases Energy Recharge by', note: 'Assume a Recarga de 10 s depois da habilidade sempre ativa.' },
  'Dodoco Tales': { atkPct: { p: 2 }, byType: { charged: { p: 0 } }, expect: 'Charged Attack DMG', note: 'Assume os dois bônus (Carregado +DMG e ATK) ativos.' },

  // ---- Arcos ----
  'Skyward Harp': { critDmg: { p: 0 }, procs: [{ id: 'area', label: "Skyward Harp: área", scale: { atk: { p: 2 } }, element: 'Physical' }], expect: 'Increases CRIT DMG by', note: 'Dano Crítico. Golpe extra na paleta da rotação (coloque quantas vezes ele acontece). Dano em área de 125% do ATK, Físico, com 60% (R1) de chance a cada 4 s (R1).' },
  "Amos' Bow": {
    byType: { normal: [{ p: 0 }, { p: 1, x: 5 }], charged: [{ p: 0 }, { p: 1, x: 5 }] },
    expect: 'Increases Normal and Charged Attack DMG by',
    note: 'Assume o máximo: 12% base + 5 aumentos de 8% (a flecha 0,5 s no ar).',
  },
  'Elegy for the End': { em: { p: 0 }, expect: 'Increases Elemental Mastery by', note: 'Só a Maestria própria. O buff de 4 Sigils da equipe NÃO entra.' },
  'Polar Star': {
    byType: { skill: { p: 0 }, burst: { p: 0 } },
    atkPct: { p: 5 },
    expect: 'Ashen Nightstar',
    note: 'Assume 4 stacks de Ashen Nightstar (ATK +48% no R1) sempre ativos.',
  },
  'Aqua Simulacra': { hpPct: { p: 0 }, dmgPct: { p: 1 }, expect: 'HP is increased by', note: 'Assume inimigos por perto (+DMG sempre ativo).' },
  'Thundering Pulse': { atkPct: { p: 0 }, byType: { normal: { p: 3 } }, expect: 'Thunder Emblem', note: 'Assume 3 stacks do Emblema (+40% de Ataque Normal no R1) ativos.' },
  'The First Great Magic': { byType: { charged: { p: 0 } }, expect: 'DMG dealt by Charged Attacks increased by', note: 'Só o dano de Ataque Carregado. O ATK por membros do time NÃO entra.' },
  'Golden Frostbound Oath': { defPct: { p: 4 }, expect: 'Increase DEF by', note: 'Só o DEF. Os bônus de dano Geo e Lunar-Cristalizar NÃO entram.' },
  'Hunter\'s Path': { dmgPct: { p: 0 }, expect: 'All Elemental DMG Bonus', note: 'Só o DMG elemental. O dano de Carregado por Maestria NÃO entra.' },
  'Blackcliff Warbow': blackcliff(),
  'Royal Bow': royal(),
  'The Stringless': { byType: { skill: { p: 0 }, burst: { p: 0 } }, expect: 'Increases Elemental Skill and Elemental Burst DMG by', note: 'Valor fixo.' },
  Rust: { byType: { normal: { p: 0 }, charged: { p: 1, x: -1 } }, expect: 'Increases Normal Attack DMG by', note: 'Normal +40%, Carregado -10% (no R1).' },
  Hamayumi: { byType: { normal: { p: 0 }, charged: { p: 1 } }, expect: 'Increases Normal Attack DMG by', note: 'Só o valor base. O dobro com 100% de energia NÃO entra.' },
  'Windblume Ode': { atkPct: { p: 0 }, expect: 'After using an Elemental Skill', note: 'Assume o ATK de 6 s depois da habilidade sempre ativo.' },
  'Ibis Piercer': { em: { p: 0, x: 2 }, expect: 'Elemental Mastery will increase by', note: 'Assume 2 stacks de Maestria ativos.' },
  'Wolf-Fang': { byType: { skill: { p: 0 }, burst: { p: 0 } }, expect: 'DMG dealt by Elemental Skill and Elemental Burst is increased by', note: 'Só o DMG de habilidade e Supremo. A Taxa Crítica por stack NÃO entra.' },

  // ---- Catalisadores 4★ de Royal/Blackcliff ----
  'Blackcliff Agate': blackcliff(),
  'Royal Grimoire': royal(),
};

/** Apelido: armas do mesmo "tipo de curadoria" que não têm nomes diferentes. Mantido vazio de propósito. */
export const ALIASES: Record<string, string> = {};

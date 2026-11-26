/**
 * Uma caixa por condição (#58, respostas do Davi): as passivas que somavam vários efeitos numa caixa só passam a ter um
 * buff por efeito (a raiz fica só com o que vale sem condição). Versões que trocam o efeito (Radiance, 2+ inimigos) entram
 * como faixa com a DIFERENÇA para a versão base: ligada por cima dela, o total é o da versão alternativa.
 */
import type { BuffCur, GearCur, StatsCur, Sum } from './gear';

const buff = (id: string, label: string, stats: StatsCur, more: Partial<BuffCur> = {}): BuffCur => ({ id, label, stats, ...more });
const range = (id: string, label: string, stats: StatsCur, more: Partial<BuffCur> = {}) => buff(id, label, stats, { timed: true, ...more });
/** `a − b`, os dois com o mesmo multiplicador de stacks. */
const minus = (a: number, b: number, x = 1): Sum => [{ p: a, x }, { p: b, x: -x }];

export const WEAPONS_4: Record<string, GearCur> = {
  'Dodoco Tales': {
    buffs: [buff('carregado', 'Carregado (depois de um Normal)', { byType: { charged: { p: 0 } } }), buff('atk', 'ATK (depois de um Carregado)', { atkPct: { p: 2 } })],
    expect: 'Charged Attack DMG',
    note: 'Um efeito por caixa.',
  },
  'Aqua Simulacra': { hpPct: { p: 0 }, buffs: [buff('perto', 'DMG com inimigos por perto', { dmgPct: { p: 1 } })], expect: 'HP is increased by', note: 'HP sempre; o DMG com inimigos por perto tem caixa própria.' },
  "Crimson Moon's Semblance": {
    buffs: [buff('vinculo', 'DMG com Vínculo', { dmgPct: { p: 2 } }), buff('vinculo30', 'DMG extra com Vínculo de 30% ou mais', { dmgPct: { p: 4 } })],
    expect: 'Bond of Life',
    note: 'Um efeito por caixa.',
  },
  Azurelight: {
    buffs: [buff('habilidade', 'ATK depois da habilidade', { atkPct: { p: 0 } }), buff('sem-energia', 'ATK e Dano Crítico com 0 de energia', { atkPct: { p: 2 }, critDmg: { p: 3 } })],
    expect: 'when the equipping character has 0 Energy',
    note: 'Um efeito por caixa; o de 0 de energia vale dentro dos 12 s depois da habilidade.',
  },
  'Athame Artis': {
    critDmgByType: { burst: { p: 0 } },
    buffs: [
      buff('lamina', 'Blade of the Daylight Hours (ATK do dono)', { atkPct: { p: 2 } }),
      { id: 'time', label: 'ATK dos aliados', scope: 'others', timed: true, stats: { atkPct: { p: 3 } } },
      { id: 'hex', label: 'Secret Rite (ATK do dono)', team: { hexerei: 2 }, stats: { atkPct: { p: 2, x: 0.75 } } },
      { id: 'hext', label: 'Secret Rite (ATK dos aliados)', scope: 'others', timed: true, team: { hexerei: 2 }, stats: { atkPct: { p: 3, x: 0.75 } } },
    ],
    expect: 'Blade of the Daylight Hours',
    note: 'Dano Crítico do Supremo sempre; o ATK do dono tem caixa própria; o ATK dos aliados (3 s) vale nas janelas. Com Hexerei: Secret Rite (2+ membros) os dois ATK sobem 75%.',
  },
  'Talking Stick': {
    buffs: [buff('pyro', 'ATK (afetado por Pyro)', { atkPct: { p: 4 } }), buff('outros', 'DMG (afetado por Hydro, Cryo, Electro ou Dendro)', { dmgPct: { p: 5 } })],
    expect: 'affected by Pyro',
    note: 'Um efeito por caixa.',
  },
  'Flowing Purity': {
    buffs: [buff('habilidade', 'DMG depois da habilidade', { dmgPct: { p: 0 } }), buff('vinculo', 'DMG ao limpar o Vínculo (máximo)', { dmgPct: { p: 4 } })],
    expect: 'Bond of Life',
    note: 'Um efeito por caixa.',
  },
  'Dawning Frost': {
    buffs: [buff('carregado', 'Maestria (Carregado acertado)', { em: { p: 0 } }), buff('habilidade', 'Maestria (habilidade acertada)', { em: { p: 2 } })],
    expect: 'For 10s after a Charged Attack hits',
    note: 'Um efeito por caixa.',
  },
  'Sunny Morning Sleep-In': {
    buffs: [buff('redemoinho', 'Maestria (Redemoinho)', { em: { p: 0 } }), buff('habilidade', 'Maestria (habilidade acertada)', { em: { p: 1 } }), buff('supremo', 'Maestria (Supremo acertado)', { em: { p: 2 } })],
    expect: 'Elemental Mastery increases by',
    note: 'Um efeito por caixa.',
  },
  'Vivid Notions': {
    atkPct: { p: 0 },
    buffs: [
      buff('dawn', "Dawn's First Hue (Imersivo)", { critDmgByType: { plunge: { p: 2 } } }),
      buff('twilight', "Twilight's Splendor (habilidade ou Supremo)", { critDmgByType: { plunge: { p: 3 } } }),
    ],
    expect: "Dawn's First Hue",
    note: 'ATK sempre; um Dano Crítico do Imersivo por caixa.',
  },
  "Nightweaver's Looking Glass": {
    buffs: [
      buff('oracao', 'Prayer of the Far North (Maestria)', { em: { p: 0 } }),
      buff('lua', 'New Moon Verse (Maestria)', { em: { p: 2 } }),
      { id: 'florescer', label: 'Florescer da equipe', scope: 'team', timed: true, stats: { reactionBonus: { bloom: { p: 4 }, hyperbloom: { p: 5 }, burgeon: { p: 5 }, lunarbloom: { p: 6 } } } },
    ],
    expect: 'Prayer of the Far North',
    note: 'Uma Maestria por caixa; com as duas, +120% de Florescer, +80% de Hiperflorescer e Brotar e +40% de Lunar-Florescer para a equipe (faixa).',
  },
  "Nocturne's Curtain Call": {
    hpPct: { re: 'Max HP increases by (\\d+(?:\\.\\d+)?)%' },
    buffs: [buff('vinho', 'Sacred Wine (reação Lunar)', { hpPct: { p: 0 }, reactionBonus: { lunarchargedCritDmg: { p: 1 }, lunarbloomCritDmg: { p: 1 }, lunarcrystallizeCritDmg: { p: 1 } } })],
    expect: 'Bountiful Sea',
    note: 'HP base sempre; o HP extra e o Dano Crítico Lunar depois de reação Lunar têm caixa própria.',
  },
  'Solar Pearl': {
    buffs: [
      buff('normal', 'Normal (depois de habilidade ou Supremo)', { byType: { normal: { p: 0 } } }),
      buff('hab-sup', 'Habilidade e Supremo (depois de um Normal)', { byType: { skill: { p: 0 }, burst: { p: 0 } } }),
    ],
    expect: 'Normal Attack hits increase Elemental Skill and Elemental Burst DMG',
    note: 'Um efeito por caixa.',
  },
  'Mitternachts Waltz': {
    buffs: [buff('habilidade', 'Habilidade (depois de um Normal)', { byType: { skill: { p: 2 } } }), buff('normal', 'Normal (depois da habilidade)', { byType: { normal: { p: 0 } } })],
    expect: 'Normal Attack hits on opponents increase Elemental Skill DMG',
    note: 'Um efeito por caixa.',
  },
  'Disaster and Remorse': {
    buffs: [
      buff('unforgivable', 'Unforgivable (Normal e Carregado)', { byType: { normal: { p: 2 }, charged: { p: 2 } } }),
      buff('irreparable', 'Irreparable (habilidade e Supremo)', { byType: { skill: { p: 3 }, burst: { p: 3 } } }),
      buff('hex', 'Secret Rite (Normal e Carregado)', { byType: { normal: { p: 2, x: 0.75 }, charged: { p: 2, x: 0.75 } } }, { team: { hexerei: 2 } }),
      buff('hex-hab', 'Secret Rite (habilidade e Supremo)', { byType: { skill: { p: 3, x: 0.75 }, burst: { p: 3, x: 0.75 } } }, { team: { hexerei: 2 } }),
    ],
    expect: 'Path of Conflict',
    note: 'Um efeito por caixa; com Hexerei: Secret Rite os bônus sobem 75%.',
  },
  'Starsealed Edict': {
    critDmg: { re: 'Increases CRIT DMG by (\\d+(?:\\.\\d+)?)%' },
    buffs: [
      buff('crystal', 'Crystal Compounding (Maestria)', { em: { p: 0 } }),
      buff('stacks', 'Law of Combustion (Maestria)', { em: { p: 1, x: 3 } }),
      range('radiance', 'Law of Combustion (Radiance)', { reactionBonus: { stellarconductCritDmg: { p: 2, x: 3 } } }, { stacks: { max: 3, of: 'stacks' } }),
    ],
    expect: 'Crystal Compounding',
    note: 'Dano Crítico sempre; a Maestria da habilidade e os stacks (3 por padrão) têm caixa própria; com Radiance: Stellar-Conduct, Dano Crítico Estelar-Conduct por stack (faixa).',
  },
  'Reliquary of Truth': {
    critRate: { p: 5 },
    buffs: [
      buff('segredo', 'Secret of Lies (Maestria)', { em: { p: 0 } }),
      buff('verdade', 'Moon of Truth (Dano Crítico)', { critDmg: { p: 1 } }),
      buff('ambos', 'Os dois efeitos juntos (+50%)', { em: { p: 0, x: 0.5 }, critDmg: { p: 1, x: 0.5 } }),
    ],
    expect: 'Secret of Lies',
    note: 'Taxa Crítica sempre; um efeito por caixa. O reforço vale com os dois juntos.',
  },
  'Beacon of the Reed Sea': {
    buffs: [
      buff('habilidade', 'ATK (habilidade acertada)', { atkPct: { p: 0 } }),
      buff('dano', 'ATK (depois de levar dano)', { atkPct: { p: 2 } }),
      buff('sem-escudo', 'HP sem escudo', { hpPct: { p: 4 } }),
    ],
    expect: 'ATK will be increased by',
    note: 'Um efeito por caixa.',
  },
  'The Daybreak Chronicles': {
    buffs: [
      buff('normal', 'Stirring Dawn Breeze (Normal)', { byType: { normal: { p: 1 } } }),
      buff('habilidade', 'Stirring Dawn Breeze (habilidade)', { byType: { skill: { p: 1 } } }),
      buff('supremo', 'Stirring Dawn Breeze (Supremo)', { byType: { burst: { p: 1 } } }),
    ],
    expect: 'Stirring Dawn Breeze',
    note: 'Um tipo de golpe por caixa, no máximo (60% no R1). No jogo cai 10% por segundo em combate e sobe com os acertos.',
  },
  'Mountain-Bracing Bolt': {
    byType: { skill: { p: 1 } },
    buffs: [buff('aliado', 'Habilidade (depois da habilidade de um aliado)', { byType: { skill: { p: 2 } } })],
    expect: 'increases Elemental Skill DMG by',
    note: 'DMG da habilidade sempre; o extra depois da habilidade de um aliado tem caixa própria.',
  },

  // ---- Versões que trocam o efeito ----
  'New Bough': {
    buffs: [
      buff('stacks', 'Verdant (ATK e Maestria)', { atkPct: { p: 3, x: 3 }, em: { p: 5, x: 3 } }),
      // Radiance: ATK 6% no lugar de 4%, sem a Maestria, e +8% de DMG Estelar (por stack).
      range('radiance', 'Verdant (Radiance)', { atkPct: minus(4, 3, 3), em: { p: 5, x: -3 }, reactionBonus: { stellarconduct: { p: 6, x: 3 }, stellarswirl: { p: 6, x: 3 } } }, { stacks: { max: 3, of: 'stacks' } }),
    ],
    expect: 'Verdant',
    note: 'Stacks de Verdant (3 por padrão). Com Radiance: Stellar Glimmer, ligue a faixa por cima: ela troca a Maestria por mais ATK e DMG Estelar.',
  },
  "Winter's Heavy Heart": {
    buffs: [
      { id: 'cryo', label: 'Maestria por membro Cryo', stats: { em: { p: 0 } }, team: { scale: { of: ['Cryo'], table: [1, 2, 3, 4] } } },
      { id: 'electro', label: 'ATK por membro Electro', stats: { atkPct: { p: 1 } }, team: { scale: { of: ['Electro'], table: [1, 2, 3, 4] } } },
      // Radiance: cada membro Cryo OU Electro dá 20 de Maestria e 6% de DMG Estelar, no lugar dos bônus acima.
      range('radiance-cryo', 'Versão Radiance (membros Cryo)', { em: minus(2, 0), reactionBonus: { stellarconduct: { p: 3 }, stellarswirl: { p: 3 } } }, { team: { scale: { of: ['Cryo'], table: [1, 2, 3, 4] } } }),
      range('radiance-electro', 'Versão Radiance (membros Electro)', { em: { p: 2 }, atkPct: { p: 1, x: -1 }, reactionBonus: { stellarconduct: { p: 3 }, stellarswirl: { p: 3 } } }, { team: { scale: { of: ['Electro'], table: [1, 2, 3, 4] } } }),
    ],
    expect: 'Silver-Tinged Blood Pact',
    note: 'Conta os membros Cryo (Maestria) e Electro (ATK) do time, contando o dono. Com Radiance: Stellar Glimmer, ligue as duas faixas por cima: elas trocam os bônus pela versão Radiance.',
  },
  'Forged by the Golden Melody': {
    atkPct: { p: 0 },
    buffs: [
      range('em', 'Harmonic Movement (Maestria)', { em: { p: 1 } }),
      range('estelar', 'Harmonic Movement (Estelar)', { reactionBonus: { stellarconduct: { p: 2 }, stellarswirl: { p: 2 } } }),
      range('contra-atk', 'Contrapuntal (ATK)', { atkPct: { p: 0 } }),
      range('contra-em', 'Contrapuntal (Maestria)', { em: { p: 1 } }),
      range('contra-estelar', 'Contrapuntal (Estelar)', { reactionBonus: { stellarconduct: { p: 2 }, stellarswirl: { p: 2 } } }),
    ],
    expect: 'Harmonic Movement',
    note: 'O +ATK da primeira fase fica sempre; as fases de Maestria e de DMG Estelar são faixas. O Contrapuntal soma uma cópia da fase ativa na hora da reação Estelar: ligue a faixa da mesma fase.',
  },
  Deathmatch: {
    buffs: [
      buff('um', 'ATK (menos de 2 inimigos)', { atkPct: { p: 1 } }),
      range('dois', 'Versão 2 ou mais inimigos (no lugar da de cima)', { atkPct: minus(2, 1), defPct: { p: 3 } }),
    ],
    expect: 'at least 2 opponents nearby',
    note: 'Com 2 ou mais inimigos, ligue a faixa por cima: o ATK cai e a DEF sobe.',
  },

  // ---- Recarga que se liga à parte e Hexerei ----
  'Engulfing Lightning': {
    atkPctPerEr: { coef: { p: 0 }, cap: { p: 1 } },
    buffs: [buff('recarga', 'Recarga depois do Supremo', { er: { p: 2 } })],
    expect: 'Energy Recharge over the base',
    note: 'ATK pela Recarga acima de 100%; a Recarga extra de 12 s depois do Supremo tem caixa própria.',
  },
  "Angelos' Heptades": {
    atkPct: { p: 0 },
    buffs: [
      { id: 'luz', label: 'DMG do personagem ativo por ATK', scope: 'team', timed: true, convert: { from: 'atk', perPoint: { p: 2, x: 0.001 }, cap: { p: 3 }, to: ['dmgPct'] } },
      { id: 'luz-hex', label: 'Hexerei fora de campo (metade)', scope: 'team', timed: true, forFactions: ['hexerei'], team: { hexerei: 2 }, convert: { from: 'atk', perPoint: { p: 2, x: 0.0005 }, cap: { p: 3, x: 0.5 }, to: ['dmgPct'] } },
    ],
    expect: 'ATK is increased by',
    note: 'ATK; o DMG por ATK depois de criar um escudo é faixa (ligue nos golpes do personagem ativo). Com Hexerei: Secret Rite, os membros Hexerei fora de campo ganham metade: faixa própria.',
  },
};

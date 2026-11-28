/**
 * Tudo que, no texto de uma passiva de arma ou de um bônus de set, tem duração: qual parte do efeito, quantos
 * segundos (parâmetro do Lunaris `p`, ou literal conferido no texto) e que golpes abrem a janela sozinha. Sem
 * `auto`, a condição não aparece na rotação (escudo, cura, inimigo com pouca vida, tema sorteado...) e a janela é do
 * usuário, já com a duração certa. `NO_WINDOW` diz por que o resto que cita tempo não vira janela.
 * `tests/data/gearTiming.test.ts` trava: nada que cita tempo fica fora das duas listas.
 */
import type { HitType } from '../../src/data/schema';
import { NATLAN, type Val } from './gear';

export interface AutoCur {
  on?: HitType[];
  by?: 'team' | 'others';
  /** Espera entre ativações (só quando o texto dá uma maior que a duração, ou no reativar periódico). */
  cd?: Val;
  periodic?: true;
  /** [posição, total] dos efeitos que se revezam. */
  seq?: [number, number];
  /** "Ao usar" (e não "ao acertar"): só o uso abre a janela, não os acertos seguintes de um golpe contínuo. */
  cast?: true;
  /** Golpes que alongam a janela: `add` s por golpe, até `max` s, um a cada `every` s. */
  extend?: { on: HitType[]; add: Val; max: Val; every?: Val };
}

export interface TimeCur {
  root?: string[];
  team?: true;
  res?: true;
  buff?: string;
  flat?: string;
  label?: string;
  s: Val;
  auto?: AutoCur;
  wielders?: string[];
  /** Portadores para quem a duração não corre fora de campo. */
  pausesFor?: string[];
}

const ANY: AutoCur = {};
const SKILL: AutoCur = { on: ['skill'] };
const BURST: AutoCur = { on: ['burst'] };
const SKILL_BURST: AutoCur = { on: ['skill', 'burst'] };
const NORMAL: AutoCur = { on: ['normal'] };
const CHARGED: AutoCur = { on: ['charged'] };
const PLUNGE: AutoCur = { on: ['plunge'] };
const NA_CA: AutoCur = { on: ['normal', 'charged'] };
const USE_SKILL: AutoCur = { ...SKILL, cast: true };
const USE_BURST: AutoCur = { ...BURST, cast: true };
const USE_SKILL_BURST: AutoCur = { ...SKILL_BURST, cast: true };

const p = (index: number): Val => ({ p: index });
const lit = (seconds: number): Val => ({ lit: seconds });
/** Vários buffs com a mesma duração e o mesmo gatilho. */
const each = (ids: string[], s: Val, auto?: AutoCur): TimeCur[] => ids.map((buff) => ({ buff, s, ...(auto ? { auto } : {}) }));

/** Mil Sóis Ardentes: Normal e Carregado alongam; em Nightsoul a duração não corre fora de campo. */
const SUNS: AutoCur = { ...USE_SKILL_BURST, cd: p(4), extend: { on: ['normal', 'charged'], add: p(5), max: lit(6), every: p(6) } };
const BLACKCLIFF: TimeCur[] = [{ buff: 'stacks', s: p(1), auto: ANY }];
const SHIELD_STACKS: TimeCur[] = [{ buff: 'stacks', s: p(2), auto: ANY }, { buff: 'escudo', s: p(2) }];
const PERIODIC_PAIR = (self: string, team: string): TimeCur[] => each([self, team], p(2), { periodic: true, cd: p(0) });
const SYMBOLS: TimeCur[] = [{ buff: 'stacks', s: p(1), auto: { ...USE_SKILL_BURST, cd: p(2) } }];

export const WEAPON_TIMING: Record<string, TimeCur[]> = {
  // ---------- Espadas ----------
  'Dark Iron Sword': [{ root: ['atkPct'], s: p(1), auto: ANY }],
  'Skyrider Sword': [{ root: ['atkPct'], s: p(1), auto: USE_BURST }],
  'Prototype Rancour': [{ buff: 'stacks', s: lit(6), auto: NA_CA }],
  'Iron Sting': [{ buff: 'stacks', s: p(2), auto: ANY }],
  'Blackcliff Longsword': BLACKCLIFF,
  'Sapwood Blade': [{ root: ['em'], s: p(1), auto: { cd: p(2) } }],
  "Xiphos' Moonlight": PERIODIC_PAIR('er', 'er-time'),
  'Toukabou Shigure': [{ root: ['dmgPct'], s: p(0), auto: { cd: p(2) } }],
  'Wolf-Fang': [{ buff: 'taxa-hab', s: p(1), auto: SKILL }, { buff: 'taxa-sup', s: p(4), auto: BURST }],
  'Finale of the Deep': [{ root: ['atkPct'], s: p(1), auto: USE_SKILL }, { buff: 'vinculo', s: p(5) }],
  'Fleuve Cendre Ferryman': [{ root: ['er'], s: p(2), auto: USE_SKILL }],
  "The Dockhand's Assistant": SYMBOLS,
  'Flute of Ezpitzal': [{ root: ['defPct'], s: p(1), auto: USE_SKILL }],
  "Serenity's Call": [{ root: ['hpPct'], s: p(1), auto: ANY }, { buff: 'moonsign', s: p(1), auto: ANY }],
  "Heretic's Molten Blade": [{ root: ['atkPct'], s: p(0), auto: { ...USE_SKILL, cd: p(1) } }, { buff: 'distancia', s: p(0), auto: { ...USE_SKILL, cd: p(1) } }],
  Emberwell: [{ root: ['atkPct'], s: p(1), auto: ANY }, { buff: 'estelar', s: p(3), auto: ANY }],
  'New Bough': [{ buff: 'stacks', s: p(1), auto: ANY }, { buff: 'radiance', s: p(1) }],
  'Silver Light': [{ buff: 'stacks', s: p(1), auto: USE_SKILL }],
  'Freedom-Sworn': [{ team: true, s: p(2), auto: { cd: p(5) } }, { buff: 'cancao', s: p(2), auto: { cd: p(5) } }],
  'Summit Shaper': SHIELD_STACKS,
  'Mistsplitter Reforged': [{ buff: 'emblema', s: p(5), auto: { on: ['normal', 'burst'] } }],
  'Haran Geppaku Futsu': [{ buff: 'stacks', s: p(4), auto: USE_SKILL }],
  'Key of Khaj-Nisut': each(['em-hp', 'em-time'], p(2), SKILL),
  'Light of Foliar Incision': [{ flat: 'DMG por Maestria', s: p(3), auto: NORMAL }],
  'Splendor of Tranquil Waters': [{ buff: 'stacks-2', s: p(4), auto: ANY }, { buff: 'stacks-3', s: p(1), auto: ANY }],
  'Uraku Misugiri': [{ buff: 'geo', s: p(4), auto: ANY }],
  Absolution: [{ buff: 'vinculo', s: p(2), auto: ANY }],
  'Peak Patrol Song': [{ buff: 'stacks', s: p(1), auto: { on: ['normal', 'plunge'] } }, { buff: 'def-time', s: p(6), auto: { on: ['normal', 'plunge'] } }],
  Azurelight: each(['habilidade', 'sem-energia'], p(1), USE_SKILL),
  'Athame Artis': each(['lamina', 'time', 'hex', 'hext'], p(1), BURST),
  'Lightbearing Moonshard': [{ buff: 'lcr', s: p(1), auto: USE_SKILL }],
  'Whitelake Frostfeather': each(['stacks', 'crit'], p(2), SKILL),
  'Exaiphanes Blade': [{ root: ['atkPct'], s: p(1), auto: ANY }],
  'Beyond the Chrysalis': [{ root: ['critDmg'], label: 'Winds of Devotion', s: p(3), auto: { ...USE_SKILL_BURST, seq: [0, 3] } }, { buff: 'defiance', s: p(3), auto: { ...USE_SKILL_BURST, seq: [1, 3] } }],

  // ---------- Espadões ----------
  'Skyrider Greatsword': [{ buff: 'stacks', s: lit(6), auto: NA_CA }],
  'The Bell': [{ root: ['dmgPct'], s: lit(10), auto: { cd: p(1) } }],
  Whiteblind: [{ buff: 'stacks', s: lit(6), auto: NA_CA }],
  'Blackcliff Slasher': BLACKCLIFF,
  'Makhaira Aquamarine': PERIODIC_PAIR('em-atk', 'em-atk-time'),
  'Forest Regalia': [{ root: ['em'], s: p(1), auto: { cd: p(2) } }],
  'Mailed Flower': [{ root: ['atkPct', 'em'], s: p(0), auto: ANY }],
  'Talking Stick': [{ buff: 'pyro', s: p(2), auto: ANY }, { buff: 'outros', s: p(3), auto: ANY }],
  'Tidal Shadow': [{ root: ['atkPct'], s: p(1), auto: ANY }],
  'Portable Power Saw': SYMBOLS,
  'Fruitful Hook': [{ root: ['dmgPctByType'], s: p(2), auto: PLUNGE }],
  'Earth Shaker': [{ root: ['dmgPctByType'], s: p(1), auto: { by: 'team' } }],
  'Flame-Forged Insight': [{ root: ['em'], s: p(2), auto: ANY }],
  'Master Key': [{ root: ['em'], s: p(1), auto: ANY }, { buff: 'moonsign', s: p(1), auto: ANY }],
  'Forged by the Golden Melody': [
    { root: ['atkPct'], label: 'Harmonic Movement (ATK)', s: p(3), auto: { periodic: true, cd: p(3), seq: [0, 3] } },
    { buff: 'em', s: p(3), auto: { periodic: true, cd: p(3), seq: [1, 3] } },
    { buff: 'estelar', s: p(3), auto: { periodic: true, cd: p(3), seq: [2, 3] } },
    ...each(['contra-atk', 'contra-em', 'contra-estelar'], p(4)),
  ],
  'Blade of Atonement': [{ root: ['em'], s: p(1), auto: ANY }, { buff: 'atk', s: p(3) }],
  "Wolf's Gravestone": [{ buff: 'lobo', s: lit(12) }],
  'Song of Broken Pines': [{ team: true, s: p(2), auto: { ...NA_CA, cd: p(5) } }],
  'The Unforged': SHIELD_STACKS,
  'Beacon of the Reed Sea': [{ buff: 'habilidade', s: p(1), auto: SKILL }, { buff: 'dano', s: p(3), auto: ANY }],
  Verdict: [{ buff: 'stacks', s: p(1), auto: ANY }],
  'Fang of the Mountain King': [{ buff: 'stacks', s: p(3), auto: SKILL }],
  'A Thousand Blazing Suns': [
    { root: ['atkPct', 'critDmg'], label: 'Scorching Brilliance', s: p(3), auto: SUNS, pausesFor: NATLAN },
    { buff: 'nightsoul', s: p(3), auto: SUNS, wielders: NATLAN, pausesFor: NATLAN },
  ],
  'Gest of the Mighty Wolf': each(['stacks', 'hex'], p(3), { on: ['normal', 'charged', 'skill'] }),
  'A Teaspoon of Transcendence': [{ buff: 'estelar', s: p(2), auto: CHARGED }],

  // ---------- Lanças ----------
  'Prototype Starglitter': [{ buff: 'stacks', s: lit(12), auto: USE_SKILL }],
  'Crescent Pike': [{ flat: 'Dano extra de Normal e Carregado por ATK', s: lit(5), auto: USE_SKILL }],
  'Blackcliff Pole': BLACKCLIFF,
  Moonpiercer: [{ root: ['atkPct'], s: p(1), auto: { cd: p(2) } }],
  'Missive Windspear': [{ root: ['atkPct', 'em'], s: p(2), auto: ANY }],
  "Prospector's Drill": SYMBOLS,
  'Mountain-Bracing Bolt': [{ buff: 'aliado', s: p(3), auto: { ...USE_SKILL, by: 'others' } }],
  'Footprint of the Rainbow': [{ root: ['defPct'], s: p(1), auto: USE_SKILL }],
  'Tamayuratei no Ohanashi': [{ root: ['atkPct'], s: p(2), auto: USE_SKILL }],
  "Sacrificer's Staff": [{ buff: 'stacks', s: p(0), auto: SKILL }],
  'Sturdy Bone': [{ flat: 'DMG do Normal por ATK', s: p(3), auto: ANY }],
  Frostbreath: [{ root: ['atkPct'], s: p(1), auto: ANY }],
  'Vortex Vanquisher': SHIELD_STACKS,
  'Primordial Jade Winged-Spear': [{ root: ['dmgPct'], label: 'DMG com todos os stacks', s: lit(6), auto: ANY }, { buff: 'stacks', s: lit(6), auto: ANY }],
  'Calamity Queller': [{ buff: 'stacks', s: p(4), auto: SKILL }, { buff: 'fora', s: p(4) }],
  'Engulfing Lightning': [{ buff: 'recarga', s: p(3), auto: USE_BURST }],
  'Staff of the Scarlet Sands': [{ buff: 'dream', s: p(2), auto: SKILL }],
  'Lumidouce Elegy': [{ buff: 'stacks', s: p(2), auto: ANY }],
  'Symphonist of Scents': each(['echoes', 'echoes-self'], p(3)),
  'Fractured Halo': [{ root: ['atkPct'], s: p(1), auto: USE_SKILL_BURST }, { buff: 'edict', s: p(3) }],
  'Bloodsoaked Ruins': [{ buff: 'lc', s: p(0), auto: USE_BURST }, { buff: 'requiem', s: p(2) }],
  'Disaster and Remorse': [
    // Cada um se alonga com os acertos do outro tipo enquanto o Caminho do Conflito durar.
    ...each(['unforgivable', 'hex'], p(1), { ...USE_SKILL, cd: p(6), extend: { on: ['skill', 'burst'], add: p(4), max: lit(14) } }),
    ...each(['irreparable', 'hex-hab'], p(1), { ...USE_SKILL, cd: p(6), extend: { on: ['normal', 'charged'], add: p(4), max: lit(14) } }),
  ],

  // ---------- Catalisadores ----------
  'Thrilling Tales of Dragon Slayers': [{ buff: 'time', s: p(1), auto: { ...USE_SKILL_BURST, cd: p(2) } }],
  'Emerald Orb': [{ root: ['atkPct'], s: lit(12), auto: ANY }],
  'Twin Nephrite': [{ root: ['atkPct'], s: p(1), auto: ANY }],
  'The Widsith': each(['recitativo', 'aria', 'interludio'], p(3)),
  'Solar Pearl': [{ buff: 'hab-sup', s: lit(6), auto: NORMAL }, { buff: 'normal', s: lit(6), auto: SKILL_BURST }],
  'Mappa Mare': [{ buff: 'stacks', s: lit(10), auto: ANY }],
  'Blackcliff Agate': BLACKCLIFF,
  'Wine and Song': [{ root: ['atkPct'], s: p(1), auto: ANY }],
  'Dodoco Tales': [{ buff: 'carregado', s: p(1), auto: NORMAL }, { buff: 'atk', s: p(3), auto: CHARGED }],
  'Hakushin Ring': each(['elemental', 'pyro', 'hydro', 'cryo', 'dendro', 'anemo', 'geo'], p(1)),
  'Oathsworn Eye': [{ root: ['er'], s: p(1), auto: USE_SKILL }],
  'Wandering Evenstar': PERIODIC_PAIR('em-atk', 'em-atk-time'),
  'Fruit of Fulfillment': [{ buff: 'stacks', s: p(3), auto: ANY }],
  'Flowing Purity': [{ buff: 'habilidade', s: p(1), auto: USE_SKILL }, { buff: 'vinculo', s: p(5), auto: USE_SKILL }],
  'Ballad of the Boundless Blue': [{ buff: 'stacks', s: p(0), auto: NA_CA }],
  'Waveriding Whirl': [{ root: ['hpPct'], s: p(2), auto: { ...USE_SKILL, cd: p(3) } }, { buff: 'hydro', s: p(2), auto: { ...USE_SKILL, cd: p(3) } }],
  'Ring of Yaxche': [{ buff: 'hp-normal', s: p(2), auto: USE_SKILL }],
  'Etherlight Spindlelute': [{ root: ['em'], s: p(1), auto: USE_SKILL }],
  'Dawning Frost': [{ buff: 'carregado', s: p(1), auto: CHARGED }, { buff: 'habilidade', s: p(3), auto: SKILL }],
  'Clash of Kings': [{ root: ['atkPct', 'em'], s: p(2), auto: { ...USE_SKILL, cd: p(3), extend: { on: ['charged'], add: p(4), max: p(4) } } }],
  'Echoes of the Heart': [{ root: ['em'], s: p(2), auto: ANY }, { buff: 'estelar', s: p(3), auto: ANY }],
  "Jadefall's Splendor": [{ buff: 'hp-dmg', s: p(2), auto: USE_BURST }],
  "Kagura's Verity": [{ root: ['dmgPct'], label: 'DMG com 3 stacks', s: p(1), auto: USE_SKILL }, ...each(['stacks', 'estelar'], p(1), USE_SKILL)],
  "Tulaytullah's Remembrance": [{ buff: 'stacks', s: p(2), auto: USE_SKILL }],
  'Cashflow Supervision': [{ buff: 'stacks', s: p(0), auto: ANY }],
  'Tome of the Eternal Flow': [{ buff: 'stacks', s: p(0), auto: ANY }],
  "Crane's Echoing Call": [{ buff: 'imersivo', s: p(3), auto: PLUNGE }],
  "Surf's Up": [{ buff: 'stacks', s: p(2), auto: { ...USE_SKILL, cd: p(1) } }],
  "Starcaller's Watch": [{ team: true, s: p(1) }],
  'Sunny Morning Sleep-In': [{ buff: 'redemoinho', s: p(3), auto: ANY }, { buff: 'habilidade', s: p(4), auto: SKILL }, { buff: 'supremo', s: p(5), auto: BURST }],
  'Vivid Notions': [{ buff: 'dawn', s: p(1), auto: PLUNGE }, { buff: 'twilight', s: p(1), auto: SKILL_BURST }],
  "Nightweaver's Looking Glass": [{ buff: 'oracao', s: p(3), auto: SKILL }, { buff: 'lua', s: p(1), auto: { by: 'team' } }, { buff: 'florescer', s: p(3), auto: SKILL }],
  'Reliquary of Truth': [{ buff: 'segredo', s: p(2), auto: SKILL }, { buff: 'verdade', s: p(3), auto: ANY }, { buff: 'ambos', s: p(3), auto: SKILL }],
  "Nocturne's Curtain Call": [{ buff: 'vinho', s: p(2), auto: ANY }],
  "Angelos' Heptades": each(['luz', 'luz-hex'], p(4)),
  'Hymn of the Maelstrom': [...each(['stacks', 'hp-atk'], p(4), ANY), ...each(['reforco-hp', 'reforco-atk'], p(6))],
  'Starsealed Edict': each(['crystal', 'stacks', 'radiance'], p(3), USE_SKILL),
  'Song of the Vigil': [{ buff: 'atk', s: p(3) }],
  'Memory of Dust': SHIELD_STACKS,

  // ---------- Arcos ----------
  'Prototype Crescent': [{ root: ['atkPct'], s: p(2), auto: CHARGED }],
  'Compound Bow': [{ buff: 'stacks', s: lit(6), auto: NA_CA }],
  'Blackcliff Warbow': BLACKCLIFF,
  'Mitternachts Waltz': [{ buff: 'habilidade', s: p(1), auto: NORMAL }, { buff: 'normal', s: p(3), auto: SKILL }],
  'Windblume Ode': [{ root: ['atkPct'], s: p(1), auto: USE_SKILL }],
  "King's Squire": [{ root: ['em'], s: p(1), auto: { ...USE_SKILL_BURST, cd: p(3) } }],
  'Ibis Piercer': [{ buff: 'stacks', s: p(1), auto: CHARGED }],
  'Scion of the Blazing Sun': [{ root: ['dmgPctByType'], s: p(2), auto: CHARGED }],
  'Song of Stillness': [{ root: ['dmgPct'], s: p(1), auto: ANY }],
  Cloudforged: [{ buff: 'stacks', s: p(1), auto: USE_BURST }],
  'Range Gauge': SYMBOLS,
  'Flower-Wreathed Feathers': [{ buff: 'stacks', s: p(4), auto: CHARGED }],
  'Snare Hook': [{ root: ['em'], s: p(1), auto: ANY }, { buff: 'moonsign', s: p(1), auto: ANY }],
  "Rainbow Serpent's Rain Bow": [{ root: ['atkPct'], s: p(0), auto: ANY }],
  'Covenant of Frost and Snow': [{ root: ['em'], s: p(1), auto: USE_SKILL }],
  'Breezeborne Refrain': [{ buff: 'viper', s: p(3), auto: SKILL_BURST }],
  'Elegy for the End': [{ buff: 'cancao', s: p(2), auto: { ...SKILL_BURST, cd: p(5) } }],
  'Polar Star': [{ buff: 'nightstar', s: p(1), auto: { on: ['normal', 'charged', 'skill', 'burst'] } }],
  'Thundering Pulse': [{ buff: 'emblema', s: p(5), auto: { on: ['normal', 'skill'] } }],
  "Hunter's Path": [{ flat: 'DMG do Carregado por Maestria', s: p(3), auto: CHARGED }],
  'Silvershower Heartstrings': each(['remedy', 'crit-golpe'], p(3), USE_SKILL),
  "Astral Vulture's Crimson Plumage": [{ root: ['atkPct'], s: p(1), auto: ANY }],
  'Golden Frostbound Oath': [{ buff: 'favor', s: p(0), auto: SKILL }, ...each(['mischief-geo', 'mischief-lc'], p(0))],
};

export const SET_TIMING: Record<string, TimeCur[]> = {
  'Martial Artist': [{ root: ['dmgPctByType'], s: p(0), auto: USE_SKILL }],
  Instructor: [{ team: true, s: p(0), auto: ANY }],
  'Viridescent Venerer': [{ res: true, s: p(2), auto: ANY }],
  'Glacier and Snowfield': [{ root: ['dmgPct'], s: p(2), auto: BURST }],
  'Crimson Witch of Flames': [{ root: ['dmgPct'], label: 'Stack depois da Habilidade', s: p(4), auto: USE_SKILL }],
  'Noblesse Oblige': [{ team: true, s: p(1), auto: USE_BURST }],
  'Bloodstained Chivalry': [{ buff: 'carregado', s: p(0) }],
  'Archaic Petra': [{ buff: 'geo', s: p(1) }],
  'Heart of Depth': [{ root: ['dmgPctByType'], s: p(2), auto: USE_SKILL }],
  'Tenacity of the Millelith': [{ team: true, s: p(2), auto: SKILL }],
  'Pale Flame': each(['stacks', 'fisico'], p(1), SKILL),
  "Shimenawa's Reminiscence": [{ root: ['dmgPctByType'], s: p(2), auto: USE_SKILL }],
  'Husk of Opulent Dreams': [{ buff: 'stacks', s: p(4), auto: ANY }],
  'Vermillion Hereafter': [{ root: ['atkPct'], s: p(0), auto: USE_BURST }],
  'Deepwood Memories': [{ res: true, s: p(1), auto: SKILL_BURST }],
  'Gilded Dreams': each(['mesmo', 'outro'], p(2), { cd: p(3) }),
  'Desert Pavilion Chronicle': [{ root: ['dmgPctByType'], s: p(2), auto: CHARGED }],
  'Flower of Paradise Lost': [{ buff: 'stacks', s: p(3), auto: ANY }],
  "Nymph's Dream": each(['nymph-atk', 'nymph-dmg'], p(0), ANY),
  'Marechaussee Hunter': [{ buff: 'stacks', s: p(1), auto: ANY }],
  'Nighttime Whispers in the Echoing Woods': [{ root: ['dmgPct'], s: p(0), auto: USE_SKILL }],
  'Fragment of Harmonic Whimsy': [{ buff: 'stacks', s: p(1), auto: ANY }],
  'Scroll of the Hero of Cinder City': [{ buff: 'reacao', s: p(1), auto: ANY }, { buff: 'noite', s: p(3), auto: ANY, wielders: NATLAN }],
  'Obsidian Codex': [{ root: ['critRate'], s: p(2), auto: { cast: true }, wielders: NATLAN }],
  "Long Night's Oath": [{ buff: 'stacks', s: p(4), auto: { on: ['plunge', 'charged', 'skill'] } }],
  "Night of the Sky's Unveiling": each(['cr-n', 'cr-a', 'lunar'], p(0), ANY),
  "Silken Moon's Serenade": each(['em-n', 'em-a', 'lunar'], p(0), ANY),
  'A Day Carved From Rising Winds': [{ root: ['atkPct'], s: p(0), auto: ANY }],
  'Scarlet Proof': [{ buff: 'taxa', s: p(2) }],
  // Vale mesmo fora de campo: abre a cada uso da Habilidade do portador.
  'Celestial Gift': each(['luz', 'cantico'], p(1), USE_SKILL),
  'Heart of the Furnace': [{ buff: 'atk', s: p(2) }, { buff: 'estelar', s: p(2), auto: ANY }],
};

const PROC = 'O tempo é o intervalo do golpe extra, que entra no plano de combate como um golpe.';
const STATE = 'Sem duração fixa: depende de estar em campo ou fora dele, de uma rampa ou de um estado.';
const UNMODELED = 'A parte com duração ainda não está no cálculo (ver a nota do efeito).';

/** Cita tempo no texto, mas não vira janela. Armas e sets "sem efeito no dano" (`noDamage`) não precisam entrar aqui. */
export const NO_WINDOW: Record<string, string> = {
  'Fillet Blade': PROC, 'The Flute': PROC, 'Sword of Narzissenkreuz': PROC, 'Aquila Favonia': PROC, 'Skyward Blade': PROC, 'Debate Club': PROC,
  'Prototype Archaic': PROC, 'Snow-Tombed Starsilver': PROC, 'Luxurious Sea-Lord': PROC, 'Skyward Pride': PROC, Halberd: PROC, 'Dragonspine Spear': PROC,
  'Skyward Spine': PROC, 'Eye of Perception': PROC, Frostbearer: PROC, 'Ash-Graven Drinking Horn': PROC, 'Skyward Atlas': PROC, Messenger: PROC,
  'The Viridescent Hunt': PROC, 'End of the Line': PROC, 'Sequence of Solitude': PROC, 'Skyward Harp': PROC,
  'The Black Sword': 'O tempo é só o intervalo da cura.',
  'The Alley Flash': 'O tempo é o castigo por tomar dano; o bônus vale sempre.',
  'Cinnabar Spindle': 'O tempo é só o intervalo do dano fixo, que vale em cada Habilidade.',
  'Crimson Moon\'s Semblance': 'O tempo é só o intervalo do Vínculo.',
  'Everlasting Moonglow': 'O tempo é só da energia.',
  'Katsuragikiri Nagamasa': 'O tempo é só da energia.',
  'Kitain Cross Spear': 'O tempo é só da energia.',
  Slingshot: 'O tempo é o voo da flecha.',
  "Amos' Bow": 'O tempo é o voo da flecha.',
  'Serpent Spine': STATE, 'Lost Prayer to the Sacred Winds': STATE, 'Sacrificial Jade': STATE, 'Alley Hunter': STATE, 'Fading Twilight': STATE, 'The Daybreak Chronicles': STATE,
  'Unfinished Reverie': STATE, Adventurer: 'O tempo é só da cura.', 'Golden Troupe': STATE, 'Aubade of Morningstar and Moon': STATE,
  'Finale of the Deep Galleries': 'O tempo é a trava entre Normal e Supremo, que o motor já aplica golpe a golpe.',
  'Thundering Fury': 'O tempo é só o da recarga da Habilidade.',
  "Vourukasha's Glow": UNMODELED, 'Ocean-Hued Clam': UNMODELED, 'Echoes of an Offering': UNMODELED, 'Song of Days Past': UNMODELED,
};

/**
 * Passivas, constelações e talentos de personagem com duração no texto (decisão do Davi, #75): quantos segundos e
 * que golpes abrem a janela sozinha. A chave é o id do buff; num buff fixo, vale para o dano fixo dele. Todo número é
 * conferido por `curate-effects.ts` no texto do Lunaris (o do próprio buff ou o de `from`) ou lido da linha do
 * talento (`row`). Sem `auto`, a condição não aparece na rotação (abater, apanhar, sorteio) e o usuário cria a janela,
 * já com a duração. `CHARACTER_NO_WINDOW` lista os buffs de janela que o texto não limita no tempo.
 * `tests/data/charTiming.test.ts` trava: nenhum buff de janela fica fora das duas listas.
 */
import type { HitType } from '../../src/data/schema';

export interface CharAuto {
  /** Tipos de golpe que abrem a janela (vazio = qualquer golpe). */
  on?: HitType[];
  by?: 'team';
  /** Espera entre ativações (s), conferida no texto. */
  cd?: number;
  /** "Ao usar": as execuções seguintes de um golpe contínuo não abrem. */
  cast?: true;
  /** Só os golpes cujo nome contém um destes trechos (toque ou segurado). */
  labels?: string[];
  extend?: { on: HitType[]; add: number; max: number; every?: number };
  /** Acúmulos que o 1º golpe de um aliado com a reação gasta (ver `AutoWindow.consume`). */
  consume?: { reaction: 'vaporize' };
}

export interface CharTime {
  s?: number;
  /** Linha de duração do talento (muda com o nível quando o jogo muda). */
  row?: ['skill' | 'burst', string];
  /** Texto onde o número `s` está, se não for o do próprio buff: `p1`, `const2`... */
  from?: string;
  /** A partir da constelação, soma segundos; `check` é o trecho a conferir no texto dela. */
  plus?: [constellation: number, seconds: number, check: string, from: string];
  /** A janela começa tanto depois do golpe (ex.: quando o estado do talento acaba). */
  delay?: number | ['skill' | 'burst', string];
  auto?: CharAuto;
  /** Só com Hexerei: Secret Rite e o dono Hexerei: golpes que alongam a janela (texto da passiva `from`). */
  hex?: { on: HitType[]; add: number; max: number; every: number; from: string };
  /** Segundos que o efeito ainda dura depois da janela, e o texto onde está o número. */
  tail?: [seconds: number, from: string];
}

const SKILL: CharAuto = { on: ['skill'] };
const BURST: CharAuto = { on: ['burst'] };
const BOTH: CharAuto = { on: ['skill', 'burst'] };
const NORMAL: CharAuto = { on: ['normal'] };
const CHARGED: CharAuto = { on: ['charged'] };
const USE_SKILL: CharAuto = { ...SKILL, cast: true };
const USE_BURST: CharAuto = { ...BURST, cast: true };
const USE_BOTH: CharAuto = { ...BOTH, cast: true };
/** Condição que a rotação não mostra (reação, Nightsoul Burst): qualquer golpe do dono ou do time abre. */
const OWN: CharAuto = {};
const TEAM: CharAuto = { by: 'team' };

const t = (s: number, auto?: CharAuto, more: Omit<CharTime, 's' | 'auto'> = {}): CharTime => ({ s, ...(auto ? { auto } : {}), ...more });
const r = (talent: 'skill' | 'burst', key: string, auto?: CharAuto, more: Omit<CharTime, 'row' | 'auto'> = {}): CharTime => ({ row: [talent, key], ...(auto ? { auto } : {}), ...more });
/** Vários buffs com o mesmo tempo e o mesmo gatilho. */
const each = (ids: string[], time: CharTime): Record<string, CharTime> => Object.fromEntries(ids.map((id) => [id, time]));

const SHENHE = r('burst', 'Duration', USE_BURST, { plus: [2, 6, '6 seconds', 'const2'] });
const OMEN: CharTime = r('burst', 'Omen Duration', USE_BURST, { hex: { on: ['normal', 'charged'], add: 2, max: 8, every: 0.5, from: 'p4' } });
const GEO_TRAVELER: Record<string, CharTime> = { c1: r('burst', 'Stonewall Duration', USE_BURST) };
const ELECTRO_TRAVELER: Record<string, CharTime> = { c2: t(8, BURST) };
const DENDRO_TRAVELER = each(['a1', 'c6', 'c6h', 'c6e', 'c6p'], r('burst', 'Lea Lotus Lamp Duration', USE_BURST));
const PYRO_TRAVELER: Record<string, CharTime> = { c4: t(9, USE_BURST) };
const CRYO_TRAVELER: Record<string, CharTime> = { ...each(['c2', 'c2x'], t(5, SKILL)), c6: t(15, USE_BURST) };

export const CHARACTER_TIMING: Record<string, Record<string, CharTime>> = {
  Mavuika: { a1: t(10, TEAM), a4: t(20, USE_BURST), c1: t(8, TEAM), c4: t(20, USE_BURST, { from: 'p2' }) },
  Citlali: { ...each(['a1', 'c2r'], t(12, TEAM)), ...each(['c2team', 'c6t', 'c6s'], r('skill', 'Itzpapa Duration', USE_SKILL)) },
  Iansan: { a1: t(15, CHARGED), c2: t(15, USE_BURST), c6: t(3, USE_BURST), escala: r('burst', 'Duration', USE_BURST, { plus: [6, 3, '3s', 'const6'] }) },
  Bennett: each(['c1', 'c6', 'inspiracao'], r('burst', 'Duration', USE_BURST)),
  Lyney: { c4: t(6, CHARGED) },
  'Shikanoin Heizou': { a4: t(10, SKILL) },
  'Raiden Shogun': { c4: t(10, USE_BURST, { delay: ['burst', 'Musou Isshin Duration'] }), c2: r('burst', 'Musou Isshin Duration', USE_BURST) },
  Skirk: { c2: t(12.5, BURST), burst: r('skill', 'Seven-Phase Flash Mode Duration', BURST), a4b: t(20, TEAM), c4: t(20, TEAM, { from: 'p2' }) },
  Xiangling: { a4: t(10, USE_SKILL), c6: r('burst', 'Duration', USE_BURST, { plus: [4, 4, '40%', 'const4'] }), c1: t(6, SKILL) },
  Yelan: { c4: t(25, USE_SKILL), a4: r('burst', 'Duration', USE_BURST) },
  'Hu Tao': { a1: t(8, USE_SKILL, { delay: ['skill', 'Duration'] }), c4: t(15), c6: t(10), paramita: r('skill', 'Duration', USE_SKILL) },
  Ganyu: { a1: t(5, CHARGED), c1: t(6, CHARGED), ...each(['a4', 'c4'], r('burst', 'Duration', USE_BURST)) },
  'Kamisato Ayaka': { a1: t(6, USE_SKILL), a4: t(10, OWN), c6: t(0.5, { on: ['charged'], cd: 10 }), c4: t(6, BURST) },
  Xingqiu: { c4: r('burst', 'Duration', USE_BURST, { plus: [2, 3, '3s', 'const2'] }), c2: t(4, BURST) },
  Albedo: { a4: t(10, USE_BURST), c1: t(20, USE_SKILL), c4: t(3, { on: ['plunge'] }), ...each(['c6', 'a4hs', 'a4hx'], t(20, USE_SKILL)) },
  Diluc: { a4: r('burst', 'Infusion Duration', USE_BURST, { plus: [0, 4, '4s', 'p2'] }), c2: t(10), c4: t(2, USE_SKILL, { delay: 2 }), c6: t(6, USE_SKILL) },
  Klee: { c1: t(12), ...each(['c6s', 'c6o'], t(25, USE_BURST)), c2: t(10, SKILL) },
  'Yae Miko': { c4: t(5, SKILL), c1: t(10, OWN), c2: r('skill', 'Duration', USE_SKILL) },
  Eula: { c1: t(6, BOTH), ...each(['skill', 'skill-fis'], r('skill', 'RES Decrease Duration', USE_SKILL)) },
  Alhaitham: { c2: t(8, { on: ['skill', 'charged', 'plunge', 'burst'] }), c6: t(6, { on: ['skill', 'charged', 'plunge', 'burst'] }), ...each(['c4m', 'c4d'], t(15, USE_BURST)) },
  Gorou: { a1: t(12, USE_BURST), ...each(['skill-def', 'skill'], r('skill', 'Duration', USE_BOTH)), c6: t(12, USE_BOTH) },
  Shenhe: { a1: SHENHE, c2: SHENHE, burst: SHENHE, a4: t(10, { ...USE_SKILL, labels: ['Press'] }), a4h: t(15, { ...USE_SKILL, labels: ['Hold'] }), c4: t(60, USE_SKILL) },
  'Yun Jin': { c2: t(12, USE_BURST), c4: t(12, OWN) },
  Thoma: { c6: t(6, BOTH) },
  Nilou: { a1: t(30, USE_SKILL), c4: t(8, SKILL), ...each(['c2', 'c2d'], t(10, TEAM)) },
  Neuvillette: { c2: t(30, TEAM, { from: 'p1' }) },
  Wriothesley: each(['a4', 'c2n'], r('skill', 'Duration', USE_SKILL)),
  Clorinde: { c6: t(12, USE_SKILL), a4: t(15, OWN), ...each(['a1', 'c2'], t(15, TEAM)) },
  Navia: { a1: t(4, USE_SKILL), c4: t(8, BURST) },
  Kinich: { c2: t(6, SKILL), a4: t(15, TEAM) },
  Chiori: { a4: t(20, { by: 'team', on: ['skill'] }) },
  Barbara: { c2: r('skill', 'Duration', USE_SKILL) },
  Razor: { c1: t(8, USE_SKILL), c6: t(15, USE_BOTH), c4: t(7, SKILL) },
  Amber: { a4: t(10, CHARGED), c6: t(10, USE_BURST) },
  Xinyan: { a4: r('skill', 'Shield Duration', USE_SKILL), c4: t(12, SKILL) },
  Mika: each(['a1', 'a4', 'c6'], r('skill', 'Soulwind Duration', USE_SKILL)),
  Venti: { c4: t(10, USE_BOTH), c2: t(10, SKILL), ...each(['c6', 'c6cd'], r('burst', 'Duration', USE_BURST)) },
  Beidou: { a4: t(10, USE_SKILL), c6: r('burst', 'Duration', USE_BURST) },
  Xiao: { ...each(['burst', 'a1'], r('burst', 'Duration', USE_BURST)), a4: t(7, USE_SKILL) },
  Ningguang: { a4: t(10, USE_SKILL) },
  Noelle: each(['c6', 'burst'], r('burst', 'Duration', USE_BURST)),
  Qiqi: { a4rad: r('skill', 'Duration', USE_SKILL), c6: t(12, USE_BURST) },
  Chongyun: { a4: t(8, USE_SKILL, { delay: ['skill', 'Field Duration'] }) },
  Diona: each(['c6', 'c6rad'], r('burst', 'Duration', USE_BURST)),
  // C1: 8 s depois de cada acerto num inimigo com Presságio, então até 8 s depois do fim dele.
  Mona: {
    c2: t(12, CHARGED), burst: OMEN, c1: { ...OMEN, tail: [8, 'const1'] }, ...each(['c4', 'c4h', 'c6omen'], OMEN), c6: t(8, { on: ['burst', 'charged'] }),
    hexglow: t(8, { on: ['normal', 'charged'], consume: { reaction: 'vaporize' } }),
  },
  Keqing: { c4: t(10, OWN), a4: t(8, USE_BURST), c6: t(8, OWN) },
  Sucrose: {
    a1: t(8, OWN), a4: t(8, BOTH), p4s: t(15, USE_SKILL), p4l: t(20, USE_BURST),
    ...each(['c6', 'c6hex'], r('burst', 'Duration', USE_BURST, { plus: [2, 2, '2s', 'const2'] })),
  },
  Rosaria: { a1: t(5, USE_SKILL), c1: t(4, OWN), c6: t(10, BURST) },
  Yoimiya: { a1: t(3, NORMAL), ...each(['a4', 'a4s'], t(15, USE_BURST)), c1: t(20), c2: t(6, OWN) },
  'Sangonomiya Kokomi': { c6: t(4, { on: ['normal', 'charged'] }), burst: r('burst', 'Duration', USE_BURST) },
  'Kujou Sara': each(['skill', 'c6'], r('skill', 'ATK Bonus Duration', USE_BOTH)),
  'Arataki Itto': { burst: r('burst', 'Duration', USE_BURST), c4: t(10, USE_BURST, { delay: ['burst', 'Duration'] }) },
  Kirara: { c6: t(15, USE_BOTH) },
  Aloy: { ...each(['a1', 'a1o'], t(10, USE_SKILL)), ...each(['a4', 'rushing'], r('skill', 'Rushing Ice Duration', USE_SKILL)) },
  'Kamisato Ayato': {
    burst: r('burst', 'Duration', USE_BURST),
    ...each(['c2', 'namisen', 'namisen-c2'], r('skill', 'Takimeguri Kanka Duration', USE_SKILL)),
  },
  Collei: { c4: t(12, USE_BURST) },
  Tighnari: { a1: t(4, CHARGED), c2: r('skill', 'Vijnana-Khanda Field Duration', USE_SKILL), ...each(['c4', 'c4r'], t(8, USE_BURST)) },
  // O Pathclearer dura 10 s e cada Habilidade nele soma 4 s, até o teto de 18 s do texto.
  Cyno: { c2: t(4, NORMAL), burst: r('burst', 'Basic Duration', { ...USE_BURST, extend: { on: ['skill'], add: 4, max: 8 } }) },
  Nahida: { a1: r('burst', 'Base Duration', USE_BURST), ...each(['c2', 'c2c'], t(8, TEAM)), c4: r('skill', 'Seed of Skandha Duration', USE_SKILL) },
  Faruzan: each(['c6', 'burst', 'burst-res'], r('burst', 'Duration', USE_BURST)),
  Yaoyao: { c1: t(8, BOTH), c4: t(8, USE_BOTH) },
  Kaveh: { a4: r('burst', 'Duration', USE_BURST) },
  Baizhu: { c4: t(15, USE_BURST), ...each(['a4', 'a4lb', 'a4cat'], t(6, USE_BURST)) },
  Lynette: { c6: t(6, USE_SKILL), a1: t(10, USE_BURST), a4: r('burst', 'Bogglecat Box Duration', USE_BURST) },
  Freminet: { a4: t(5, OWN), ...each(['c4', 'c6'], t(6, OWN)) },
  Chevreuse: { c6: t(8, SKILL), a4: t(30, USE_SKILL), a1: t(6, TEAM) },
  Gaming: { c2: t(5) },
  Xianyun: { c2: t(15, USE_SKILL), a1: t(20, USE_SKILL), c6: t(16, USE_BURST) },
  Sigewinne: { a1: t(18, USE_SKILL), ...each(['c6', 'c6d'], t(15, USE_BOTH)), c2: t(8, SKILL) },
  Arlecchino: { c6: t(20, { ...USE_BURST, cd: 15 }) },
  Sethos: { c2: t(10, CHARGED), c4: t(10, { on: ['charged', 'burst'] }), a4: t(5, { on: ['charged'], cd: 15 }) },
  Emilie: { c2: t(10, BOTH), c6: t(5, { ...USE_BOTH, cd: 12 }) },
  Kachina: { a1: t(12, TEAM), c4: r('burst', 'Field Duration', USE_BURST) },
  Xilonen: {
    a1: r('skill', 'Nightsoul Point Time Limit', USE_SKILL), ...each(['c2geo', 'c2pyro', 'c2hydro', 'c2cryo'], r('skill', 'Source Sample Activation Duration', USE_SKILL)),
    a4: t(15, TEAM), c4: t(15, USE_SKILL), c6: t(5, { on: ['normal', 'plunge'], cd: 15 }),
  },
  Mualani: { a4: t(20, TEAM) },
  Ororon: { c2: t(9, USE_BURST), c6: t(9, TEAM) },
  'Lan Yan': { c4: t(12, USE_BURST) },
  'Yumemizuki Mizuki': { a4: t(4, TEAM), ...each(['c1', 'c1s', 'c6', 'c2', 'c2d', 'skill-swirl', 'skill-stellar', 'p4em'], r('skill', 'Dreamdrifter Duration', USE_SKILL)) },
  Varesa: { a4: t(12, TEAM), ...each(['a1', 'a1fp'], t(5, USE_SKILL)), c1: t(5, { on: ['skill', 'plunge', 'burst'] }), c4dr: t(15, USE_BURST) },
  Ifa: { a4: t(10, TEAM), c4: t(15, USE_BURST) },
  Flins: { c2res: t(7, OWN) },
  Aino: { c1: t(15, USE_BOTH), ...each(['c6', 'c6g'], t(15, USE_BURST)) },
  Nefer: { ...each(['c2', 'a1'], t(8, OWN)), c4: r('skill', 'Shadow Dance Duration', USE_SKILL) },
  Durin: { c2: t(20, USE_BURST), ...each(['c6', 'c6dark', 'c6def'], t(6, BURST)), a1: t(6, TEAM), a1hex: t(6, TEAM, { from: 'p1' }), a4: t(20, USE_BURST), ...each(['c1p', 'c1d'], t(20, USE_BURST)) },
  Jahoda: { a4: t(6, USE_BURST), c6: t(20, USE_SKILL) },
  Columbina: { a1: t(10, TEAM), ...each(['c2', 'c2lc', 'c2lb', 'c2lcr', 'c6lc', 'c6lb', 'c6lcr'], t(8, TEAM)), domain: r('burst', 'Lunar Domain Duration', USE_BURST) },
  Illuga: { ...each(['a1', 'a1g'], t(20, USE_BOTH)), ...each(['c6', 'c6g'], t(20, USE_BOTH, { from: 'p1' })), c4: r('burst', 'Duration', USE_BURST) },
  Varka: { ...each(['c4', 'c4-pyro', 'c4-hydro', 'c4-cryo', 'c4-electro'], t(10, OWN)), a4: t(8, TEAM), ...each(['a1m', 'a1m2'], r('skill', 'Sturm und Drang Duration', USE_SKILL)) },
  Lohen: { ...each(['a4', 'a4o'], t(8, TEAM)), c2: t(8, BOTH), a4hex: t(6, BOTH) },
  'Aether (Geo)': GEO_TRAVELER, 'Lumine (Geo)': GEO_TRAVELER,
  'Aether (Electro)': ELECTRO_TRAVELER, 'Lumine (Electro)': ELECTRO_TRAVELER,
  'Aether (Dendro)': DENDRO_TRAVELER, 'Lumine (Dendro)': DENDRO_TRAVELER,
  'Aether (Pyro)': PYRO_TRAVELER, 'Lumine (Pyro)': PYRO_TRAVELER,
  'Aether (Cryo)': CRYO_TRAVELER, 'Lumine (Cryo)': CRYO_TRAVELER,
  Linnea: { c2: t(8, TEAM), c4: t(5, TEAM), c1: t(10, USE_SKILL), c6: t(10, USE_SKILL, { from: 'const1' }) },
  Prune: {
    a4: t(5, BOTH), c2: r('burst', 'Hunter-Seeker Mode Duration', USE_BURST, { plus: [6, 4, '4s', 'const6'] }),
    c6: t(5, TEAM), 'hex-self': t(5, TEAM), 'hex-trig': t(5, TEAM),
  },
  Mitya: { ...each(['c1', 'a1', 'c2em', 'c2res', 'c2emo'], r('skill', 'Detection Core Duration', USE_SKILL)), a4: t(15, OWN) },
  Valeriy: { c2: t(18, USE_SKILL), c6: t(7, { on: ['charged', 'burst'] }) },
  // Cura, trompa e vórtice se repetem enquanto a Canção dura: a janela acompanha o estado da Habilidade.
  Vodyanitsa: { ...each(['c2', 'c6', 'c4', 'c1', 'c2s', 'c6s', 'skill', 'burst'], r('skill', 'Duration', USE_SKILL)), a1: t(6, TEAM) },
  'Kaedehara Kazuha': { a4: t(8, OWN), c6: t(5, USE_BOTH), c2: r('burst', 'Duration', USE_BURST) },
  Escoffier: { c1: t(15, USE_BOTH), a4: t(12, BOTH), c2: t(15, USE_SKILL) },
  Yanfei: { burst: r('burst', 'Duration', USE_BURST), a1: t(6, CHARGED) },
  Candace: { ...each(['burst', 'a4'], r('burst', 'Duration', USE_BURST)), c2: t(15, SKILL) },
  Zhongli: { shield: r('skill', 'Shield Duration', USE_SKILL) },
  Furina: { ...each(['burst', 'burst-c1', 'c2'], r('burst', 'Duration', USE_BURST)), c6: t(10, USE_SKILL) },
  Lisa: { a4: t(10, BURST) },
  'Kuki Shinobu': { c6: t(15) },
  Charlotte: { c2: t(12, SKILL) },
  Ineffa: { a4: t(20, USE_BURST), c1: t(20, USE_SKILL) },
  Lauma: {
    ...each(['a1n', 'a1a'], t(20, USE_SKILL)), ...each(['c2', 'c2lb', 'pale', 'palelb'], r('burst', 'Pale Hymn Duration', USE_BURST)),
    'skill-res': r('skill', 'Elemental RES Decrease Duration', SKILL),
  },
  Zibai: { c2: r('skill', 'Lunar Phase Shift Duration', USE_SKILL), c6: t(3, SKILL) },
  Nicole: {
    ...each(['c6', 'graca', 'a1', 'c2', 'c2res-pyro', 'c2res-hydro', 'c2res-electro', 'c2res-cryo', 'c2res-dendro', 'c2res-anemo', 'c2res-geo'], r('skill', 'Grace of Kenosis Duration', USE_SKILL)),
    c4: t(20, USE_SKILL),
  },
  Alyosha: each(['c6', 'hp'], r('skill', "Hunter's Precision Duration", USE_SKILL)),
  Odette: {
    ...each(['a1', 'c6', 'c2', 'c2res', 'c2res-electro', 'c2res-anemo'], r('skill', 'Solo Dance Double Duration', USE_BOTH)),
    c4: t(6, USE_BURST), burst: r('burst', "Snow Swan's Dream Duration", USE_BURST),
  },
  Fischl: { ...each(['hex-atk', 'hex-em'], t(10, TEAM)), ...each(['c6atk', 'c6em'], t(10, BOTH)) },
  Chasca: { c6: t(3, SKILL) },
};

const STATE = 'estado ou condição sem duração no texto';
const HP = 'depende do HP; o texto não dá duração';
const INSTANT = 'vale no próprio golpe; o texto não dá duração';
const COMP = 'depende da composição do time ou de acúmulos, sem duração';

/** Buffs de janela que o texto não limita no tempo: continuam com a janela do usuário. */
export const CHARACTER_NO_WINDOW: Record<string, Record<string, string>> = {
  Mavuika: { c6def: STATE, c2anel: STATE },
  Lyney: { c2: STATE },
  'Shikanoin Heizou': { c6: INSTANT, c6cd: INSTANT },
  'Hu Tao': { a4: HP },
  Diluc: { c1: HP },
  'Yae Miko': { c6: STATE },
  Qiqi: { c2atk: STATE },
  Jean: { c1: INSTANT, c4: STATE },
  Wriothesley: { a1: INSTANT, c1r: STATE, c2b: INSTANT, c6: INSTANT },
  Clorinde: { c4: INSTANT },
  Navia: { c2: INSTANT, c6: INSTANT },
  'Kamisato Ayato': { c1: HP },
  Wanderer: { a1pyro: STATE, a1cryo: STATE, c2: INSTANT },
  Razor: { c2: HP },
  Gaming: { a4: HP },
  Chongyun: { c6: HP },
  Sethos: { c1: INSTANT },
  Emilie: { a4: STATE },
  Freminet: { c1: INSTANT },
  Baizhu: { a1: HP },
  Charlotte: { c4: INSTANT },
  Sayu: { c2: INSTANT },
  Chasca: { a1: INSTANT },
  Cyno: { a1: INSTANT },
  Yanfei: { c2: HP, c6: COMP },
  Linnea: { a4: COMP },
  Vesna: { c2: STATE, a4atk: COMP, a4em: COMP, c4atk: COMP, c4em: COMP, c1: STATE },
  Lohen: { c6cd: STATE },
  Columbina: { c4lc: INSTANT, c4lcr: INSTANT },
  Ifa: { a1: STATE, c2: STATE },
  Varesa: { c4: INSTANT },
  Varka: { c6: STATE },
  'Aether (Pyro)': { c1: STATE, c1ns: STATE, c6: STATE },
  'Lumine (Pyro)': { c1: STATE, c1ns: STATE, c6: STATE },
  Sandrone: { c1: STATE },
  Alyosha: { a3: STATE },
  Odette: { c1: INSTANT },
};

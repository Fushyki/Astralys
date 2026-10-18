/**
 * Montagem dos stats de um personagem: bloco estático (ascensão, arma, sets, passivas, main stats),
 * buffs de time com etiquetas de ativação e stats finais dado um número de rolls de substat.
 *
 * Modelo derivado da aba "Cálculos" da planilha de referência. A diferença-chave: os "perfis de buff" da
 * planilha viram ETIQUETAS (tags). Cada ação da rotação diz quais etiquetas estão ativas; no editor visual
 * as janelas de tempo dos buffs preenchem isso.
 */
import type { Character, HitType, Weapon } from '../data/schema';
import type { CharacterEffect, SetEffect, WeaponEffect } from '../effects/schema';
import {
  FLOWER_HP,
  MAIN_STAT_VALUES,
  MAX_ROLLS_PER_SUBSTAT,
  PLUME_ATK,
  ROLLS_PER_PIECE,
  SUBSTAT_ROLL_VALUES,
  SUBSTATS,
  pick,
  type PieceSlot,
  type Rarity,
  type Rolls,
  type Substat,
} from './artifacts';

// ---------- Bloco de stats ----------

export interface StatBlock {
  atkPct: number;
  atkFlat: number;
  hpPct: number;
  hpFlat: number;
  defPct: number;
  defFlat: number;
  em: number;
  /** ER ALÉM dos 100%. */
  er: number;
  /** Taxa crítica além dos 5% base. */
  critRate: number;
  /** Dano crítico além dos 50% base. */
  critDmg: number;
  /** DMG% geral (elemental/todos). */
  dmgBonus: number;
  dmgByType: Record<HitType, number>;
  meltBonus: number;
  vaporizeBonus: number;
}

export type StatDelta = Partial<Omit<StatBlock, 'dmgByType'>> & { dmgByType?: Partial<Record<HitType, number>> };

export const zeroBlock = (): StatBlock => ({
  atkPct: 0, atkFlat: 0, hpPct: 0, hpFlat: 0, defPct: 0, defFlat: 0, em: 0, er: 0, critRate: 0, critDmg: 0,
  dmgBonus: 0, dmgByType: { normal: 0, charged: 0, plunge: 0, skill: 0, burst: 0 }, meltBonus: 0, vaporizeBonus: 0,
});

export function addDelta(target: StatBlock, delta: StatDelta): StatBlock {
  for (const [k, v] of Object.entries(delta)) {
    if (k === 'dmgByType') {
      for (const [t, x] of Object.entries(v as object)) target.dmgByType[t as HitType] += x as number;
    } else if (typeof v === 'number') {
      (target as unknown as Record<string, number>)[k] += v;
    }
  }
  return target;
}

/** Nomes de stat usados nas abas da planilha (PT) e aliases em inglês → campo do bloco. */
const NAMED: Record<string, (v: number) => StatDelta> = {
  'ATK%': (v) => ({ atkPct: v }),
  ATK: (v) => ({ atkFlat: v }),
  'HP%': (v) => ({ hpPct: v }),
  HP: (v) => ({ hpFlat: v }),
  'DEF%': (v) => ({ defPct: v }),
  DEF: (v) => ({ defFlat: v }),
  EM: (v) => ({ em: v }),
  ER: (v) => ({ er: v }),
  CR: (v) => ({ critRate: v }),
  CD: (v) => ({ critDmg: v }),
  'DMG%': (v) => ({ dmgBonus: v }),
  'DMG% Normal': (v) => ({ dmgByType: { normal: v } }),
  'DMG% Carregado': (v) => ({ dmgByType: { charged: v } }),
  'DMG% Charged': (v) => ({ dmgByType: { charged: v } }),
  'DMG% Imersivo': (v) => ({ dmgByType: { plunge: v } }),
  'DMG% Plunge': (v) => ({ dmgByType: { plunge: v } }),
  'DMG% Habilidade': (v) => ({ dmgByType: { skill: v } }),
  'DMG% Skill': (v) => ({ dmgByType: { skill: v } }),
  'DMG% Supremo': (v) => ({ dmgByType: { burst: v } }),
  'DMG% Burst': (v) => ({ dmgByType: { burst: v } }),
};

/** Converte "stat nomeado + valor" em delta. Devolve null se o nome for desconhecido. */
export function namedStatDelta(name: string, value: number): StatDelta | null {
  const f = NAMED[name.trim()];
  return f ? f(value) : null;
}

/** Stat de ascensão/substat do Lunaris ('CD', 'Pyro%', 'Healing'...) → delta. Bônus elementais só valem para o próprio elemento. */
export function lunarisStatDelta(stat: string, value: number, element: string): StatDelta | null {
  if (stat === 'Healing') return null;
  if (stat.endsWith('%') && /^(Physical|Pyro|Hydro|Anemo|Electro|Dendro|Cryo|Geo)%$/.test(stat)) {
    return stat === `${element}%` ? { dmgBonus: value } : null;
  }
  return namedStatDelta(stat, value);
}

// ---------- Entrada de um membro ----------

export interface ArtifactConfig {
  rarity: Record<PieceSlot, Rarity>;
  /** Nomes de stat: areia (ATK%, EM, ER, HP%, DEF%), cálice (DMG%, ATK%, EM, HP%, DEF%), tiara (CR, CD, ATK%, EM, HP%, DEF%, Healing). */
  sands: string;
  goblet: string;
  circlet: string;
}

export interface SetSelection {
  name: string;
  effect?: SetEffect;
}

export interface MemberInput {
  character: Character;
  weapon: Weapon;
  characterEffect?: CharacterEffect;
  weaponEffect?: WeaponEffect;
  primarySet?: SetSelection;
  /** Se informado, vira 2+2 (só os bônus de 2 peças valem). */
  secondarySet?: SetSelection;
  artifacts: ArtifactConfig;
  talents: { normal: number; skill: number; burst: number };
  /** ER mínimo desejado (1 = 100%). */
  minER?: number;
  /** Rolls totais de substat (padrão: 9 por peça 5★ + 7 por peça 4★). */
  totalRolls?: number;
  /** Rolls TOTAIS em CR+CD forçados (inclui os mínimos). Vazio = otimizar. */
  forcedCritRolls?: number;
}

export const fourPieceActive = (m: MemberInput) => !!m.primarySet && !m.secondarySet;

// ---------- Rolls ----------

export function pieceCounts(a: ArtifactConfig) {
  const five = Object.values(a.rarity).filter((r) => r === 5).length;
  return { five, four: 5 - five };
}

export function defaultTotalRolls(a: ArtifactConfig): number {
  const { five, four } = pieceCounts(a);
  return five * ROLLS_PER_PIECE[0] + four * ROLLS_PER_PIECE[1];
}

/** Valor médio por roll, ponderado pela raridade das peças. */
export function rollValues(a: ArtifactConfig): Record<Substat, number> {
  const { five, four } = pieceCounts(a);
  const r5 = five * ROLLS_PER_PIECE[0];
  const r4 = four * ROLLS_PER_PIECE[1];
  const out = {} as Record<Substat, number>;
  for (const s of SUBSTATS) {
    const [v5, v4] = SUBSTAT_ROLL_VALUES[s];
    out[s] = (r5 * v5 + r4 * v4) / (r5 + r4);
  }
  return out;
}

/** Máximo de rolls num substat: soma por peça, descontando as peças cujo MAIN é esse stat. */
export function maxRollsFor(a: ArtifactConfig, stat: Substat): number {
  const max = (slot: PieceSlot) => pick(MAX_ROLLS_PER_SUBSTAT, a.rarity[slot]);
  const mains: Record<'sands' | 'goblet' | 'circlet', string> = { sands: a.sands, goblet: a.goblet, circlet: a.circlet };
  let total = max('flower') + max('plume');
  for (const slot of ['sands', 'goblet', 'circlet'] as const) if (mains[slot] !== stat) total += max(slot);
  return total;
}

// ---------- Bloco estático ----------

function mainStatValue(slot: 'sands' | 'goblet' | 'circlet', stat: string, rarity: Rarity): number {
  const table = MAIN_STAT_VALUES[slot] as Record<string, readonly [number, number]>;
  const pair = table[stat];
  if (!pair) throw new Error(`Main stat "${stat}" não existe para ${slot}`);
  return pick(pair, rarity);
}

/** Bônus de 2 peças como "stat nomeado + valor" (modelo da planilha). */
function twoPieceDelta(set: SetSelection | undefined): StatDelta | null {
  const tp = set?.effect?.twoPiece;
  return tp ? namedStatDelta(tp.stat, tp.value) : null;
}

// ---------- Origem de cada bônus (para atribuição) ----------

export type StatSourceKind =
  | 'ascension'
  | 'weapon-substat'
  | 'set-2p'
  | 'set-4p'
  | 'character'
  | 'weapon'
  | 'main-stat'
  | 'extra';

/** Um bônus estático e de onde ele vem. A soma de todas as fontes de um membro é o seu bloco estático. */
export interface StatSource {
  id: string;
  label: string;
  kind: StatSourceKind;
  /** Índice do membro dono do bônus. */
  member: number;
  delta: StatDelta;
}

export const isEmptyDelta = (d: StatDelta) =>
  Object.entries(d).every(([k, v]) => (k === 'dmgByType' ? Object.values(v as object).every((x) => !x) : !v));

/**
 * Tudo o que o personagem tem SEM substats e SEM buffs de time, uma fonte por vez: ascensão, substat da
 * arma, 2 peças, passivas de personagem e arma, 4 peças e os três main stats.
 */
export function staticSources(m: MemberInput, member = 0): StatSource[] {
  const out: StatSource[] = [];
  const el = m.character.element;
  const add = (id: string, label: string, kind: StatSourceKind, delta: StatDelta | null) => {
    if (delta && !isEmptyDelta(delta)) out.push({ id: `m${member}:${id}`, label, kind, member, delta });
  };

  if (m.character.ascension) {
    add('ascension', `Ascensão (${m.character.ascension.stat})`, 'ascension',
      lunarisStatDelta(m.character.ascension.stat, m.character.ascension.value, el));
  }
  if (m.weapon.substat) {
    add('weapon-substat', `${m.weapon.name}: substat`, 'weapon-substat',
      lunarisStatDelta(m.weapon.substat.stat, m.weapon.substat.value, el));
  }

  add('set2p-primary', `${m.primarySet?.name ?? 'Set'} (2 peças)`, 'set-2p', twoPieceDelta(m.primarySet));
  add('set2p-secondary', `${m.secondarySet?.name ?? 'Set'} (2 peças)`, 'set-2p', twoPieceDelta(m.secondarySet));

  const ce = m.characterEffect;
  if (ce) {
    add('character', `${m.character.name}: passivas`, 'character',
      { atkPct: ce.atkPct, dmgBonus: ce.dmgPct, critRate: ce.critRate, critDmg: ce.critDmg, em: ce.em });
  }

  const we = m.weaponEffect;
  if (we) {
    add('weapon', `${m.weapon.name}: passiva`, 'weapon',
      { atkPct: we.atkPct, dmgBonus: we.dmgPct, critRate: we.critRate, critDmg: we.critDmg, em: we.em, er: we.er });
  }

  const four = fourPieceActive(m) ? m.primarySet?.effect?.fourPiece : undefined;
  if (four) {
    add('set4p', `${m.primarySet?.name} (4 peças)`, 'set-4p', {
      atkPct: four.atkPct, dmgBonus: four.dmgPct, critRate: four.critRate, critDmg: four.critDmg, em: four.em,
      meltBonus: four.meltBonus, vaporizeBonus: four.vaporizeBonus, dmgByType: four.dmgPctByType,
    });
  }

  const a = m.artifacts;
  for (const [slot, stat] of [['sands', a.sands], ['goblet', a.goblet], ['circlet', a.circlet]] as const) {
    add(`main-${slot}`, `Main stat: ${stat}`, 'main-stat', namedStatDelta(stat, mainStatValue(slot, stat, a.rarity[slot])));
  }
  return out;
}

export function foldSources(sources: readonly StatSource[]): StatBlock {
  const b = zeroBlock();
  for (const s of sources) addDelta(b, s.delta);
  return b;
}

/** Bloco estático de um membro (soma de todas as suas fontes). */
export function staticStats(m: MemberInput): StatBlock {
  return foldSources(staticSources(m));
}

// ---------- Buffs de time ----------

export interface TeamBuff {
  id: string;
  /** Etiqueta de ativação: a ação precisa listá-la em `activeTags` para o buff valer. */
  tag: string;
  /** 'all' ou nomes de personagem que recebem. */
  targets: 'all' | string[];
  delta: StatDelta;
  description?: string;
}

export function receivesBuff(buff: TeamBuff, characterName: string): boolean {
  return buff.targets === 'all' || buff.targets.includes(characterName);
}

/** Soma dos buffs de time ativos que um personagem recebe. `tags = 'all'` ativa todos. */
export function activeTeamDelta(
  buffs: readonly TeamBuff[],
  characterName: string,
  tags: ReadonlySet<string> | 'all',
  include: (b: TeamBuff) => boolean = () => true,
): StatBlock {
  const sum = zeroBlock();
  for (const b of buffs) {
    if (!receivesBuff(b, characterName) || !include(b)) continue;
    if (tags !== 'all' && !tags.has(b.tag)) continue;
    addDelta(sum, b.delta);
  }
  return sum;
}

// ---------- Stats finais ----------

export interface FinalStats {
  atk: number;
  hp: number;
  def: number;
  em: number;
  /** Multiplicador total: 1.11 = 111% de recarga de energia. */
  er: number;
  critRate: number;
  critDmg: number;
  dmgBonus: number;
  dmgByType: Record<HitType, number>;
  meltBonus: number;
  vaporizeBonus: number;
  /** Bônus de ATK% que a arma ganha com ER (ex.: Engulfing Lightning). */
  weaponErAtkPct: number;
}

export function weaponErAtkPct(m: MemberInput, er: number): number {
  const p = m.weaponEffect?.atkPctPerEr;
  return p ? Math.min(Math.max(er - 1, 0) * p.coef, p.cap) : 0;
}

/**
 * Stats finais dado o número TOTAL de rolls por substat (inclui o mínimo), os buffs de time ativos
 * e o ATK% de ressonância.
 */
export function finalStats(m: MemberInput, statics: StatBlock, rolls: Rolls, team: StatBlock, resonanceAtkPct = 0): FinalStats {
  const rv = rollValues(m.artifacts);
  const er = 1 + statics.er + team.er + rolls.ER * rv.ER;
  const erAtk = weaponErAtkPct(m, er);
  const a = m.artifacts;

  const atkBase = m.character.baseAtk + m.weapon.baseAtk;
  const atk =
    atkBase * (1 + statics.atkPct + team.atkPct + resonanceAtkPct + rolls['ATK%'] * rv['ATK%'] + erAtk) +
    pick(PLUME_ATK, a.rarity.plume) + statics.atkFlat + team.atkFlat + rolls.ATK * rv.ATK;

  const hp =
    m.character.baseHp * (1 + statics.hpPct + team.hpPct + rolls['HP%'] * rv['HP%']) +
    pick(FLOWER_HP, a.rarity.flower) + statics.hpFlat + team.hpFlat + rolls.HP * rv.HP;

  const def =
    m.character.baseDef * (1 + statics.defPct + team.defPct + rolls['DEF%'] * rv['DEF%']) +
    statics.defFlat + team.defFlat + rolls.DEF * rv.DEF;

  const dmgByType = { ...statics.dmgByType };
  for (const t of Object.keys(dmgByType) as HitType[]) dmgByType[t] += team.dmgByType[t];

  return {
    atk, hp, def,
    em: statics.em + team.em + rolls.EM * rv.EM,
    er,
    critRate: 0.05 + statics.critRate + team.critRate + rolls.CR * rv.CR,
    critDmg: 0.5 + statics.critDmg + team.critDmg + rolls.CD * rv.CD,
    dmgBonus: statics.dmgBonus + team.dmgBonus,
    dmgByType,
    meltBonus: statics.meltBonus + team.meltBonus,
    vaporizeBonus: statics.vaporizeBonus + team.vaporizeBonus,
    weaponErAtkPct: erAtk,
  };
}

/** Rolls mínimos: `min` em cada um dos 10 substats. */
export function minimumRolls(min: number): Rolls {
  const r = {} as Rolls;
  for (const s of SUBSTATS) r[s] = min;
  return r;
}

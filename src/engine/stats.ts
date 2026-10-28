/**
 * Montagem dos stats de um personagem: bloco estático (ascensão, arma, sets, passivas, main stats),
 * buffs de time com etiquetas de ativação e stats finais dado um número de rolls de substat.
 *
 * Modelo derivado da aba "Cálculos" da planilha de referência. A diferença-chave: os "perfis de buff" da
 * planilha viram ETIQUETAS (tags). Cada ação da rotação diz quais etiquetas estão ativas; no editor visual
 * as janelas de tempo dos buffs preenchem isso.
 */
import type { Element } from '../data/schema';
import type { ElementOrPhysical } from './constants/reactions';
import type { Character, HitType, Weapon } from '../data/schema';
import { REACTION_BONUS_KEYS, weaponStatsAt, type BuffStats, type CharacterBuff, type CharacterEffect, type ReactionBonusKey, type SetEffect, type WeaponEffect } from '../effects/schema';
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
  /** Taxa crítica extra só para um tipo de golpe (ex.: Kaeya C1, Normal e Carregado). */
  critRateByType: Record<HitType, number>;
  /** Dano crítico extra só para um tipo de golpe (ex.: Itto C6, Carregado). */
  critDmgByType: Record<HitType, number>;
  meltBonus: number;
  vaporizeBonus: number;
  /** Fração da DEF do inimigo ignorada pelos golpes deste membro. */
  defIgnore: number;
  /** Bônus de DMG Físico (só golpes Físicos). */
  physDmg: number;
  /** Dano Crítico extra só em golpes Físicos. */
  physCritDmg: number;
  /**
   * Parte de `dmgBonus` que é bônus do ELEMENTO do personagem (ascensão, cálice, 2 peças elementais, buffs com
   * `forElements`). Golpes de outro elemento ou Físicos não a recebem.
   */
  eleDmg: number;
  /** Bônus de dano de reação (ex.: +40% de Sobrecarga do Thundering Fury), em fração. */
  reactionBonus: Record<ReactionBonusKey, number>;
}

/** Reações com bônus de dano próprio além de Derreter/Vaporizar (que têm campo separado); ver `REACTION_BONUS_KEYS`. */
export { REACTION_BONUS_KEYS, type ReactionBonusKey };
const ZERO_REACTIONS = Object.fromEntries(REACTION_BONUS_KEYS.map((k) => [k, 0])) as Record<ReactionBonusKey, number>;
/** Cópia do molde zerado (bem mais rápida que remontar as ~70 chaves a cada bloco: roda milhares de vezes por segundo no otimizador). */
const zeroReactions = () => ({ ...ZERO_REACTIONS });

type ByType = Partial<Record<HitType, number>>;
const BY_TYPE_KEYS = ['dmgByType', 'critRateByType', 'critDmgByType', 'reactionBonus'] as const;

export type StatDelta = Partial<Omit<StatBlock, 'dmgByType' | 'critRateByType' | 'critDmgByType' | 'reactionBonus'>> & {
  dmgByType?: ByType;
  critRateByType?: ByType;
  critDmgByType?: ByType;
  reactionBonus?: Partial<Record<ReactionBonusKey, number>>;
};

export const zeroBlock = (): StatBlock => ({
  atkPct: 0, atkFlat: 0, hpPct: 0, hpFlat: 0, defPct: 0, defFlat: 0, em: 0, er: 0, critRate: 0, critDmg: 0,
  dmgBonus: 0, dmgByType: { normal: 0, charged: 0, plunge: 0, skill: 0, burst: 0 },
  critRateByType: { normal: 0, charged: 0, plunge: 0, skill: 0, burst: 0 }, critDmgByType: { normal: 0, charged: 0, plunge: 0, skill: 0, burst: 0 },
  meltBonus: 0, vaporizeBonus: 0, defIgnore: 0, physDmg: 0, physCritDmg: 0, eleDmg: 0, reactionBonus: zeroReactions(),
});

const BY_TYPE_SET: ReadonlySet<string> = new Set(BY_TYPE_KEYS);

/** O delta com todos os números multiplicados por `k`. */
export function scaleDelta(delta: StatDelta, k: number): StatDelta {
  const scale = (v: unknown): unknown => (typeof v === 'number' ? v * k : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([key, x]) => [key, scale(x)])) : v);
  return scale(delta) as StatDelta;
}

export function addDelta(target: StatBlock, delta: StatDelta): StatBlock {
  const t = target as unknown as Record<string, number>;
  for (const k in delta) {
    const v = (delta as Record<string, unknown>)[k];
    if (typeof v === 'number') {
      if (!BY_TYPE_SET.has(k)) t[k] += v;
    } else if (v && BY_TYPE_SET.has(k)) {
      const into = (target as unknown as Record<string, Record<string, number>>)[k];
      for (const key in v as Record<string, number>) into[key] = (into[key] ?? 0) + (v as Record<string, number>)[key];
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
  /** Cálice e 2 peças elementais: DMG do elemento do personagem (não vale para golpes Físicos nem de outro elemento). */
  'DMG% Elemental': (v) => ({ dmgBonus: v, eleDmg: v }),
  'Physical DMG%': (v) => ({ physDmg: v }),
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
  const key = name.trim();
  const f = NAMED[key];
  if (f) return f(value);
  // Buffs de teste (editor): `react:<chave>` = bônus de reação (ver REACTION_BONUS_KEYS), `cr:<tipo>` / `cd:<tipo>` = crítico por tipo de golpe.
  const [kind, arg] = key.split(':');
  if (kind === 'react' && (REACTION_BONUS_KEYS as readonly string[]).includes(arg)) return { reactionBonus: { [arg]: value } as Partial<Record<ReactionBonusKey, number>> };
  if ((kind === 'cr' || kind === 'cd') && ['normal', 'charged', 'plunge', 'skill', 'burst'].includes(arg)) return kind === 'cr' ? { critRateByType: { [arg]: value } } : { critDmgByType: { [arg]: value } };
  if (key === 'Melt DMG%') return { meltBonus: value };
  if (key === 'Vaporize DMG%') return { vaporizeBonus: value };
  if (key === 'DEF ignore') return { defIgnore: value };
  if (key === 'Physical CD') return { physCritDmg: value };
  return null;
}

/** Stat de ascensão/substat do Lunaris ('CD', 'Pyro%', 'Healing'...) → delta. Bônus elementais só valem para o próprio elemento. */
export function lunarisStatDelta(stat: string, value: number, element: string): StatDelta | null {
  if (stat === 'Healing') return null;
  if (stat === 'Physical%') return { physDmg: value };
  if (stat.endsWith('%') && /^(Pyro|Hydro|Anemo|Electro|Dendro|Cryo|Geo)%$/.test(stat)) {
    return stat === `${element}%` ? { dmgBonus: value, eleDmg: value } : null;
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
  /** Nível do personagem (stats base e fórmulas de nível); ausente = o do cenário. */
  level?: number;
  weapon: Weapon;
  characterEffect?: CharacterEffect;
  /** Elementos com que reage em campo, além do próprio (buffs `forReacted`). */
  reacted?: Element[];
  weaponEffect?: WeaponEffect;
  /** Refinamento da arma (1 a 5) para efeitos com tabela por refinamento. Padrão: 1. */
  refinement?: number;
  primarySet?: SetSelection;
  /** Se informado, vira 2+2 (só os bônus de 2 peças valem). */
  secondarySet?: SetSelection;
  /** false = só 2 peças do set principal (sem o bônus de 4 peças e sem segundo set). Padrão: true. */
  fourPiece?: boolean;
  artifacts: ArtifactConfig;
  /** Níveis EFETIVOS (já com o +3 das constelações). */
  talents: { normal: number; skill: number; burst: number };
  constellation?: number;
  /** Facções ligadas pelo usuário neste membro (só as que o personagem pode ter). */
  factions?: ('moonsign' | 'hexerei')[];
  /** ER mínimo desejado (1 = 100%). */
  minER?: number;
  /** Infusão dos ataques normais, carregados e de queda (Hu Tao, Xiao, Yoimiya…): elemento no lugar do Físico. */
  normalInfusion?: ElementOrPhysical;
  /** Rolls totais de substat (padrão: 9 por peça 5★ + 7 por peça 4★). */
  totalRolls?: number;
  /** Rolls TOTAIS em CR+CD forçados (inclui os mínimos). Vazio = otimizar. */
  forcedCritRolls?: number;
  /**
   * Rolls TOTAIS por substat (inclui o mínimo) definidos à mão. Quando presente, o otimizador não mexe neste
   * membro: é o modo "theorycraft" manual.
   */
  manualRolls?: Rolls;
  /**
   * Soma EXATA dos stats das 5 peças (main stats, ATK e HP fixos de flor e pluma, substats reais). Quando presente,
   * vale no lugar dos main stats e dos rolls (o otimizador de artefatos avalia conjuntos reais e "virtuais" assim).
   */
  externalStats?: StatDelta;
}

export const fourPieceActive = (m: MemberInput) => !!m.primarySet && !m.secondarySet && m.fourPiece !== false;

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

/** Delta de um buff de personagem (passiva/constelação). Os campos podem faltar: os JSON não passam pelo Zod. */
export function characterBuffDelta(stats: BuffStats | undefined, elemental = false): StatDelta {
  if (!stats) return {};
  return {
    atkPct: stats.atkPct ?? 0, dmgBonus: stats.dmgPct ?? 0, critRate: stats.critRate ?? 0, critDmg: stats.critDmg ?? 0,
    em: stats.em ?? 0, er: stats.er ?? 0, hpPct: stats.hpPct ?? 0, defPct: stats.defPct ?? 0, dmgByType: stats.dmgPctByType ?? {},
    critRateByType: stats.critRateByType ?? {}, critDmgByType: stats.critDmgByType ?? {}, defIgnore: stats.defIgnore ?? 0,
    atkFlat: stats.atkFlat ?? 0, hpFlat: stats.hpFlat ?? 0, defFlat: stats.defFlat ?? 0,
    physDmg: stats.physDmgPct ?? 0, physCritDmg: stats.physCritDmg ?? 0, reactionBonus: stats.reactionBonus ?? {},
    // Buff só para certos elementos ("DMG Pyro +X%" para membros Pyro): é bônus elemental, não vale em golpe Físico.
    ...(elemental ? { eleDmg: stats.dmgPct ?? 0 } : {}),
  };
}

/** Buffs de personagem que valem na constelação do membro. */
export const activeCharacterBuffs = (m: MemberInput): CharacterBuff[] =>
  (m.characterEffect?.buffs ?? []).filter((b) => (m.constellation ?? 0) >= (b.minConstellation ?? 0));

/** Bônus de 2 peças como "stat nomeado + valor" (modelo da planilha). */
function twoPieceDelta(set: SetSelection | undefined, element: string): StatDelta | null {
  const effect = set?.effect;
  if (!effect) return null;
  const out = zeroBlock() as StatBlock;
  let any = false;
  for (const tp of [effect.twoPiece, ...(effect.twoPieceMore ?? [])]) {
    if (!tp || (tp.element && tp.element !== element)) continue;
    // "DMG%" de 2 peças é sempre bônus elemental no jogo: não vale para golpes Físicos.
    const d = namedStatDelta(tp.stat === 'DMG%' ? 'DMG% Elemental' : tp.stat, tp.value);
    if (d) {
      addDelta(out, d);
      any = true;
    }
  }
  return any ? out : null;
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
  | 'resonance'
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
  Object.entries(d).every(([k, v]) => ((BY_TYPE_KEYS as readonly string[]).includes(k) ? Object.values(v as object).every((x) => !x) : !v));

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

  add('set2p-primary', `${m.primarySet?.name ?? 'Set'} (2 peças)`, 'set-2p', twoPieceDelta(m.primarySet, el));
  add('set2p-secondary', `${m.secondarySet?.name ?? 'Set'} (2 peças)`, 'set-2p', twoPieceDelta(m.secondarySet, el));

  const ce = m.characterEffect;
  if (ce) {
    add('character', 'Passivas', 'character',
      { atkPct: ce.atkPct, dmgBonus: ce.dmgPct, critRate: ce.critRate, critDmg: ce.critDmg, em: ce.em });
  }

  for (const b of activeCharacterBuffs(m)) {
    if (!b.timed && b.scope === 'self') add(`cbuff-${b.id}`, b.label, 'character', characterBuffDelta(b.stats, !!b.forElements || !!b.forReacted));
  }

  const we = m.weaponEffect ? weaponStatsAt(m.weaponEffect, m.refinement) : undefined;
  if (we) {
    add('weapon', `${m.weapon.name}: passiva`, 'weapon', {
      atkPct: we.atkPct, dmgBonus: we.dmgPct, critRate: we.critRate, critDmg: we.critDmg, em: we.em, er: we.er,
      hpPct: we.hpPct, defPct: we.defPct, dmgByType: we.dmgPctByType,
    });
  }

  const four = fourPieceActive(m) ? m.primarySet?.effect?.fourPiece : undefined;
  if (four) {
    add('set4p', `${m.primarySet?.name} (4 peças)`, 'set-4p', {
      atkPct: four.atkPct, dmgBonus: four.dmgPct, critRate: four.critRate, critDmg: four.critDmg, em: four.em,
      meltBonus: four.meltBonus, vaporizeBonus: four.vaporizeBonus, dmgByType: four.dmgPctByType,
      er: four.er, hpPct: four.hpPct, defPct: four.defPct, reactionBonus: four.reactionBonus ?? {},
    });
  }

  const a = m.artifacts;
  if (m.externalStats) {
    add('artifacts', 'Artefatos (peças reais)', 'main-stat', m.externalStats);
    return out;
  }
  for (const [slot, stat] of [['sands', a.sands], ['goblet', a.goblet], ['circlet', a.circlet]] as const) {
    add(`main-${slot}`, `Main stat: ${stat}`, 'main-stat', namedStatDelta(slot === 'goblet' && stat === 'DMG%' ? 'DMG% Elemental' : stat, mainStatValue(slot, stat, a.rarity[slot])));
  }
  return out;
}

/** Cópia de um bloco de stats (os mapas por tipo também), para somar mais um delta sem mexer no original. */
export function cloneBlock(b: StatBlock): StatBlock {
  const out = { ...b } as unknown as Record<string, unknown>;
  for (const k of BY_TYPE_KEYS) out[k] = { ...(b as unknown as Record<string, object>)[k] };
  return out as unknown as StatBlock;
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
  /** Vale em toda ação, sem etiqueta nem faixa (conversões de stat que não dependem de janela). */
  always?: boolean;
  /** Conversão de stat: `delta` guarda o valor calculado com os rolls dados à montagem da equipe. */
  derived?: true;
  /** Cai em linha reta até 0 em `decay` segundos depois do início da janela (ver `CharacterBuff.decay`). */
  decay?: number;
  /** Quanto dura o efeito (s), quando o texto do jogo diz: é o tamanho da janela criada na linha do tempo. */
  duration?: number;
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
  /** Segundos desde o início da janela de cada etiqueta, no instante do golpe (para os buffs que caem com o tempo). */
  ages?: Readonly<Record<string, number>>,
): StatBlock {
  const sum = zeroBlock();
  for (const b of buffs) {
    if (!receivesBuff(b, characterName) || !include(b)) continue;
    if (tags !== 'all' && !b.always && !tags.has(b.tag)) continue;
    const k = b.decay && ages ? Math.min(1, Math.max(0, 1 - (ages[b.tag] ?? 0) / b.decay)) : 1;
    addDelta(sum, k === 1 ? b.delta : scaleDelta(b.delta, k));
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
  critRateByType: Record<HitType, number>;
  critDmgByType: Record<HitType, number>;
  meltBonus: number;
  vaporizeBonus: number;
  defIgnore: number;
  /** Bônus de DMG Físico e a parte elemental de `dmgBonus` (ver `StatBlock`). */
  physDmg: number;
  physCritDmg: number;
  eleDmg: number;
  reactionBonus: Record<ReactionBonusKey, number>;
  /** Bônus de ATK% que a arma ganha com ER (ex.: Engulfing Lightning). */
  weaponErAtkPct: number;
}

/** Soma por chave dos bônus de reação (loop simples: é a parte mais chamada do cálculo de stats finais). */
function sumReactions(a: Partial<Record<ReactionBonusKey, number>> | undefined, b: Partial<Record<ReactionBonusKey, number>> | undefined): Record<ReactionBonusKey, number> {
  const out = { ...ZERO_REACTIONS };
  // Só os bônus que não são zero mudam o molde; assim o resultado é o mesmo e quase nenhuma chave é escrita.
  if (a) for (const k in a) { const v = a[k as ReactionBonusKey]; if (v) out[k as ReactionBonusKey] += v; }
  if (b) for (const k in b) { const v = b[k as ReactionBonusKey]; if (v) out[k as ReactionBonusKey] += v; }
  return out;
}

export function weaponErAtkPct(m: MemberInput, er: number): number {
  const p = m.weaponEffect ? weaponStatsAt(m.weaponEffect, m.refinement).atkPctPerEr : undefined;
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
    (m.externalStats ? 0 : pick(PLUME_ATK, a.rarity.plume)) + statics.atkFlat + team.atkFlat + rolls.ATK * rv.ATK;

  const hp =
    m.character.baseHp * (1 + statics.hpPct + team.hpPct + rolls['HP%'] * rv['HP%']) +
    (m.externalStats ? 0 : pick(FLOWER_HP, a.rarity.flower)) + statics.hpFlat + team.hpFlat + rolls.HP * rv.HP;

  const def =
    m.character.baseDef * (1 + statics.defPct + team.defPct + rolls['DEF%'] * rv['DEF%']) +
    statics.defFlat + team.defFlat + rolls.DEF * rv.DEF;

  const dmgByType = { ...statics.dmgByType };
  for (const t of Object.keys(dmgByType) as HitType[]) dmgByType[t] += team.dmgByType[t];
  const critRateByType = { ...statics.critRateByType };
  const critDmgByType = { ...statics.critDmgByType };
  for (const t of Object.keys(critRateByType) as HitType[]) {
    critRateByType[t] += team.critRateByType[t];
    critDmgByType[t] += team.critDmgByType[t];
  }

  return {
    atk, hp, def,
    em: statics.em + team.em + rolls.EM * rv.EM,
    er,
    critRate: 0.05 + statics.critRate + team.critRate + rolls.CR * rv.CR,
    critDmg: 0.5 + statics.critDmg + team.critDmg + rolls.CD * rv.CD,
    dmgBonus: statics.dmgBonus + team.dmgBonus,
    dmgByType,
    critRateByType,
    critDmgByType,
    meltBonus: statics.meltBonus + team.meltBonus,
    vaporizeBonus: statics.vaporizeBonus + team.vaporizeBonus,
    defIgnore: statics.defIgnore + team.defIgnore,
    physDmg: (statics.physDmg ?? 0) + (team.physDmg ?? 0),
    physCritDmg: (statics.physCritDmg ?? 0) + (team.physCritDmg ?? 0),
    eleDmg: (statics.eleDmg ?? 0) + (team.eleDmg ?? 0),
    reactionBonus: sumReactions(statics.reactionBonus, team.reactionBonus),
    weaponErAtkPct: erAtk,
  };
}

/**
 * DMG% que vale para um golpe: o geral, menos a parte elemental se o golpe não é do elemento do personagem, mais o
 * bônus Físico se o golpe é Físico, mais o do tipo de golpe (golpe extra sem tipo não recebe bônus de tipo).
 */
export function hitDmgBonus(
  stats: Pick<FinalStats, 'dmgBonus' | 'dmgByType' | 'physDmg' | 'eleDmg'>,
  element: string,
  ownElement: string,
  hitType: string,
): number {
  const typed = (stats.dmgByType as Record<string, number>)[hitType] ?? 0;
  const ele = element === ownElement ? 0 : stats.eleDmg ?? 0;
  const phys = element === 'Physical' ? stats.physDmg ?? 0 : 0;
  return stats.dmgBonus - ele + phys + typed;
}

/** Rolls mínimos: `min` em cada um dos 10 substats. */
export function minimumRolls(min: number): Rolls {
  const r = {} as Rolls;
  for (const s of SUBSTATS) r[s] = min;
  return r;
}

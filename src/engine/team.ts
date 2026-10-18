/**
 * Montagem da equipa: bloco estático de cada membro, buffs de time (arma/set, personagem, extras),
 * ressonância e redução de RES do inimigo.
 */
import type { Element } from '../data/schema';
import { weaponStatsAt } from '../effects/schema';
import type { ResistanceMap } from './damage';
import {
  activeCharacterBuffs,
  addDelta,
  characterBuffDelta,
  finalStats,
  fourPieceActive,
  foldSources,
  isEmptyDelta,
  namedStatDelta,
  staticSources,
  activeTeamDelta,
  minimumRolls,
  type MemberInput,
  type StatBlock,
  type StatSource,
  type TeamBuff,
} from './stats';

export interface GlobalConfig {
  characterLevel: number;
  enemyLevel: number;
  /** RES base do inimigo (fração), igual para todos os elementos. */
  enemyBaseRes: number;
  enemyDefRed: number;
  enemyDefIgnore?: number;
  /** Rolls mínimos em cada um dos 10 substats. */
  minRollsPerSubstat: number;
  rotationDuration: number;
}

/** Buff extra definido pelo usuário (aba "Buffs extras" da planilha). */
export interface ExtraBuff {
  /** Nome do personagem ou 'all'. */
  target: string;
  stat: string;
  value: number;
  /** Buff de time = só vale quando a etiqueta `label:<label>` está ativa; senão vale sempre. */
  team: boolean;
  label?: string;
  description?: string;
}

export interface TeamInput {
  members: MemberInput[];
  extras: ExtraBuff[];
  config: GlobalConfig;
}

export interface AssembleOptions {
  /** Ids a desligar: fontes estáticas (`m0:set4p`), buffs de time (`gear-0`, `extra-1`, `flat-atk-2`), `resonance-pyro`, `res-shred-<membro>`. */
  disabled?: ReadonlySet<string>;
}

export interface TeamAssembly {
  statics: StatBlock[];
  /** Fontes de cada bônus estático (a soma de `sources[i]` é `statics[i]`). */
  sources: StatSource[][];
  buffs: TeamBuff[];
  /** ATK% de ressonância (Pyro: +25% com 2+ Pyro), aplicado a todos. */
  resonanceAtkPct: number;
  /** ATK de referência de cada membro (rolls mínimos, buffs de %, sem ATK fixo de time). */
  referenceAtk: number[];
  enemyRes: ResistanceMap;
  warnings: string[];
}

const ELEMENTS: Element[] = ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo'];
export const labelTag = (label?: string) => `label:${label?.trim() ? label.trim() : '_geral'}`;
export const gearTag = (memberIndex: number) => `gear:${memberIndex}`;
export const characterTag = (memberIndex: number) => `char:${memberIndex}`;

export function pyroResonanceAtkPct(members: MemberInput[]): number {
  return members.filter((m) => m.character.element === 'Pyro').length >= 2 ? 0.25 : 0;
}

export function assembleTeam(input: TeamInput, options: AssembleOptions = {}): TeamAssembly {
  const { members, extras, config } = input;
  const warnings: string[] = [];
  const names = members.map((m) => m.character.name);

  const off = (id: string) => options.disabled?.has(id) === true;

  // 1) Estáticos + extras que não são de time, sempre com a origem de cada bônus
  const sources: StatSource[][] = members.map((m, i) => staticSources(m, i).filter((s) => !off(s.id)));
  extras.forEach((e, n) => {
    if (e.team) return;
    const delta = namedStatDelta(e.stat, e.value);
    if (!delta) {
      warnings.push(`Buff extra com stat desconhecido ignorado: "${e.stat}"`);
      return;
    }
    members.forEach((_, i) => {
      const id = `m${i}:extra-${n}`;
      if ((e.target === 'all' || e.target === names[i]) && !off(id)) {
        sources[i].push({ id, label: e.description ?? `Buff extra: ${e.stat}`, kind: 'extra', member: i, delta });
      }
    });
  });
  const statics = sources.map((src) => foldSources(src));

  const resonanceAtkPct = off('resonance-pyro') ? 0 : pyroResonanceAtkPct(members);
  const buffs: TeamBuff[] = [];

  // 2) Buffs de arma e de 4 peças que vão ao time (valem para todos, inclusive o dono)
  members.forEach((m, i) => {
    const w = m.weaponEffect ? weaponStatsAt(m.weaponEffect, m.refinement).team : undefined;
    const s = fourPieceActive(m) ? m.primarySet?.effect?.fourPiece?.team : undefined;
    const atkPct = (w?.atkPct ?? 0) + (s?.atkPct ?? 0);
    const dmgBonus = (w?.dmgPct ?? 0) + (s?.dmgPct ?? 0);
    const em = (w?.em ?? 0) + (s?.em ?? 0);
    if ((atkPct || dmgBonus || em) && !off(`gear-${i}`)) {
      buffs.push({ id: `gear-${i}`, tag: gearTag(i), targets: 'all', delta: { atkPct, dmgBonus, em }, description: `Arma/set de ${names[i]}` });
    }
  });

  // 2b) Buffs de passivas e constelações em janela: viram faixas na linha do tempo
  members.forEach((m, i) => {
    for (const b of activeCharacterBuffs(m)) {
      if (!b.timed || !b.stats) continue;
      const delta = characterBuffDelta(b.stats);
      if (isEmptyDelta(delta) || off(`cbuff-${i}-${b.id}`)) continue;
      const targets = names.filter((n, j) => {
        if (b.scope === 'self' && j !== i) return false;
        if (b.scope === 'others' && j === i) return false;
        return !b.forElements || b.forElements.includes(members[j].character.element);
      });
      if (targets.length === 0) continue;
      buffs.push({ id: `cbuff-${i}-${b.id}`, tag: labelTag(b.label), targets, delta, description: `${names[i]}: ${b.label}` });
    }
  });

  // 3) Extras de time (com etiqueta)
  extras.forEach((e, n) => {
    if (!e.team) return;
    const delta = namedStatDelta(e.stat, e.value);
    if (!delta) {
      warnings.push(`Buff de time com stat desconhecido ignorado: "${e.stat}"`);
      return;
    }
    if (off(`extra-${n}`)) return;
    buffs.push({
      id: `extra-${n}`, tag: labelTag(e.label), targets: e.target === 'all' ? 'all' : [e.target], delta,
      description: e.description,
    });
  });

  // 4) ATK de referência (rolls mínimos, todas as etiquetas ativas, sem ATK fixo de time)
  const minRolls = minimumRolls(config.minRollsPerSubstat);
  const referenceAtk = members.map((m, i) => {
    const team = activeTeamDelta(buffs, names[i], 'all');
    return finalStats(m, statics[i], minRolls, team, resonanceAtkPct).atk;
  });

  // 5) ATK fixo que um personagem dá ao time
  members.forEach((m, i) => {
    const f = m.characterEffect?.teamFlatAtk;
    if (!f) return;
    const base = m.character.baseAtk + m.weapon.baseAtk;
    const fromBase = f.perBaseAtk * base;
    const fromTotal = f.perTotalAtk ? Math.min(f.perTotalAtk * referenceAtk[i], f.cap > 0 ? f.cap : Infinity) : 0;
    const value = fromBase + fromTotal;
    if (!value || off(`flat-atk-${i}`)) return;
    const self = m.characterEffect?.appliesToSelf === true;
    buffs.push({
      id: `flat-atk-${i}`, tag: characterTag(i), targets: names.filter((_, j) => self || j !== i),
      delta: { atkFlat: value }, description: `ATK fixo de ${names[i]}`,
    });
  });

  // 6) RES do inimigo por elemento (redução de RES de personagens; vale o tempo todo)
  const enemyRes: ResistanceMap = { Physical: config.enemyBaseRes };
  for (const el of ELEMENTS) {
    let shred = 0;
    members.forEach((m, i) => {
      const r = m.characterEffect?.resShred;
      if (r && r.value > 0 && r.elements.includes(el) && !off(`res-shred-${i}`)) shred += r.value;
      for (const b of activeCharacterBuffs(m)) {
        const br = b.resShred;
        if (br && br.value > 0 && br.elements.includes(el) && !off(`cbuff-res-${i}-${b.id}`)) shred += br.value;
      }
      const sr = fourPieceActive(m) ? m.primarySet?.effect?.fourPiece?.resShred : undefined;
      if (sr && sr.value > 0 && sr.elements.includes(el) && !off(`set-res-shred-${i}`)) shred += sr.value;
    });
    enemyRes[el] = config.enemyBaseRes - shred;
  }

  return { statics, sources, buffs, resonanceAtkPct, referenceAtk, enemyRes, warnings };
}


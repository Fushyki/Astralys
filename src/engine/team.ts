/**
 * Montagem da equipa: bloco estático de cada membro, buffs de time (arma/set, personagem, extras),
 * ressonância e redução de RES do inimigo.
 */
import type { Element } from '../data/schema';
import { weaponStatsAt } from '../effects/schema';
import type { ResistanceMap } from './damage';
import type { ElementOrPhysical } from './constants/reactions';
import type { Rolls } from './artifacts';
import {
  activeCharacterBuffs,
  addDelta,
  characterBuffDelta,
  finalStats,
  fourPieceActive,
  foldSources,
  isEmptyDelta,
  namedStatDelta,
  type StatDelta,
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
  /** 'kit' = elemento de cada golpe pelas regras do jogo; ausente = sempre o do personagem (modo antigo e planilha). */
  elementMode?: 'kit' | 'character';
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
  /** Ids de fontes/buffs que o usuário desligou (ver `AssembleOptions.disabled`). */
  disabled?: string[];
}

export interface AssembleOptions {
  /** Ids a desligar (`<buff>@<Nome>` desliga um buff de time só para esse personagem): fontes estáticas (`m0:set4p`), buffs de time (`gear-0`, `extra-1`, `flat-atk-2`), `resonance-pyro`, `res-shred-<membro>`. */
  disabled?: ReadonlySet<string>;
  /** Rolls totais de cada membro, para calcular as conversões de stat (padrão: os rolls mínimos). */
  rolls?: readonly Rolls[];
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
  /** Redução de DEF do inimigo: a do cenário mais a dos buffs (no máximo 90%). */
  enemyDefRed: number;
  /** Há conversões de stat: o valor delas depende dos rolls, então vale montar de novo com os rolls otimizados. */
  hasDerived: boolean;
  warnings: string[];
}

const ELEMENTS: ElementOrPhysical[] = ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo', 'Physical'];
export const labelTag = (label?: string) => `label:${label?.trim() ? label.trim() : '_geral'}`;
export const gearTag = (memberIndex: number) => `gear:${memberIndex}`;
export const characterTag = (memberIndex: number) => `char:${memberIndex}`;

/** Ressonâncias com efeito em stats (além da Pyro, que entra como ATK% da equipe): 2 ou mais do mesmo elemento. */
export interface ResonanceEffect {
  element: Element;
  label: string;
  delta: StatDelta;
  /** Redução de RES do inimigo no elemento indicado. */
  resShred?: { value: number; element: Element };
  note: string;
}

export function resonanceEffects(members: MemberInput[]): ResonanceEffect[] {
  const count = (el: Element) => members.filter((m) => m.character.element === el).length;
  const out: ResonanceEffect[] = [];
  if (count('Hydro') >= 2) out.push({ element: 'Hydro', label: 'Ressonância Hydro (+25% de HP máx.)', delta: { hpPct: 0.25 }, note: '+25% de HP máximo para a equipe.' });
  if (count('Cryo') >= 2) {
    out.push({ element: 'Cryo', label: 'Ressonância Cryo (+15% de Taxa Crítica)', delta: { critRate: 0.15 }, note: '+15% de Taxa Crítica contra inimigos sob Cryo ou congelados (assumido sempre ativo).' });
  }
  if (count('Dendro') >= 2) out.push({ element: 'Dendro', label: 'Ressonância Dendro (+50 de Maestria)', delta: { em: 50 }, note: '+50 de Maestria. Os +30 e +20 depois de reações NÃO entram.' });
  if (count('Geo') >= 2) {
    out.push({ element: 'Geo', label: 'Ressonância Geo (-20% de RES Geo)', delta: {}, resShred: { value: 0.2, element: 'Geo' }, note: '-20% de RES Geo do inimigo (assumido sempre ativo). O +15% de DMG com escudo NÃO entra.' });
  }
  return out;
}

export function pyroResonanceAtkPct(members: MemberInput[]): number {
  return members.filter((m) => m.character.element === 'Pyro').length >= 2 ? 0.25 : 0;
}

export function assembleTeam(input: TeamInput, options: AssembleOptions = {}): TeamAssembly {
  const { members, extras, config } = input;
  const warnings: string[] = [];
  const names = members.map((m) => m.character.name);

  const offIds = new Set<string>([...(input.disabled ?? []), ...(options.disabled ?? [])]);
  const off = (id: string) => offIds.has(id);

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
  // 1b) Ressonâncias (estáticas para todos os membros)
  resonanceEffects(members).forEach((r) => {
    const id = `resonance-${r.element.toLowerCase()}`;
    if (off(id) || isEmptyDelta(r.delta)) return;
    members.forEach((_, i) => sources[i].push({ id: `m${i}:${id}`, label: r.label, kind: 'resonance', member: i, delta: r.delta }));
  });

  const statics = sources.map((src) => foldSources(src));

  const resonanceAtkPct = off('resonance-pyro') ? 0 : pyroResonanceAtkPct(members);
  const buffs: TeamBuff[] = [];
  /** Põe um buff de time na lista, tirando quem o desligou só para si (id `<buff>@<Nome>`); sem ninguém, o buff some. */
  const addBuff = (b: TeamBuff) => {
    const all = b.targets === 'all' ? names : b.targets;
    const kept = all.filter((n) => !off(`${b.id}@${n}`));
    if (kept.length === 0) return;
    buffs.push(kept.length === all.length ? b : { ...b, targets: kept });
  };

  // 2) Buffs de arma e de 4 peças que vão ao time (valem para todos, inclusive o dono)
  members.forEach((m, i) => {
    const w = m.weaponEffect ? weaponStatsAt(m.weaponEffect, m.refinement).team : undefined;
    const s = fourPieceActive(m) ? m.primarySet?.effect?.fourPiece?.team : undefined;
    const atkPct = (w?.atkPct ?? 0) + (s?.atkPct ?? 0);
    const dmgBonus = (w?.dmgPct ?? 0) + (s?.dmgPct ?? 0);
    const em = (w?.em ?? 0) + (s?.em ?? 0);
    if ((atkPct || dmgBonus || em) && !off(`gear-${i}`)) {
      addBuff({ id: `gear-${i}`, tag: gearTag(i), targets: 'all', delta: { atkPct, dmgBonus, em }, description: `Arma/set de ${names[i]}` });
    }
  });

  // 2b) Buffs de passivas e constelações em janela: viram faixas na linha do tempo
  members.forEach((m, i) => {
    for (const b of activeCharacterBuffs(m)) {
      // Sem `timed`, o buff do próprio membro já está no bloco estático; o de equipe vale em toda ação (`always`).
      if (!b.stats || (!b.timed && b.scope === 'self')) continue;
      const delta = characterBuffDelta(b.stats, !!b.forElements);
      if (isEmptyDelta(delta) || off(`cbuff-${i}-${b.id}`)) continue;
      const targets = names.filter((n, j) => {
        if (b.scope === 'self' && j !== i) return false;
        if (b.scope === 'others' && j === i) return false;
        if (b.forFactions && !b.forFactions.some((f) => members[j].factions?.includes(f))) return false;
        return !b.forElements || b.forElements.includes(members[j].character.element);
      });
      if (targets.length === 0) continue;
      addBuff({ id: `cbuff-${i}-${b.id}`, tag: labelTag(b.label), targets, delta, description: `${names[i]}: ${b.label}`, ...(b.timed ? {} : { always: true as const }) });
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
    addBuff({
      id: `extra-${n}`, tag: labelTag(e.label), targets: e.target === 'all' ? 'all' : [e.target], delta,
      description: e.description,
    });
  });

  // 4) ATK de referência (rolls mínimos, todas as etiquetas ativas, sem ATK fixo de time)
  const minRolls = minimumRolls(config.minRollsPerSubstat);
  const referenceAtk = members.map((m, i) => {
    const team = activeTeamDelta(buffs, names[i], 'all');
    return finalStats(m, statics[i], m.externalStats ? minimumRolls(0) : minRolls, team, resonanceAtkPct).atk;
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
    addBuff({
      id: `flat-atk-${i}`, tag: characterTag(i), targets: names.filter((_, j) => self || j !== i),
      delta: { atkFlat: value }, description: `ATK fixo de ${names[i]}`,
    });
  });

  // 5b) Conversões de stat (Kazuha A4, Raiden A4...): valor = coef × stat da fonte, sem contar as próprias conversões
  const derivedStats = members.map((m, i) =>
    finalStats(m, statics[i], options.rolls?.[i] ?? minRolls, activeTeamDelta(buffs, names[i], 'all'), resonanceAtkPct),
  );
  const highestEm = derivedStats.reduce((best, s, i) => (s.em > derivedStats[best].em ? i : best), 0);
  let hasDerived = false;
  members.forEach((m, i) => {
    for (const b of activeCharacterBuffs(m)) {
      const c = b.convert;
      if (!c) continue;
      hasDerived = true;
      const id = `cbuff-${i}-${b.id}`;
      if (off(id)) continue;
      const srcIndex = c.source === 'highestEm' ? highestEm : i;
      const s = derivedStats[srcIndex];
      const srcBase = members[srcIndex].character.baseAtk + members[srcIndex].weapon.baseAtk;
      const partyEnergy = members.reduce((sum, x) => sum + (x.character.burst.energyCost ?? 0), 0);
      const stat = { atk: s.atk, baseAtk: srcBase, hp: s.hp, def: s.def, em: s.em, er: s.er, partyEnergy }[c.from];
      const raw = (c.perPoint ?? 0) * Math.max(0, stat - (c.threshold ?? 0));
      const caps = [c.cap, c.capBaseAtk !== undefined ? c.capBaseAtk * srcBase : undefined].filter((x): x is number => x !== undefined);
      const value = caps.length ? Math.min(raw, ...caps) : raw;
      if (value <= 0) continue;
      const targets = names.filter((_, j) => {
        if (b.scope === 'self' && j !== i) return false;
        if (b.scope === 'others' && j === i) return false;
        if (b.forFactions && !b.forFactions.some((f) => members[j].factions?.includes(f))) return false;
        return !b.forElements || b.forElements.includes(members[j].character.element);
      });
      if (targets.length === 0) continue;
      const delta: StatDelta = { dmgByType: {} };
      for (const to of c.to) {
        if (to === 'atkFlat' || to === 'hpFlat' || to === 'defFlat' || to === 'atkPct' || to === 'hpPct' || to === 'defPct' || to === 'em' || to === 'critRate' || to === 'critDmg' || to === 'er') delta[to] = value;
        else if (to === 'dmgPct') {
          delta.dmgBonus = value;
          if (b.forElements) delta.eleDmg = value;
        }
        else if (to === 'normal' || to === 'charged' || to === 'plunge' || to === 'skill' || to === 'burst') delta.dmgByType![to] = value;
        else delta.reactionBonus = { ...delta.reactionBonus, [to]: value };
      }
      addBuff({
        id, tag: labelTag(b.label), targets, delta, description: `${names[i]}: ${b.label}`, derived: true,
        ...(b.timed ? {} : { always: true }),
      });
    }
  });

  // 6) RES do inimigo por elemento, Físico incluído (redução de RES de personagens; vale o tempo todo)
  const enemyRes: ResistanceMap = {};
  const resonanceShred = resonanceEffects(members).filter((r) => r.resShred && !off(`resonance-${r.element.toLowerCase()}`));
  for (const el of ELEMENTS) {
    let shred = 0;
    for (const r of resonanceShred) if (r.resShred!.element === el) shred += r.resShred!.value;
    members.forEach((m, i) => {
      const r = m.characterEffect?.resShred;
      if (r && r.value > 0 && r.elements.includes(el) && !off(`res-shred-${i}`)) shred += r.value;
      for (const b of activeCharacterBuffs(m)) {
        const br = b.resShred;
        if (br && br.value > 0 && br.elements.includes(el) && !off(`cbuff-res-${i}-${b.id}`)) shred += br.value;
      }
      const sr = fourPieceActive(m) ? m.primarySet?.effect?.fourPiece?.resShred : undefined;
      if (sr && sr.value > 0 && sr.elements.includes(el) && (!sr.ifInTeam || members.some((x) => x.character.element === el)) && !off(`set-res-shred-${i}`)) shred += sr.value;
    });
    enemyRes[el] = config.enemyBaseRes - shred;
  }

  let defShred = 0;
  members.forEach((m, i) => {
    for (const b of activeCharacterBuffs(m)) if (b.defShred && !off(`cbuff-def-${i}-${b.id}`)) defShred += b.defShred;
  });
  const enemyDefRed = Math.min(0.9, config.enemyDefRed + defShred);

  return { statics, sources, buffs, resonanceAtkPct, referenceAtk, enemyRes, enemyDefRed, hasDerived, warnings };
}


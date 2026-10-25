/**
 * Avaliação de uma rotação: para cada ação, resolve os stats do personagem com os buffs ativos, o dano
 * fixo (consumindo stacks na ordem da rotação), aplica o dano direto com reações e soma por personagem.
 *
 * Modelo derivado da aba "Rotação" da planilha de referência, sem o limite de 4 reações e 5 perfis.
 */
import { kitElement } from './kitElement';
import type { Element, HitType, Move, Talent } from '../data/schema';
import type { FlatDamageEffect, SpecialMove } from '../effects/schema';
import { CONTRIBUTOR_WEIGHTS, SPECIAL_RESIST, TRANSFORMATIVE, type AdditiveReaction, type AmplifyingReaction, type ElementOrPhysical, type LunarReaction, type SpecialReaction, type TransformativeReaction } from './constants/reactions';
import { computeHit, type EnemyStats, type HitBreakdown } from './damage';
import { critFactor } from './formulas';
import { computeLunarReaction, computeSpecial, computeStellarSwirlReaction, computeTransformative, type SpecialBreakdown } from './reactions';
import type { Rolls } from './artifacts';
import { activeTeamDelta, finalStats, hitDmgBonus, type FinalStats, type MemberInput } from './stats';
import type { GlobalConfig, TeamAssembly } from './team';

export type ReactionChoice = 'none' | AmplifyingReaction | AdditiveReaction;

/** Escala somada ao golpe do Lunaris (ex.: Fighting Spirit da Mavuika = +2,04 de ATK). */
export interface ExtraScale {
  atk?: number;
  em?: number;
  hp?: number;
  def?: number;
  flat?: number;
}

/** Tipo do golpe para os bônus: os 5 do jogo ou 'other' (golpe extra de proc, sem bônus de tipo). */
export type MoveHitType = HitType | 'other';

/**
 * Reação que causa dano por si, posta na rotação como uma ação (`talent: 'reaction'`), com a Maestria e os bônus de
 * reação de quem a dispara. Fórmulas do Genshin Optimizer (`libs/gi/wr/src/reaction/{trans,lunar,stellar}.ts`).
 */
export type ReactionHit =
  | { kind: 'transformative'; reaction: TransformativeReaction; /** Redemoinho: elemento espalhado. */ element?: Element }
  | { kind: 'lunar'; reaction: Exclude<LunarReaction, 'lunarbloom'> }
  | { kind: 'stellarswirl'; vortex?: 'vortex1' | 'vortex2' };

export interface ResolvedMove {
  id: string;
  /** Nome do personagem dono do golpe (igual a `character.name`). */
  character: string;
  /**
   * 'proc' = golpe extra de arma, set, passiva ou constelação (escala fixa, não depende do nível de talento);
   * 'reaction' = dano da própria reação (`reactionHit`).
   */
  talent: Talent | 'proc' | 'reaction';
  /** Golpe que causa dano Lunar/Estelar (base = stat do dono): ignora DMG% e dano fixo comuns, usa os bônus da reação. */
  special?: SpecialMove;
  /** Só com `talent: 'reaction'`. */
  reactionHit?: ReactionHit;
  hitType: MoveHitType;
  label: string;
  displayName: string;
  /** Acertos que o golpe contém (importa para os stacks de dano fixo). */
  hits: number;
  scale: Move['scale'];
  extra?: ExtraScale;
  /** Elemento do dano. Padrão: o do personagem. */
  element?: ElementOrPhysical;
}

export interface RotationAction {
  id: string;
  /** Índice do membro na equipa. */
  member: number;
  move: ResolvedMove;
  /** Quantas vezes o golpe é executado ("Hits" da planilha). */
  executions: number;
  reaction: ReactionChoice;
  /** Etiquetas de buff de time ativas nesta ação. */
  activeTags: readonly string[];
  /** Ajuste de DMG% desta linha (ex.: decaimento do A4 da Mavuika). */
  dmgAdjust: number;
  /**
   * Reações Lunar-Charged, Lunar-Crystallize e Stellar-Swirl: índices dos membros que aplicaram os elementos (até 4).
   * Sem lista, só o dono da ação contribui.
   */
  contributors?: readonly number[];
  time?: number;
  note?: string;
}

export interface RotationContext {
  members: MemberInput[];
  assembly: TeamAssembly;
  config: GlobalConfig;
  /** Rolls TOTAIS por substat de cada membro (inclui o mínimo). */
  rolls: Rolls[];
  flatEffects?: FlatDamageEffect[];
  /** Coeficiente de EM das amplificadoras (padrão 25/9; a planilha usa 2,78). */
  ampCoefficient?: number;
}

export interface ActionResult {
  action: RotationAction;
  element: ElementOrPhysical;
  stats: FinalStats;
  /** Escala efetiva do golpe no nível de talento do personagem (já com a escala extra). */
  scale: { atk: number; em: number; hp: number; def: number; flat: number };
  flatDamage: number;
  breakdown: HitBreakdown;
  /** Família do dano: golpe direto, reação transformativa, Lunar ou Estelar. */
  kind: DamageKind;
  /** Taxa e Dano Crítico que valeram neste golpe (nas transformativas, só os da reação). */
  critRate: number;
  critDmg: number;
  noCrit: number;
  crit: number;
  avg: number;
  /** Reação de time: o valor de cada contribuinte (média) e o peso que ele teve (pesos 1, 1/2, 1/12, 1/12, do maior para o menor). */
  contributors?: { member: number; avg: number; weight: number }[];
}

export type DamageKind = 'direct' | 'transformative' | 'lunar' | 'stellar';

const isLunar = (r: SpecialReaction) => r.startsWith('lunar');

/** Família do dano de um golpe resolvido. */
export function damageKind(move: ResolvedMove): DamageKind {
  if (move.reactionHit) return move.reactionHit.kind === 'transformative' ? 'transformative' : move.reactionHit.kind === 'lunar' ? 'lunar' : 'stellar';
  if (move.special) return isLunar(move.special.reaction) ? 'lunar' : 'stellar';
  return 'direct';
}

/** Breakdown de dano Lunar/Estelar no formato do golpe direto (o DMG% vira o multiplicador `specialDmg_`). */
function specialToHit(b: SpecialBreakdown, executions: number): HitBreakdown {
  const baseTotal = b.base * executions;
  return {
    base: b.base, executions, flatDamage: 0, additive: 0, baseTotal, dmgMultiplier: b.specialDmgMultiplier, crit: 1,
    def: b.def, res: b.res, amp: 1, reactionApplied: true, total: baseTotal * b.specialDmgMultiplier * b.def * b.res,
  };
}

interface ReactionActionInput {
  move: ResolvedMove;
  executions: number;
  ownElement: Element;
  stats: FinalStats;
  /** Escala do golpe no nível de talento (golpes Lunar/Estelar). */
  scale: { atk: number; em: number; hp: number; def: number; flat: number };
  characterLevel: number;
  enemy: EnemyStats;
}

/** Dano de um golpe Lunar/Estelar ou de uma reação posta na rotação (sem crítico: ele vem em `critRate`/`critDmg`). */
function reactionAction(i: ReactionActionInput): { element: ElementOrPhysical; breakdown: HitBreakdown; critRate: number; critDmg: number } {
  const rb = (k: string) => (i.stats.reactionBonus as Record<string, number>)[k] ?? 0;
  const special = (r: SpecialReaction) => ({
    bonuses: { dmgBonus: rb(r), baseDmgBonus: rb(`${r}Base`), specialDmgBonus: rb(`${r}Special`), flatDamage: rb(`${r}Flat`), stellarMultiBonus: rb(`${r}Mult`) },
    critRate: i.stats.critRate + rb(`${r}CritRate`),
    critDmg: i.stats.critDmg + rb(`${r}CritDmg`),
    critMode: 'hit' as const,
    characterLevel: i.characterLevel,
    em: i.stats.em,
    enemy: i.enemy,
  });
  const hit = i.move.reactionHit;
  if (!hit) {
    const sp = i.move.special!;
    const resist = isLunar(sp.reaction) ? SPECIAL_RESIST[sp.reaction as LunarReaction] : sp.resist ?? i.ownElement;
    const s = i.stats;
    const statValue = s.atk * i.scale.atk + s.em * i.scale.em + s.hp * i.scale.hp + s.def * i.scale.def + i.scale.flat;
    const c = special(sp.reaction);
    const b = computeSpecial({ ...c, reaction: sp.reaction, resistElement: resist, base: { statValue }, multiplier: 1 });
    return { element: resist, breakdown: specialToHit(b, i.executions), critRate: c.critRate, critDmg: c.critDmg };
  }
  if (hit.kind === 'lunar') {
    const c = special(hit.reaction);
    const b = computeLunarReaction(hit.reaction, c);
    return { element: SPECIAL_RESIST[hit.reaction], breakdown: specialToHit(b, i.executions), critRate: c.critRate, critDmg: c.critDmg };
  }
  if (hit.kind === 'stellarswirl') {
    // Genshin Optimizer: o Redemoinho Estelar usa a RES Anemo; os vórtices, a RES Cryo.
    const resistElement: Element = hit.vortex ? 'Cryo' : 'Anemo';
    const c = special('stellarswirl');
    const b = computeStellarSwirlReaction({ ...c, resistElement }, hit.vortex);
    return { element: resistElement, breakdown: specialToHit(b, i.executions), critRate: c.critRate, critDmg: c.critDmg };
  }
  const info = TRANSFORMATIVE[hit.reaction];
  const r = hit.reaction;
  const critRate = info.canCrit ? rb(`${r}CritRate`) : 0;
  const critDmg = info.canCrit ? rb(`${r}CritDmg`) : 0;
  const t = computeTransformative({
    reaction: r, characterLevel: i.characterLevel, em: i.stats.em, enemy: i.enemy, critMode: 'hit',
    bonuses: { dmgBonus: rb(r), flatDamage: rb(`${r}Flat`) },
    ...(r === 'swirl' ? { swirl: { element: hit.element ?? 'Pyro' } } : {}),
  });
  const element: ElementOrPhysical = r === 'swirl' ? hit.element ?? 'Pyro' : info.resist;
  const baseTotal = t.base * i.executions;
  return {
    element,
    breakdown: { base: t.base, executions: i.executions, flatDamage: 0, additive: 0, baseTotal, dmgMultiplier: 1, crit: 1, def: t.def, res: t.res, amp: t.amp, reactionApplied: true, total: baseTotal * t.def * t.res * t.amp },
    critRate,
    critDmg,
  };
}

export interface MemberTotals {
  name: string;
  noCrit: number;
  crit: number;
  avg: number;
  /** Fração do dano médio total da rotação. */
  share: number;
}

export interface RotationResult {
  actions: ActionResult[];
  members: MemberTotals[];
  totals: { noCrit: number; crit: number; avg: number; dps: number };
}

const TALENT_MAX = 15;

export function scaleAt(move: ResolvedMove, level: number | undefined) {
  const i = Math.min(Math.max(Math.trunc(level ?? 1) || 1, 1), TALENT_MAX) - 1;
  const x = move.extra ?? {};
  return {
    atk: (move.scale.atk?.[i] ?? 0) + (x.atk ?? 0),
    em: (move.scale.em?.[i] ?? 0) + (x.em ?? 0),
    hp: (move.scale.hp?.[i] ?? 0) + (x.hp ?? 0),
    def: (move.scale.def?.[i] ?? 0) + (x.def ?? 0),
    flat: (move.scale.flat?.[i] ?? 0) + (x.flat ?? 0),
  };
}

/** Elementos de alvo/estilo de cada efeito de dano fixo vêm como texto; compara sem diferenciar maiúsculas. */
const sameEl = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function sourceStatValue(effect: FlatDamageEffect, stats: FinalStats, source: MemberInput): number {
  switch (effect.sourceStat) {
    case 'ATK': return stats.atk;
    case 'HP': return stats.hp;
    case 'DEF': return stats.def;
    case 'EM': return stats.em;
    case 'BaseATK': return source.character.baseAtk + source.weapon.baseAtk;
  }
}

export function evaluateRotation(ctx: RotationContext, actions: readonly RotationAction[]): RotationResult {
  const { members, assembly, config } = ctx;
  const names = members.map((m) => m.character.name);

  const cache = new Map<string, FinalStats>();
  const statsFor = (member: number, tags: ReadonlySet<string> | 'all'): FinalStats => {
    const key = `${member}|${tags === 'all' ? '*' : [...tags].sort().join(',')}`;
    let s = cache.get(key);
    if (!s) {
      const team = activeTeamDelta(assembly.buffs, names[member], tags);
      s = finalStats(members[member], assembly.statics[member], ctx.rolls[member], team, assembly.resonanceAtkPct);
      cache.set(key, s);
    }
    return s;
  };

  // Dano fixo: valor por hit de cada efeito (stat do doador com todas as etiquetas ativas) e stacks restantes.
  const flat = (ctx.flatEffects ?? []).map((e) => {
    const src = names.indexOf(e.source);
    const perHit =
      !e.active || src < 0
        ? 0
        : (() => {
            const raw = e.perPoint * Math.max(0, sourceStatValue(e, statsFor(src, 'all'), members[src]) - e.threshold);
            return e.capPerHit === undefined ? raw : Math.min(raw, e.capPerHit);
          })();
    return { effect: e, perHit, remaining: e.stacks ?? Infinity };
  });

  const results: ActionResult[] = actions.map((action) => {
    const member = members[action.member];
    const move = action.move;
    const tags = new Set(action.activeTags);
    const stats = statsFor(action.member, tags);
    const enemy: EnemyStats = {
      level: config.enemyLevel,
      res: assembly.enemyRes,
      defRed: assembly.enemyDefRed,
      defIgnore: Math.min(1, (config.enemyDefIgnore ?? 0) + (stats.defIgnore ?? 0)),
    };
    const kind = damageKind(move);

    // Golpe Lunar/Estelar ou reação: fórmula própria, sem DMG% nem dano fixo comuns (não consome stacks).
    if (kind !== 'direct') {
      const scale = move.reactionHit ? { atk: 0, em: 0, hp: 0, def: 0, flat: 0 } : scaleAt(move, move.talent === 'proc' || move.talent === 'reaction' ? 1 : member.talents[move.talent]);
      const r = reactionAction({ move, executions: action.executions, ownElement: member.character.element, stats, scale, characterLevel: config.characterLevel, enemy });
      const hit = move.reactionHit;
      if (hit && (hit.kind === 'lunar' || hit.kind === 'stellarswirl')) {
        // Reação do time: cada contribuinte vale por si (EM e crítico próprios) e o total é a soma ponderada 1 + 1/2 + 1/12 + 1/12.
        const who = [...new Set(action.contributors?.length ? action.contributors : [action.member])].filter((i) => i >= 0 && i < members.length).slice(0, CONTRIBUTOR_WEIGHTS.length);
        const each = who.map((i) => {
          const st = statsFor(i, tags);
          const en: EnemyStats = { ...enemy, defIgnore: Math.min(1, (config.enemyDefIgnore ?? 0) + (st.defIgnore ?? 0)) };
          const x = reactionAction({ move, executions: 1, ownElement: members[i].character.element, stats: st, scale, characterLevel: config.characterLevel, enemy: en });
          const n = x.breakdown.total;
          return { member: i, noCrit: n, crit: n * critFactor('crit', x.critRate, x.critDmg), avg: n * critFactor('avg', x.critRate, x.critDmg) };
        });
        const weighted = (pick: (e: (typeof each)[number]) => number) => [...each].map(pick).sort((a, b) => b - a).reduce((s, v, k) => s + v * CONTRIBUTOR_WEIGHTS[k], 0) * action.executions;
        const noCrit = weighted((e) => e.noCrit);
        const byAvg = [...each].sort((a, b) => b.avg - a.avg);
        const scaleTo = r.breakdown.total > 0 ? noCrit / r.breakdown.total : 0;
        return {
          action, element: r.element, stats, scale, flatDamage: 0,
          breakdown: { ...r.breakdown, base: r.breakdown.base * scaleTo, baseTotal: r.breakdown.baseTotal * scaleTo, total: noCrit },
          kind, critRate: r.critRate, critDmg: r.critDmg,
          noCrit, crit: weighted((e) => e.crit), avg: weighted((e) => e.avg),
          contributors: byAvg.map((e, k) => ({ member: e.member, avg: e.avg * action.executions, weight: CONTRIBUTOR_WEIGHTS[k] })),
        };
      }
      const noCrit = r.breakdown.total;
      return {
        action, element: r.element, stats, scale, flatDamage: 0, breakdown: r.breakdown, kind, critRate: r.critRate, critDmg: r.critDmg,
        noCrit, crit: noCrit * critFactor('crit', r.critRate, r.critDmg), avg: noCrit * critFactor('avg', r.critRate, r.critDmg),
      };
    }

    // Sem elemento escolhido, vale o do kit (Físico nos ataques normais de arma, elemento nas habilidades) ou, no modo antigo, o do personagem.
    const element: ElementOrPhysical = move.element ?? (config.elementMode === 'kit' ? kitElement(member.character, move, member.normalInfusion) : member.character.element);

    // Dano fixo desta linha
    const hitsOfAction = action.executions * Math.max(1, move.hits);
    let flatDamage = 0;
    for (const f of flat) {
      if (f.perHit <= 0 || f.remaining <= 0) continue;
      const e = f.effect;
      const targetOk = e.targets === 'all' || e.targets.includes(member.character.name);
      const elementOk = e.elements.length === 0 || (element !== 'Physical' && e.elements.some((x) => sameEl(x, element)));
      const typeOk = e.hitTypes.length === 0 || (move.hitType !== 'other' && e.hitTypes.includes(move.hitType));
      if (!(targetOk && elementOk && typeOk)) continue;
      const covered = Math.min(hitsOfAction, f.remaining);
      f.remaining -= covered;
      flatDamage += covered * f.perHit;
    }

    const level = move.talent === 'proc' || move.talent === 'reaction' ? 1 : member.talents[move.talent];
    const scale = scaleAt(move, level);
    const base = stats.atk * scale.atk + stats.em * scale.em + stats.hp * scale.hp + stats.def * scale.def + scale.flat;

    const byType = <T,>(r: Record<HitType, T> | undefined) => (move.hitType === 'other' ? undefined : r?.[move.hitType]);
    const critRate = stats.critRate + ((byType(stats.critRateByType) as number | undefined) ?? 0);
    const critDmg = stats.critDmg + ((byType(stats.critDmgByType) as number | undefined) ?? 0) + (element === 'Physical' ? stats.physCritDmg ?? 0 : 0);

    const reactionBonus =
      action.reaction === 'melt' ? stats.meltBonus
      : action.reaction === 'vaporize' ? stats.vaporizeBonus
      : action.reaction === 'spread' || action.reaction === 'aggravate' ? stats.reactionBonus?.[action.reaction] ?? 0
      : 0;

    const breakdown = computeHit({
      element,
      base,
      executions: action.executions,
      flatDamage,
      dmgBonus: hitDmgBonus(stats, element, member.character.element, move.hitType) + action.dmgAdjust,
      critRate,
      critDmg,
      critMode: 'hit',
      characterLevel: config.characterLevel,
      em: stats.em,
      enemy,
      reaction: action.reaction === 'none' ? undefined : { kind: action.reaction, bonus: reactionBonus },
      ampCoefficient: ctx.ampCoefficient,
    });

    const noCrit = breakdown.total;
    return {
      action,
      element,
      stats,
      scale,
      flatDamage,
      breakdown,
      kind,
      critRate,
      critDmg,
      noCrit,
      crit: noCrit * critFactor('crit', critRate, critDmg),
      avg: noCrit * critFactor('avg', critRate, critDmg),
    };
  });

  const memberTotals: MemberTotals[] = members.map((m, i) => {
    const mine = results.filter((r) => r.action.member === i);
    return {
      name: m.character.name,
      noCrit: mine.reduce((s, r) => s + r.noCrit, 0),
      crit: mine.reduce((s, r) => s + r.crit, 0),
      avg: mine.reduce((s, r) => s + r.avg, 0),
      share: 0,
    };
  });
  const totals = {
    noCrit: memberTotals.reduce((s, m) => s + m.noCrit, 0),
    crit: memberTotals.reduce((s, m) => s + m.crit, 0),
    avg: memberTotals.reduce((s, m) => s + m.avg, 0),
    dps: 0,
  };
  totals.dps = config.rotationDuration > 0 ? totals.avg / config.rotationDuration : 0;
  memberTotals.forEach((m) => (m.share = totals.avg > 0 ? m.avg / totals.avg : 0));

  return { actions: results, members: memberTotals, totals };
}


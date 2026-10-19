/**
 * Avaliação de uma rotação: para cada ação, resolve os stats do personagem com os buffs ativos, o dano
 * fixo (consumindo stacks na ordem da rotação), aplica o dano direto com reações e soma por personagem.
 *
 * Modelo derivado da aba "Rotação" da planilha de referência, sem o limite de 4 reações e 5 perfis.
 */
import type { HitType, Move, Talent } from '../data/schema';
import type { FlatDamageEffect } from '../effects/schema';
import type { AdditiveReaction, AmplifyingReaction, ElementOrPhysical } from './constants/reactions';
import { computeHit, type HitBreakdown } from './damage';
import { critFactor } from './formulas';
import type { Rolls } from './artifacts';
import { activeTeamDelta, finalStats, type FinalStats, type MemberInput } from './stats';
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

export interface ResolvedMove {
  id: string;
  /** Nome do personagem dono do golpe (igual a `character.name`). */
  character: string;
  talent: Talent;
  hitType: HitType;
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
  noCrit: number;
  crit: number;
  avg: number;
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

export function scaleAt(move: ResolvedMove, level: number) {
  const i = Math.min(Math.max(Math.trunc(level), 1), TALENT_MAX) - 1;
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

function sourceStatValue(effect: FlatDamageEffect, stats: FinalStats): number {
  switch (effect.sourceStat) {
    case 'ATK': return stats.atk;
    case 'HP': return stats.hp;
    case 'DEF': return stats.def;
    case 'EM': return stats.em;
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
            const raw = e.perPoint * Math.max(0, sourceStatValue(e, statsFor(src, 'all')) - e.threshold);
            return e.capPerHit === undefined ? raw : Math.min(raw, e.capPerHit);
          })();
    return { effect: e, perHit, remaining: e.stacks ?? Infinity };
  });

  const results: ActionResult[] = actions.map((action) => {
    const member = members[action.member];
    const move = action.move;
    const tags = new Set(action.activeTags);
    const stats = statsFor(action.member, tags);
    const element: ElementOrPhysical = move.element ?? member.character.element;

    // Dano fixo desta linha
    const hitsOfAction = action.executions * Math.max(1, move.hits);
    let flatDamage = 0;
    for (const f of flat) {
      if (f.perHit <= 0 || f.remaining <= 0) continue;
      const e = f.effect;
      const targetOk = e.targets === 'all' || e.targets.includes(member.character.name);
      const elementOk = e.elements.length === 0 || (element !== 'Physical' && e.elements.some((x) => sameEl(x, element)));
      const typeOk = e.hitTypes.length === 0 || e.hitTypes.includes(move.hitType);
      if (!(targetOk && elementOk && typeOk)) continue;
      const covered = Math.min(hitsOfAction, f.remaining);
      f.remaining -= covered;
      flatDamage += covered * f.perHit;
    }

    const level = member.talents[move.talent];
    const scale = scaleAt(move, level);
    const base = stats.atk * scale.atk + stats.em * scale.em + stats.hp * scale.hp + stats.def * scale.def + scale.flat;

    const critRate = stats.critRate + (stats.critRateByType?.[move.hitType] ?? 0);
    const critDmg = stats.critDmg + (stats.critDmgByType?.[move.hitType] ?? 0);

    const reactionBonus =
      action.reaction === 'melt' ? stats.meltBonus : action.reaction === 'vaporize' ? stats.vaporizeBonus : 0;

    const breakdown = computeHit({
      element,
      base,
      executions: action.executions,
      flatDamage,
      dmgBonus: stats.dmgBonus + stats.dmgByType[move.hitType] + action.dmgAdjust,
      critRate,
      critDmg,
      critMode: 'hit',
      characterLevel: config.characterLevel,
      em: stats.em,
      enemy: {
        level: config.enemyLevel,
        res: assembly.enemyRes,
        defRed: assembly.enemyDefRed,
        defIgnore: Math.min(1, (config.enemyDefIgnore ?? 0) + (stats.defIgnore ?? 0)),
      },
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


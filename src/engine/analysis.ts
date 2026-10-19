/**
 * Métricas de leitura da rotação e do build: de onde vem o dano, quanto vale cada substat a mais,
 * cascata de multiplicadores de um golpe e comparação de variantes (armas, sets, refinamentos).
 * Tudo derivado do motor; nada aqui inventa números de jogo.
 */
import type { HitType } from '../data/schema';
import { SUBSTATS, type Rolls, type Substat } from './artifacts';
import { critFactor, type CritMode } from './formulas';
import { optimizeTeam, type OptimizerContext, type TeamOptimization } from './optimizer';
import { evaluateRotation, type ActionResult, type RotationContext, type RotationResult } from './rotation';
import { maxRollsFor, type FinalStats, type MemberInput } from './stats';
import { assembleTeam, type TeamInput } from './team';
import type { FlatDamageEffect } from '../effects/schema';

// ---------- Dano por fonte e participação de reações ----------

export type SourceKey = HitType | 'amplifying' | 'additive' | 'transformative' | 'lunar' | 'stellar';

export interface SourceBreakdown {
  total: number;
  /** Dano médio atribuído a cada fonte; a soma é exatamente `total`. */
  bySource: Record<SourceKey, number>;
  /** Fração do total. */
  shares: Record<SourceKey, number>;
  /** Dano que existe por causa de reações (amplificadoras + aditivas + as que causam dano por si). */
  reactionShare: number;
}

const SOURCE_KEYS: SourceKey[] = ['normal', 'charged', 'plunge', 'skill', 'burst', 'amplifying', 'additive', 'transformative', 'lunar', 'stellar'];
const emptySources = (): Record<SourceKey, number> => Object.fromEntries(SOURCE_KEYS.map((k) => [k, 0])) as Record<SourceKey, number>;

/**
 * Separa o dano médio por tipo de golpe e por reação. O ganho de uma amplificadora é `dano × (1 − 1/amp)`
 * e o de uma aditiva é a parcela do termo aditivo na base; o restante pertence ao tipo do golpe.
 */
export function damageBySource(result: RotationResult): SourceBreakdown {
  const by = emptySources();
  for (const r of result.actions) {
    const b = r.breakdown;
    const withoutAmp = r.avg / b.amp;
    const additiveShare = b.baseTotal > 0 ? (b.additive * b.executions) / b.baseTotal : 0;
    by.amplifying += r.avg - withoutAmp;
    by.additive += withoutAmp * additiveShare;
    by[r.action.move.hitType] += withoutAmp * (1 - additiveShare);
  }
  const total = result.totals.avg;
  const shares = emptySources();
  for (const k of SOURCE_KEYS) shares[k] = total > 0 ? by[k] / total : 0;
  return {
    total,
    bySource: by,
    shares,
    reactionShare: shares.amplifying + shares.additive + shares.transformative + shares.lunar + shares.stellar,
  };
}

// ---------- Crítico ----------

export type CritStatus = 'ok' | 'low-crit-dmg' | 'low-crit-rate' | 'rate-over-cap';

export interface CritProfile {
  critRate: number;
  critDmg: number;
  /** Crit Value = 2 × CR% + CD% (em pontos percentuais). */
  critValue: number;
  /** CD / CR. Ideal ≈ 2 (proporção 1:2). */
  ratio: number;
  status: CritStatus;
}

export function critProfile(stats: Pick<FinalStats, 'critRate' | 'critDmg'>, options: { min?: number; max?: number } = {}): CritProfile {
  const min = options.min ?? 1.5;
  const max = options.max ?? 2.5;
  const ratio = stats.critRate > 0 ? stats.critDmg / stats.critRate : Infinity;
  const status: CritStatus =
    stats.critRate > 1 ? 'rate-over-cap' : ratio < min ? 'low-crit-dmg' : ratio > max ? 'low-crit-rate' : 'ok';
  return {
    critRate: stats.critRate,
    critDmg: stats.critDmg,
    critValue: 2 * stats.critRate * 100 + stats.critDmg * 100,
    ratio,
    status,
  };
}

// ---------- Ganho marginal por substat ----------

export interface SubstatGain {
  member: number;
  substat: Substat;
  /** DPS da equipa ganho com +1 roll neste substat. */
  dpsGain: number;
  /** dpsGain / DPS atual. */
  relativeGain: number;
  /** O membro já está no limite de rolls deste substat (o ganho é hipotético). */
  atCap: boolean;
}

/** Quanto DPS cada membro ganharia com +1 roll de cada substat (mapa de calor do otimizador). */
export function substatGains(ctx: RotationContext, actions: Parameters<typeof evaluateRotation>[1]): SubstatGain[] {
  const base = evaluateRotation(ctx, actions);
  const out: SubstatGain[] = [];
  ctx.members.forEach((m, i) => {
    for (const s of SUBSTATS) {
      const rolls: Rolls[] = ctx.rolls.map((r) => ({ ...r }));
      rolls[i][s] += 1;
      const after = evaluateRotation({ ...ctx, rolls }, actions);
      const dpsGain = after.totals.dps - base.totals.dps;
      out.push({
        member: i,
        substat: s,
        dpsGain,
        relativeGain: base.totals.dps > 0 ? dpsGain / base.totals.dps : 0,
        atCap: ctx.rolls[i][s] >= maxRollsFor(m.artifacts, s),
      });
    }
  });
  return out;
}

// ---------- Cascata de multiplicadores ----------

export type WaterfallKey = 'base' | 'dmg' | 'crit' | 'reaction' | 'def' | 'res';

export interface WaterfallStep {
  key: WaterfallKey;
  label: string;
  /** Fator que esta etapa multiplica (1 para a base). */
  factor: number;
  /** Valor acumulado depois desta etapa. */
  value: number;
}

/** base → bônus de dano → crítico → reação → defesa → resistência. O último valor é o dano do golpe. */
export function hitWaterfall(r: ActionResult, mode: CritMode = 'avg'): WaterfallStep[] {
  const b = r.breakdown;
  const crit = critFactor(mode, r.stats.critRate, r.stats.critDmg);
  const steps: [WaterfallKey, string, number][] = [
    ['base', 'Base', 1],
    ['dmg', 'Bônus de dano', b.dmgMultiplier],
    ['crit', 'Crítico', crit],
    ['reaction', 'Reação', b.amp],
    ['def', 'Defesa', b.def],
    ['res', 'Resistência', b.res],
  ];
  let value = b.baseTotal;
  return steps.map(([key, label, factor]) => {
    value *= factor;
    return { key, label, factor, value };
  });
}

// ---------- Comparação de variantes (armas, sets, refinamentos, constelações) ----------

export interface Variant {
  label: string;
  /** Devolve o membro modificado (ex.: outra arma + o efeito dela). */
  apply: (member: MemberInput) => MemberInput;
}

export interface VariantResult {
  label: string;
  dps: number;
  avg: number;
  /** DPS relativo à variante de referência (1 = igual). */
  relative: number;
  optimization: TeamOptimization;
}

export interface VariantInput {
  team: TeamInput;
  actions: OptimizerContext['actions'];
  flatEffects?: FlatDamageEffect[];
  ampCoefficient?: number;
}

/** Re-otimiza os substats da equipa para cada variante e compara o DPS com a referência. Ordenado do melhor ao pior. */
export function compareVariants(input: VariantInput, member: number, variants: Variant[], referenceIndex = 0): VariantResult[] {
  const results = variants.map((v) => {
    const members = input.team.members.map((m, i) => (i === member ? v.apply(m) : m));
    const team: TeamInput = { ...input.team, members };
    const optimization = optimizeTeam({
      members,
      assembly: assembleTeam(team),
      config: team.config,
      actions: input.actions,
      flatEffects: input.flatEffects,
      ampCoefficient: input.ampCoefficient,
    });
    return { label: v.label, dps: optimization.result.totals.dps, avg: optimization.result.totals.avg, relative: 0, optimization };
  });
  const ref = results[referenceIndex]?.dps ?? 0;
  results.forEach((r) => (r.relative = ref > 0 ? r.dps / ref : 0));
  return results.sort((a, b) => b.dps - a.dps);
}

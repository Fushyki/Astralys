/**
 * Otimizador de substats: distribui os rolls livres de um personagem entre crítico, % da escala principal
 * e EM para maximizar o dano médio da rotação, depois de garantir o ER mínimo.
 *
 * Reproduz a busca exata da planilha de referência (abas "Cálculos" e "Otimizador"):
 *  1. orçamento: rolls totais − 10 × rolls mínimos = rolls livres;
 *  2. ER recebe só o necessário para o ER mínimo;
 *  3. o restante (até 45) vai para dano: k rolls em crítico (melhor divisão CR/CD) e o resto entre % da
 *     escala principal e EM; escolhe o k de maior dano (empate → menor k);
 *  4. escala principal (ATK/HP/DEF) = a de maior peso na rotação; suporte sem dano próprio maximiza o stat
 *     do seu dano fixo.
 *
 * Limitação herdada do modelo: buffs de time que mexem em CR/CD não entram na busca (variariam por ação).
 */
import { ADDITIVE, type AdditiveReaction, type AmplifyingReaction } from './constants/reactions';
import { additiveTerm, ampMultiplier } from './damage';
import { defMultiplier, resMultiplier } from './formulas';
import type { FlatDamageEffect } from '../effects/schema';
import { enemyRes } from './damage';
import {
  FLOWER_HP,
  PLUME_ATK,
  pick,
  SUBSTATS,
  type Rolls,
  type Substat,
} from './artifacts';
import {
  evaluateRotation,
  withoutDecay,
  scaleAt,
  type RotationAction,
  type RotationContext,
  type RotationResult,
} from './rotation';
import {
  activeTeamDelta,
  defaultTotalRolls,
  finalStats,
  hitDmgBonus,
  maxRollsFor,
  minimumRolls,
  rollValues,
  weaponErAtkPct,
  type StatBlock,
} from './stats';

export type MainScale = 'atk' | 'hp' | 'def';
const MAX_DAMAGE_ROLLS = 45;

export interface OptimizerContext extends Omit<RotationContext, 'rolls'> {
  actions: readonly RotationAction[];
}

export interface OptimizationResult {
  member: number;
  rolls: Rolls;
  mainScale: MainScale;
  /** Suporte sem dano próprio: maximiza o stat do dano fixo que fornece. */
  support: boolean;
  /** Os rolls foram definidos à mão (não houve otimização). */
  manual?: boolean;
  budget: { total: number; free: number; erRolls: number; damageRolls: number };
  /** Rolls livres (além do mínimo) em cada destino. */
  free: { cr: number; cd: number; scale: number; em: number; er: number };
  /** Dano médio do membro segundo o otimizador (confere com evaluateRotation). */
  expectedAvg: number;
}

interface Group {
  profile: StatBlock;
  reaction: AmplifyingReaction | AdditiveReaction | 'none';
  element: string;
  sA: number; sE: number; sH: number; sD: number;
  /** Σ W × escala fixa  +  Σ dano fixo × multiplicadores (constantes na busca). */
  sC: number;
  /** Σ W (para o termo aditivo). */
  sW: number;
}

const ceilTol = (x: number) => Math.ceil(x - 1e-9);

/** Otimiza os rolls de UM membro. `flatByAction` = dano fixo por ação (índice = posição em ctx.actions). */
export function optimizeMember(ctx: OptimizerContext, memberIndex: number, flatByAction?: readonly number[]): OptimizationResult {
  const { members, assembly, config } = ctx;
  const m = members[memberIndex];

  // Rolls definidos à mão: não há o que otimizar.
  if (m.manualRolls) {
    const rolls = { ...m.manualRolls };
    const used = Object.values(rolls).reduce((s, x) => s + x, 0);
    return {
      member: memberIndex,
      rolls,
      mainScale: 'atk',
      support: false,
      manual: true,
      budget: { total: used, free: 0, erRolls: 0, damageRolls: 0 },
      free: { cr: 0, cd: 0, scale: 0, em: 0, er: 0 },
      expectedAvg: 0,
    };
  }
  const names = members.map((x) => x.character.name);
  const statics = assembly.statics[memberIndex];
  const rv = rollValues(m.artifacts);
  const minR = config.minRollsPerSubstat;

  // ---- 1) Orçamento ----
  // Padrão KQM (`liquidRolls`, KQMS 3.0): 20 procs fixos (2 de cada substat) + 20 livres; cada substat recebe no máximo 2 procs livres por
  // peça e nenhum numa peça cujo stat principal é ele. Sem `liquidRolls` vale a regra da planilha (mínimo por substat, o resto é livre).
  const kqm = m.liquidRolls !== undefined;
  const total = m.totalRolls ?? defaultTotalRolls(m.artifacts);
  const free = kqm ? Math.max(0, m.liquidRolls!) : Math.max(0, total - SUBSTATS.length * minR);
  const floor = minR; // procs fixos de cada substat
  const slotMains = ['HP', 'ATK', m.artifacts.sands, m.artifacts.goblet, m.artifacts.circlet];
  const maxFree = (s: Substat) => (kqm ? 2 * slotMains.filter((mn) => mn !== s).length : Math.max(0, maxRollsFor(m.artifacts, s) - floor));

  const er0 = 1 + statics.er + floor * rv.ER;
  const minER = m.minER ?? 0;
  const statFocus = m.kqmStat;
  const erRolls = statFocus === 'er' ? Math.min(maxFree('ER'), free) : minER <= er0 ? 0 : Math.min(maxFree('ER'), free, ceilTol((minER - er0) / rv.ER));
  let damageRolls = Math.min(MAX_DAMAGE_ROLLS, free - erRolls);
  // ATK próprio mínimo: preenchido depois que a escala principal é conhecida (precisa de maxScale)
  const erFinal = er0 + erRolls * rv.ER;
  const erAtk = weaponErAtkPct(m, erFinal);

  // ---- 2) Grupos de ações do membro ----
  const profileCache = new Map<string, StatBlock>();
  const profileOf = (tags: readonly string[], share?: Readonly<Record<string, number>>) => {
    const key = [...tags].sort().join(',') + (share ? JSON.stringify(share) : '');
    let p = profileCache.get(key);
    if (!p) {
      p = activeTeamDelta(assembly.buffs, names[memberIndex], new Set(tags), undefined, undefined, share);
      profileCache.set(key, p);
    }
    return { key, team: p };
  };

  const groups = new Map<string, Group>();
  const minStats = (tags: readonly string[], share?: Readonly<Record<string, number>>) =>
    finalStats(m, statics, minimumRolls(floor), profileOf(tags, share).team, assembly.resonanceAtkPct);

  // Foco do KQM: só o golpe escolhido pesa na busca (se ele não está na rotação, vale a rotação inteira).
  const focus = m.kqmFocus && ctx.actions.some((a) => a.member === memberIndex && a.move.id === m.kqmFocus) ? m.kqmFocus : undefined;
  ctx.actions.forEach((a, idx) => {
    if (a.member !== memberIndex) return;
    if (focus && a.move.id !== focus) return;
    // Reação posta na rotação: só depende da Maestria e dos bônus de reação; a busca de substats não a enxerga.
    if (a.move.reactionHit || a.move.talent === 'reaction') return;
    const { key, team } = profileOf(a.activeTags, a.tagShare);
    const stats = minStats(a.activeTags, a.tagShare); // só para os bônus de DMG% (não dependem dos rolls)
    const element = a.move.element ?? m.character.element;
    // Golpe Lunar/Estelar: sem DMG% comum (a parte da Maestria dele a busca não enxerga; o dano final usa a fórmula certa).
    const dmg = a.move.special ? 1 : 1 + hitDmgBonus(stats, element, m.character.element, a.move.hitType) + a.dmgAdjust;
    const def = defMultiplier(config.characterLevel, config.enemyLevel, assembly.enemyDefRed, config.enemyDefIgnore ?? 0);
    const res = resMultiplier(enemyRes({ level: config.enemyLevel, res: assembly.enemyRes }, element));
    const w = a.executions * dmg * def * res;
    const sc = scaleAt(a.move, a.move.talent === 'proc' ? 1 : m.talents[a.move.talent]);
    const flat = (flatByAction?.[idx] ?? 0) * dmg * def * res;
    const gk = `${key}|${a.reaction}|${element}`;
    let g = groups.get(gk);
    if (!g) {
      g = { profile: team, reaction: a.reaction, element, sA: 0, sE: 0, sH: 0, sD: 0, sC: 0, sW: 0 };
      groups.set(gk, g);
    }
    g.sA += w * sc.atk;
    g.sE += w * sc.em;
    g.sH += w * sc.hp;
    g.sD += w * sc.def;
    g.sC += w * sc.flat + flat;
    g.sW += w;
  });
  const gs = [...groups.values()];

  // ---- 3) Escala principal ----
  // Peso de cada stat = Σ(W × escala) × valor do stat com rolls mínimos e SEM o bônus de ATK% por ER da arma.
  const allTeam = activeTeamDelta(assembly.buffs, names[memberIndex], 'all');
  const full = finalStats(m, statics, minimumRolls(floor), allTeam, assembly.resonanceAtkPct);
  const atkBase = m.character.baseAtk + m.weapon.baseAtk + (statics.atkBaseFlat ?? 0) + (allTeam.atkBaseFlat ?? 0);
  const statWeight = {
    atk: full.atk - atkBase * full.weaponErAtkPct,
    hp: full.hp,
    def: full.def,
  };
  const sum = (f: (g: Group) => number) => gs.reduce((s, g) => s + f(g), 0);
  const weight = {
    atk: sum((g) => g.sA) * statWeight.atk,
    hp: sum((g) => g.sH) * statWeight.hp,
    def: sum((g) => g.sD) * statWeight.def,
  };
  const noOwnDamage = sum((g) => g.sA + g.sE + g.sH + g.sD) === 0;

  const supportStat = (() => {
    const e = (ctx.flatEffects ?? []).find((f) => f.source === m.character.name);
    return e ? ({ ATK: 'atk', HP: 'hp', DEF: 'def' } as const)[e.sourceStat as 'ATK' | 'HP' | 'DEF'] : undefined;
  })();
  const support = statFocus !== undefined || (noOwnDamage && supportStat !== undefined);

  const mainScale: MainScale = statFocus === 'hp' || statFocus === 'atk' || statFocus === 'def'
    ? statFocus
    : support && supportStat
    ? supportStat
    : support
    ? 'atk' // foco em EM/ER: a escala não recebe procs
    : weight.atk >= weight.hp && weight.atk >= weight.def ? 'atk' : weight.hp >= weight.def ? 'hp' : 'def';
  const scaleSubstat: Substat = ({ atk: 'ATK%', hp: 'HP%', def: 'DEF%' } as const)[mainScale];
  const base = minimumRolls(floor);
  const maxScale = maxFree(scaleSubstat);
  const maxEM = maxFree('EM');
  const maxCR = maxFree('CR');
  const maxCD = maxFree('CD');
  // Os tetos por substat limitam o que cabe: procs além deles não têm onde entrar.
  if (kqm) damageRolls = Math.min(damageRolls, maxScale + maxEM + maxCR + maxCD);

  // ---- 4) Funções de avaliação ----
  const plume = pick(PLUME_ATK, m.artifacts.rarity.plume);
  const flower = pick(FLOWER_HP, m.artifacts.rarity.flower);
  const cr0 = 0.05 + statics.critRate + base.CR * rv.CR;
  const cd0 = 0.5 + statics.critDmg + base.CD * rv.CD;
  /** `crit`: rolls em CR e CD; com ele o crítico de cada grupo inclui os buffs de time ativos nas ações dele (regra KQM). */
  const damagePart = (s: number, e: number, crit?: { c: number; d: number }): number => {
    let acc = 0;
    for (const g of gs) {
      const t = g.profile;
      const atk =
        atkBase * (1 + statics.atkPct + t.atkPct + assembly.resonanceAtkPct + base['ATK%'] * rv['ATK%'] + (mainScale === 'atk' ? s * rv['ATK%'] : 0) + erAtk) +
        plume + statics.atkFlat + t.atkFlat + base.ATK * rv.ATK;
      const hp =
        m.character.baseHp * (1 + statics.hpPct + t.hpPct + base['HP%'] * rv['HP%'] + (mainScale === 'hp' ? s * rv['HP%'] : 0)) +
        flower + statics.hpFlat + t.hpFlat + base.HP * rv.HP;
      const def =
        m.character.baseDef * (1 + statics.defPct + t.defPct + base['DEF%'] * rv['DEF%'] + (mainScale === 'def' ? s * rv['DEF%'] : 0)) +
        statics.defFlat + t.defFlat + base.DEF * rv.DEF;
      const em = statics.em + t.em + base.EM * rv.EM + e * rv.EM;

      let part = atk * g.sA + em * g.sE + hp * g.sH + def * g.sD + g.sC;
      let amp = 1;
      if (g.reaction === 'melt' || g.reaction === 'vaporize') {
        const bonus = g.reaction === 'melt' ? statics.meltBonus + t.meltBonus : statics.vaporizeBonus + t.vaporizeBonus;
        amp = ampMultiplier(g.reaction, g.element as never, em, bonus, ctx.ampCoefficient);
      } else if (g.reaction === 'spread' || g.reaction === 'aggravate') {
        const info = ADDITIVE[g.reaction];
        const bonus = (statics.reactionBonus?.[g.reaction] ?? 0) + (t.reactionBonus?.[g.reaction] ?? 0);
        if (g.element === info.element) part += g.sW * additiveTerm(g.reaction, g.element as never, config.characterLevel, em, bonus);
      }
      const cf = crit ? 1 + Math.min(cr0 + t.critRate + crit.c * rv.CR, 1) * (cd0 + t.critDmg + crit.d * rv.CD) : 1;
      acc += amp * part * cf;
    }
    return acc;
  };

  // ATK próprio (sem buffs de outros nem ressonância) mínimo: rolls de ATK% que a busca não pode tirar da escala.
  let sMin = 0;
  if (m.minOwnAtk && mainScale === 'atk') {
    const atkNoScale = atkBase * (1 + statics.atkPct + base['ATK%'] * rv['ATK%'] + erAtk) + plume + statics.atkFlat + base.ATK * rv.ATK;
    sMin = Math.min(damageRolls, maxScale, Math.max(0, ceilTol((m.minOwnAtk - atkNoScale) / (atkBase * rv['ATK%']))));
  }

  const critBest = (k: number) => {
    let best = 0;
    let bestC = 0;
    for (let c = Math.max(0, k - maxCD); c <= Math.min(k, maxCR); c++) {
      const v = 1 + Math.min(cr0 + c * rv.CR, 1) * (cd0 + (k - c) * rv.CD);
      if (v > best) { best = v; bestC = c; }
    }
    return { value: best, c: bestC };
  };
  const scaleBest = (mm: number) => {
    let best = 0;
    let bestS = 0;
    for (let s = Math.max(sMin, mm - maxEM); s <= Math.min(mm, maxScale); s++) {
      const v = damagePart(s, mm - s);
      if (v > best) { best = v; bestS = s; }
    }
    return { value: best, s: bestS };
  };

  // ---- 5) Busca ----
  let k = 0;
  let c = 0;
  let s = 0;
  let emFocus = 0;
  if (support) {
    const toScale = statFocus === 'em' || statFocus === 'er' ? 0 : Math.min(damageRolls, maxScale);
    s = toScale;
    if (statFocus === 'em') emFocus = Math.min(damageRolls, maxEM);
    c = kqm ? Math.min(damageRolls - s - emFocus, maxCR) : damageRolls - s - emFocus;
    k = c; // o resto vai para crítico (CR), como na planilha
  } else {
    const forced = m.forcedCritRolls;
    // O forçado não passa do que cabe nos tetos de CR e CD: além disso a busca não achava combinação e jogava tudo na Proficiência.
    const kForced = forced === undefined ? undefined : Math.max(0, Math.min(damageRolls, maxCR + maxCD, forced - base.CR - base.CD));
    // o mínimo de ATK% fica reservado: crítico só usa o que sobra
    const kMax = damageRolls - sMin;
    const range = kForced === undefined ? Array.from({ length: kMax + 1 }, (_, i) => i) : [Math.min(kForced, kMax)];
    if (kqm) {
      // Regra KQM: busca conjunta em CR, CD, escala e EM, com o crítico de cada grupo (inclui buffs de time de CR e CD).
      let best = -1;
      for (const kk of range) {
        const rem = damageRolls - kk;
        for (let cc = Math.max(0, kk - maxCD); cc <= Math.min(kk, maxCR); cc++) {
          for (let ss = Math.max(sMin, rem - maxEM); ss <= Math.min(rem, maxScale); ss++) {
            const v = damagePart(ss, rem - ss, { c: cc, d: kk - cc });
            if (v > best) { best = v; k = kk; c = cc; s = ss; }
          }
        }
      }
    } else {
      let bestTotal = -1;
      for (const kk of range) {
        const total = critBest(kk).value * scaleBest(damageRolls - kk).value;
        if (total > bestTotal) { bestTotal = total; k = kk; }
      }
      c = critBest(k).c;
      s = scaleBest(damageRolls - k).s;
    }
  }
  const em = damageRolls - k - s;

  const rolls: Rolls = { ...base };
  rolls.CR += c;
  rolls.CD += support ? 0 : k - c;
  rolls[scaleSubstat] += s;
  rolls.EM += support ? emFocus : em;
  rolls.ER += erRolls;

  return {
    member: memberIndex,
    rolls,
    mainScale,
    support,
    budget: { total, free, erRolls, damageRolls },
    free: { cr: c, cd: support ? 0 : k - c, scale: s, em: support ? emFocus : em, er: erRolls },
    expectedAvg: 0,
  };
}

export interface TeamOptimization {
  members: OptimizationResult[];
  rolls: Rolls[];
  result: RotationResult;
}

/**
 * Otimiza todos os membros. Com dano fixo ativo, faz duas passadas: primeiro sem ele (para saber os stats
 * das fontes), depois com o dano fixo calculado fixado na busca, como a planilha faz.
 */
export function optimizeTeam(ctx: OptimizerContext): TeamOptimization {
  const run = (flat?: readonly number[]) => ctx.members.map((_, i) => optimizeMember(ctx, i, flat));

  let results = run();
  let rolls = results.map((r) => r.rolls);
  const hasFlat = (ctx.flatEffects ?? []).some((f: FlatDamageEffect) => f.active);
  if (hasFlat) {
    const pre = evaluateRotation({ ...ctx, rolls, flatEffects: withoutDecay(ctx.flatEffects) }, ctx.actions);
    results = run(pre.actions.map((a) => a.flatDamage));
    rolls = results.map((r) => r.rolls);
  }

  const result = evaluateRotation({ ...ctx, rolls }, ctx.actions);
  results.forEach((r, i) => (r.expectedAvg = result.members[i].avg));
  return { members: results, rolls, result };
}

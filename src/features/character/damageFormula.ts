/**
 * "Cálculo do dano" de um golpe, como o Genshin Optimizer mostra ao clicar no número: a fórmula com os valores no lugar e, para cada
 * fator (ATK, bônus de dano, crítico, DEF, RES, reação), de onde vem cada parte. Puro: usa o resultado do motor, as fontes
 * estáticas e os buffs de time ativos neste golpe; o que a lista de fontes não explica aparece como "Outros", então o total sempre fecha.
 */
import {
  AMP_EM_COEFFICIENT, ampBase, critFactor, defMultiplier, resMultiplier, scaleAt,
  type ActionResult, type StatDelta, type TeamAssembly, type TeamInput,
} from '../../engine';
import { formatDecimal, formatInt } from '../../ui/format';
import { resFromMultiplier } from '../rotation/rotationModel';

export interface FormulaTerm { label: string; value: string }
export interface FormulaBlock {
  id: string;
  title: string;
  /** Valor final do fator, já formatado. */
  total: string;
  /** Como ele é calculado, com os números no lugar. */
  expr: string;
  terms: FormulaTerm[];
}
export interface DamageFormula {
  /** A fórmula inteira numa linha. */
  expr: string;
  blocks: FormulaBlock[];
  /** Só o golpe direto tem a fórmula detalhada; reações usam outra. */
  detailed: boolean;
}

const pct = (f: number, d = 1) => `${formatDecimal(f * 100, d)}%`;
const mult = (f: number, d = 3) => `×${formatDecimal(f, d)}`;
const sgn = (f: number, d = 1) => `${f > 0 ? '+' : ''}${pct(f, d)}`;

type Ctx = { assembly: TeamAssembly; team: TeamInput; member: number; active: ReadonlySet<string> };

/** Cada fonte (estática ou buff de time ativo neste golpe) que dá algo a `read`, com o nome dela. */
function termsOf(a: Ctx, read: (d: StatDelta) => number): { label: string; v: number }[] {
  const name = a.team.members[a.member].character.name;
  const out: { label: string; v: number }[] = [];
  for (const s of a.assembly.sources[a.member] ?? []) {
    const v = read(s.delta);
    if (Math.abs(v) > 1e-9) out.push({ label: s.label, v });
  }
  for (const b of a.assembly.buffs) {
    if (!(b.always || a.active.has(b.tag)) || !(b.targets === 'all' || b.targets.includes(name))) continue;
    const v = read(b.delta);
    if (Math.abs(v) > 1e-9) out.push({ label: b.description ?? b.id, v });
  }
  return out;
}

export function damageFormula(args: { result: ActionResult; team: TeamInput; assembly: TeamAssembly; member: number; mode?: 'avg' | 'crit' | 'noCrit'; ampCoefficient?: number }): DamageFormula {
  const { result: r, team, assembly, member } = args;
  const mode = args.mode ?? 'avg';
  const m = team.members[member];
  const b = r.breakdown;
  const cfg = team.config;
  const ctx: Ctx = { assembly, team, member, active: new Set(r.action.activeTags) };
  const hitType = r.action.move.hitType;
  const sameElement = r.element === m.character.element;
  const byType = (rec: unknown) => (rec as Record<string, number> | undefined)?.[hitType] ?? 0;
  const blocks: FormulaBlock[] = [];

  /** Soma de um stat: mostra cada fonte e, se sobrar diferença (substats, decaimento por tempo), uma linha "Outros". */
  const withRest = (terms: { label: string; v: number }[], total: number, fmt: (n: number) => string): FormulaTerm[] => {
    const out = terms.map((t) => ({ label: t.label, value: fmt(t.v) }));
    const rest = total - terms.reduce((s, t) => s + t.v, 0);
    if (Math.abs(rest) > 1e-6 * Math.max(1, Math.abs(total))) out.push({ label: 'Substats (rolls do build) e outros', value: fmt(rest) });
    return out;
  };

  // ---- Base: escala do golpe × stats ----
  const sc = r.scale;
  const parts = [
    { name: 'ATK', scale: sc.atk, stat: r.stats.atk, id: 'atk' as const },
    { name: 'HP', scale: sc.hp, stat: r.stats.hp, id: 'hp' as const },
    { name: 'DEF', scale: sc.def, stat: r.stats.def, id: 'def' as const },
    { name: 'Proficiência', scale: sc.em, stat: r.stats.em, id: 'em' as const },
  ];
  const used = parts.filter((p) => p.scale > 0);
  const baseExpr = [...used.map((p) => `${pct(p.scale)} × ${p.name} ${formatInt(p.stat)}`), ...(sc.flat > 0 ? [formatInt(sc.flat)] : [])].join(' + ') || '0';
  // Escala do talento no nível atual e, se houver, o extra do golpe (ex.: pontos de Espírito Lutador da Mavuika).
  const ex = (r.action.move.extra ?? {}) as Record<string, number | undefined>;
  const move = r.action.move;
  const level = move.talent === 'proc' || move.talent === 'reaction' ? 1 : m.talents[move.talent];
  const talentScale = scaleAt({ ...move, extra: undefined }, level);
  const baseTerms: FormulaTerm[] = used.flatMap((p) =>
    (ex[p.id] ?? 0) > 0
      ? [
        { label: `Escala do talento (nv ${level}) em ${p.name}`, value: pct(talentScale[p.id]) },
        { label: 'Extra do golpe (pontos do recurso)', value: `+${pct(ex[p.id]!)}` },
        { label: `${pct(p.scale)} × ${p.name} ${formatInt(p.stat)}`, value: formatInt(p.scale * p.stat) },
      ]
      : [{ label: `${pct(p.scale)} do ${p.name}`, value: formatInt(p.scale * p.stat) }],
  );
  if (sc.flat > 0) baseTerms.push({ label: 'Valor fixo do golpe', value: formatInt(sc.flat) });
  if (b.additive > 0) baseTerms.push({ label: 'Termo aditivo da reação (Propagar/Intensificar)', value: formatInt(b.additive) });
  if (b.executions > 1) baseTerms.push({ label: 'Execuções', value: `× ${b.executions}` });
  if (b.flatDamage > 0) baseTerms.push({ label: 'Dano fixo (por golpe elegível)', value: `+ ${formatInt(b.flatDamage)}` });
  const baseFull = `(${baseExpr}${b.additive > 0 ? ` + ${formatInt(b.additive)}` : ''})${b.executions > 1 ? ` × ${b.executions}` : ''}${b.flatDamage > 0 ? ` + ${formatInt(b.flatDamage)}` : ''}`;
  blocks.push({ id: 'base', title: 'Dano base', total: formatInt(b.baseTotal), expr: baseFull, terms: baseTerms });

  // ---- ATK, HP, DEF (base × (1 + %) + fixo) e Proficiência (soma) ----
  const baseOf = { atk: m.character.baseAtk + m.weapon.baseAtk, hp: m.character.baseHp, def: m.character.baseDef };
  const keys = { atk: ['atkPct', 'atkFlat'], hp: ['hpPct', 'hpFlat'], def: ['defPct', 'defFlat'] } as const;
  for (const p of used) {
    if (p.id === 'em') {
      blocks.push({ id: 'em', title: 'Proficiência Elemental', total: formatInt(p.stat), expr: 'soma das fontes', terms: withRest(termsOf(ctx, (d) => d.em ?? 0), p.stat, (n) => formatInt(n)) });
      continue;
    }
    const [pk, fk] = keys[p.id];
    const pctTerms = termsOf(ctx, (d) => (d as unknown as Record<string, number>)[pk] ?? 0);
    if (p.id === 'atk' && assembly.resonanceAtkPct > 0) pctTerms.push({ label: 'Ressonância elemental', v: assembly.resonanceAtkPct });
    const flatTerms = termsOf(ctx, (d) => (d as unknown as Record<string, number>)[fk] ?? 0);
    const sumPct = pctTerms.reduce((s, t) => s + t.v, 0);
    const sumFlat = flatTerms.reduce((s, t) => s + t.v, 0);
    const base = baseOf[p.id];
    const rest = p.stat - (base * (1 + sumPct) + sumFlat);
    const terms: FormulaTerm[] = [
      { label: p.id === 'atk' ? 'ATK base (personagem + arma)' : `${p.name} base do personagem`, value: formatInt(base) },
      ...pctTerms.map((t) => ({ label: t.label, value: sgn(t.v) })),
      ...flatTerms.map((t) => ({ label: `${t.label} (fixo)`, value: `+${formatInt(t.v)}` })),
    ];
    if (Math.abs(rest) > 0.5) terms.push({ label: 'Substats (rolls do build) e outros', value: `${rest > 0 ? '+' : ''}${formatInt(rest)}` });
    blocks.push({ id: p.id, title: `${p.name} total`, total: formatInt(p.stat), expr: `${p.name} base ${formatInt(base)} × (1 + ${pct(sumPct)}) + ${formatInt(sumFlat)}`, terms });
  }

  // ---- Bônus de dano ----
  const dmgTotal = b.dmgMultiplier - 1;
  const dmgTerms = termsOf(ctx, (d) => (d.dmgBonus ?? 0) - (sameElement ? 0 : d.eleDmg ?? 0) + byType(d.dmgByType) + (r.element === 'Physical' ? d.physDmg ?? 0 : 0));
  const adjust = r.action.dmgAdjust ?? 0;
  blocks.push({ id: 'dmg', title: 'Bônus de dano', total: pct(dmgTotal), expr: `1 + ${pct(dmgTotal)}`, terms: withRest([...dmgTerms, ...(adjust ? [{ label: 'Ajuste manual do golpe', v: adjust }] : [])], dmgTotal, (n) => sgn(n)) });

  // ---- Crítico ----
  const crTerms = termsOf(ctx, (d) => (d.critRate ?? 0) + byType(d.critRateByType));
  blocks.push({ id: 'cr', title: 'Taxa crítica', total: pct(r.critRate), expr: 'soma das fontes (no máximo 100%)', terms: [{ label: 'Base do jogo', value: '+5,0%' }, ...withRest(crTerms, r.critRate - 0.05, (n) => sgn(n))] });
  const cdTerms = termsOf(ctx, (d) => (d.critDmg ?? 0) + byType(d.critDmgByType) + (r.element === 'Physical' ? d.physCritDmg ?? 0 : 0));
  blocks.push({ id: 'cd', title: 'Dano crítico', total: pct(r.critDmg), expr: 'soma das fontes', terms: [{ label: 'Base do jogo', value: '+50,0%' }, ...withRest(cdTerms, r.critDmg - 0.5, (n) => sgn(n))] });
  const cf = mode === 'noCrit' ? 1 : critFactor(mode, r.critRate, r.critDmg);
  const critExpr = mode === 'avg' ? `1 + ${pct(Math.min(1, Math.max(0, r.critRate)))} × ${pct(r.critDmg)}` : mode === 'crit' ? `1 + ${pct(r.critDmg)}` : '1';

  // ---- DEF do inimigo ----
  const lc = m.level ?? cfg.characterLevel;
  const ignore = Math.min(1, (cfg.enemyDefIgnore ?? 0) + (r.stats.defIgnore ?? 0));
  const defOk = Math.abs(defMultiplier(lc, cfg.enemyLevel, assembly.enemyDefRed, ignore) - b.def) < 1e-9;
  blocks.push({
    id: 'def', title: 'DEF do inimigo', total: pct(b.def),
    expr: defOk ? `(${lc} + 100) / ((${lc} + 100) + (${cfg.enemyLevel} + 100) × (1 − ${pct(assembly.enemyDefRed)}) × (1 − ${pct(ignore)}))` : 'multiplicador de DEF',
    terms: [
      { label: 'Nível do personagem', value: String(lc) }, { label: 'Nível do inimigo', value: String(cfg.enemyLevel) },
      { label: 'Redução de DEF do inimigo', value: pct(assembly.enemyDefRed) }, { label: 'DEF ignorada', value: pct(ignore) },
    ],
  });

  // ---- RES do inimigo ----
  const enemyRes = resFromMultiplier(b.res);
  const resOk = Math.abs(resMultiplier(enemyRes) - b.res) < 1e-9;
  const resBand = enemyRes < 0 ? `1 − (${pct(enemyRes)}) / 2` : enemyRes < 0.75 ? `1 − ${pct(enemyRes)}` : `1 / (4 × ${pct(enemyRes)} + 1)`;
  const shred = enemyRes - cfg.enemyBaseRes;
  blocks.push({
    id: 'res', title: 'RES do inimigo', total: `${pct(enemyRes)} → ${mult(b.res)}`, expr: resOk ? resBand : 'multiplicador de RES',
    terms: [{ label: 'RES base do inimigo', value: pct(cfg.enemyBaseRes) }, ...(Math.abs(shred) > 1e-9 ? [{ label: 'Reduções de RES (equipe)', value: sgn(shred) }] : [])],
  });

  // ---- Reação amplificadora ----
  if (b.amp !== 1) {
    const coef = args.ampCoefficient ?? AMP_EM_COEFFICIENT;
    const bracket = ampBase(r.stats.em, coef);
    blocks.push({
      id: 'reaction', title: 'Reação', total: mult(b.amp), expr: `base da reação × (1 + ${formatDecimal(coef, 3)} × Proficiência / (Proficiência + 1400) + bônus da reação)`,
      terms: [{ label: 'Proficiência', value: formatInt(r.stats.em) }, { label: 'Fator da Proficiência', value: formatDecimal(bracket, 3) }, { label: 'Base da reação × (fator + bônus)', value: mult(b.amp) }],
    });
  }
  blocks.push({ id: 'crit', title: mode === 'avg' ? 'Crítico médio' : mode === 'crit' ? 'Crítico' : 'Sem crítico', total: mult(cf), expr: critExpr, terms: [] });

  const total = mode === 'avg' ? r.avg : mode === 'crit' ? r.crit : r.noCrit;
  const expr = [`Base ${formatInt(b.baseTotal)}`, `Bônus ${mult(b.dmgMultiplier)}`, `Crítico ${mult(cf)}`, `DEF ${mult(b.def)}`, `RES ${mult(b.res)}`, ...(b.amp !== 1 ? [`Reação ${mult(b.amp)}`] : [])].join(' × ') + ` = ${formatInt(total)}`;
  return { expr, blocks, detailed: r.kind === 'direct' };
}

/** A mesma explicação em texto puro, para copiar. */
export function formulaText(title: string, f: DamageFormula): string {
  return [`${title}: ${f.expr}`, ...f.blocks.flatMap((x) => [`${x.title} ${x.total} = ${x.expr}`, ...x.terms.map((t) => `  ${t.label}: ${t.value}`)])].join('\n');
}

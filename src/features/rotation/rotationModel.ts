/**
 * Modelo da tela Rotação e buffs: informações de cada faixa de buff (fonte, alvo, valor, cor), a cascata de
 * multiplicadores de um golpe (na ordem do mockup) e quanto um golpe perde sem cada buff que o cobre.
 */
import {
  assembleTeam,
  critFactor,
  evaluateRotation,
  type ActionResult,
  type AnalysisBundle,
  type ResolvedProject,
  type RotationProject,
  tagsAt,
  type TeamBuff,
} from '../../engine';
import { deltaChips } from '../team/teamModel';
import { buffLanes } from './buffLanes';

// ---------- Faixas de buff ----------

export interface LaneInfo {
  tag: string;
  /** Nome curto da faixa (cabe na coluna lateral). */
  label: string;
  /** Quem dá o buff ("Citlali · TTDS") e a quem vale ("Mavuika", "time", "inimigo"). */
  source: string;
  target: string;
  /** Texto do efeito na barra ("+48% ATK"). */
  value: string;
  /** Índice do membro que dá o buff, se der para saber (colore a barra). */
  giver: number | null;
  detail: string;
  /** Duração do efeito (s) que o jogo informa: tamanho padrão da janela nova. */
  duration?: number;
}

const ownerOf = (b: TeamBuff): number | null => {
  const m = /^(?:gear|flat-atk|cbuff)-(\d+)/.exec(b.id);
  return m ? Number(m[1]) : null;
};

/** Quem dá o buff: pelo id, ou pelo nome do personagem que aparece na descrição ("TTDS da Citlali"). */
function giverOf(b: TeamBuff, names: string[]): number | null {
  const owner = ownerOf(b);
  if (owner !== null) return owner;
  const text = b.description ?? '';
  const hit = names.findIndex((n) => text.includes(n));
  return hit >= 0 ? hit : null;
}

export function laneInfos(project: RotationProject, resolved: ResolvedProject): LaneInfo[] {
  const team = resolved.team;
  const names = team.members.map((m) => m.character.name);
  const lanes = buffLanes(team);
  const buffs = assembleTeam(team).buffs;
  return lanes.map((lane) => {
    const group = buffs.filter((b) => b.tag === lane.tag);
    const giver = group.map((b) => giverOf(b, names)).find((g) => g !== null) ?? null;
    const targets = new Set<string>();
    let everyone = false;
    for (const b of group) {
      if (b.targets === 'all') everyone = true;
      else b.targets.forEach((t) => targets.add(t));
    }
    const target = everyone || targets.size >= names.length - 1 ? 'time' : [...targets].join(', ');
    const chips = [...new Set(group.flatMap((b) => deltaChips(b.delta)))];
    const source = giver !== null ? `${names[giver]} · ${lane.label}` : lane.label;
    void project;
    return { tag: lane.tag, label: lane.label, source, target, value: chips.join(' · ') || lane.label, giver, detail: lane.detail, ...(lane.duration ? { duration: lane.duration } : {}) };
  });
}

// ---------- Cascata do golpe ----------

export interface CascadeStep {
  key: string;
  label: string;
  /** Multiplicador deste passo (null na base). */
  factor: number | null;
  /** Valor acumulado depois do passo. */
  value: number;
}

/** Dano base → ×Bônus de dano → ×DEF → ×RES → ×Reação → ×Crítico médio = dano médio do golpe. */
export function hitCascade(r: ActionResult): CascadeStep[] {
  const b = r.breakdown;
  const crit = critFactor('avg', r.critRate, r.critDmg);
  const steps: [string, string, number][] = [
    ['dmg', 'Bônus de dano', b.dmgMultiplier],
    ['def', 'DEF', b.def],
    ['res', 'RES', b.res],
    ['reaction', 'Reação', b.amp],
    ['crit', 'Crítico médio', crit],
  ];
  let value = b.baseTotal;
  const out: CascadeStep[] = [{ key: 'base', label: 'Dano base', factor: null, value }];
  for (const [key, label, factor] of steps) {
    value *= factor;
    out.push({ key, label, factor, value });
  }
  return out;
}

/** Um número do golpe para mostrar no painel: `unit` diz como formatar (inteiro, percentual ou multiplicador). */
export interface HitFigure {
  key: string;
  label: string;
  value: number;
  unit: 'int' | 'pct' | 'mult';
}

/** RES do inimigo que gerou o multiplicador (inverso de: <0 → 1−RES/2; <75% → 1−RES; senão 1/(4·RES+1)). */
export function resFromMultiplier(mult: number): number {
  if (mult > 1) return 2 * (1 - mult);
  if (mult > 0.25) return 1 - mult;
  return (1 / mult - 1) / 4;
}

/** Os números que importam num golpe: dano base, ATK, Proficiência, crítico, bônus de dano, DEF e RES do inimigo (e a reação, se houve). */
export function hitFigures(r: ActionResult): HitFigure[] {
  const b = r.breakdown;
  const out: HitFigure[] = [
    { key: 'base', label: 'Dano base', value: b.baseTotal, unit: 'int' },
    { key: 'atk', label: 'ATK', value: r.stats.atk, unit: 'int' },
    { key: 'em', label: 'Proficiência', value: r.stats.em, unit: 'int' },
    { key: 'cr', label: 'Taxa crítica', value: r.critRate, unit: 'pct' },
    { key: 'cd', label: 'Dano crítico', value: r.critDmg, unit: 'pct' },
    { key: 'dmg', label: 'Bônus de dano', value: b.dmgMultiplier - 1, unit: 'pct' },
    { key: 'def', label: 'DEF do inimigo', value: b.def, unit: 'pct' },
    { key: 'res', label: 'RES do inimigo', value: resFromMultiplier(b.res), unit: 'pct' },
  ];
  if (b.amp !== 1) out.push({ key: 'reaction', label: 'Reação', value: b.amp, unit: 'mult' });
  return out;
}

// ---------- Buffs ligados num golpe (para desligar só nele) ----------

export interface HitBuffRow {
  tag: string;
  /** Quem dá e qual faixa ("Iansan · Scroll"). */
  name: string;
  /** Texto do efeito ("+40% DMG"). */
  value: string;
  /** Vale neste golpe (não foi desligado nele). */
  on: boolean;
  /** Ligado: quanto do dano do golpe some sem o buff. Desligado: quanto ele ganharia com o buff. */
  effect: number;
}

/**
 * Os buffs de time (faixas) que cobrem o golpe pelo tempo, ligados ou desligados só para ele (`ActionRef.tagsOff`), e o efeito de cada um
 * no dano dele. Só entram as faixas que chegam ao personagem do golpe.
 */
export function hitBuffRows(project: RotationProject, resolved: ResolvedProject, bundle: AnalysisBundle, actionId: string): HitBuffRow[] {
  const action = project.actions.find((a) => a.id === actionId);
  const result = bundle.optimization.result.actions.find((a) => a.action.id === actionId);
  if (!action || !result) return [];
  const team = resolved.team;
  const member = team.members[action.member]?.character.name;
  const rolls = bundle.optimization.rolls;
  const assembly = assembleTeam(team, { rolls });
  const lanes = new Map(laneInfos(project, resolved).map((l) => [l.tag, l]));
  const base = action.tagSource === 'windows' ? tagsAt(project.buffWindows, action.time) : action.activeTags;
  const off = new Set(action.tagsOff ?? []);
  const avgWith = (tags: string[]): number => {
    const actions = resolved.actions.map((a) => (a.id === actionId ? { ...a, activeTags: tags } : a));
    return evaluateRotation({ members: team.members, assembly, config: team.config, rolls, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient }, actions).actions.find((x) => x.action.id === actionId)?.avg ?? 0;
  };
  const current = result.action.activeTags;
  return base
    .filter((tag) => assembly.buffs.some((b) => b.tag === tag && !b.always && (b.targets === 'all' || b.targets.includes(member))))
    .map((tag) => {
      const on = !off.has(tag);
      const effect = result.avg <= 0 ? 0 : on ? Math.max(0, 1 - avgWith(current.filter((t) => t !== tag)) / result.avg) : Math.max(0, avgWith([...current, tag]) / result.avg - 1);
      const lane = lanes.get(tag);
      return { tag, name: lane?.source ?? tag, value: lane?.value ?? '', on, effect };
    });
}

// ---------- Buffs que cobrem um golpe ----------

export interface CoveringBuff {
  id: string;
  name: string;
  /** Fração do dano médio do golpe que some sem o buff. */
  loss: number;
}

/** Para cada buff de equipe ativo neste golpe: quanto do dano dele some se o buff for desligado. */
export function coveringBuffs(project: RotationProject, resolved: ResolvedProject, bundle: AnalysisBundle, actionId: string): CoveringBuff[] {
  const result = bundle.optimization.result.actions.find((a) => a.action.id === actionId);
  if (!result || result.avg <= 0) return [];
  const team = resolved.team;
  const member = team.members[result.action.member]?.character.name;
  const active = new Set(result.action.activeTags);
  const assembly = assembleTeam(team, { rolls: bundle.optimization.rolls });
  const candidates = assembly.buffs.filter((b) => (b.always || active.has(b.tag)) && (b.targets === 'all' || b.targets.includes(member)));
  const run = (extra: string[]) => {
    const disabled = [...(team.disabled ?? []), ...extra];
    const a = assembleTeam({ ...team, disabled }, { rolls: bundle.optimization.rolls });
    const r = evaluateRotation(
      { members: team.members, assembly: a, config: team.config, rolls: bundle.optimization.rolls, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient },
      resolved.actions,
    );
    return r.actions.find((x) => x.action.id === actionId)?.avg ?? 0;
  };
  void project;
  return candidates
    .map((b) => ({ id: b.id, name: b.description ?? b.id, loss: Math.max(0, 1 - run([b.id]) / result.avg) }))
    .filter((c) => c.loss > 1e-6)
    .sort((a, b) => b.loss - a.loss);
}

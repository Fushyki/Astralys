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
    return { tag: lane.tag, label: lane.label, source, target, value: chips.join(' · ') || lane.label, giver, detail: lane.detail };
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
  const crit = critFactor('avg', r.stats.critRate, r.stats.critDmg);
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

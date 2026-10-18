/**
 * Liga um projeto à calculadora de recarga: monta a entrada do motor (`calculateEnergy`) com a equipe do projeto,
 * o custo do Supremo (Lunaris) e as partículas da habilidade (tabela de efeitos), e guarda a configuração em `meta.energy`.
 */
import type { Character } from '../../data/schema';
import type { SkillParticles } from '../../effects/schema';
import { calculateEnergy, type EnergyInput, type EnergyMember, type EnergyResult, type EnergySlot, type RotationProject } from '../../engine';

export type Margin = 'low' | 'medium' | 'high';
export const MARGIN_FACTOR: Record<Margin, number> = { low: 0.9, medium: 1, high: 1.1 };
export const MARGIN_LABEL: Record<Margin, string> = { low: 'Baixa (−10%)', medium: 'Média (0%)', high: 'Alta (+10%)' };

export const DEFAULT_ENEMY_PARTICLES = 6;
/** Padrão do app anterior quando o personagem não está na tabela de partículas. */
export const FALLBACK_PARTICLES = 3;

export type StoredSlot = NonNullable<NonNullable<RotationProject['meta']['energy']>['slots']>[string];

export interface MemberEnergyInfo {
  member: EnergyMember;
  /** Partículas por uso vindas da tabela (undefined = personagem não cadastrado, usa o padrão). */
  tableParticles: number | undefined;
  note: string;
}

export function defaultSlot(name: string): StoredSlot {
  return { skillUses: 1, onField: [name], favProcs: 0, favTarget: null, flat: 0, fieldTime: 0.15, useBurst: true };
}

export function energyMembers(project: RotationProject, characters: readonly Character[], particles: readonly SkillParticles[]): MemberEnergyInfo[] {
  return project.members.map((ref) => {
    const c = characters.find((x) => x.name === ref.character);
    const row = particles.find((p) => p.character === ref.character);
    return {
      member: {
        name: ref.character,
        element: c?.element ?? 'Pyro',
        burstCost: c?.burst.energyCost ?? 0,
        particles: row?.particles ?? FALLBACK_PARTICLES,
      },
      tableParticles: row?.particles,
      note: row?.note ?? '',
    };
  });
}

export function slotOf(project: RotationProject, name: string): StoredSlot {
  const stored = project.meta.energy?.slots[name];
  const base = defaultSlot(name);
  // Personagem que nunca usa o Supremo (custo 0) começa com ele desligado; quem já foi configurado mantém a escolha.
  return stored ? { ...base, ...stored } : base;
}

/** Entrada do motor: os nomes viram índices e referências a quem saiu da equipe são descartadas. */
export function buildEnergyInput(project: RotationProject, infos: MemberEnergyInfo[]): EnergyInput {
  const names = infos.map((i) => i.member.name);
  const slots: EnergySlot[] = names.map((name, i) => {
    const s = slotOf(project, name);
    const info = infos[i];
    return {
      skillUses: s.skillUses,
      particlesOverride: s.particles,
      onFieldReceivers: s.onField.map((n) => names.indexOf(n)).filter((x) => x >= 0),
      favProcs: s.favProcs,
      favTarget: s.favTarget === null ? null : names.indexOf(s.favTarget) >= 0 ? names.indexOf(s.favTarget) : null,
      flat: s.flat,
      fieldTime: s.fieldTime,
      useBurst: s.useBurst && info.member.burstCost > 0,
    };
  });
  return { members: infos.map((i) => i.member), slots, enemyParticles: project.meta.energy?.enemyParticles ?? DEFAULT_ENEMY_PARTICLES };
}

export function energyResults(project: RotationProject, infos: MemberEnergyInfo[]): EnergyResult[] {
  return calculateEnergy(buildEnergyInput(project, infos));
}

/** Grava a configuração de um personagem (e os dados gerais) em `meta.energy`. */
export function withEnergy(
  project: RotationProject,
  patch: { enemyParticles?: number; margin?: Margin; slot?: { name: string; value: Partial<StoredSlot> } },
): RotationProject {
  const cur = project.meta.energy ?? { enemyParticles: DEFAULT_ENEMY_PARTICLES, margin: 'medium' as Margin, slots: {} };
  const slots = { ...cur.slots };
  if (patch.slot) slots[patch.slot.name] = { ...slotOf(project, patch.slot.name), ...patch.slot.value };
  return {
    ...project,
    meta: {
      ...project.meta,
      energy: { enemyParticles: patch.enemyParticles ?? cur.enemyParticles, margin: patch.margin ?? cur.margin ?? 'medium', slots },
      updatedAt: new Date().toISOString(),
    },
  };
}

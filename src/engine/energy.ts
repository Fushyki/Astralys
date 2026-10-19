/**
 * Recarga de Energia necessária por personagem: quanta energia vem das partículas da habilidade (com o bônus de
 * mesmo elemento e de estar em campo), de armas Favonius, de inimigos e de energia fixa, contra o custo do Supremo.
 *
 * Multiplicadores de absorção (mecânica do jogo): partícula elemental do MESMO elemento rende ×3 em campo e ×1,8 fora;
 * de elemento DIFERENTE, ×1 em campo e ×0,6 fora; partícula neutra (inimigos e Favonius) rende ×2 em campo e ×1,2 fora.
 */
import type { Element } from '../data/schema';

export const PARTICLE_ON_SAME = 3.0;
export const PARTICLE_OFF_SAME = 1.8;
export const PARTICLE_ON_OTHER = 1.0;
export const PARTICLE_OFF_OTHER = 0.6;
export const CLEAR_ON = 2.0;
export const CLEAR_OFF = 1.2;
/** Cada ativação de arma Favonius solta 3 partículas neutras. */
export const FAVONIUS_PARTICLES = 3;
/** Folga sobre a recarga exata, para chefes de alvo único (a mesma do app anterior). */
export const SAFETY_MARGIN = 1.15;

export interface EnergyMember {
  name: string;
  element: Element;
  /** Custo do Supremo; 0 = não usa Supremo. */
  burstCost: number;
  /** Partículas elementais por uso da habilidade. */
  particles: number;
}

export interface EnergySlot {
  /** Quantas vezes a habilidade é usada na rotação. */
  skillUses: number;
  /** Partículas por uso, se diferente do padrão do personagem. */
  particlesOverride?: number;
  /** Índices dos membros que estão EM CAMPO quando as partículas caem (divide igualmente). Vazio = todos fora de campo. */
  onFieldReceivers: number[];
  /** Ativações de arma Favonius. */
  favProcs: number;
  /** Quem está em campo quando as partículas da Favonius caem; null = ninguém. */
  favTarget: number | null;
  /** Energia fixa recebida (habilidades que dão energia direto). */
  flat: number;
  /** Fração do tempo em campo (0 a 1), para as partículas de inimigos. */
  fieldTime: number;
  /** O personagem usa o Supremo na rotação? */
  useBurst: boolean;
}

export interface EnergyInput {
  members: EnergyMember[];
  slots: EnergySlot[];
  /** Partículas neutras que os inimigos soltam na rotação. */
  enemyParticles: number;
}

export type EnergyStatus = 'ignored' | 'comfortable' | 'balanced' | 'high' | 'critical';

export interface EnergyResult {
  /** Recarga necessária como fração (1,45 = 145%); nunca abaixo de 1. */
  neededER: number;
  /** `neededER` com a folga de segurança. */
  safeER: number;
  status: EnergyStatus;
  baseFromSkills: number;
  baseFromFavonius: number;
  baseFromEnemies: number;
  flatEnergy: number;
  /** Energia por partículas com 100% de recarga. */
  totalBase: number;
}

export function statusOf(neededER: number): Exclude<EnergyStatus, 'ignored'> {
  if (neededER >= 2.15) return 'critical';
  if (neededER >= 1.75) return 'high';
  if (neededER >= 1.35) return 'balanced';
  return 'comfortable';
}

export function calculateEnergy(input: EnergyInput): EnergyResult[] {
  const { members, slots } = input;
  return members.map((target, t) => {
    const slot = slots[t];
    let baseFromSkills = 0;
    members.forEach((gen, g) => {
      const gs = slots[g];
      const perUse = gs.particlesOverride ?? gen.particles;
      const total = Math.max(0, gs.skillUses) * Math.max(0, perUse);
      const receivers = gs.onFieldReceivers;
      const onField = receivers.includes(t) ? 1 / receivers.length : 0;
      const same = gen.element === target.element;
      const on = same ? PARTICLE_ON_SAME : PARTICLE_ON_OTHER;
      const off = same ? PARTICLE_OFF_SAME : PARTICLE_OFF_OTHER;
      baseFromSkills += total * (onField * on + (1 - onField) * off);
    });

    let baseFromFavonius = 0;
    slots.forEach((fs) => {
      if (fs.favProcs <= 0) return;
      const onField = fs.favTarget === t;
      baseFromFavonius += fs.favProcs * FAVONIUS_PARTICLES * (onField ? CLEAR_ON : CLEAR_OFF);
    });

    const field = Math.min(1, Math.max(0, slot.fieldTime));
    const baseFromEnemies = Math.max(0, input.enemyParticles) * (field * CLEAR_ON + (1 - field) * CLEAR_OFF);
    const flatEnergy = Math.max(0, slot.flat);
    const totalBase = baseFromSkills + baseFromFavonius + baseFromEnemies;
    const common = { baseFromSkills, baseFromFavonius, baseFromEnemies, flatEnergy, totalBase };

    if (!slot.useBurst || target.burstCost <= 0) {
      return { ...common, neededER: 1, safeER: 1, status: 'ignored' as const };
    }
    const fromParticles = Math.max(0, target.burstCost - flatEnergy);
    let needed = 1;
    if (totalBase > 0.05 && fromParticles > 0) needed = fromParticles / totalBase;
    needed = Math.max(1, needed);
    return { ...common, neededER: needed, safeER: needed * SAFETY_MARGIN, status: statusOf(needed) };
  });
}

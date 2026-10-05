import { DamageHit } from './damageBreakdown';

export type ActionType = 'swap' | 'skill' | 'burst' | 'normal' | 'charged' | 'plunge' | 'special';

export interface TimelineAction {
  id: string;
  charIndex: number; // 0 to 3
  charName: string;
  actionType: ActionType;
  actionLabel: string; // e.g. "Swap In", "E (Toque)", "E (Segurar)", "Q (Supremo)", "5N3D", "CA", "Nightsoul"
  startTime: number; // in seconds (e.g. 0.0, 1.2, 5.4)
  duration: number; // in seconds (e.g. 0.8, 1.2, 2.0)
  damage?: number;
  particles?: number;
  buffsActive?: string[];
  notes?: string;
}

export interface BuffTrack {
  id: string;
  name: string;
  sourceChar: string;
  startTime: number;
  endTime: number;
  statBonus: string; // e.g. "+1200 ATK", "-40% RES", "+40% Dano", "+100 EM"
  color: string; // tailwind color / hex
  description?: string;
}

export interface RotationTimelineData {
  totalDuration: number;
  actions: TimelineAction[];
  buffs: BuffTrack[];
}

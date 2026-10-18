/**
 * Números de cada projeto do cofre (DPS, DPR e participação de cada personagem). Calculados na thread principal,
 * um projeto por vez e em intervalos curtos, para a lista aparecer na hora e os números chegarem em seguida.
 */
import { useEffect, useState } from 'react';
import { analyzeProject, resolveProject } from '../../engine';
import type { LoadedData } from './data';
import { loadProject } from './persistence';

export interface ProjectStats {
  dps: number;
  dpr: number;
  shares: number[];
  duration: number;
}

export type StatsMap = Record<string, ProjectStats | 'error'>;

export function useProjectStats(ids: string[], data: LoadedData | undefined, version: string): StatsMap {
  const [stats, setStats] = useState<StatsMap>({});
  const key = ids.join('|');

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    const queue = key ? key.split('|') : [];
    const next = () => {
      const id = queue.shift();
      if (id === undefined || cancelled) return;
      let value: ProjectStats | 'error' = 'error';
      try {
        const p = loadProject(id);
        if (p) {
          const r = resolveProject(p, data.game, data.effects);
          const b = analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient });
          const res = b.optimization.result;
          value = { dps: res.totals.dps, dpr: res.totals.avg, shares: res.members.map((m) => m.share), duration: p.config.rotationDuration };
        }
      } catch {
        value = 'error';
      }
      if (!cancelled) setStats((s) => ({ ...s, [id]: value }));
      setTimeout(next, 0);
    };
    setTimeout(next, 0);
    return () => {
      cancelled = true;
    };
  }, [key, data, version]);

  return stats;
}

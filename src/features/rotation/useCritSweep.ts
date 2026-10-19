/** Calcula a curva "dano × rolls em crítico" no Web Worker, com atraso para não recalcular a cada edição. */
import { useEffect, useRef, useState } from 'react';
import { assembleTeam, type AnalysisBundle, type CritSweep, type ResolvedProject } from '../../engine';
import { EngineClient } from './engineClient';

export function useCritSweep(resolved: ResolvedProject, bundle: AnalysisBundle, member: number): { sweep: CritSweep | null; error: string | null } {
  const [state, setState] = useState<{ sweep: CritSweep | null; error: string | null }>({ sweep: null, error: null });
  const client = useRef<EngineClient | null>(null);

  useEffect(() => {
    client.current = new EngineClient();
    return () => {
      client.current?.dispose();
      client.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const team = resolved.team;
      client.current
        ?.request<CritSweep>({
          type: 'critSweep',
          input: {
            ctx: {
              members: team.members,
              assembly: assembleTeam(team),
              config: team.config,
              actions: resolved.actions,
              flatEffects: resolved.flatEffects,
              ampCoefficient: resolved.ampCoefficient,
            },
            rolls: bundle.optimization.rolls,
            member,
          },
        })
        .then((sweep) => !cancelled && setState({ sweep, error: null }))
        .catch((e) => !cancelled && setState({ sweep: null, error: e instanceof Error ? e.message : String(e) }));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [resolved, bundle, member]);

  return state;
}

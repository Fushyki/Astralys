/**
 * Calcula a análise completa do projeto no Web Worker sempre que ele muda (com um pequeno atraso para não
 * recalcular a cada pixel arrastado). Mantém o resultado anterior visível enquanto o novo é calculado.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { resolveProject, type AnalysisBundle, type ResolvedProject, type RotationProject } from '../../engine';
import type { LoadedData } from './data';
import { EngineClient } from './engineClient';

export type AnalysisState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; bundle: AnalysisBundle; resolved: ResolvedProject; stale: boolean }
  | { status: 'error'; message: string };

const DEBOUNCE_MS = 120;

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function useAnalysis(project: RotationProject | null, data: LoadedData | undefined): AnalysisState {
  const resolution = useMemo(() => {
    if (!project || !data) return null;
    try {
      return { resolved: resolveProject(project, data.game, data.effects) };
    } catch (e) {
      return { error: messageOf(e) };
    }
  }, [project, data]);

  const [state, setState] = useState<AnalysisState>({ status: 'idle' });
  const client = useRef<EngineClient | null>(null);

  useEffect(() => {
    client.current = new EngineClient();
    return () => {
      client.current?.dispose();
      client.current = null;
    };
  }, []);

  useEffect(() => {
    if (!resolution) return;
    if ('error' in resolution) {
      setState({ status: 'error', message: resolution.error ?? 'Erro desconhecido' });
      return;
    }
    const { resolved } = resolution;
    let cancelled = false;
    setState((s) => (s.status === 'ready' ? { ...s, stale: true } : { status: 'loading' }));
    const timer = setTimeout(() => {
      client.current
        ?.request<AnalysisBundle>({
          type: 'analyze',
          input: { team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient },
        })
        .then((bundle) => {
          if (!cancelled) setState({ status: 'ready', bundle, resolved, stale: false });
        })
        .catch((e) => {
          if (!cancelled) setState({ status: 'error', message: messageOf(e) });
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [resolution]);

  return state;
}

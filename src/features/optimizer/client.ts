/**
 * Cliente dos workers do otimizador: reparte a busca entre vários workers, repassa entre eles o piso de poda (o
 * N-ésimo melhor já achado), junta os resultados e deixa parar a qualquer momento. Sem Worker (testes), roda na
 * thread principal.
 */
import type { FromWorker, ToWorker, WorkerData } from './optimizer.worker';
import { runOptimizer, type OptimizedBuild, type OptimizerResult } from './run';

export interface OptimizerProgress {
  evaluations: number;
  patternsDone: number;
  patterns: number;
  /** Melhor valor do foco até agora. */
  best: number;
  elapsedMs: number;
}

export interface OptimizerJob {
  promise: Promise<OptimizerResult>;
  /** Para a busca; o que já foi achado é devolvido (resultado marcado como parcial). */
  stop: () => void;
}

export const defaultWorkerCount = () => Math.max(1, Math.min(6, (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4) - 1 || 1));

/** Junta os resultados dos workers: união dos melhores de cada um, sem repetir, e os N melhores no total. */
export function mergeResults(results: OptimizerResult[], topN: number): OptimizerResult {
  const byKey = new Map<string, OptimizedBuild>();
  for (const r of results) for (const b of r.builds) if (!byKey.has(b.key)) byKey.set(b.key, b);
  const builds = [...byKey.values()].sort((a, b) => b.report.value - a.report.value).slice(0, topN);
  const first = results[0];
  const sum = (f: (r: OptimizerResult) => number) => results.reduce((n, r) => n + f(r), 0);
  return {
    builds,
    equipped: first.equipped,
    inventory: first.inventory,
    stats: {
      evaluations: sum((r) => r.stats.evaluations),
      dominated: first.stats.dominated,
      patterns: sum((r) => r.stats.patterns),
      patternsDone: sum((r) => r.stats.patternsDone),
      stopped: results.some((r) => r.stopped),
      combinations: first.stats.combinations,
    },
    stopped: results.some((r) => r.stopped),
    equippedOutside: first.equippedOutside,
  };
}

export function startOptimizerJob(data: WorkerData, onProgress?: (p: OptimizerProgress) => void, workers = defaultWorkerCount()): OptimizerJob {
  const t0 = performance.now();
  if (typeof Worker === 'undefined') {
    // sem workers: roda na thread principal, de uma vez
    let stopped = false;
    const promise = Promise.resolve().then(() => runOptimizer({ ...data, shouldStop: () => stopped }));
    return { promise, stop: () => (stopped = true) };
  }

  const pool: Worker[] = [];
  const results: OptimizerResult[] = [];
  const progress = new Map<number, { evaluations: number; patternsDone: number; patterns: number; best: number }>();
  let settled = false;
  let resolveJob!: (r: OptimizerResult) => void;
  let rejectJob!: (e: Error) => void;
  const promise = new Promise<OptimizerResult>((resolve, reject) => {
    resolveJob = resolve;
    rejectJob = reject;
  });
  const finish = () => {
    settled = true;
    pool.forEach((w) => w.terminate());
  };

  pool.forEach(() => undefined);
  for (let i = 0; i < workers; i++) {
    const w = new Worker(new URL('./optimizer.worker.ts', import.meta.url), { type: 'module' });
    pool.push(w);
    w.onmessage = (event: MessageEvent<FromWorker>) => {
      const m = event.data;
      if (settled) return;
      if (m.type === 'progress') {
        progress.set(i, { evaluations: m.evaluations, patternsDone: m.patternsDone, patterns: m.patterns, best: m.best });
        if (onProgress) {
          const all = [...progress.values()];
          onProgress({
            evaluations: all.reduce((n, p) => n + p.evaluations, 0),
            patternsDone: all.reduce((n, p) => n + p.patternsDone, 0),
            patterns: all.reduce((n, p) => n + p.patterns, 0),
            best: Math.max(...all.map((p) => p.best)),
            elapsedMs: performance.now() - t0,
          });
        }
      } else if (m.type === 'threshold') {
        pool.forEach((other, j) => j !== i && other.postMessage({ type: 'floor', value: m.value } satisfies ToWorker));
      } else if (m.type === 'done') {
        results.push(m.result);
        if (results.length === pool.length) {
          finish();
          resolveJob(mergeResults(results, data.config.topN));
        }
      } else if (m.type === 'error') {
        finish();
        rejectJob(new Error(m.message));
      }
    };
    w.onerror = (event) => {
      if (settled) return;
      finish();
      rejectJob(new Error(event.message || 'O otimizador parou de responder.'));
    };
    w.postMessage({ type: 'start', data, partition: { index: i, count: workers } } satisfies ToWorker);
  }
  return { promise, stop: () => pool.forEach((w) => w.postMessage({ type: 'stop' } satisfies ToWorker)) };
}

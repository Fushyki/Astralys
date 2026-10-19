/// <reference lib="webworker" />
/**
 * Web Worker do otimizador de artefatos. Roda a parte da busca que lhe coube (`partition`), cede o controle de tempos
 * em tempos para receber o piso de poda dos outros workers e o pedido de parar, e devolve o resultado ao terminar.
 */
import { startOptimizer, type OptimizerResult, type RunInput } from './run';

export type WorkerData = Omit<RunInput, 'onProgress' | 'onPattern' | 'shouldStop'>;

export type ToWorker =
  | { type: 'start'; data: WorkerData; partition: { index: number; count: number } }
  | { type: 'stop' }
  | { type: 'floor'; value: number };

export type FromWorker =
  | { type: 'progress'; evaluations: number; patternsDone: number; patterns: number; best: number }
  | { type: 'threshold'; value: number }
  | { type: 'done'; result: OptimizerResult }
  | { type: 'error'; message: string };

let stop = false;
let floor = -Infinity;
const post = (m: FromWorker) => self.postMessage(m);

async function run(data: WorkerData, partition: { index: number; count: number }) {
  try {
    const handle = startOptimizer(
      {
        ...data,
        onProgress: (s, best) => post({ type: 'progress', evaluations: s.evaluations, patternsDone: s.patternsDone, patterns: s.patterns, best }),
        shouldStop: () => stop,
      },
      { partition, floor: () => floor, onThreshold: (value) => post({ type: 'threshold', value }) },
    );
    for (const _ of handle.steps) {
      void _;
      // devolve o controle ao laço de eventos para as mensagens (parar, piso) chegarem
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    post({ type: 'done', result: handle.result() });
  } catch (e) {
    post({ type: 'error', message: e instanceof Error ? e.message : String(e) });
  }
}

self.onmessage = (event: MessageEvent<ToWorker>) => {
  const m = event.data;
  if (m.type === 'start') void run(m.data, m.partition);
  else if (m.type === 'stop') stop = true;
  else if (m.type === 'floor') floor = Math.max(floor, m.value);
};

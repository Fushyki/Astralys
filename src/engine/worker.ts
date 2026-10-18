/// <reference lib="webworker" />
/**
 * Web Worker do motor: mantém a UI fluida durante otimizações e comparações em lote.
 * Uso na interface:  new Worker(new URL('./engine/worker.ts', import.meta.url), { type: 'module' })
 */
import { handleEngineRequest, type EngineRequest } from './workerApi';

self.onmessage = (event: MessageEvent<EngineRequest>) => {
  self.postMessage(handleEngineRequest(event.data));
};

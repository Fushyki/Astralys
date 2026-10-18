/**
 * Cliente do Web Worker do motor. Cada pedido recebe um id e devolve uma Promise; se o navegador não
 * suportar workers (ou nos testes), o mesmo código roda na thread principal.
 */
import { handleEngineRequest, type EngineRequest, type EngineResponse, type EngineResult } from '../../engine';

type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
export type EngineRequestBody = DistributiveOmit<EngineRequest, 'id'>;

interface Pending {
  resolve: (value: EngineResult) => void;
  reject: (reason: Error) => void;
}

export class EngineClient {
  private worker?: Worker;
  private seq = 0;
  private pending = new Map<number, Pending>();

  constructor() {
    if (typeof Worker === 'undefined') return;
    this.worker = new Worker(new URL('../../engine/worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (event: MessageEvent<EngineResponse>) => this.settle(event.data);
    this.worker.onerror = (event) => this.failAll(new Error(event.message || 'O motor de cálculo parou de responder.'));
  }

  request<T extends EngineResult>(body: EngineRequestBody): Promise<T> {
    const id = ++this.seq;
    const req = { ...body, id } as EngineRequest;
    if (!this.worker) {
      return new Promise<T>((resolve, reject) => {
        const res = handleEngineRequest(req);
        if (res.ok) resolve(res.result as T);
        else reject(new Error(res.error));
      });
    }
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as Pending['resolve'], reject });
      this.worker!.postMessage(req);
    });
  }

  private settle(res: EngineResponse) {
    const p = this.pending.get(res.id);
    if (!p) return;
    this.pending.delete(res.id);
    if (res.ok) p.resolve(res.result);
    else p.reject(new Error(res.error));
  }

  private failAll(error: Error) {
    for (const p of this.pending.values()) p.reject(error);
    this.pending.clear();
  }

  dispose() {
    this.failAll(new Error('Cálculo cancelado.'));
    this.worker?.terminate();
    this.worker = undefined;
  }
}

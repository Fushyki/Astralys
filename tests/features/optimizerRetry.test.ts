/** Falha ao carregar o Worker do otimizador: baixa o arquivo de novo, ignorando o cache, e tenta só mais uma vez (#69). */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startOptimizerJob } from '../../src/features/optimizer/client';
import type { WorkerData } from '../../src/features/optimizer/optimizer.worker';

function stub(fetchOk: boolean) {
  const created: unknown[] = [];
  class Broken {
    onerror: ((e: { message: string }) => void) | null = null;
    constructor() {
      created.push(this);
    }
    postMessage() {
      queueMicrotask(() => this.onerror?.({ message: '' }));
    }
    terminate() {}
  }
  const fetch = vi.fn(async () => ({ ok: fetchOk }));
  vi.stubGlobal('Worker', Broken);
  vi.stubGlobal('fetch', fetch);
  return { created, fetch };
}
const run = () => startOptimizerJob({} as WorkerData, undefined, 1).promise;

describe('Worker do otimizador que não carrega', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('baixa de novo sem cache e tenta uma vez', async () => {
    const { created, fetch } = stub(true);
    await expect(run()).rejects.toThrow('Recarregue a página');
    expect(created).toHaveLength(2);
    expect(fetch).toHaveBeenCalledWith(expect.any(String), { cache: 'reload' });
  });
  it('arquivo que sumiu de vez: só a mensagem', async () => {
    const { created } = stub(false);
    await expect(run()).rejects.toThrow('Recarregue a página');
    expect(created).toHaveLength(1);
  });
});

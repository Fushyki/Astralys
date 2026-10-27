import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reloadOnce } from '../../src/app/reloadOnce';

describe('recarregar uma vez depois de um deploy', () => {
  const store = new Map<string, string>();
  const reload = vi.fn();
  beforeEach(() => {
    store.clear();
    reload.mockClear();
    vi.stubGlobal('sessionStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) });
    vi.stubGlobal('location', { reload });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('recarrega na primeira falha e não entra em laço na segunda', () => {
    expect(reloadOnce()).toBe(true);
    expect(reloadOnce()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

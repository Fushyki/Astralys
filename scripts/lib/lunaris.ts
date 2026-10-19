/**
 * Cliente do Lunaris (API não oficial, descoberta lendo o bundle do site):
 *   https://api.lunaris.moe/data/version.json
 *   https://api.lunaris.moe/data/{ver}/charlist.json | weaponlist.json | artifactlist.json
 *   https://api.lunaris.moe/data/{ver}/{lang}/char|weapon|artifact/{id}.json   (lang em minúsculas)
 *
 * Boas maneiras: cache em disco (data/raw, fora do git), poucos pedidos em paralelo,
 * User-Agent identificável e nova tentativa com espera crescente.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const LUNARIS_BASE = 'https://api.lunaris.moe/data';
const USER_AGENT = 'AstralysDataSync/1.0 (+https://github.com/Fushyki/Astralys)';

export interface FetchOptions {
  /** Pasta do cache (ex.: data/raw/lunaris). */
  cacheDir: string;
  /** Ignora o cache e volta a pedir. */
  refresh?: boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Pede `urlPath` (relativo a LUNARIS_BASE), com cache em disco. Devolve o JSON já convertido. */
export async function fetchJson<T = unknown>(urlPath: string, opts: FetchOptions): Promise<T> {
  const file = path.join(opts.cacheDir, urlPath);

  if (!opts.refresh) {
    try {
      return JSON.parse(await readFile(file, 'utf8')) as T;
    } catch {
      /* sem cache: segue para a rede */
    }
  }

  const url = `${LUNARIS_BASE}/${urlPath}`;
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
      const text = await res.text();
      const data = JSON.parse(text) as T;
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, text, 'utf8');
      return data;
    } catch (err) {
      lastError = err;
      if (err instanceof Error && err.message.startsWith('HTTP 4') && !err.message.startsWith('HTTP 429')) break;
      await sleep(500 * attempt * attempt);
    }
  }
  throw new Error(`Falha ao obter ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

/** Executa `fn` sobre `items` com no máximo `limit` tarefas em simultâneo. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

export interface LunarisVersion {
  timestamp: number;
  version: string;
  versions: string[];
}

export const fetchVersion = (opts: FetchOptions) => fetchJson<LunarisVersion>('version.json', { ...opts, refresh: true });

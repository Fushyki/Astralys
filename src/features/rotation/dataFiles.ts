/**
 * De onde vem cada arquivo de dados do site gerado por `scripts/app-data.ts` (`data/app/`). Entram por `import.meta.glob`
 * para o `tsc` não exigir que existam. Este módulo só é carregado junto com os dados: a lista tem um item por arquivo.
 */
const app = import.meta.glob<{ default: unknown }>('../../data/app/**/*.json');

/** `name`: caminho dentro de `data/app/`, sem `.json` (ex.: `weapons`, `moves/10000106`). */
export const appFile = async <T,>(name: string): Promise<T> => {
  const load = app[`../../data/app/${name}.json`];
  if (!load) throw new Error(`Arquivo de dados ausente: ${name}`);
  return (await load()).default as T;
};

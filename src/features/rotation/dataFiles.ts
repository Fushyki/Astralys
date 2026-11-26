/**
 * De onde vem cada arquivo de dados do site. Os de `data/app/` são gerados por `scripts/app-data.ts` e entram por
 * `import.meta.glob`, para o `tsc` não exigir que existam. Este módulo só é carregado junto com os dados.
 */
const app = import.meta.glob<{ default: unknown }>('../../data/app/*.json');

export const appFile = async <T,>(name: string): Promise<T> => {
  const load = app[`../../data/app/${name}.json`];
  if (!load) throw new Error(`Arquivo de dados ausente: ${name}`);
  return (await load()).default as T;
};

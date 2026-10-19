/** Filtros do Vault: busca por nome, personagem, elemento e favoritos. Função pura. */
import type { ProjectSummary } from '../rotation/persistence';

export interface VaultFilters {
  query: string;
  character: string;
  element: string;
  favoritesOnly: boolean;
  /** Versão do jogo; '' = todas, NO_PATCH = times sem versão registrada. */
  patch: string;
}

export const NO_PATCH = '__sem_versao__';

export const NO_FILTERS: VaultFilters = { query: '', character: '', element: '', favoritesOnly: false, patch: '' };

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** `elementOf` devolve o elemento de um personagem (ou undefined se não for conhecido). */
export function filterProjects(items: ProjectSummary[], f: VaultFilters, elementOf: (name: string) => string | undefined): ProjectSummary[] {
  const q = fold(f.query.trim());
  return items
    .filter((p) => !f.favoritesOnly || p.favorite)
    .filter((p) => !f.patch || (f.patch === NO_PATCH ? !p.gameVersion : p.gameVersion === f.patch))
    .filter((p) => !f.character || p.members.includes(f.character))
    .filter((p) => !f.element || p.members.some((m) => elementOf(m) === f.element))
    .filter((p) => !q || fold(p.name).includes(q) || p.members.some((m) => fold(m).includes(q)))
    // favoritos primeiro; dentro de cada grupo, a ordem de recência original
    .sort((a, b) => Number(b.favorite) - Number(a.favorite));
}

/** Patches presentes nos times, do mais novo ao mais antigo (comparação numérica por parte); '' fica de fora. */
export function patchesOf(items: ProjectSummary[]): string[] {
  const parts = (v: string) => v.split('.').map((x) => Number(x) || 0);
  const cmp = (a: string, b: string) => {
    const pa = parts(a);
    const pb = parts(b);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) if ((pb[i] ?? 0) !== (pa[i] ?? 0)) return (pb[i] ?? 0) - (pa[i] ?? 0);
    return 0;
  };
  return [...new Set(items.map((p) => p.gameVersion).filter(Boolean))].sort(cmp);
}

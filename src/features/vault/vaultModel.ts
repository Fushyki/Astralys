/** Filtros do Vault: busca por nome, personagem, elemento e favoritos. Função pura. */
import type { ProjectSummary } from '../rotation/persistence';

export interface VaultFilters {
  query: string;
  character: string;
  element: string;
  favoritesOnly: boolean;
}

export const NO_FILTERS: VaultFilters = { query: '', character: '', element: '', favoritesOnly: false };

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** `elementOf` devolve o elemento de um personagem (ou undefined se não for conhecido). */
export function filterProjects(items: ProjectSummary[], f: VaultFilters, elementOf: (name: string) => string | undefined): ProjectSummary[] {
  const q = fold(f.query.trim());
  return items
    .filter((p) => !f.favoritesOnly || p.favorite)
    .filter((p) => !f.character || p.members.includes(f.character))
    .filter((p) => !f.element || p.members.some((m) => elementOf(m) === f.element))
    .filter((p) => !q || fold(p.name).includes(q) || p.members.some((m) => fold(m).includes(q)))
    // favoritos primeiro; dentro de cada grupo, a ordem de recência original
    .sort((a, b) => Number(b.favorite) - Number(a.favorite));
}

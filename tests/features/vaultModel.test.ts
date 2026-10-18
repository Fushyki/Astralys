import { describe, expect, it } from 'vitest';
import type { ProjectSummary } from '../../src/features/rotation/persistence';
import { NO_FILTERS, filterProjects } from '../../src/features/vault/vaultModel';

const mk = (id: string, name: string, members: string[], favorite = false): ProjectSummary => ({ id, name, members, actions: 1, updatedAt: '2025-01-01', isSample: false, favorite });
const items = [mk('a', 'Melt hipercarry', ['Mavuika', 'Citlali']), mk('b', 'Hiperflorescência', ['Nahida', 'Xingqiu'], true), mk('c', 'Outro', ['Citlali'])];
const el: Record<string, string> = { Mavuika: 'Pyro', Citlali: 'Cryo', Nahida: 'Dendro', Xingqiu: 'Hydro' };
const f = (p: Partial<typeof NO_FILTERS>) => filterProjects(items, { ...NO_FILTERS, ...p }, (n) => el[n]).map((x) => x.id);

describe('filtros do Vault', () => {
  it('sem filtros mostra tudo, favoritos primeiro', () => expect(f({})).toEqual(['b', 'a', 'c']));
  it('busca ignora acento e caixa, no nome e nos personagens', () => {
    expect(f({ query: 'hiperflorescencia' })).toEqual(['b']);
    expect(f({ query: 'CITLALI' })).toEqual(['a', 'c']);
  });
  it('filtra por personagem, elemento e favoritos', () => {
    expect(f({ character: 'Citlali' })).toEqual(['a', 'c']);
    expect(f({ element: 'Dendro' })).toEqual(['b']);
    expect(f({ favoritesOnly: true })).toEqual(['b']);
  });
  it('combina filtros', () => expect(f({ character: 'Citlali', element: 'Pyro' })).toEqual(['a']));
});

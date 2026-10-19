import { describe, expect, it } from 'vitest';
import type { ProjectSummary } from '../../src/features/rotation/persistence';
import { NO_FILTERS, NO_PATCH, filterProjects, patchesOf } from '../../src/features/vault/vaultModel';

const mk = (id: string, name: string, members: string[], favorite = false, gameVersion = ''): ProjectSummary => ({ id, name, members, actions: 1, updatedAt: '2025-01-01', isSample: false, favorite, shared: false, gameVersion });
const items = [mk('a', 'Melt hipercarry', ['Mavuika', 'Citlali'], false, '7.1.53'), mk('b', 'Hiperflorescência', ['Nahida', 'Xingqiu'], true), mk('c', 'Outro', ['Citlali'], false, '6.10.0')];
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
  it('filtra por patch e por times sem patch', () => {
    expect(f({ patch: '7.1.53' })).toEqual(['a']);
    expect(f({ patch: NO_PATCH })).toEqual(['b']);
  });
  it('lista os patches do mais novo ao mais antigo', () => expect(patchesOf(items)).toEqual(['7.1.53', '6.10.0']));
  it('combina filtros', () => expect(f({ character: 'Citlali', element: 'Pyro' })).toEqual(['a']));
});

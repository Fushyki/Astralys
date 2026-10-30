import { beforeEach, describe, expect, it } from 'vitest';
import type { Good } from '../../src/features/good/goodImport';
import { activeDatabaseId, bindNewProject, bindProject, createDatabase, databaseOfProject, deleteDatabase, listDatabases, loadGood, projectInActiveDatabase, saveGood, setActiveDatabase } from '../../src/features/good/goodStore';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  } as Storage;
});

const good = (names: string[]): Good => ({ format: 'GOOD', characters: names.map((key) => ({ key })), weapons: [], artifacts: [] });

describe('bases de dados do inventário', () => {
  it('o inventário antigo (uma base só) vira Base 1 e fica ativo', () => {
    store.set('astralys:inventario-good', JSON.stringify(good(['Mavuika'])));
    expect(listDatabases().map((d) => d.name)).toEqual(['Base 1']);
    expect(loadGood()!.characters[0].key).toBe('Mavuika');
    expect(store.has('astralys:inventario-good')).toBe(false);
  });

  it('trocar de base mostra só os itens dela, sem misturar', () => {
    const a = createDatabase('Minha', good(['Mavuika']))!;
    const b = createDatabase('Amigo', good(['Citlali', 'Bennett']))!;
    expect(activeDatabaseId()).toBe(a);
    setActiveDatabase(b);
    expect(loadGood()!.characters.map((c) => c.key)).toEqual(['Citlali', 'Bennett']);
    setActiveDatabase(a);
    expect(loadGood()!.characters.map((c) => c.key)).toEqual(['Mavuika']);
  });

  it('gravar numa base não toca nas outras', () => {
    const a = createDatabase('Minha', good(['Mavuika']))!;
    const b = createDatabase('Amigo', good(['Citlali']))!;
    saveGood(good(['Mavuika', 'Iansan']), a);
    setActiveDatabase(b);
    expect(loadGood()!.characters).toHaveLength(1);
    expect(listDatabases().find((d) => d.id === a)!.characters).toBe(2);
  });

  it('os times são da base: cada um usa o inventário da sua e só aparece com ela em uso', () => {
    const a = createDatabase('Minha', good(['Mavuika']))!;
    const b = createDatabase('Amigo', good(['Citlali']))!;
    bindNewProject('t1'); // nasce na base em uso (Minha)
    setActiveDatabase(b);
    bindNewProject('t2'); // nasce na base em uso (Amigo)
    expect(databaseOfProject('t1')).toBe(a);
    expect(databaseOfProject('t2')).toBe(b);
    expect(loadGood('t1')!.characters[0].key).toBe('Mavuika');
    expect(loadGood('t2')!.characters[0].key).toBe('Citlali');
    expect([projectInActiveDatabase('t1'), projectInActiveDatabase('t2'), projectInActiveDatabase('exemplo')]).toEqual([false, true, true]);
    setActiveDatabase(a);
    expect([projectInActiveDatabase('t1'), projectInActiveDatabase('t2')]).toEqual([true, false]);
  });

  it('time de antes das bases (sem ligação) fica na primeira base; sem bases, aparece sempre', () => {
    expect(projectInActiveDatabase('velho')).toBe(true);
    const a = createDatabase('Minha', good(['Mavuika']))!;
    createDatabase('Amigo', good(['Citlali']));
    expect(databaseOfProject('velho')).toBe(a);
    bindProject('velho', a);
  });

  it('excluir a base ativa passa para outra; excluir a última deixa sem inventário', () => {
    const a = createDatabase('A', good(['Mavuika']))!;
    const b = createDatabase('B', good(['Citlali']))!;
    deleteDatabase(a);
    expect(activeDatabaseId()).toBe(b);
    expect(store.has(`astralys:base:${a}`)).toBe(false);
    deleteDatabase(b);
    expect(loadGood()).toBeNull();
  });
});

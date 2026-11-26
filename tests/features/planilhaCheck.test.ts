import { afterEach, describe, expect, it } from 'vitest';
import { hasPlanilhaProjects as full } from '../../src/features/rotation/leavePlanilha';
import { sampleForApp, sampleProject } from '../../src/features/rotation/persistence';
import { teamNames } from '../../src/features/rotation/data';
import { hasPlanilhaProjects as light, planilhaCharacters } from '../../src/features/rotation/planilhaCheck';

/** localStorage de mentira: como no navegador, `Object.keys` devolve as chaves guardadas. */
const store = (entries: Record<string, string>) => {
  const fake = { ...entries };
  Object.defineProperty(fake, 'getItem', { value: (k: string) => entries[k] ?? null });
  (globalThis as { localStorage?: unknown }).localStorage = fake;
};
const saved = (id: string, value: unknown) => ({ [`astralys:projeto:${id}`]: JSON.stringify(value) });
const planilha = sampleProject();
const normal = sampleForApp();
const { compat: _, ...semCompat } = normal;

describe('hasPlanilhaProjects leve', () => {
  afterEach(() => { delete (globalThis as { localStorage?: unknown }).localStorage; });

  const cases: [string, Record<string, string>, boolean][] = [
    ['localStorage vazio', {}, false],
    ['time no modo planilha', saved('a', planilha), true],
    ['time fora do modo planilha', saved('a', normal), false],
    ['time sem o campo compat', saved('a', semCompat), false],
    ['um de cada', { ...saved('a', normal), ...saved('b', planilha) }, true],
    ['JSON inválido', { 'astralys:projeto:x': '{compat:' }, false],
    ['JSON inválido junto de um time planilha', { 'astralys:projeto:x': '{', ...saved('b', planilha) }, true],
    ['JSON "null"', { 'astralys:projeto:x': 'null' }, false],
    ['chave de outra coisa', { 'astralys:outra': JSON.stringify(planilha) }, false],
  ];
  it.each(cases)('%s: mesma resposta que a leitura completa', (_name, entries, expected) => {
    store(entries);
    expect(full()).toBe(expected);
    expect(light()).toBe(expected);
  });

  it('lista os personagens dos times a converter (a migração precisa dos golpes deles)', () => {
    store({ ...saved('a', planilha), ...saved('b', normal), 'astralys:projeto:x': '{"compat":"planilha","members":[null]}' });
    expect(planilhaCharacters().sort()).toEqual(teamNames(planilha));
  });

  it('sem armazenamento responde false', () => {
    expect(light()).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { messageOf, toRemote, type RemoteProject } from '../../src/online/api';
import { planSync } from '../../src/online/sync';
import { summaryText } from '../../src/online/syncNow';
import { cloneProject, sampleProject } from '../../src/features/rotation/persistence';

const at = (iso: string, id = 'a') => {
  const p = cloneProject(sampleProject(), 'Time');
  return { ...p, id, meta: { ...p.meta, updatedAt: iso } };
};
const remoteOf = (p: ReturnType<typeof at>): RemoteProject => ({ id: p.id, nome: p.name, character_name: 'x', role: 'Time', version: '1', is_public: false, dados: p, atualizado_em: p.meta.updatedAt });

describe('plano de sincronização', () => {
  it('sobe o que a conta não tem e o que está mais novo aqui', () => {
    const novo = at('2026-02-01T00:00:00Z', 'novo');
    const velhoNaConta = at('2026-01-01T00:00:00Z', 'b');
    const maisNovoAqui = at('2026-03-01T00:00:00Z', 'b');
    const plan = planSync([novo, maisNovoAqui], [remoteOf(velhoNaConta)]);
    expect(plan.push.map((p) => p.id).sort()).toEqual(['b', 'novo']);
    expect(plan.pull).toHaveLength(0);
  });

  it('baixa o que só existe na conta e o que está mais novo lá', () => {
    const soNaConta = at('2026-02-01T00:00:00Z', 'conta');
    const velhoAqui = at('2026-01-01T00:00:00Z', 'b');
    const maisNovoLa = at('2026-03-01T00:00:00Z', 'b');
    const plan = planSync([velhoAqui], [remoteOf(maisNovoLa), remoteOf(soNaConta)]);
    expect(plan.pull.map((p) => p.id).sort()).toEqual(['b', 'conta']);
    expect(plan.push).toHaveLength(0);
  });

  it('empate não faz nada e projeto ilegível é contado', () => {
    const p = at('2026-02-01T00:00:00Z', 'a');
    const ruim: RemoteProject = { ...remoteOf(at('2026-02-01T00:00:00Z', 'z')), dados: { schemaVersion: 99 } };
    const plan = planSync([p], [remoteOf(p), ruim]);
    expect(plan).toMatchObject({ same: 1, unreadable: 1 });
    expect(plan.push).toHaveLength(0);
    expect(plan.pull).toHaveLength(0);
  });

  it('o exemplo embutido nunca vai nem vem da conta', () => {
    const exemplo = at('2026-02-01T00:00:00Z', 'exemplo');
    const plan = planSync([exemplo], [remoteOf(exemplo), remoteOf(at('2026-03-01T00:00:00Z', 'exemplo'))]);
    expect(plan).toMatchObject({ same: 0, unreadable: 0 });
    expect(plan.push).toHaveLength(0);
    expect(plan.pull).toHaveLength(0);
  });

  it('o texto do resultado fala em português', () => {
    expect(summaryText({ pushed: 2, pulled: 1, same: 0, unreadable: 0 })).toBe('2 times enviados para a conta; 1 time baixado da conta.');
    expect(summaryText({ pushed: 0, pulled: 0, same: 3, unreadable: 0 })).toBe('Tudo já estava sincronizado.');
  });
});

describe('API', () => {
  it('traduz erros do FastAPI', () => {
    expect(messageOf(400, { detail: 'Este e-mail já está cadastrado.' })).toBe('Este e-mail já está cadastrado.');
    expect(messageOf(422, { detail: [{ msg: 'Value error, A senha deve conter no mínimo 8 caracteres.' }] })).toBe('A senha deve conter no mínimo 8 caracteres.');
    expect(messageOf(429, null)).toMatch(/Muitas tentativas/);
    expect(messageOf(500, null)).toBe('Erro 500 ao falar com o servidor.');
  });

  it('só vai como público quem foi marcado como compartilhado', () => {
    const p = at('2026-02-01T00:00:00Z', 'abc');
    expect(toRemote(p).is_public).toBe(false);
    expect(toRemote({ ...p, meta: { ...p.meta, shared: true } }).is_public).toBe(true);
  });

  it('o projeto vai ao servidor com id, nome e personagem principal', () => {
    const p = at('2026-02-01T00:00:00Z', 'abc');
    const r = toRemote(p);
    expect(r).toMatchObject({ id: 'abc', nome: 'Time', character_name: p.members[0].character, is_public: false });
    expect(r.dados).toBe(p);
  });
});

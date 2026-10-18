import { beforeEach, describe, expect, it } from 'vitest';
import * as ops from '../../src/features/rotation/projectOps';
import { SAMPLE_ID, deleteStoredProject, loadProject, loadStoredProject, sampleProject, saveProject } from '../../src/features/rotation/persistence';
import { useRotationStore } from '../../src/features/rotation/store';

const fresh = () => sampleProject();
const burst = { character: 'Bennett', talent: 'burst' as const, label: 'Skill DMG', variant: 0 };

describe('operações sobre o projeto', () => {
  it('nunca muta o projeto original', () => {
    const p = fresh();
    const frozen = JSON.stringify(p);
    ops.addAction(p, { member: 3, move: burst, time: 9 });
    ops.moveAction(p, p.actions[0].id, 3);
    ops.removeAction(p, p.actions[0].id);
    ops.duplicateAction(p, p.actions[0].id);
    ops.renameProject(p, 'Outro nome');
    expect(JSON.stringify(p)).toBe(frozen);
  });

  it('addAction gera id único e valida o dono do golpe', () => {
    const p = fresh();
    const q = ops.addAction(p, { member: 3, move: burst, time: 9.123 });
    expect(q.actions).toHaveLength(p.actions.length + 1);
    const added = q.actions[q.actions.length - 1];
    expect(new Set(q.actions.map((a) => a.id)).size).toBe(q.actions.length);
    expect(added).toMatchObject({ member: 3, executions: 1, reaction: 'none', time: 9.12 });
    expect(() => ops.addAction(p, { member: 0, move: burst, time: 1 })).toThrow(/Bennett/);
    expect(() => ops.addAction(p, { member: 9, move: burst, time: 1 })).toThrow(RangeError);
  });

  it('o id novo não colide mesmo depois de remover ações', () => {
    let p = fresh();
    p = ops.removeAction(p, p.actions[0].id);
    const q = ops.addAction(p, { member: 3, move: burst, time: 1 });
    const ids = q.actions.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('o tempo nunca fica negativo nem não numérico', () => {
    const p = fresh();
    const id = p.actions[0].id;
    expect(ops.moveAction(p, id, -4).actions.find((a) => a.id === id)!.time).toBe(0);
    expect(ops.moveAction(p, id, NaN).actions.find((a) => a.id === id)!.time).toBe(0);
    expect(ops.moveAction(p, id, 2.345).actions.find((a) => a.id === id)!.time).toBe(2.35);
  });

  it('execuções nunca ficam abaixo de 1', () => {
    const p = fresh();
    const id = p.actions[0].id;
    expect(ops.updateAction(p, id, { executions: 0 }).actions.find((a) => a.id === id)!.executions).toBe(1);
  });

  it('id inexistente devolve o mesmo projeto (sem criar histórico à toa)', () => {
    const p = fresh();
    expect(ops.updateAction(p, 'nao-existe', { time: 3 })).toBe(p);
    expect(ops.removeAction(p, 'nao-existe')).toBe(p);
    expect(ops.duplicateAction(p, 'nao-existe')).toEqual({ project: p, newId: null });
  });

  it('duplicar copia a ação 0,5 s depois, com etiquetas independentes', () => {
    const p = fresh();
    const src = p.actions[1];
    const { project, newId } = ops.duplicateAction(p, src.id);
    const copy = project.actions.find((a) => a.id === newId)!;
    expect(copy.time).toBeCloseTo(src.time + 0.5, 6);
    expect(copy.activeTags).toEqual(src.activeTags);
    expect(copy.activeTags).not.toBe(src.activeTags);
  });

  it('renomear ignora nome vazio e limita o tamanho', () => {
    const p = fresh();
    expect(ops.renameProject(p, '   ')).toBe(p);
    expect(ops.renameProject(p, 'x'.repeat(300)).name).toHaveLength(120);
  });

  it('chronological ordena por tempo sem alterar o projeto', () => {
    const p = fresh();
    const times = ops.chronological(p).map((a) => a.time);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(p.actions[0].time).toBe(6.9); // a ordem original da planilha permanece
  });
});

describe('estado do editor com desfazer e refazer', () => {
  beforeEach(() => useRotationStore.getState().open(fresh()));
  const state = () => useRotationStore.getState();

  it('abrir limpa o histórico e a seleção', () => {
    state().select('row-5');
    state().open(fresh());
    expect(state()).toMatchObject({ past: [], future: [], selectedActionId: null, dirty: false });
  });

  it('desfaz e refaz uma sequência de edições', () => {
    const original = state().project!;
    const id = original.actions[0].id;
    state().moveAction(id, 3);
    state().moveAction(id, 4);
    expect(state().project!.actions.find((a) => a.id === id)!.time).toBe(4);
    state().undo();
    expect(state().project!.actions.find((a) => a.id === id)!.time).toBe(3);
    state().undo();
    expect(state().project!.actions.find((a) => a.id === id)!.time).toBe(original.actions[0].time);
    state().undo(); // nada a desfazer
    expect(state().project).toBe(original);
    state().redo();
    state().redo();
    expect(state().project!.actions.find((a) => a.id === id)!.time).toBe(4);
    state().redo(); // nada a refazer
    expect(state().future).toHaveLength(0);
  });

  it('uma edição nova depois de desfazer apaga o "refazer"', () => {
    const id = state().project!.actions[0].id;
    state().moveAction(id, 3);
    state().undo();
    expect(state().future).toHaveLength(1);
    state().moveAction(id, 8);
    expect(state().future).toHaveLength(0);
  });

  it('adicionar seleciona a nova ação; remover a selecionada limpa a seleção', () => {
    const newId = state().addAction({ member: 3, move: burst, time: 9 });
    expect(state().selectedActionId).toBe(newId);
    state().removeAction(newId!);
    expect(state().selectedActionId).toBeNull();
    state().undo();
    expect(state().project!.actions.some((a) => a.id === newId)).toBe(true);
  });

  it('marca como alterado e volta a "salvo"', () => {
    expect(state().dirty).toBe(false);
    state().moveAction(state().project!.actions[0].id, 2);
    expect(state().dirty).toBe(true);
    state().markSaved();
    expect(state().dirty).toBe(false);
  });

  it('edição que não muda nada não cria histórico', () => {
    state().updateAction('nao-existe', { time: 1 });
    expect(state().past).toHaveLength(0);
    expect(state().dirty).toBe(false);
  });

  it('o histórico tem limite de 100 passos', () => {
    const id = state().project!.actions[0].id;
    for (let i = 1; i <= 130; i++) state().moveAction(id, i / 10);
    expect(state().past.length).toBe(100);
  });
});

describe('persistência local', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
  });

  it('salva, lê e apaga', () => {
    const p = { ...fresh(), id: 'meu-combo', name: 'Meu combo' };
    expect(saveProject(p)).toBe(true);
    expect(loadStoredProject('meu-combo')).toEqual(p);
    deleteStoredProject('meu-combo');
    expect(loadStoredProject('meu-combo')).toBeNull();
  });

  it('o exemplo carrega mesmo sem nada salvo; ids desconhecidos dão null', () => {
    expect(loadProject(SAMPLE_ID)?.name).toMatch(/Mavuika/);
    expect(loadProject('nao-existe')).toBeNull();
  });

  it('dado corrompido ou de outra versão é ignorado, não quebra', () => {
    store.set('astralys:projeto:ruim', '{nao e json');
    store.set('astralys:projeto:v9', JSON.stringify({ ...fresh(), schemaVersion: 9 }));
    expect(loadStoredProject('ruim')).toBeNull();
    expect(loadStoredProject('v9')).toBeNull();
  });

  it('uma edição salva do exemplo prevalece sobre o exemplo original', () => {
    const edited = ops.renameProject(fresh(), 'Exemplo editado');
    saveProject(edited);
    expect(loadProject(SAMPLE_ID)?.name).toBe('Exemplo editado');
  });

  it('armazenamento indisponível não lança erro', () => {
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: () => { throw new Error('bloqueado'); },
      setItem: () => { throw new Error('cota cheia'); },
      removeItem: () => { throw new Error('bloqueado'); },
    };
    expect(saveProject(fresh())).toBe(false);
    expect(loadStoredProject('exemplo')).toBeNull();
    expect(() => deleteStoredProject('exemplo')).not.toThrow();
    expect(loadProject(SAMPLE_ID)).not.toBeNull(); // o exemplo continua disponível
  });
});

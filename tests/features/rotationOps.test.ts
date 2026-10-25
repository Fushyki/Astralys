import { describe, expect, it } from 'vitest';
import { tagsAt } from '../../src/engine';
import {
  addWindow, chainOf, insertAction, insertTime, makeChain, moveAction, reactionEveryN, rebuildChain, removeAction, removeChain,
  reorderActions, setWindowAnchor, setWindowMode, addExecution, dissolveChain,
} from '../../src/features/rotation/projectOps';
import { sampleProject } from '../../src/features/rotation/persistence';

const empty = () => ({ ...sampleProject(), compat: 'none' as const, actions: [], buffWindows: [], chains: {} });
const move = (label: string) => ({ character: sampleProject().members[0].character, talent: 'skill' as const, label, variant: 0 });

describe('inserir golpes', () => {
  it('em ordem: 5 golpes seguidos saem espaçados pelo valor definido, sem sobreposição', () => {
    let p = empty();
    const gap = 0.4;
    for (let i = 0; i < 5; i++) p = insertAction(p, { member: 0, move: move(`g${i}`) }, { mode: 'order', gap, marker: 0 });
    expect(p.actions.map((a) => a.time)).toEqual([0, 0.4, 0.8, 1.2, 1.6]);
  });

  it('no instante marcado: empurra para depois de um golpe do mesmo personagem a menos de "espaço"', () => {
    let p = empty();
    p = insertAction(p, { member: 0, move: move('a') }, { mode: 'marker', gap: 0.4, marker: 2 });
    p = insertAction(p, { member: 0, move: move('b') }, { mode: 'marker', gap: 0.4, marker: 2.1 });
    expect(p.actions.map((a) => a.time)).toEqual([2, 2.4]);
    // outro personagem pode ficar no mesmo instante
    expect(insertTime(p, { mode: 'marker', gap: 0.4, marker: 2, member: 1 })).toBe(2);
  });

  it('reordenar: em ordem refaz os tempos; no marcado só muda a ordem', () => {
    let p = empty();
    for (let i = 0; i < 3; i++) p = insertAction(p, { member: 0, move: move(`g${i}`) }, { mode: 'order', gap: 0.5, marker: 0 });
    const ordered = reorderActions(p, 2, 0, 'order', 0.5);
    expect(ordered.actions.map((a) => a.move.label)).toEqual(['g2', 'g0', 'g1']);
    expect(ordered.actions.map((a) => a.time)).toEqual([0, 0.5, 1]);
    const marked = reorderActions(p, 2, 0, 'marker', 0.5);
    expect(marked.actions.map((a) => a.move.label)).toEqual(['g2', 'g0', 'g1']);
    expect(marked.actions.map((a) => a.time)).toEqual([1, 0, 0.5]);
  });
});

describe('golpe contínuo', () => {
  it('a cada 2,0 s de 0,5 a 10,5 s dá 5 execuções editáveis uma a uma', () => {
    let p = empty();
    p = insertAction(p, { member: 0, move: move('c'), reaction: 'melt' }, { mode: 'marker', gap: 0.4, marker: 0.5 });
    p = makeChain(p, p.actions[0].id, { every: 2, until: 10.5 });
    const chain = chainOf(p, p.actions[0].chainId!);
    expect(chain.map((a) => a.time)).toEqual([0.5, 2.5, 4.5, 6.5, 8.5]);
    // editar uma execução à mão não apaga as outras
    p = moveAction(p, chain[2].id, 4.9);
    expect(chainOf(p, chain[0].chainId!).map((a) => a.time)).toEqual([0.5, 2.5, 4.9, 6.5, 8.5]);
    // Reação em 1 de 2: execuções 1, 3 e 5 com reação
    p = reactionEveryN(p, chain[0].chainId!, 2, 'melt');
    expect(chainOf(p, chain[0].chainId!).map((a) => a.reaction)).toEqual(['melt', 'none', 'melt', 'none', 'melt']);
    // Refazer pelo intervalo recria (até a duração)
    p = rebuildChain(p, chain[0].chainId!, { start: 0.5, every: 4, until: 10.5 });
    expect(chainOf(p, chain[0].chainId!).map((a) => a.time)).toEqual([0.5, 4.5, 8.5]);
    p = addExecution(p, chain[0].chainId!);
    expect(chainOf(p, chain[0].chainId!)).toHaveLength(4);
    expect(dissolveChain(p, chain[0].chainId!).actions).toHaveLength(1);
    expect(removeChain(p, chain[0].chainId!).actions).toHaveLength(0);
  });

  it('sem "Até": o contínuo vai até a duração da rotação (último golpe não contínuo)', () => {
    let p = empty();
    p = insertAction(p, { member: 0, move: move('fim') }, { mode: 'marker', gap: 0.4, marker: 9 });
    p = insertAction(p, { member: 0, move: move('c') }, { mode: 'marker', gap: 0.4, marker: 1 });
    const id = p.actions.find((a) => a.move.label === 'c')!.id;
    p = makeChain(p, id, { every: 2 });
    const times = chainOf(p, p.actions.find((a) => a.chainId)!.chainId!).map((a) => a.time);
    expect(times).toEqual([1, 3, 5, 7]);
    expect(Math.max(...times)).toBeLessThan(9);
  });

  it('remover a última execução some com o grupo', () => {
    let p = empty();
    p = insertAction(p, { member: 0, move: move('c') }, { mode: 'order', gap: 0.4, marker: 0 });
    p = makeChain(p, p.actions[0].id, { every: 1, until: 0.5 });
    const id = p.actions[0].id;
    expect(Object.keys(p.chains)).toHaveLength(1);
    p = removeAction(p, id);
    expect(p.chains).toEqual({});
  });
});

describe('janelas de buff', () => {
  it('"Por golpe" acompanha o golpe-gatilho quando ele é movido', () => {
    let p = empty();
    p = insertAction(p, { member: 0, move: move('gatilho') }, { mode: 'marker', gap: 0.4, marker: 1 });
    p = addWindow(p, 'label:x', 1.5, 3);
    const w = p.buffWindows[0];
    p = setWindowAnchor(p, w.id, { actionId: p.actions[0].id, delay: 0.5 });
    expect([p.buffWindows[0].start, p.buffWindows[0].end]).toEqual([1.5, 4.5]);
    p = moveAction(p, p.actions[0].id, 3);
    expect([p.buffWindows[0].start, p.buffWindows[0].end]).toEqual([3.5, 6.5]);
  });

  it('"Rotação inteira" vale em qualquer instante; sem janela o buff não entra', () => {
    let p = empty();
    p = addWindow(p, 'label:x', 2, 1);
    expect(tagsAt(p.buffWindows, 0)).toEqual([]);
    p = setWindowMode(p, p.buffWindows[0].id, 'whole', 10);
    expect(tagsAt(p.buffWindows, 0)).toEqual(['label:x']);
    expect(tagsAt(p.buffWindows, 99)).toEqual(['label:x']);
    expect(tagsAt([], 1)).toEqual([]);
  });
});

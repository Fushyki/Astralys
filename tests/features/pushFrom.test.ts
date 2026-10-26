import { describe, expect, it } from 'vitest';
import { minPush, pushFrom } from '../../src/features/rotation/projectOps';
import { sampleProject } from '../../src/features/rotation/persistence';

const base = () => {
  const p = sampleProject();
  const actions = p.actions.slice(0, 4).map((a, i) => ({ ...a, id: `a${i}`, time: i * 2, chainId: undefined }));
  return { ...p, actions, chains: {}, buffWindows: [
    { id: 'w0', tag: 'x', start: 0, end: 3 },
    { id: 'w1', tag: 'y', start: 4, end: 6 },
    { id: 'w2', tag: 'z', start: 1, end: 5 },
    { id: 'w3', tag: 'k', start: 0, end: 9, whole: true },
  ] };
};

describe('empurrar a linha do tempo', () => {
  it('empurra para a direita tudo que está a partir da linha', () => {
    const next = pushFrom(base(), 3, 2);
    expect(next.actions.map((a) => a.time)).toEqual([0, 2, 6, 8]);
    const w = (id: string) => next.buffWindows.find((x) => x.id === id)!;
    expect(w('w0')).toMatchObject({ start: 0, end: 3 });
    expect(w('w1')).toMatchObject({ start: 6, end: 8 });
    expect(w('w2')).toMatchObject({ start: 1, end: 7 });
    expect(w('w3')).toMatchObject({ start: 0, end: 9 });
  });
  it('para a esquerda, não passa do último golpe que ficou antes da linha', () => {
    const p = base();
    expect(minPush(p, 4.5)).toBeCloseTo(-0.5, 9);
    const next = pushFrom(p, 4.5, -10);
    expect(next.actions.map((a) => a.time)).toEqual([0, 2, 4, 5.5]);
  });
});

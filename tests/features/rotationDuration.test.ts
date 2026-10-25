import { describe, expect, it } from 'vitest';
import { effectiveDuration } from '../../src/engine';
import { makeChain, updateConfig } from '../../src/features/rotation/projectOps';
import { sampleProject } from '../../src/features/rotation/persistence';

const base = (): ReturnType<typeof sampleProject> => {
  const p = sampleProject();
  return { ...p, compat: 'none', config: { ...p.config, rotationDuration: 3.5, durationManual: undefined } };
};

describe('duração da rotação', () => {
  it('segue o instante do último golpe, não o valor antigo (3,5 s com golpes até ~10 s)', () => {
    const p = base();
    const last = p.actions.reduce((m, a) => Math.max(m, a.time), 0);
    expect(last).toBeGreaterThan(3.5);
    expect(effectiveDuration(p)).toBeCloseTo(last, 2);
  });

  it('o valor manual só vale se o usuário o definiu em Configurações', () => {
    const p = updateConfig(base(), { rotationDuration: 30 });
    expect(p.config.durationManual).toBe(true);
    expect(effectiveDuration(p)).toBe(30);
    expect(effectiveDuration(updateConfig(p, { durationManual: false }))).not.toBe(30);
  });

  it('o modo planilha mantém a duração da planilha (gabarito)', () => {
    const p = sampleProject();
    expect(p.compat).toBe('planilha');
    expect(effectiveDuration(p)).toBe(p.config.rotationDuration);
  });

  it('mudar a duração corta o golpe contínuo naquele instante e o que ia até o fim acompanha', () => {
    const p0 = base();
    const id = p0.actions[0].id;
    const p1 = updateConfig(makeChain(p0, id, { every: 2, until: 20 }), { rotationDuration: 20 });
    const chainTimes = (p: typeof p1) => p.actions.filter((a) => a.chainId).map((a) => a.time);
    expect(Math.max(...chainTimes(p1))).toBeGreaterThan(14);
    const shorter = updateConfig(p1, { rotationDuration: 9 });
    expect(Math.max(...chainTimes(shorter))).toBeLessThanOrEqual(9);
    expect(effectiveDuration(shorter)).toBe(9);
    const longer = updateConfig(shorter, { rotationDuration: 25 });
    expect(Math.max(...chainTimes(longer))).toBeGreaterThan(20);
    expect(effectiveDuration(longer)).toBe(25);
  });
});

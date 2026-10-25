import { describe, expect, it } from 'vitest';
import { effectiveDuration } from '../../src/engine';
import { updateConfig } from '../../src/features/rotation/projectOps';
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
});

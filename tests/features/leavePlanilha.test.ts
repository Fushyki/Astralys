import { describe, expect, it } from 'vitest';
import { leavePlanilha } from '../../src/features/rotation/leavePlanilha';
import { sampleForApp, sampleProject } from '../../src/features/rotation/persistence';

describe('modo planilha fora do site', () => {
  it('o exemplo que o site abre já usa todos os efeitos', () => {
    expect(sampleForApp().compat).not.toBe('planilha');
    expect(sampleForApp().config.durationManual).toBe(true);
  });
  it('o JSON original continua no modo planilha (gabarito dos testes)', () => {
    expect(sampleProject().compat).toBe('planilha');
  });
  it('projeto fora do modo planilha passa direto', () => {
    const p = sampleForApp();
    expect(leavePlanilha(p, {} as never).project).toBe(p);
  });
});

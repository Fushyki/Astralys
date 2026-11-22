import { describe, expect, it } from 'vitest';
import { buildSummary } from '../../src/features/community/teamSummary';
import { sampleForApp } from '../../src/features/rotation/persistence';

describe('buildSummary', () => {
  const p = sampleForApp();
  const s = buildSummary(p, { dps: 1, dpr: 2, duration: 3, shares: [1] });
  it('lista os membros e uma sequência curta em ordem de tempo', () => {
    expect(s.members.map((m) => m.character)).toEqual(p.members.map((m) => m.character));
    expect(s.sequence.length).toBeGreaterThan(0);
    expect(s.sequence.length).toBeLessThanOrEqual(30);
    expect(s.sequence.every((x) => typeof x.time === 'number')).toBe(true); // instante de cada golpe, para o plano de combate do card
    expect(s.actionCount).toBe(p.actions.length);
  });
  it('junta golpes iguais em sequência', () => {
    const a = p.actions[0];
    const twice = { ...p, actions: [{ ...a, time: 0 }, { ...a, id: 'b', time: 1 }] };
    const r = buildSummary(twice, { dps: 0, dpr: 0, duration: 0, shares: [] });
    expect(r.sequence).toHaveLength(1);
    expect(r.sequence[0].times).toBe(2 * Math.max(1, Math.round(a.executions)));
  });
  it('guarda os golpes do card (arredondados) e fica abaixo do limite do servidor mesmo com muitos', () => {
    const hits = Array.from({ length: 120 }, (_, i) => ({ at: i / 120 + 0.00049, to: 0.9, ticks: Array.from({ length: 80 }, (_, k) => k / 80), member: i % 4, weight: 0.123456, burst: false, letter: 'E', count: 80 }));
    const r = buildSummary(p, { dps: 1, dpr: 2, duration: 30, shares: [1], hits });
    expect(r.hits![1].at).toBe(0.009);
    expect(JSON.stringify(r).length).toBeLessThan(20000);
  });
});

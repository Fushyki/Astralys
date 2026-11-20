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
    expect(s.sequence.every((x) => typeof x.time === 'number')).toBe(true); // instante de cada golpe, para a linha do tempo do card
    expect(s.actionCount).toBe(p.actions.length);
  });
  it('junta golpes iguais em sequência', () => {
    const a = p.actions[0];
    const twice = { ...p, actions: [{ ...a, time: 0 }, { ...a, id: 'b', time: 1 }] };
    const r = buildSummary(twice, { dps: 0, dpr: 0, duration: 0, shares: [] });
    expect(r.sequence).toHaveLength(1);
    expect(r.sequence[0].times).toBe(2 * Math.max(1, Math.round(a.executions)));
  });
});

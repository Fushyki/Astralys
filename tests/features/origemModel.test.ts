import { describe, expect, it } from 'vitest';
import demoJson from '../../src/screens/inicio/demo.json';
import { buffName, coveringRows, strongestHit, type Demo } from '../../src/screens/inicio/origemModel';

const demo = demoJson as Demo;

describe('demonstração da página inicial', () => {
  it('reproduz o gabarito da planilha (3.790.496 de dano e 216.600 de DPS)', () => {
    expect(demo.total).toBe(3790496);
    expect(demo.dps).toBe(216600);
    expect(demo.hits).toHaveLength(24);
  });

  it('os buffs de um golpe vêm do mais pesado ao mais leve, dentro da janela que cobre o instante', () => {
    const hit = strongestHit(demo);
    const rows = coveringRows(demo, hit);
    expect(rows.length).toBeGreaterThan(0);
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].effect).toBeGreaterThanOrEqual(rows[i].effect);
    for (const r of rows) {
      expect(r.window.start).toBeLessThanOrEqual(hit.t);
      expect(r.window.end).toBeGreaterThan(hit.t);
      expect(r.without).toBeCloseTo(hit.avg * (1 - r.effect), 6);
      expect(r.without).toBeLessThan(hit.avg);
    }
  });

  it('o golpe mais forte é o Supremo da Mavuika', () => {
    const hit = strongestHit(demo);
    expect(demo.members[hit.m].name).toBe('Mavuika');
    expect(hit.kind).toBe('burst');
  });

  it('o nome do buff não repete o dono', () => {
    const w = demo.windows.find((x) => x.name.endsWith('Bennett'))!;
    expect(buffName(w, demo.members[w.giver!])).toBe('ATK fixo');
  });
});

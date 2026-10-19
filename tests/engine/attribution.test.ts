import { describe, it, expect } from 'vitest';
import { attributeBuffs, evaluateRotation, handleEngineRequest, type EngineResponse } from '../../src/engine';
import { loadPlanilhaFixture } from '../helpers/planilhaFixture';

const { ctx, optimized, imported } = loadPlanilhaFixture();
const result = optimized.result;

const attribution = attributeBuffs({
  team: imported.team,
  actions: imported.actions,
  rolls: optimized.rolls,
  flatEffects: imported.flatEffects,
  ampCoefficient: ctx.ampCoefficient,
});
const byId = (id: string) => attribution.items.find((i) => i.id === id)!;

describe('atribuição por buff', () => {
  it('o total confere com a avaliação completa', () => {
    expect(attribution.total).toBeCloseTo(result.totals.avg, 6);
  });

  it('ids únicos, ordenado do maior para o menor', () => {
    const ids = attribution.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let i = 1; i < attribution.items.length; i++) {
      expect(attribution.items[i - 1].contribution).toBeGreaterThanOrEqual(attribution.items[i].contribution);
    }
  });

  it('inclui fontes estáticas, buffs de time, ressonância e redução de RES', () => {
    const kinds = new Set(attribution.items.map((i) => i.kind));
    for (const k of ['ascension', 'weapon', 'set-4p', 'main-stat', 'team-gear', 'team-extra', 'team-flat-atk', 'resonance', 'res-shred']) {
      expect(kinds.has(k as never), k).toBe(true);
    }
  });

  it('redução de RES da Citlali: ganho EXATO de 1 − 0,9/1,05 no dano Pyro da Mavuika', () => {
    const shred = byId('res-shred-1');
    const mavuika = shred.perMember.find((m) => m.name === 'Mavuika')!;
    // RES Pyro vai de 10% (×0,9) para −10% (×1,05) com a redução de 20%
    expect(mavuika.contribution).toBeCloseTo(result.members[0].avg * (1 - 0.9 / 1.05), 3);
    // Iansan (Electro) não é afetada, pois a redução vale só para Pyro e Hydro
    expect(shred.perMember.find((m) => m.name === 'Iansan')!.contribution).toBeCloseTo(0, 6);
  });

  it('ressonância Pyro vale ≈ 4,9% do dano total', () => {
    expect(byId('resonance-pyro').share).toBeCloseTo(0.0491, 3);
  });

  it('o ATK fixo do Bennett beneficia mais quem causa mais dano (Mavuika)', () => {
    const b = byId('flat-atk-3');
    const [mav, ...rest] = b.perMember;
    expect(mav.contribution).toBeGreaterThan(0);
    expect(rest.every((m) => m.contribution <= mav.contribution)).toBe(true);
  });

  it('desligar uma fonte reduz (ou mantém) o dano; nenhuma contribuição é negativa neste time', () => {
    for (const i of attribution.items) expect(i.contribution, i.id).toBeGreaterThanOrEqual(-1e-6);
  });

  it('contribuições são marginais: não somam o total (multiplicadores se combinam)', () => {
    const sum = attribution.items.reduce((s, i) => s + i.contribution, 0);
    expect(sum).toBeGreaterThan(attribution.total * 0.5);
    expect(sum).not.toBeCloseTo(attribution.total, 0);
  });
});

describe('protocolo do Web Worker', () => {
  it('avalia e otimiza como a chamada direta', () => {
    const direct = evaluateRotation({ ...ctx, rolls: optimized.rolls }, imported.actions);
    const viaEval = handleEngineRequest({ id: 1, type: 'evaluate', ctx: { ...ctx, rolls: optimized.rolls }, actions: [...imported.actions] }) as Extract<EngineResponse, { ok: true }>;
    expect(viaEval.ok).toBe(true);
    expect((viaEval.result as typeof direct).totals.avg).toBeCloseTo(direct.totals.avg, 9);

    const viaOpt = handleEngineRequest({ id: 2, type: 'optimize', ctx }) as Extract<EngineResponse, { ok: true }>;
    expect((viaOpt.result as { result: typeof direct }).result.totals.avg).toBeCloseTo(result.totals.avg, 6);
  });

  it('os argumentos sobrevivem ao structuredClone (exigência do postMessage)', () => {
    const cloned = structuredClone(ctx);
    const r = handleEngineRequest({ id: 3, type: 'optimize', ctx: cloned }) as Extract<EngineResponse, { ok: true }>;
    expect((r.result as { result: { totals: { avg: number } } }).result.totals.avg).toBeCloseTo(result.totals.avg, 6);
  });

  it('erros viram resposta ok:false em vez de derrubar o worker', () => {
    const bad = handleEngineRequest({ id: 4, type: 'evaluate', ctx: { ...ctx, rolls: optimized.rolls }, actions: [{ ...imported.actions[0], member: 99 }] });
    expect(bad).toMatchObject({ id: 4, ok: false });
  });
});

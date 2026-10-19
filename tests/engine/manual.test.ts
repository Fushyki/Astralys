import { describe, expect, it } from 'vitest';
import {
  RotationProjectSchema,
  analyzeProject,
  manualToRolls,
  parseProject,
  resolveProject,
  SUBSTATS,
  type RotationProject,
} from '../../src/engine';
import { loadPlanilhaFixture } from '../helpers/planilhaFixture';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const fx = loadPlanilhaFixture();
const root = path.resolve(__dirname, '../..');
const sample = (): RotationProject => parseProject(JSON.parse(readFileSync(path.join(root, 'src/features/rotation/sample/mavuika-iansan.json'), 'utf8')));
const analyze = (p: RotationProject) => {
  const r = resolveProject(p, fx.data, fx.effects);
  return analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient });
};

describe('rolls manuais', () => {
  const auto = analyze(sample());

  it('fixar à mão os rolls do otimizador reproduz exatamente o resultado', () => {
    const p = sample();
    p.members[0].manualRolls = { ...auto.optimization.rolls[0] };
    const manual = analyze(p);
    expect(manual.optimization.members[0].manual).toBe(true);
    expect(manual.optimization.result.totals.avg).toBeCloseTo(auto.optimization.result.totals.avg, 6);
    expect(manual.optimization.rolls[0]).toEqual(auto.optimization.rolls[0]);
  });

  it('só o membro manual deixa de ser otimizado', () => {
    const p = sample();
    p.members[0].manualRolls = { ...auto.optimization.rolls[0], CD: 2, CR: 2 };
    const r = analyze(p);
    expect(r.optimization.members[1].manual).toBeUndefined();
    expect(r.optimization.rolls[1]).toEqual(auto.optimization.rolls[1]);
    expect(r.optimization.result.members[0].avg).toBeLessThan(auto.optimization.result.members[0].avg);
  });

  it('o que não foi informado vale o mínimo configurado', () => {
    const rolls = manualToRolls({ CR: 9 }, 2);
    expect(rolls.CR).toBe(9);
    expect(rolls.CD).toBe(2);
    expect(SUBSTATS.every((s) => rolls[s] >= 2)).toBe(true);
  });

  it('o JSON salvo continua válido e idêntico depois de ida e volta', () => {
    const p = sample();
    p.members[1].manualRolls = { CR: 8, CD: 8 };
    expect(parseProject(JSON.parse(JSON.stringify(p))).members[1].manualRolls).toEqual({ CR: 8, CD: 8 });
  });

  it('recusa substat inexistente e quantidade absurda de rolls', () => {
    const p = JSON.parse(JSON.stringify(sample()));
    p.members[0].manualRolls = { INEXISTENTE: 3 };
    expect(RotationProjectSchema.safeParse(p).success).toBe(false);
    p.members[0].manualRolls = { CR: 99 };
    expect(RotationProjectSchema.safeParse(p).success).toBe(false);
    p.members[0].manualRolls = { CR: -1 };
    expect(RotationProjectSchema.safeParse(p).success).toBe(false);
  });
});

describe('avisos de rolls', () => {
  it('o otimizador nunca gera avisos', () => {
    expect(analyze(sample()).rollWarnings).toEqual([]);
  });

  it('manual acima do orçamento das peças', () => {
    const p = sample();
    p.members[0].manualRolls = { CR: 20, CD: 20, 'ATK%': 20, EM: 20, ER: 20 }; // muito acima de 45
    const w = analyze(p).rollWarnings;
    expect(w.some((x) => x.kind === 'over-budget' && x.member === 0)).toBe(true);
  });

  it('manual acima do limite de um substat (6 por peça 5★ → 30 no máximo, ou menos se o main é o mesmo)', () => {
    const p = sample();
    p.members[0].manualRolls = { CD: 25 }; // a tiara da Mavuika já é CD: o limite é menor
    const w = analyze(p).rollWarnings;
    const cap = w.find((x) => x.kind === 'over-substat-cap');
    expect(cap).toBeDefined();
    expect(cap!.message).toMatch(/Mavuika: 25 rolls de CD/);
  });
});

describe('stats finais por membro', () => {
  const b = analyze(sample());

  it('batem com o gabarito (todos os buffs ativos)', () => {
    expect(b.memberStats).toHaveLength(4);
    const m = b.memberStats[0];
    expect(m.atk).toBeCloseTo(5791.25, 2);
    expect(m.em).toBeCloseTo(424, 6);
    expect(m.critRate).toBeCloseTo(0.989, 6);
    expect(m.critDmg).toBeCloseTo(2.318, 6);
    expect(m.er).toBeCloseTo(1.11, 6);
  });

  it('existem para membros sem nenhuma ação', () => {
    const p = sample();
    p.actions = p.actions.filter((a) => a.member !== 3);
    const r = analyze(p);
    expect(r.memberStats[3].atk).toBeGreaterThan(0);
    expect(r.crit[3]).toBeNull();
  });
});

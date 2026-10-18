/**
 * Gabarito: o motor tem de reproduzir a planilha "Mavuika Iansan Combo2" (modo compat "planilha").
 * Os valores esperados são lidos das células em cache do próprio .xlsx, sem transcrição manual.
 */
import { describe, it, expect } from 'vitest';
import {
  PLANILHA_AMP_COEFFICIENT,
  activeTeamDelta,
  critFactor,
  evaluateRotation,
  finalStats,
} from '../../src/engine';
import { loadPlanilhaFixture } from '../helpers/planilhaFixture';

const { wb, imported, assembly, ctx: ctxBase, optimized } = loadPlanilhaFixture();
const { team, actions } = imported;
const result = optimized.result;
const v = (sheet: string, ref: string): number => {
  const c = wb.Sheets[sheet][ref];
  if (!c) throw new Error(`Célula ${sheet}!${ref} vazia`);
  return Number(c.v);
};

const SLOT_COL = ['C', 'D', 'E', 'F']; // colunas de Cálculos
const RES_COL = ['B', 'C', 'D', 'E']; // colunas de Resultado
const REL = 1e-9;
const close = (actual: number, expected: number, rel = REL) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(Math.abs(expected) * rel + 1e-9);

describe('importação da planilha', () => {
  it('monta a equipa e as 24 ações da rotação', () => {
    expect(team.members.map((m) => m.character.name)).toEqual(['Mavuika', 'Citlali', 'Iansan', 'Bennett']);
    expect(actions).toHaveLength(24);
    expect(imported.warnings).toEqual([]);
  });

  it('perfis viram etiquetas', () => {
    expect(imported.profiles['Nenhum']).toEqual([]);
    expect(imported.profiles['Todos']).toContain('label:Scroll');
    expect(imported.profiles['Iansan (início)']).toEqual(['char:0', 'gear:0', 'label:_geral']);
  });
});

describe('gabarito: rolls otimizados (aba Resultado)', () => {
  // Resultado linhas 24–30: CR, CD, ATK%, HP%, DEF%, EM, ER (já somando os mínimos)
  const rows: [string, keyof (typeof optimized.rolls)[0]][] = [
    ['24', 'CR'], ['25', 'CD'], ['26', 'ATK%'], ['27', 'HP%'], ['28', 'DEF%'], ['29', 'EM'], ['30', 'ER'],
  ];
  team.members.forEach((m, i) => {
    it(`${m.character.name}: distribuição de rolls`, () => {
      for (const [row, key] of rows) {
        expect(optimized.rolls[i][key], `${m.character.name} ${key}`).toBe(v('Resultado', `${RES_COL[i]}${row}`));
      }
    });
  });
});

describe('gabarito: stats finais por perfil (aba Cálculos)', () => {
  const profileNames = ['Todos', 'Iansan (início)', 'Pós-Supremo', 'Final', 'Nenhum'];
  team.members.forEach((m, i) => {
    profileNames.forEach((profile, p) => {
      it(`${m.character.name} / ${profile}: ATK e EM`, () => {
        const tags = new Set(imported.profiles[profile]);
        const s = finalStats(
          m, assembly.statics[i], optimized.rolls[i], activeTeamDelta(assembly.buffs, m.character.name, tags),
          assembly.resonanceAtkPct,
        );
        close(s.atk, v('Cálculos', `${SLOT_COL[i]}${332 + p}`));
        close(s.em, v('Cálculos', `${SLOT_COL[i]}${339 + p}`));
      });
    });

    it(`${m.character.name}: HP, DEF, ER, CR e CD`, () => {
      const s = finalStats(m, assembly.statics[i], optimized.rolls[i], activeTeamDelta(assembly.buffs, m.character.name, 'all'), assembly.resonanceAtkPct);
      close(s.hp, v('Cálculos', `${SLOT_COL[i]}337`));
      close(s.def, v('Cálculos', `${SLOT_COL[i]}338`));
      close(s.er, v('Cálculos', `${SLOT_COL[i]}328`));
      close(s.critRate, v('Cálculos', `${SLOT_COL[i]}330`));
      close(s.critDmg, v('Cálculos', `${SLOT_COL[i]}331`));
    });
  });

  it('valores da especificação: ATK 5791,25 / EM 424 / ER 1,11 / CR 0,989 / CD 2,318 (Mavuika)', () => {
    const s = finalStats(team.members[0], assembly.statics[0], optimized.rolls[0], activeTeamDelta(assembly.buffs, 'Mavuika', 'all'), assembly.resonanceAtkPct);
    close(s.atk, 5791.25, 1e-6);
    close(s.em, 424, 1e-9);
    close(s.er, 1.11, 1e-9);
    close(s.critRate, 0.989, 1e-9);
    close(s.critDmg, 2.318, 1e-9);
  });
});

describe('gabarito: dano de cada linha da rotação (aba Rotação)', () => {
  const rowOf = (idx: number) => 5 + idx;
  actions.forEach((a, idx) => {
    it(`linha ${rowOf(idx)}: ${a.move.displayName}`, () => {
      const r = result.actions[idx];
      const row = rowOf(idx);
      close(r.noCrit, v('Rotação', `AH${row}`), 1e-9);
      close(r.crit, v('Rotação', `AI${row}`), 1e-9);
      close(r.avg, v('Rotação', `AJ${row}`), 1e-9);
    });
  });
});

describe('gabarito: totais (aba Resultado)', () => {
  it('dano por personagem', () => {
    team.members.forEach((m, i) => {
      close(result.members[i].noCrit, v('Resultado', `${RES_COL[i]}36`));
      close(result.members[i].crit, v('Resultado', `${RES_COL[i]}37`));
      close(result.members[i].avg, v('Resultado', `${RES_COL[i]}38`));
      close(result.members[i].share, v('Resultado', `${RES_COL[i]}39`), 1e-9);
    });
  });

  it('DPR 3.790.496,07 e DPS 216.599,78 (17,5 s)', () => {
    close(result.totals.avg, v('Resultado', 'B42'));
    close(result.totals.dps, v('Resultado', 'B43'));
    close(result.totals.crit, v('Resultado', 'B44'));
    close(result.totals.noCrit, v('Resultado', 'B45'));
    close(result.totals.avg, 3790496.072, 1e-6);
    close(result.totals.dps, 216599.7756, 1e-6);
  });

  it('a verificação interna do otimizador bate com a avaliação completa', () => {
    team.members.forEach((_, i) => close(optimized.members[i].expectedAvg, result.members[i].avg, 1e-12));
  });
});

describe('sanidade do modelo', () => {
  it('sem o coeficiente 2,78 da planilha o erro fica abaixo de 0,1%', () => {
    const exact = evaluateRotation({ ...ctxBase, rolls: optimized.rolls, ampCoefficient: undefined }, actions);
    const rel = Math.abs(exact.totals.avg - result.totals.avg) / result.totals.avg;
    expect(rel).toBeLessThan(0.001);
  });

  it('critFactor médio usa a taxa limitada a 100%', () => {
    expect(critFactor('avg', 0.989, 2.318)).toBeCloseTo(1 + 0.989 * 2.318, 12);
  });
});

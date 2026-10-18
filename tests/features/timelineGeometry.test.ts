import { describe, expect, it } from 'vitest';
import {
  SNAP,
  X0,
  X1,
  axisEnd,
  buffRowY,
  createScale,
  memberLaneY,
  rulerTicks,
  snap,
  starRadius,
  timelineHeight,
} from '../../src/features/rotation/timelineGeometry';
import { sampleProject } from '../../src/features/rotation/persistence';

describe('escala de tempo', () => {
  const sc = createScale(18);

  it('0 s fica no início do eixo e o fim no fim', () => {
    expect(sc.x(0)).toBe(X0);
    expect(sc.x(18)).toBe(X1);
    expect(sc.x(9)).toBeCloseTo((X0 + X1) / 2, 9);
  });

  it('t é a inversa de x e nunca devolve tempo negativo', () => {
    for (const t of [0, 1.3, 7.4, 17.9]) expect(sc.t(sc.x(t))).toBeCloseTo(t, 9);
    expect(sc.t(0)).toBe(0); // à esquerda do eixo (coluna de nomes)
  });
});

describe('snap', () => {
  it('arredonda ao passo e nunca fica negativo', () => {
    expect(snap(3.14)).toBeCloseTo(3.1, 9);
    expect(snap(3.16)).toBeCloseTo(3.2, 9);
    expect(snap(-2)).toBe(0);
    expect(snap(3.3, 0.5)).toBe(3.5);
    expect(SNAP).toBe(0.1);
  });
});

describe('estrelas', () => {
  it('crescem com o dano e têm tamanho mínimo e máximo', () => {
    expect(starRadius(0, 100)).toBe(3.2);
    expect(starRadius(100, 100)).toBeCloseTo(18.2, 9);
    expect(starRadius(25, 100)).toBeCloseTo(3.2 + 15 * 0.5, 9);
    expect(starRadius(500, 100)).toBeCloseTo(18.2, 9); // nunca passa do máximo
    expect(starRadius(5, 0)).toBe(3.2);
    expect(starRadius(10, 100)).toBeLessThan(starRadius(40, 100));
  });
});

describe('eixo e régua', () => {
  it('o exemplo cobre os 17,5 s e o último golpe aos 17,4 s', () => {
    const end = axisEnd(sampleProject());
    expect(end).toBeGreaterThanOrEqual(18.4);
    expect(end % 2).toBe(0);
  });

  it('cresce quando uma janela ou golpe passa do fim', () => {
    const p = sampleProject();
    const longer = { ...p, buffWindows: [{ id: 'w1', tag: 'gear:3', start: 5, end: 30 }] };
    expect(axisEnd(longer)).toBeGreaterThanOrEqual(30);
  });

  it('marcas de 2 em 2 s (1 em 1 s em eixos curtos)', () => {
    expect(rulerTicks(18)).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);
    expect(rulerTicks(6)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe('alturas', () => {
  it('as faixas de membros e de buffs não se sobrepõem e a altura total as contém', () => {
    expect(memberLaneY(1)).toBeGreaterThan(memberLaneY(0));
    const h = timelineHeight(4, 6);
    expect(h).toBeGreaterThan(buffRowY(4, 5));
    expect(buffRowY(4, 0)).toBeGreaterThan(memberLaneY(3) + 44);
  });
});

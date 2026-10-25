import { describe, expect, it } from 'vitest';
import { DIM, DIMS } from '../../src/features/optimizer/vector';
import { allPatterns, bruteForce, configOfPieces, pruneDominated, solve, type Evaluate, type Piece, type SetConfig } from '../../src/features/optimizer/solver';

/** Gerador pseudo-aleatório com semente (mulberry32). */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inventory(seed: number, perSlot: number, sets: string[]): Piece[][] {
  const r = rng(seed);
  let index = 0;
  return Array.from({ length: 5 }, (_, slot) =>
    Array.from({ length: perSlot }, () => {
      const vec = new Float64Array(DIMS);
      // 4 substats entre os 10 (ATK%, CR, CD, EM, ER, HP%...), valores parecidos com os do jogo
      const dims = [DIM.atkPct, DIM.cr, DIM.cd, DIM.em, DIM.er, DIM.hpPct, DIM.atkFlat, DIM.defPct];
      for (let k = 0; k < 4; k++) {
        const d = dims[Math.floor(r() * dims.length)];
        const rolls = 1 + Math.floor(r() * 3);
        vec[d] += rolls * ({ [DIM.atkPct]: 0.05, [DIM.cr]: 0.033, [DIM.cd]: 0.066, [DIM.em]: 19.5, [DIM.er]: 0.055, [DIM.hpPct]: 0.05, [DIM.atkFlat]: 18, [DIM.defPct]: 0.06 } as Record<number, number>)[d];
      }
      if (slot === 0) vec[DIM.hpFlat] += 4780;
      if (slot === 1) vec[DIM.atkFlat] += 311;
      if (slot === 2) vec[r() < 0.5 ? DIM.atkPct : DIM.er] += 0.466;
      if (slot === 3 && r() < 0.6) vec[DIM.dmg] += 0.466;
      if (slot === 4) vec[r() < 0.5 ? DIM.cr : DIM.cd] += r() < 0.5 ? 0.311 : 0.622;
      // o grupo é o main stat: o da areia, do cálice e da tiara que o gerador acima escolheu
      const group = slot >= 2 ? [DIM.atkPct, DIM.er, DIM.dmg, DIM.cr, DIM.cd].filter((d) => vec[d] >= (slot === 3 ? 0.466 : slot === 4 ? 0.311 : 0.466)).join('-') : undefined;
      return { index: index++, slot, set: sets[Math.floor(r() * sets.length)], vec, group };
    }),
  );
}

/** Dano de brinquedo, monótono: ATK × (1 + DMG%) × crítico, bônus de set por config, e Recarga mínima como restrição. */
const toy = (minEr: number): Evaluate => (v, config: SetConfig) => {
  const er = 1 + v[DIM.er];
  if (er < minEr) return -Infinity;
  const four = config.primarySet && !config.secondarySet && config.fourPiece !== false;
  const twoPieces = (config.primarySet ? 1 : 0) + (config.secondarySet ? 1 : 0);
  const atkPct = v[DIM.atkPct] + (config.primarySet === 'A' ? 0.18 : 0) + (config.secondarySet === 'A' ? 0.18 : 0);
  const dmg = 1 + v[DIM.dmg] + (four && config.primarySet === 'B' ? 0.35 : 0) + twoPieces * 0.02 + (config.primarySet === 'C' || config.secondarySet === 'C' ? 0.15 : 0);
  const atk = 800 * (1 + atkPct) + v[DIM.atkFlat];
  const cr = Math.min(1, 0.05 + v[DIM.cr]);
  const cd = 0.5 + v[DIM.cd];
  const em = 1 + (2.78 * (v[DIM.em] + 100)) / (v[DIM.em] + 100 + 1400);
  return atk * dmg * (1 + cr * cd) * em * (1 + 0.1 * v[DIM.hpPct]);
};

const values = (bs: { value: number }[]) => bs.map((b) => b.value);

describe('configOfPieces', () => {
  const p = (set: string, slot: number): Piece => ({ index: slot, slot, set, vec: new Float64Array(DIMS) });
  it('4 peças, 2+2, 2 peças e sem set', () => {
    expect(configOfPieces([p('A', 0), p('A', 1), p('A', 2), p('A', 3), p('B', 4)])).toEqual({ primarySet: 'A' });
    expect(configOfPieces([p('A', 0), p('A', 1), p('B', 2), p('B', 3), p('C', 4)])).toEqual({ primarySet: 'A', secondarySet: 'B' });
    expect(configOfPieces([p('A', 0), p('A', 1), p('A', 2), p('B', 3), p('C', 4)])).toEqual({ primarySet: 'A', fourPiece: false });
    expect(configOfPieces([p('A', 0), p('B', 1), p('C', 2), p('D', 3), p('E', 4)])).toEqual({});
  });
});

describe('solver exato', () => {
  it('acha os mesmos 5 melhores que a força bruta (várias sementes, com restrição de Recarga)', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const slots = inventory(seed, 6, ['A', 'B', 'C', 'D']);
      for (const minEr of [0, 1.2]) {
        const ev = toy(minEr);
        const expected = bruteForce(slots, ev, 5);
        const got = solve({ slots, evaluate: ev, topN: 5 });
        expect(values(got.builds), `semente ${seed}, ER ${minEr}`).toHaveLength(expected.length);
        values(got.builds).forEach((v, i) => expect(v).toBeCloseTo(expected[i].value, 6));
      }
    }
  });

  it('com topN = 1 e topN = 10 também', () => {
    const slots = inventory(11, 7, ['A', 'B', 'C']);
    const ev = toy(1.1);
    for (const topN of [1, 10]) {
      const expected = bruteForce(slots, ev, topN);
      const got = solve({ slots, evaluate: ev, topN });
      expect(values(got.builds)).toHaveLength(expected.length);
      values(got.builds).forEach((v, i) => expect(v).toBeCloseTo(expected[i].value, 6));
    }
  });

  it('a poda por dominância não perde nenhum dos melhores', () => {
    const slots = inventory(21, 9, ['A', 'B']);
    const ev = toy(0);
    const dom = pruneDominated(slots, 5);
    expect(dom.removed).toBeGreaterThanOrEqual(0);
    const withoutPrune = bruteForce(slots, ev, 5);
    const withPrune = bruteForce(dom.slots, ev, 5);
    values(withPrune).forEach((v, i) => expect(v).toBeCloseTo(withoutPrune[i].value, 6));
  });

  it('padrões: 4 peças, 2 peças, 2+2 e sem set aparecem só quando o inventário permite', () => {
    const slots = inventory(31, 4, ['A', 'B']);
    const kinds = new Set(allPatterns(slots).map((p) => p.kind));
    expect(kinds).toEqual(new Set(['none', 'four', 'two', 'two-two']));
    const onlyOne = inventory(32, 4, ['A']);
    expect(new Set(allPatterns(onlyOne).map((p) => p.kind))).toEqual(new Set(['none', 'four', 'two']));
  });

  it('com sets marcados (fullBonus) só sobram padrões que dão o bônus completo', () => {
    const slots = inventory(31, 4, ['A', 'B']);
    expect(new Set(allPatterns(slots, new Set(['A']), true).map((p) => p.kind))).toEqual(new Set(['four']));
    expect(new Set(allPatterns(slots, new Set(['A', 'B']), true).map((p) => p.kind))).toEqual(new Set(['four', 'two-two']));
  });

  it('para quando pedem e devolve o que já achou', () => {
    const slots = inventory(41, 8, ['A', 'B', 'C']);
    let calls = 0;
    const r = solve({ slots, evaluate: toy(0), topN: 3, shouldStop: () => ++calls > 0, onProgress: () => undefined });
    expect(r.stats.stopped).toBe(true);
  });

  it('descarta muito: com 8 peças por posição testa bem menos que as 32.768 combinações', () => {
    const slots = inventory(51, 8, ['A', 'B', 'C']);
    const r = solve({ slots, evaluate: toy(1.1), topN: 5 });
    expect(r.stats.evaluations).toBeLessThan(32768 * 3);
  });
});

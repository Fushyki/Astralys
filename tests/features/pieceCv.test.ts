import { describe, expect, it } from 'vitest';
import { pieceCv } from '../../src/screens/otimizar/ResultCard';

describe('CV (Crit Value) da peça', () => {
  it('é 2 × Taxa Crítica + Dano Crítico das substats (o main stat não entra)', () => {
    expect(pieceCv({ substats: [{ key: 'critRate_', value: 3.9 }, { key: 'critDMG_', value: 8 }, { key: 'atk_', value: 5.3 }, { key: 'hp_', value: 8.7 }] } as never)).toBeCloseTo(15.8, 6);
    expect(pieceCv({ substats: [{ key: 'atk', value: 19 }] } as never)).toBe(0);
  });
});

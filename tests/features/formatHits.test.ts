import { describe, expect, it } from 'vitest';
import { formatHits } from '../../src/ui/format';

describe('formatHits', () => {
  it('golpe de vários acertos vira "x + y"; um acerto ou sem divisão fica só o número', () => {
    expect(formatHits(1000, [0.5, 0.5])).toBe('500 + 500');
    expect(formatHits(1000, [0.6, 0.4])).toBe('600 + 400');
    expect(formatHits(1000, [1])).toBe('1.000');
    expect(formatHits(1000)).toBe('1.000');
  });
});

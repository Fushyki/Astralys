import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { verifySet } from '../../scripts/verify-kit-numbers';
import type { SetEffect } from '../../src/effects/schema';

const effects: SetEffect[] = JSON.parse(readFileSync(path.resolve(__dirname, '../../src/effects/sets.json'), 'utf8'));

it('todo número de set existe no texto do Lunaris', () => {
  expect(effects.flatMap(verifySet)).toEqual([]);
});

it('o verificador pega um número inventado', () => {
  const e = structuredClone(effects.find((x) => x.set === 'Resolution of Sojourner')!);
  e.fourPiece!.buffs![0].stats.critRateByType = { charged: 0.3137 };
  expect(verifySet(e).length).toBe(1);
});

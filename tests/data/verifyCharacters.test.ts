import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { verifyCharacter } from '../../scripts/verify-kit-numbers';
import type { CharacterEffect } from '../../src/effects/schema';

const effects: CharacterEffect[] = JSON.parse(readFileSync(path.resolve(__dirname, '../../src/effects/characters.json'), 'utf8'));

it('todo número dos buffs de personagem existe no texto do Lunaris', () => {
  expect(effects.flatMap(verifyCharacter)).toEqual([]);
});

it('o verificador pega um número inventado', () => {
  const e = structuredClone(effects.find((x) => x.character === 'Mavuika')!);
  e.buffs![0].stats.atkPct = 0.3137;
  expect(verifyCharacter(e).length).toBe(1);
});

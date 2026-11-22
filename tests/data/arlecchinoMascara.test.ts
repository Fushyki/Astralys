import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { scaleBuffStacks } from '../../src/engine/stacks';
import type { CharacterEffect } from '../../src/effects/schema';

const effects: CharacterEffect[] = JSON.parse(readFileSync(path.resolve(__dirname, '../../src/effects/characters.json'), 'utf8'));
const buff = effects.find((e) => e.character === 'Arlecchino')!.buffs.find((b) => b.id === 'normal')!;

it('Masque of the Red Death: Normais somam (valor do talento × ATK × Vínculo da Vida), escolhido em passos de 5%', () => {
  expect(buff.flat[0]).toMatchObject({ sourceStat: 'ATK', hitTypes: ['normal'] });
  expect(buff.level!.talent).toBe('normal');
  expect(buff.level!.table[0]).toBeCloseTo(1.204, 6); // nível 1: 120,4% do ATK por 100% de Vínculo
  expect(buff.stacks).toMatchObject({ max: 40, step: 5, default: 20 });
  // Vínculo de 100% (20 passos) = metade do valor de 200%; 30% (6 passos) = 15% do valor de 200%.
  expect(scaleBuffStacks(buff, 20).flat[0].perPoint).toBeCloseTo(1, 10);
  expect(scaleBuffStacks(buff, 6).flat[0].perPoint).toBeCloseTo(0.3, 10);
});

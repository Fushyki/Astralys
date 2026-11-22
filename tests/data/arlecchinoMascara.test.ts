import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { pointExtra, pointMoveOf } from '../../src/engine/project';
import type { CharacterEffect } from '../../src/effects/schema';

const effects: CharacterEffect[] = JSON.parse(readFileSync(path.resolve(__dirname, '../../src/effects/characters.json'), 'utf8'));
const arl = effects.find((e) => e.character === 'Arlecchino')!;
const talents = { normal: 10, skill: 10, burst: 10 };

it('Masque of the Red Death: cada Normal soma (valor do talento × Vínculo da Vida) do ATK; o 4º golpe tem 2 acertos', () => {
  const m = (label: string) => ({ talent: 'normal', label });
  const hit1 = pointExtra(m('1-Hit DMG'), arl, talents, 100)!.atk!;
  expect(hit1).toBeGreaterThan(1.2); // 120,4% no nível 1, mais no 10: para 100% de Vínculo
  expect(pointExtra(m('4-Hit DMG'), arl, talents, 100)!.atk!).toBeCloseTo(hit1 * 2, 10);
  expect(pointExtra(m('1-Hit DMG'), arl, talents, 50)!.atk!).toBeCloseTo(hit1 / 2, 10);
  expect(pointMoveOf(m('6-Hit DMG'), arl)?.max).toBe(200);
  expect(pointMoveOf({ talent: 'normal', label: 'Charged Attack DMG' }, arl)).toBeUndefined(); // só os Normais
});

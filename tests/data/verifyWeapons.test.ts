import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { verifyWeapon } from '../../scripts/verify-kit-numbers';
import type { WeaponEffect } from '../../src/effects/schema';

const effects: WeaponEffect[] = JSON.parse(readFileSync(path.resolve(__dirname, '../../src/effects/weapons.json'), 'utf8'));
/** Conferidos à mão: o valor é soma ou produto de parâmetros (EM de duas fontes, conversão por unidade, % x stacks), que o verificador não reconhece. */
const CHECKED_BY_HAND = ['Dawning Frost', 'Sunny Morning Sleep-In', 'Vivid Notions', "Nocturne's Curtain Call", 'Hymn of the Maelstrom', 'A Thousand Blazing Suns', 'Athame Artis', 'Disaster and Remorse', 'Makhaira Aquamarine', "Moonweaver's Dawn", 'Peak Patrol Song', 'Ring of Yaxche', 'Wandering Evenstar', "Xiphos' Moonlight"];

it('toda arma tem os números autorizados pelo Lunaris (salvo as conferidas à mão)', () => {
  const bad = [...new Set(effects.flatMap(verifyWeapon).map((f) => f.weapon))].filter((w) => !CHECKED_BY_HAND.includes(w));
  expect(bad).toEqual([]);
});

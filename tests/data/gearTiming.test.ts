/** Nada que cita tempo num texto de arma ou de set fica sem decisão: ou vira janela, ou diz por que não (#72). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { NO_WINDOW, SET_TIMING, WEAPON_TIMING } from '../../scripts/curation/timing';
import type { SetEffect, WeaponEffect } from '../../src/effects/schema';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const TIME = /\d+(\.\d+)?\s?(s\b|sec\b|seconds?\b)/;
type Bonus = { description: string };

it('toda arma e todo 4 peças que cita tempo está em WEAPON_TIMING/SET_TIMING ou em NO_WINDOW', () => {
  const weapons = json<{ name: string; passive: { refinements: Bonus[] } | null }[]>('src/data/generated/weapons.json');
  const sets = json<{ name: string; bonuses: { fourPiece?: Bonus } }[]>('src/data/generated/artifacts.json');
  const weaponFx = json<WeaponEffect[]>('src/effects/weapons.json');
  const setFx = json<SetEffect[]>('src/effects/sets.json');
  const missing = [
    ...weapons.filter((w) => w.passive && TIME.test(w.passive.refinements[0].description)).map((w) => ({ name: w.name, listed: w.name in WEAPON_TIMING, fx: weaponFx.find((x) => x.weapon === w.name) })),
    ...sets.filter((s) => s.bonuses.fourPiece && TIME.test(s.bonuses.fourPiece.description)).map((s) => ({ name: s.name, listed: s.name in SET_TIMING, fx: setFx.find((x) => x.set === s.name) })),
  ].filter((x) => x.fx && !x.listed && !(x.name in NO_WINDOW) && !x.fx.noDamage).map((x) => x.name);
  expect(missing).toEqual([]);
  expect(Object.keys(NO_WINDOW).filter((n) => n in WEAPON_TIMING || n in SET_TIMING)).toEqual([]);
});

it('cada linha de tempo chegou aos efeitos gerados', () => {
  const weaponFx = json<WeaponEffect[]>('src/effects/weapons.json');
  const setFx = json<SetEffect[]>('src/effects/sets.json');
  for (const [name, list] of Object.entries(WEAPON_TIMING)) expect(weaponFx.find((x) => x.weapon === name)?.timing?.length, name).toBe(list.length);
  for (const [name, list] of Object.entries(SET_TIMING)) expect(setFx.find((x) => x.set === name)?.timing?.length, name).toBe(list.length);
});

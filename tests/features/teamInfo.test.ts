import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { EffectsData } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';
import { effectCoverage, missingEffects, resonanceOf } from '../../src/features/rotation/teamInfo';
import { defaultMember } from '../../src/features/rotation/teamOps';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const effects: EffectsData = {
  characters: json('src/effects/characters.json'),
  weapons: json('src/effects/weapons.json'),
  sets: json('src/effects/sets.json'),
  flatDamage: json('src/effects/flatDamage.json'),
};
const data = { characters: json<never[]>('src/data/generated/characters.json'), weapons: json<never[]>('src/data/generated/weapons.json') };

describe('ressonância', () => {
  it('2 Pyro dão ressonância Pyro, já calculada (+25% ATK)', () => {
    const r = resonanceOf(['Pyro', 'Cryo', 'Electro', 'Pyro']);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ element: 'Pyro', applied: true });
    expect(r[0].text).toMatch(/25%/);
  });

  it('Hydro, Cryo, Dendro e Geo também são calculadas; Electro e Anemo não mudam stats', () => {
    const r = resonanceOf(['Hydro', 'Hydro', 'Cryo', 'Cryo', 'Dendro', 'Dendro', 'Geo', 'Geo', 'Electro', 'Electro', 'Anemo', 'Anemo']);
    const by = Object.fromEntries(r.map((x) => [x.element, x]));
    for (const el of ['Hydro', 'Cryo', 'Dendro', 'Geo']) expect(by[el].applied, el).toBe(true);
    for (const el of ['Electro', 'Anemo']) expect(by[el].applied, el).toBe(false);
    expect(by.Hydro.text).toMatch(/25%.*HP/);
    expect(by.Cryo.text).toMatch(/15%.*Taxa Crítica/);
    expect(by.Dendro.text).toMatch(/50.*Maestria/);
    expect(by.Geo.text).toMatch(/20%.*RES Geo/);
  });

  it('4 elementos diferentes ou 1 de cada: nenhuma ressonância', () => {
    expect(resonanceOf(['Pyro', 'Hydro', 'Cryo', 'Geo'])).toEqual([]);
    expect(resonanceOf([])).toEqual([]);
  });

  it('dois pares dão duas ressonâncias', () => {
    expect(resonanceOf(['Pyro', 'Pyro', 'Hydro', 'Hydro']).map((x) => x.element).sort()).toEqual(['Hydro', 'Pyro']);
  });
});

describe('cobertura de efeitos', () => {
  const p = sampleProject();

  it('o exemplo tem tudo coberto', () => {
    for (const m of p.members) expect(missingEffects(m, effects)).toEqual([]);
  });

  it('arma e set sem efeito cadastrado são apontados', () => {
    const m = { ...p.members[0], weapon: 'Dull Blade', primarySet: 'Tiny Miracle' };
    const c = effectCoverage(m, effects);
    expect(c.weaponHasEffect).toBe(false);
    expect(c.primarySetHasEffect).toBe(false);
    expect(missingEffects(m, effects)).toEqual(['arma Dull Blade', 'set Tiny Miracle']);
  });

  it('set com 2 peças cadastradas mas sem 4 peças avisa só o bônus de 4 peças', () => {
    const m = { ...p.members[0], primarySet: 'Gilded Dreams', secondarySet: undefined };
    expect(effectCoverage(m, effects).primarySetHasEffect).toBe(true);
    expect(effectCoverage(m, effects).fourPieceMissing).toBe(true);
    expect(missingEffects(m, effects)).toContain('4 peças de Gilded Dreams');
    expect(missingEffects({ ...m, fourPiece: false }, effects)).not.toContain('4 peças de Gilded Dreams');
  });

  it('sem set escolhido não é falta', () => {
    const m = { ...p.members[0], primarySet: undefined, secondarySet: undefined };
    expect(effectCoverage(m, effects).primarySetHasEffect).toBeNull();
    expect(missingEffects(m, effects)).toEqual([]);
  });

  it('um personagem novo por defeito geralmente não tem efeitos cadastrados', () => {
    const ref = defaultMember('Fischl', data);
    expect(effectCoverage(ref, effects).characterHasEffect).toBe(false);
  });
});

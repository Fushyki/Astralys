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

  it('outros elementos aparecem como "ainda não calculado", sem inventar valor', () => {
    const r = resonanceOf(['Hydro', 'Hydro', 'Cryo', 'Geo']);
    expect(r[0]).toMatchObject({ element: 'Hydro', applied: false });
    expect(r[0].text).toMatch(/ainda não/);
    expect(r[0].text).not.toMatch(/\d+%/);
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
    const m = { ...p.members[0], weapon: 'Redhorn Stonethresher', primarySet: 'Gilded Dreams' };
    const c = effectCoverage(m, effects);
    expect(c.weaponHasEffect).toBe(false);
    expect(c.primarySetHasEffect).toBe(false);
    expect(missingEffects(m, effects)).toEqual(['arma Redhorn Stonethresher', 'set Gilded Dreams']);
  });

  it('sem set escolhido não é falta', () => {
    const m = { ...p.members[0], primarySet: undefined, secondarySet: undefined };
    expect(effectCoverage(m, effects).primarySetHasEffect).toBeNull();
    expect(missingEffects(m, effects)).toEqual([]);
  });

  it('um personagem novo por defeito geralmente não tem efeitos cadastrados', () => {
    const ref = defaultMember('Kamisato Ayaka', data);
    expect(effectCoverage(ref, effects).characterHasEffect).toBe(false);
  });
});

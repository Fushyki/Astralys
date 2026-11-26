/** A cópia dos dados que o site importa (`scripts/app-data.ts`) só pode perder o que o site não lê. */
import { describe, expect, it } from 'vitest';
import { appData } from '../../scripts/app-data';
import artifacts from '../../src/data/generated/artifacts.json';
import characters from '../../src/data/generated/characters.json';
import weapons from '../../src/data/generated/weapons.json';
import type { ArtifactSet, Character, Weapon } from '../../src/data/schema';

const app = appData();
type Text = { description?: string; descriptionPt?: string; params?: number[] };
const full = (list: unknown) => list as Record<string, any>[];

describe('dados do site', () => {
  it('armas: só saem os params e o inglês que tem português', () => {
    const slim = app['weapons.json'] as Weapon[];
    const back = slim.map((w, i) => ({
      ...w,
      passive: w.passive && { ...w.passive, refinements: w.passive.refinements.map((r: Text, k: number) => ({ ...full(weapons)[i].passive.refinements[k], ...r })) },
    }));
    expect(back).toEqual(weapons);
    for (const r of slim.flatMap((w) => (w.passive?.refinements ?? []) as Text[])) {
      expect(r.params).toBeUndefined();
      expect(r.descriptionPt ?? r.description).toBeTruthy();
    }
  });

  it('sets: só saem o bônus de 1 peça, os params e o inglês que tem português', () => {
    const slim = app['artifacts.json'] as ArtifactSet[];
    expect(slim.map((s) => s.name)).toEqual(full(artifacts).map((s) => s.name));
    slim.forEach((s, i) => {
      const { onePiece: _, ...kept } = full(artifacts)[i].bonuses;
      expect(Object.keys(s.bonuses)).toEqual(Object.keys(kept));
      for (const [k, b] of Object.entries(s.bonuses) as [string, Text][]) expect(b.descriptionPt ?? b.description).toBe(kept[k].descriptionPt ?? kept[k].description);
    });
  });

  it('personagens: só saem as partículas', () => {
    const slim = app['characters.json'] as Character[];
    expect(slim.map((c, i) => ({ ...c, particles: full(characters)[i].particles }))).toEqual(characters);
  });
});

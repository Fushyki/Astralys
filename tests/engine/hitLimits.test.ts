import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveProject, type EffectsData, type GameData, type RotationProject } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = {
  characters: json('src/data/generated/characters.json'),
  moves: json('src/data/generated/moves.json'),
  weapons: json('src/data/generated/weapons.json'),
  artifacts: json('src/data/generated/artifacts.json'),
};
const effects: EffectsData = {
  characters: json('src/effects/characters.json'),
  weapons: json('src/effects/weapons.json'),
  sets: json('src/effects/sets.json'),
  flatDamage: json('src/effects/flatDamage.json'),
};

/** Buff manual "+20% de DMG de Habilidade" na rotação inteira, limitado aos N primeiros golpes de habilidade. */
const project = (maxHits?: number): RotationProject => {
  const p = { ...sampleProject(), compat: undefined } as RotationProject;
  return {
    ...p,
    actions: p.actions.map((a) => ({ ...a, tagSource: 'windows' as const, activeTags: [] })),
    extras: [{ target: 'all', stat: 'DMG% Habilidade', value: 0.2, team: true, label: 'Rift', description: 'Buff manual' }],
    buffWindows: [{ id: 'w1', tag: 'label:Rift', start: 0, end: 30, whole: true, ...(maxHits ? { maxHits } : {}) }],
  };
};

describe('buff limitado aos N primeiros golpes (BuffWindow.maxHits)', () => {
  const skillIds = (p: RotationProject) => resolveProject(p, game, effects).actions.filter((a) => a.move.hitType === 'skill');
  const withTag = (p: RotationProject) => skillIds(p).filter((a) => a.activeTags.includes('label:Rift'));

  it('sem limite, todos os golpes de habilidade recebem o buff', () => {
    const all = skillIds(project());
    expect(all.length).toBeGreaterThan(3);
    expect(withTag(project())).toHaveLength(all.length);
  });
  it('com limite 3, só os 3 primeiros (no tempo) recebem; os outros tipos de golpe nem contam', () => {
    const got = withTag(project(3));
    expect(got).toHaveLength(3);
    const firstThree = [...skillIds(project())].sort((a, b) => (a.time ?? 0) - (b.time ?? 0)).slice(0, 3).map((a) => a.id).sort();
    expect(got.map((a) => a.id).sort()).toEqual(firstThree);
  });
  it('limite maior que o número de golpes não corta nada', () => {
    expect(withTag(project(999))).toHaveLength(skillIds(project()).length);
  });
});

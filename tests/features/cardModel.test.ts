import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { buildCardModel, hitTypeLookup } from '../../src/features/card/cardModel';
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

const model = (mutate?: (p: ReturnType<typeof sampleProject>) => void) => {
  const p = sampleProject();
  mutate?.(p);
  const resolved = resolveProject(p, game, effects);
  const bundle = analyzeProject({ team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });
  return buildCardModel(p, bundle, game.characters, hitTypeLookup(resolved));
};

describe('modelo do card infográfico', () => {
  const m = model();

  it('traz os números da rotação de referência', () => {
    expect(m.dpr).toBeCloseTo(3790496.07, 1);
    expect(m.dps).toBeCloseTo(216599.78, 1);
    expect(m.duration).toBe(17.5);
  });

  it('um membro por personagem, com a participação somando 100%', () => {
    expect(m.members.map((x) => x.name)).toEqual(['Mavuika', 'Citlali', 'Iansan', 'Bennett']);
    expect(m.members.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1, 6);
    expect(m.members[0].share).toBeCloseTo(0.9527, 3);
  });

  it('build: arma, sets, main stats abreviados e ER final', () => {
    const mav = m.members[0];
    expect(mav.weapon).toBe('A Thousand Blazing Suns');
    expect(mav.sets).toContain('Obsidian Codex');
    expect(mav.mains).toBe('EM / DMG / CD');
    expect(mav.er).toBeCloseTo(1.11, 2);
    expect(mav.element).toBe('Pyro');
    expect(mav.icon).toMatch(/Mavuika/);
  });

  it('a sequência agrupa os golpes por personagem na ordem do tempo', () => {
    expect(m.sequence.startsWith('Citlali')).toBe(true);
    expect(m.sequence).toContain('Mavuika');
    expect(m.sequence.split(' · ').length).toBeGreaterThanOrEqual(4);
  });

  it('repetições seguidas viram ×N', () => {
    expect(m.sequence).toMatch(/×\d/);
  });

  it('usa o título e o selo do projeto quando existem', () => {
    const c = model((p) => { p.meta.card = { title: 'Meu card', badge: 'F2P', tag: 'Meta 7.1' }; });
    expect([c.title, c.badge, c.tag]).toEqual(['Meu card', 'F2P', 'Meta 7.1']);
    expect(m.title).toBe(sampleProject().name);
    expect(m.tag).toBe('');
  });
});

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { buffLanes } from '../../src/features/rotation/buffLanes';
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

describe('faixas de buff do exemplo', () => {
  const lanes = buffLanes(resolveProject(sampleProject(), game, effects).team);
  const tags = lanes.map((l) => l.tag);

  it('uma faixa por fonte de buff que a equipe tem', () => {
    expect(new Set(tags).size).toBe(tags.length);
    expect(tags).toEqual(expect.arrayContaining(['gear:1', 'gear:3', 'char:2', 'char:3', 'label:Scroll', 'label:TTDS']));
  });

  it('não cria faixa para quem não dá buff ao time (Mavuika)', () => {
    expect(tags).not.toContain('gear:0');
    expect(tags).not.toContain('char:0');
  });

  it('nomes curtos e legíveis', () => {
    const byTag = Object.fromEntries(lanes.map((l) => [l.tag, l.label]));
    expect(byTag['gear:3']).toBe('Set de Bennett');
    expect(byTag['char:3']).toBe('ATK fixo Bennett');
    expect(byTag['label:Scroll']).toBe('Scroll');
    expect(lanes.every((l) => l.label.length <= 18)).toBe(true);
  });

  it('ordem: sets, depois personagens, depois rótulos', () => {
    const kinds = tags.map((t) => t.split(':')[0]);
    const firstChar = kinds.indexOf('char');
    const firstLabel = kinds.indexOf('label');
    expect(kinds.lastIndexOf('gear')).toBeLessThan(firstChar);
    expect(kinds.lastIndexOf('char')).toBeLessThan(firstLabel);
  });

  it('o detalhe traz a descrição dos buffs', () => {
    expect(lanes.find((l) => l.tag === 'label:Scroll')!.detail).toMatch(/Scroll da Iansan/);
  });
});

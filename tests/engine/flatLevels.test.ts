import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyFlatLevels, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import type { FlatDamageEffect } from '../../src/effects/schema';
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

describe('dano fixo do kit por nível de talento', () => {
  const flat = effects.flatDamage as FlatDamageEffect[];
  const shenhe = flat.find((e) => e.name.startsWith('Shenhe'))!;

  it('Shenhe traz a tabela de 15 níveis do Lunaris (45,66% a 108,43% do ATK)', () => {
    expect(shenhe.level!.table[0]).toBeCloseTo(0.4566, 6);
    expect(shenhe.level!.table[14]).toBeCloseTo(1.0843, 6);
  });

  it('o coeficiente vira a linha do nível do talento da fonte', () => {
    const members = resolveProject(sampleProject(), game, effects).team.members;
    const fake = { ...members[0], character: { ...members[0].character, name: 'Shenhe' }, talents: { normal: 1, skill: 10, burst: 1 } };
    const [out] = applyFlatLevels([shenhe], [fake]);
    expect(out.perPoint).toBeCloseTo(0.8218, 6);
  });

  it('sem a fonte no time o efeito fica como está (e não conta)', () => {
    const members = resolveProject(sampleProject(), game, effects).team.members;
    const [out] = applyFlatLevels([shenhe], members);
    expect(out).toBe(shenhe);
  });

  it('o time do exemplo não muda (nenhuma dessas fontes está nele)', () => {
    const r = resolveProject(sampleProject(), game, effects);
    expect(r.flatEffects.filter((e) => e.level)).toHaveLength(effects.flatDamage.filter((e) => (e as FlatDamageEffect).level).length);
  });
});

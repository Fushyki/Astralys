import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ASCENSION_CAPS, ascensionAt, characterAtLevel, type LevelsData } from '../../src/data/levels';
import type { Character } from '../../src/data/schema';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const levels = json<LevelsData>('src/data/generated/levels.json');
const characters = json<Character[]>('src/data/generated/characters.json');
const game: GameData = { characters, moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json'), levels };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

describe('nível do personagem', () => {
  it('a ascensão segue os níveis-limite (Lv. 90 = A6, Lv. 40 = A2)', () => {
    expect(ASCENSION_CAPS).toEqual([20, 40, 50, 60, 70, 80]);
    expect([1, 19, 20, 40, 79, 80, 90].map(ascensionAt)).toEqual([0, 0, 1, 2, 5, 6, 6]);
  });

  it('o nível 89 fica colado ao 90 do Lunaris em todos os personagens com dados (sem salto na emenda)', () => {
    for (const c of characters) {
      if (!levels.chars[c.name]) continue;
      const l89 = characterAtLevel(c, 89, levels);
      expect(l89.baseHp / c.baseHp, c.name).toBeGreaterThan(0.97);
      expect(l89.baseHp, c.name).toBeLessThan(c.baseHp);
      expect(l89.baseAtk / c.baseAtk, c.name).toBeGreaterThan(0.97);
    }
  });

  it('nível menor tem stats menores e o stat de ascensão cai com a ascensão', () => {
    const col = characters.find((c) => c.name === 'Columbina')!;
    expect(characterAtLevel(col, 90, levels)).toBe(col);
    const l80 = characterAtLevel(col, 80, levels);
    expect(l80.baseHp).toBeCloseTo(13662.08, 0);
    expect(l80.baseHp).toBeLessThan(col.baseHp);
    expect(l80.ascension!.value).toBeCloseTo(0.192, 9); // A6 também no 80
    expect(characterAtLevel(col, 40, levels).ascension!.value).toBeCloseTo(0.048, 9); // A2
    expect(characterAtLevel(col, 1, levels).baseAtk).toBeLessThan(l80.baseAtk);
  });

  it('sem curva (ou sem dados do personagem) devolve o mesmo personagem', () => {
    const col = characters.find((c) => c.name === 'Columbina')!;
    expect(characterAtLevel(col, 50)).toBe(col);
    expect(characterAtLevel({ ...col, name: 'Inventada' }, 50, levels).baseHp).toBe(col.baseHp);
  });

  it('no projeto, o nível de um membro muda o HP dele e só o dele', () => {
    const p = { ...sampleProject(), compat: 'none' as const };
    const stats = (level?: number) => {
      const members = p.members.map((m, i) => (i === 0 ? { ...m, level } : m));
      const r = resolveProject({ ...p, members }, game, effects);
      return analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient }).memberStats;
    };
    const full = stats(undefined);
    const low = stats(50);
    expect(low[0].hp).toBeLessThan(full[0].hp);
    expect(low[1].hp).toBe(full[1].hp);
  });
});

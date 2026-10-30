import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { NO_WEAPON, resolveMember, type EffectsData, type GameData } from '../../src/engine';
import { defaultMember, nakedMember } from '../../src/features/rotation/teamOps';
import { staticSources } from '../../src/engine/stats';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

describe('personagem novo pelado', () => {
  it('nasce sem arma e sem artefatos: ATK base da arma 0 e nenhum main stat', () => {
    const ref = nakedMember('Mavuika', game);
    expect(ref.weapon).toBe(NO_WEAPON);
    const m = resolveMember(ref, game, effects);
    expect(m.weapon.baseAtk).toBe(0);
    expect(staticSources(m).some((s) => s.kind === 'main-stat' || s.kind === 'weapon' || s.kind === 'weapon-substat')).toBe(false);
  });
  it('o build padrão antigo continua equipado', () => {
    const m = resolveMember(defaultMember('Mavuika', game), game, effects);
    expect(m.weapon.baseAtk).toBeGreaterThan(0);
    expect(staticSources(m).some((s) => s.kind === 'main-stat')).toBe(true);
  });
});

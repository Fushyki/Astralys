import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, assembleTeam, damageTable, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

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

/** "Death's Crossing" (Skirk A4): o Normal causa 170% do dano ORIGINAL com 3 stacks. Multiplica o dano base; não soma ao DMG%. */
describe('Skirk A4: % do dano original', () => {
  const skirk = effects.characters.find((c) => c.character === 'Skirk')!;
  it('a curadoria guarda como multiplicador do dano base (×1,7 Normal da habilidade e ×1,6 Supremo), sem DMG% somado', () => {
    const n = skirk.buffs.find((b) => b.id === 'a4n')!;
    const s = skirk.buffs.find((b) => b.id === 'a4b')!;
    expect(n.moveMult?.extra).toBe(0.7);
    expect(n.moveMult?.talents).toEqual(['skill', 'proc']);
    expect(n.stats).toBeUndefined();
    expect(s.stats?.baseMultByType).toEqual({ burst: 0.6 });
    expect(s.stats?.dmgPctByType).toEqual({});
  });
  it('no motor, o 1° Normal do Seven-Phase Flash com A4 vale 1,7 × a parte escala × ATK e o DMG% não muda', () => {
    const p = { ...sampleProject(), compat: undefined };
    p.members[0] = { ...p.members[0], character: 'Skirk' };
    // 3 acúmulos pedem 3 colegas Hydro ou Cryo.
    p.members = [p.members[0], ...['Furina', 'Escoffier', 'Shenhe'].map((n) => defaultMember(n, game))];
    const row = (disabled: string[]) => {
      const r = resolveProject({ ...p, disabled }, game, effects);
      const rolls = analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient }).optimization.rolls;
      const t = damageTable({ team: r.team, assembly: assembleTeam(r.team, { rolls }), rolls: r.team.members.map(() => rolls[0]), member: 0, moves: game.moves, reaction: 'none' });
      return t.find((x) => x.move.talent === 'skill' && x.move.label === '1-Hit DMG')!.result;
    };
    const without = row(['cbuff-0-a4n']);
    const withA4 = row([]);
    expect(withA4.breakdown.base / without.breakdown.base).toBeCloseTo(1.7, 2);
    expect(withA4.breakdown.dmgMultiplier).toBeCloseTo(without.breakdown.dmgMultiplier, 9);
  });
});

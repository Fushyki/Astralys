import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { activeTeamDelta } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const base: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

/** Mavuika recebe um buff de teste: -20% de RES Pyro e -10% de DEF do inimigo. */
const withShred = (timed: boolean): EffectsData => ({
  ...base,
  characters: base.characters.map((c) =>
    c.character === 'Mavuika'
      ? { ...c, buffs: [...c.buffs, { id: 'teste-shred', label: 'Teste shred', minConstellation: 0, scope: 'self', timed, duration: 12, resShred: { value: 0.2, elements: ['Pyro'] }, defShred: 0.1 } as never] }
      : c,
  ),
});
const team = (e: EffectsData) => assembleTeam(resolveProject({ ...sampleProject(), compat: 'none' }, game, e).team, {});

describe('redução de RES/DEF com duração', () => {
  it('sem duração (timed:false) continua fixa para o time inteiro', () => {
    const none = team(base);
    const fixed = team(withShred(false));
    expect(fixed.enemyRes.Pyro).toBeCloseTo(none.enemyRes.Pyro - 0.2, 9);
    expect(fixed.enemyDefRed).toBeCloseTo(none.enemyDefRed + 0.1, 9);
    expect(fixed.buffs.some((b) => b.id.includes('shred'))).toBe(false);
  });

  it('com duração vira janela: o mapa fixo não muda e o golpe dentro da janela recebe a redução', () => {
    const none = team(base);
    const a = team(withShred(true));
    expect(a.enemyRes.Pyro).toBeCloseTo(none.enemyRes.Pyro, 9);
    expect(a.enemyDefRed).toBeCloseTo(none.enemyDefRed, 9);
    const b = a.buffs.find((x) => x.id.includes('shred'))!;
    expect(b.duration).toBe(12);
    expect(b.targets).not.toBe('none');
    const inside = activeTeamDelta(a.buffs, 'Citlali', new Set([b.tag]));
    expect(inside.resShred.Pyro).toBeCloseTo(0.2, 9);
    expect(inside.defShred).toBeCloseTo(0.1, 9);
    const outside = activeTeamDelta(a.buffs, 'Citlali', new Set());
    expect(outside.resShred.Pyro).toBeUndefined();
    expect(outside.defShred).toBe(0);
  });
});

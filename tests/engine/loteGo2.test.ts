/** Lote 2 da comparação com o Genshin Optimizer (Issue #49): bônus que valiam em golpes demais. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, labelTag, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { activeCharacterBuffs, minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

const resolve = (names: string[], actions: unknown[] = []) => resolveProject({ ...sampleProject(), compat: 'none', extras: [], buffWindows: [], disabled: [], members: names.map((n) => defaultMember(n, game)), actions } as never, game, effects);
const has = (names: string[], id: string) => activeCharacterBuffs(resolve(names).team.members[0]).some((b) => b.id === id);

/** Bônus de DMG que o golpe recebe com a etiqueta do buff ligada, menos sem ela. */
function gain(character: string, label: string, buffLabel: string) {
  const run = (tags: string[]) => {
    const r = resolve([character], [{ id: 'a', member: 0, move: { character, talent: 'skill', label, variant: 0 }, executions: 1, reaction: 'none', activeTags: tags, tagSource: 'manual', dmgAdjust: 0, time: 0 }]);
    return evaluateRotation({ members: r.team.members, assembly: assembleTeam(r.team), config: r.team.config, rolls: [minimumRolls(2)], flatEffects: r.flatEffects }, r.actions).actions[0].noCrit;
  };
  return run([labelTag(buffLabel)]) / run([]);
}

describe('lote 2', () => {
  it('Freminet A4 só vale no Shattering Pressure', () => {
    expect(gain('Freminet', 'Level 0 Shattering Pressure DMG', 'Freminet A4')).toBeGreaterThan(1.1);
    expect(gain('Freminet', 'Upward Thrust DMG', 'Freminet A4')).toBeCloseTo(1, 9);
  });
  it('Chasca A1 só vale no projétil brilhante', () => {
    const a1 = effects.characters.find((c) => c.character === 'Chasca')!.buffs.find((b) => b.id === 'a1')!;
    expect(gain('Chasca', 'Shining Shadowhunt Shell DMG', a1.label)).toBeGreaterThan(1.1);
    expect(gain('Chasca', 'Shadowhunt Shell DMG', a1.label)).toBeCloseTo(1, 9);
  });
  it('Xilonen A1 só sem dois ou mais Pyro, Hydro, Electro ou Cryo', () => {
    expect(has(['Xilonen', 'Bennett'], 'a1')).toBe(true);
    expect(has(['Xilonen', 'Bennett', 'Furina'], 'a1')).toBe(false);
  });
  it('Linnea reduz mais RES com 2 membros Moonsign', () => {
    expect(has(['Linnea'], 'a1g')).toBe(false);
    expect(has(['Linnea', 'Illuga'], 'a1g')).toBe(true);
  });
  it('o Starwicker da Xianyun não soma no dano durante a queda', () => {
    const labels = resolve(['Xianyun']).flatEffects.filter((e) => e.source === 'Xianyun').flatMap((e) => e.labels ?? []);
    expect(labels).toContain('Low/High Plunge DMG');
    expect(labels).toContain('Driftcloud Wave DMG');
    expect(labels).not.toContain('Plunge DMG');
  });
});

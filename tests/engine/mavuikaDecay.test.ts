import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

function bonusAt(constellation: number, times: number[]) {
  const base = sampleProject();
  const members = base.members.map((m, i) => (i === 0 ? { ...m, constellation } : m));
  const p: any = {
    ...base, compat: 'none', elementMode: 'personagem', members, extras: [], disabled: [], enabled: [],
    buffWindows: [{ id: 'w1', tag: 'label:Mavuika A4', start: 5, end: 25 }],
    actions: times.map((t, i) => ({ id: `a${i}`, member: 0, move: { character: 'Mavuika', talent: 'burst', label: 'Skill DMG', variant: 0 }, executions: 1, reaction: 'none', activeTags: [], tagSource: 'windows', dmgAdjust: 0, time: t })),
  };
  const r = resolveProject(p, game, effects);
  const asm = assembleTeam({ ...r.team, disabled: [] });
  const res = evaluateRotation({ members: r.team.members, assembly: asm, config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions);
  return res.actions.map((a) => a.stats.dmgBonus);
}

describe('A4 da Mavuika (Kiongozi) cai com o tempo', () => {
  it('+40% no início da janela e cai em linha reta até 0 em 20 s', () => {
    const [start, mid, end, after] = bonusAt(0, [5, 15, 24.9, 30]);
    expect(start - after).toBeCloseTo(0.4, 6);
    expect(mid - after).toBeCloseTo(0.2, 6);
    expect(end - after).toBeCloseTo(0.4 * (1 - 19.9 / 20), 6);
  });

  it('na C4 não cai mais (e a C4 soma +10%, ligada na mesma janela)', () => {
    const [start, mid] = bonusAt(4, [5, 15]);
    expect(mid).toBeCloseTo(start, 9);
  });
});

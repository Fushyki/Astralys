/** Canção de Luscinia do Illuga: Dano Geo e Lunar-Cristalizar gastam os mesmos acúmulos, 21 mais os extras (#60). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type ActionRef, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

const ILLUGA_Q = game.moves.find((m) => m.character === 'Illuga' && m.talent === 'burst')!.label;
const GEO = 'Lunar Phase Shift 1-Hit DMG';
const LUNAR = 'Spirit Steed\'s Stride 2-Hit DMG';

function run(hits: [string, number][], extra?: number, patch: Partial<ActionRef> = {}) {
  // O Supremo do Illuga em 0 s abre os acúmulos; os golpes vêm depois.
  const burst: ActionRef = { id: 'q', member: 0, move: { character: 'Illuga', talent: 'burst', label: ILLUGA_Q, variant: 0 }, executions: 1, reaction: 'none', activeTags: [], tagSource: 'manual', dmgAdjust: 0, time: 0 };
  const actions = [burst, ...hits.map(([label, executions], i): ActionRef => ({ id: `a${i}`, member: 1, move: { character: 'Zibai', talent: 'skill', label, variant: 0 }, executions, reaction: 'none', activeTags: [], tagSource: 'manual', dmgAdjust: 0, time: i + 1, ...patch }))];
  const p = { ...sampleProject(), compat: 'none' as const, extras: [], buffWindows: [], disabled: [], actions, members: [{ ...defaultMember('Illuga', game), condManual: false, ...(extra === undefined ? {} : { stacks: { 'pool:quills': extra } }) }, defaultMember('Zibai', game)] };
  const r = resolveProject(p, game, effects);
  const assembly = assembleTeam(r.team);
  return evaluateRotation({ members: r.team.members, assembly, config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions.slice(1);
}
/** Acertos que receberam o bônus: os efeitos do mesmo golpe gastam juntos. */
const covered = (a: ReturnType<typeof run>[number]) => Math.max(0, ...(a.flatUse ?? []).filter((u) => u.source === 'Illuga').map((u) => u.hits));

describe('Canção de Luscinia', () => {
  it('Geo e Lunar-Cristalizar dividem os 21 acúmulos, na ordem do tempo', () => {
    const [geo, lunar, after] = run([[GEO, 15], [LUNAR, 10], [GEO, 5]]);
    expect([covered(geo), covered(lunar), covered(after)]).toEqual([15, 6, 0]);
  });
  it('os extras vão de 5 em 5 até 36', () => {
    for (const [extra, total] of [[0, 21], [1, 26], [2, 31], [3, 36], [9, 36]] as const) {
      const [geo, lunar] = run([[GEO, 15], [LUNAR, 40]], extra);
      expect(covered(geo) + covered(lunar)).toBe(total);
    }
  });
  it('o golpe Lunar recebe o próprio bônus, maior que o Geo, e perde dano sem acúmulo', () => {
    const [lunar] = run([[LUNAR, 1]]);
    const [none] = run([[GEO, 21], [LUNAR, 1]]).slice(1);
    expect(lunar.avg).toBeGreaterThan(none.avg);
    const per = (a: typeof lunar) => (a.flatUse ?? []).reduce((s, u) => s + u.perHit * Math.min(1, u.hits), 0);
    expect(per(lunar)).toBeGreaterThan(per(run([[GEO, 1]])[0]));
  });
  it('antes do Supremo e depois de 20 s não há acúmulos; um novo Supremo renova', () => {
    const at = (times: [string, number][]) => {
      const actions = times.map(([label, time], i): ActionRef => ({ id: `b${i}`, member: label === ILLUGA_Q ? 0 : 1, move: { character: label === ILLUGA_Q ? 'Illuga' : 'Zibai', talent: label === ILLUGA_Q ? 'burst' : 'skill', label, variant: 0 }, executions: label === ILLUGA_Q ? 1 : 25, reaction: 'none', activeTags: [], tagSource: 'manual', dmgAdjust: 0, time }));
      const p = { ...sampleProject(), compat: 'none' as const, extras: [], buffWindows: [], disabled: [], actions, members: [{ ...defaultMember('Illuga', game), condManual: false }, defaultMember('Zibai', game)] };
      const r = resolveProject(p, game, effects);
      return evaluateRotation({ members: r.team.members, assembly: assembleTeam(r.team), config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions.filter((a) => a.action.member === 1).map(covered);
    };
    expect(at([[GEO, 1], [ILLUGA_Q, 2], [GEO, 3], [ILLUGA_Q, 10], [GEO, 11], [GEO, 31]])).toEqual([0, 21, 21, 0]);
  });
  it('a reação do time não gasta acúmulo', () => {
    const reaction = { move: { character: 'Zibai', talent: 'reaction' as const, label: 'lunarcrystallize', variant: 0 }, executions: 3 };
    const [r] = run([[LUNAR, 1]], 0, reaction);
    expect(r.flatUse ?? []).toEqual([]);
  });
});

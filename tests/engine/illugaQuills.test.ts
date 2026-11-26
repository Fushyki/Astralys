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

const GEO = 'Lunar Phase Shift 1-Hit DMG';
const LUNAR = 'Spirit Steed\'s Stride 2-Hit DMG';

function run(hits: [string, number][], extra?: number, patch: Partial<ActionRef> = {}) {
  const actions = hits.map(([label, executions], i): ActionRef => ({ id: `a${i}`, member: 1, move: { character: 'Zibai', talent: 'skill', label, variant: 0 }, executions, reaction: 'none', activeTags: [], tagSource: 'manual', dmgAdjust: 0, time: i, ...patch }));
  const p = { ...sampleProject(), compat: 'none' as const, extras: [], buffWindows: [], disabled: [], actions, members: [{ ...defaultMember('Illuga', game), condManual: false, ...(extra === undefined ? {} : { stacks: { 'pool:quills': extra } }) }, defaultMember('Zibai', game)] };
  const r = resolveProject(p, game, effects);
  const assembly = assembleTeam(r.team);
  return evaluateRotation({ members: r.team.members, assembly, config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions;
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
  it('a reação do time não gasta acúmulo', () => {
    const reaction = { move: { character: 'Zibai', talent: 'reaction' as const, label: 'lunarcrystallize', variant: 0 }, executions: 3 };
    const [r] = run([[LUNAR, 1]], 0, reaction);
    expect(r.flatUse ?? []).toEqual([]);
  });
});

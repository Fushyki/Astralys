import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

type Act = { member: number; talent: 'normal' | 'skill' | 'burst' | 'proc'; label: string; tags?: string[] };
type Mem = { character: string; constellation?: number };
function run(members: Mem[], actions: Act[]) {
  const p = {
    ...sampleProject(), compat: 'none', elementMode: 'personagem',
    members: members.map((m) => ({ ...defaultMember(m.character, game), ...m })),
    actions: actions.map((a, i) => ({
      id: `a${i}`, member: a.member, move: { character: members[a.member].character, talent: a.talent, label: a.label, variant: 0 },
      executions: 1, reaction: 'none', activeTags: a.tags ?? [], tagSource: 'manual', dmgAdjust: 0, time: i,
    })),
    buffWindows: [], disabled: [],
  };
  const r = resolveProject(p as never, game, effects);
  const asm = assembleTeam(r.team);
  return evaluateRotation({ members: r.team.members, assembly: asm, config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions;
}

describe('rótulos usados existem em moves.json', () => {
  it.each([['Navia', 'Rosula Shardshot Base DMG'], ['Kachina', 'Turbo Twirly Mounted DMG'], ['Kachina', 'Turbo Twirly Independent DMG'], ['Xilonen', '1-Hit DMG'], ['Xilonen', 'Rush DMG']])('%s %s', (c, l) => {
    expect(game.moves.some((m) => m.character === c && m.label === l)).toBe(true);
  });
});

describe('Navia C4: RES Geo -20% só dentro da janela', () => {
  const shot: Act = { member: 0, talent: 'skill', label: 'Rosula Shardshot Base DMG' };
  it('desligado não reduz; ligado reduz 20%', () => {
    const [off] = run([{ character: 'Navia', constellation: 4 }], [shot]);
    const [on] = run([{ character: 'Navia', constellation: 4 }], [{ ...shot, tags: ['label:Navia C4'] }]);
    expect(off.stats.resShred.Geo ?? 0).toBe(0);
    expect(on.stats.resShred.Geo).toBeCloseTo(0.2, 9);
  });
});

describe('Kachina C4: DEF do ativo dentro da janela', () => {
  it('quem está em campo ganha DEF com a janela ligada', () => {
    const team: Mem[] = [{ character: 'Navia' }, { character: 'Kachina', constellation: 4 }];
    const hit: Act = { member: 0, talent: 'normal', label: '1-Hit DMG' };
    const [off] = run(team, [hit]);
    const [on] = run(team, [{ ...hit, tags: ['label:Kachina C4'] }]);
    expect(on.stats.def).toBeGreaterThan(off.stats.def);
  });
});

describe('Kachina A4: 20% da DEF só no Turbo Twirly', () => {
  it('soma nos dois golpes do Turbo Twirly e não no Supremo', () => {
    const mounted = run([{ character: 'Kachina' }], [{ member: 0, talent: 'skill', label: 'Turbo Twirly Mounted DMG' }])[0];
    const indep = run([{ character: 'Kachina' }], [{ member: 0, talent: 'skill', label: 'Turbo Twirly Independent DMG' }])[0];
    const burst = run([{ character: 'Kachina' }], [{ member: 0, talent: 'burst', label: 'Skill DMG' }])[0];
    expect(mounted.flatDamage).toBeCloseTo(0.2 * mounted.stats.def, 6);
    expect(indep.flatDamage).toBeCloseTo(0.2 * indep.stats.def, 6);
    expect(burst.flatDamage).toBe(0);
  });
});

describe('Xilonen C6: 300% da DEF em Normal e Imersivo', () => {
  it('soma 3 x DEF no Normal e nada na habilidade', () => {
    const hit = run([{ character: 'Xilonen', constellation: 6 }], [{ member: 0, talent: 'normal', label: '1-Hit DMG' }])[0];
    const skill = run([{ character: 'Xilonen', constellation: 6 }], [{ member: 0, talent: 'skill', label: 'Rush DMG' }])[0];
    // O dano fixo lê a DEF com todos os buffs ligados (>= a da ação): 3 x DEF no mínimo.
    expect(hit.flatDamage).toBeGreaterThanOrEqual(3 * hit.stats.def - 1e-6);
    expect(skill.flatDamage).toBe(0);
  });
});

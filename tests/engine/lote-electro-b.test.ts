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

/** Todo rótulo usado nos testes precisa existir no cadastro do personagem. */
const hasMove = (character: string, label: string) => game.moves.some((m) => m.character === character && m.label === label);

describe('rótulos usados existem em moves.json', () => {
  it.each([
    ['Kujou Sara', 'Tengu Juurai: Ambush DMG'], ['Yae Miko', 'Skill DMG'], ['Yae Miko', 'Sesshou Sakura DMG: Level 4'],
    ['Kuki Shinobu', 'Skill DMG'], ['Kuki Shinobu', 'Grass Ring of Sanctification DMG'], ['Kuki Shinobu', '1-Hit DMG'],
    ['Cyno', 'Mortuary Rite DMG'], ['Cyno', '1-Hit DMG'], ['Sethos', 'Shadowpiercing Shot DMG'], ['Sethos', '1-Hit DMG'],
  ])('%s: %s', (c, l) => expect(hasMove(c, l)).toBe(true));
  it('Shadowpiercing Shot é golpe Normal no cadastro', () => {
    expect(game.moves.find((m) => m.character === 'Sethos' && m.label === 'Shadowpiercing Shot DMG')!.hitType).toBe('normal');
  });
});

describe('Kujou Sara', () => {
  const ambush: Act = { member: 0, talent: 'skill', label: 'Tengu Juurai: Ambush DMG' };
  it('C6: +60% de Dano Crítico na janela (C5 não tem)', () => {
    const [off] = run([{ character: 'Kujou Sara', constellation: 6 }], [ambush]);
    const [on] = run([{ character: 'Kujou Sara', constellation: 6 }], [{ ...ambush, tags: ['label:Sara C6'] }]);
    expect(on.critDmg - off.critDmg).toBeCloseTo(0.6, 9);
    const [c5] = run([{ character: 'Kujou Sara', constellation: 5 }], [{ ...ambush, tags: ['label:Sara C6'] }]);
    expect(c5.critDmg).toBeCloseTo(off.critDmg, 9);
  });
});

describe('Yae Miko', () => {
  it('C4: +100% de DMG do Supremo, sempre; a habilidade não recebe', () => {
    const burst: Act = { member: 0, talent: 'burst', label: 'Skill DMG' };
    const [c3] = run([{ character: 'Yae Miko', constellation: 3 }], [burst]);
    const [c4] = run([{ character: 'Yae Miko', constellation: 4 }], [burst]);
    expect(c4.stats.dmgByType.burst - c3.stats.dmgByType.burst).toBeCloseTo(1, 9);
    const skill: Act = { member: 0, talent: 'skill', label: 'Sesshou Sakura DMG: Level 4' };
    expect(run([{ character: 'Yae Miko', constellation: 4 }], [skill])[0].stats.dmgByType.skill).toBeCloseTo(run([{ character: 'Yae Miko', constellation: 3 }], [skill])[0].stats.dmgByType.skill, 9);
  });
  it('C2: +200 de Maestria na janela (nível 4 da Sesshou Sakura)', () => {
    const hit: Act = { member: 0, talent: 'skill', label: 'Sesshou Sakura DMG: Level 4' };
    const [off] = run([{ character: 'Yae Miko', constellation: 2 }], [hit]);
    const [on] = run([{ character: 'Yae Miko', constellation: 2 }], [{ ...hit, tags: ['label:Yae C2'] }]);
    expect(on.stats.em - off.stats.em).toBeCloseTo(200, 6);
  });
});

describe('Kuki Shinobu A4', () => {
  it('soma 25% da Maestria ao Skill DMG e ao Grass Ring, e não ao Normal', () => {
    const t = ['label:Shinobu C6'];
    for (const label of ['Skill DMG', 'Grass Ring of Sanctification DMG']) {
      const [r] = run([{ character: 'Kuki Shinobu', constellation: 6 }], [{ member: 0, talent: 'skill', label, tags: t }]);
      expect(r.stats.em).toBeGreaterThanOrEqual(150);
      expect(r.flatDamage).toBeCloseTo(0.25 * r.stats.em, 6);
    }
    const [n] = run([{ character: 'Kuki Shinobu', constellation: 6 }], [{ member: 0, talent: 'normal', label: '1-Hit DMG', tags: t }]);
    expect(n.flatDamage).toBe(0);
  });
});

describe('Sethos', () => {
  const shot: Act = { member: 0, talent: 'normal', label: 'Shadowpiercing Shot DMG' };
  it('A4: 700% da Maestria só no Shadowpiercing Shot (o Normal comum não recebe)', () => {
    const [r] = run([{ character: 'Sethos', constellation: 4 }], [{ ...shot, tags: ['label:Sethos C4'] }]);
    expect(r.stats.em).toBeGreaterThanOrEqual(80);
    expect(r.flatDamage).toBeCloseTo(7 * r.stats.em, 6);
    const [n] = run([{ character: 'Sethos' }], [{ member: 0, talent: 'normal', label: '1-Hit DMG' }]);
    expect(n.flatDamage).toBe(0);
  });
  it('C1: +15% de Taxa Crítica na janela', () => {
    const [off] = run([{ character: 'Sethos', constellation: 1 }], [shot]);
    const [on] = run([{ character: 'Sethos', constellation: 1 }], [{ ...shot, tags: ['label:Sethos C1'] }]);
    expect(on.critRate - off.critRate).toBeCloseTo(0.15, 9);
  });
});

describe('Cyno', () => {
  it('Supremo: +100 de Maestria na janela', () => {
    const hit: Act = { member: 0, talent: 'skill', label: 'Mortuary Rite DMG' };
    const [off] = run([{ character: 'Cyno' }], [hit]);
    const [on] = run([{ character: 'Cyno' }], [{ ...hit, tags: ['label:Cyno: Pactsworn Pathclearer (Maestria)'] }]);
    expect(on.stats.em - off.stats.em).toBeCloseTo(100, 6);
  });
  it('A1: +35% de DMG da habilidade na janela', () => {
    const hit: Act = { member: 0, talent: 'skill', label: 'Mortuary Rite DMG' };
    const [off] = run([{ character: 'Cyno' }], [hit]);
    const [on] = run([{ character: 'Cyno' }], [{ ...hit, tags: ['label:Cyno A1'] }]);
    expect(on.stats.dmgByType.skill - off.stats.dmgByType.skill).toBeCloseTo(0.35, 9);
  });
  it('A4: o Duststalker Bolt entra como golpe extra e causa dano', () => {
    const [r] = run([{ character: 'Cyno' }], [{ member: 0, talent: 'proc', label: 'char:a1' }]);
    expect(r.avg).toBeGreaterThan(0);
  });
});

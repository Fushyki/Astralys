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
const effectOf = (name: string) => (effects.characters as { character: string; buffs: any[]; procs: any[]; infos: any[] }[]).find((c) => c.character === name)!;
const buffOf = (name: string, id: string) => effectOf(name).buffs.find((b) => b.id === id);

type Act = { member?: number; talent: 'normal' | 'skill' | 'burst' | 'proc'; label: string; tags?: string[] };
type Mem = { character: string; constellation?: number };
function run(members: Mem[], a: Act) {
  const p = {
    ...sampleProject(), compat: 'none', elementMode: 'personagem',
    members: members.map((m) => ({ ...defaultMember(m.character, game), ...m, talents: { normal: 10, skill: 10, burst: 10 } })),
    actions: [{ id: 'a0', member: a.member ?? 0, move: { character: members[a.member ?? 0].character, talent: a.talent, label: a.label, variant: 0 }, executions: 1, reaction: 'none', activeTags: a.tags ?? [], tagSource: 'manual', dmgAdjust: 0, time: 0 }],
    buffWindows: [], disabled: [],
  };
  const r = resolveProject(p as never, game, effects);
  const asm = assembleTeam(r.team);
  const [out] = evaluateRotation({ members: r.team.members, assembly: asm, config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions;
  return out;
}
const solo = (character: string, constellation: number, a: Act) => run([{ character, constellation }], a);
const label = (name: string, id: string) => `label:${buffOf(name, id).label}`;

it('os rótulos usados existem em moves.json', () => {
  const has = (c: string, l: string) => game.moves.some((m) => m.character === c && m.label === l);
  for (const [c, l] of [['Vodyanitsa', 'Skill DMG'], ['Vodyanitsa', '1-Hit DMG'], ['Aether (Hydro)', 'Charged Attack DMG'], ['Aether (Hydro)', '1-Hit DMG'], ['Lumine (Hydro)', 'Charged Attack DMG'], ['Columbina', 'Gravity Interference: Lunar-Charged DMG']]) expect(has(c, l), `${c} ${l}`).toBe(true);
});

describe('Vodyanitsa: debuffs em janela, Supremo na Song, C1 para ela também, Redemoinho Estelar', () => {
  it('A1: RES Anemo -35% só na janela', () => {
    const act: Act = { talent: 'skill', label: 'Skill DMG' };
    const off = solo('Vodyanitsa', 0, act);
    const on = solo('Vodyanitsa', 0, { ...act, tags: [label('Vodyanitsa', 'a1')] });
    expect(buffOf('Vodyanitsa', 'a1').timed).toBe(true);
    expect(off.stats.resShred.Anemo ?? 0).toBe(0);
    expect(on.stats.resShred.Anemo).toBeCloseTo(0.35, 9);
  });
  it('Canção: RES Hydro e Cryo pelo nível (30% no nível 10) só na janela', () => {
    const act: Act = { talent: 'skill', label: 'Skill DMG' };
    const off = solo('Vodyanitsa', 0, act);
    const on = solo('Vodyanitsa', 0, { ...act, tags: [label('Vodyanitsa', 'skill')] });
    expect(off.stats.resShred.Hydro ?? 0).toBe(0);
    expect(on.stats.resShred.Hydro).toBeCloseTo(0.3, 9);
    expect(on.stats.resShred.Cryo).toBeCloseTo(0.3, 9);
  });
  it('Supremo na Song of Ages Past: +86,4% de DMG do Supremo no nível 10, só na janela', () => {
    const act: Act = { talent: 'burst', label: 'Skill DMG' };
    const off = solo('Vodyanitsa', 0, act);
    const on = solo('Vodyanitsa', 0, { ...act, tags: [label('Vodyanitsa', 'burst')] });
    expect(on.stats.dmgByType.burst - off.stats.dmgByType.burst).toBeCloseTo(0.864, 9);
    expect(on.stats.dmgByType.skill).toBe(off.stats.dmgByType.skill);
  });
  it('C1: o ATK fixo também vale para ela', () => {
    const act: Act = { talent: 'skill', label: 'Skill DMG' };
    expect(buffOf('Vodyanitsa', 'c1').scope).toBe('team');
    const off = solo('Vodyanitsa', 1, act);
    const on = solo('Vodyanitsa', 1, { ...act, tags: [label('Vodyanitsa', 'c1')] });
    expect(on.stats.atk).toBeGreaterThan(off.stats.atk);
  });
  it('C2: +60% de Dano Crítico de Redemoinho Estelar só na janela e só na C2', () => {
    const act: Act = { talent: 'skill', label: 'Skill DMG' };
    const off = solo('Vodyanitsa', 2, act);
    const on = solo('Vodyanitsa', 2, { ...act, tags: [label('Vodyanitsa', 'c2s')] });
    expect(on.stats.reactionBonus.stellarswirlCritDmg - off.stats.reactionBonus.stellarswirlCritDmg).toBeCloseTo(0.6, 9);
    expect(buffOf('Vodyanitsa', 'c2s').minConstellation).toBe(2);
  });
  it('C6: Redemoinho Estelar elevado em 25% só na janela', () => {
    const act: Act = { talent: 'skill', label: 'Skill DMG' };
    const off = solo('Vodyanitsa', 6, act);
    const on = solo('Vodyanitsa', 6, { ...act, tags: [label('Vodyanitsa', 'c6s')] });
    expect(on.stats.reactionBonus.stellarswirlSpecial - off.stats.reactionBonus.stellarswirlSpecial).toBeCloseTo(0.25, 9);
  });
});

describe('Columbina: Domínio Lunar pela linha do Lunaris e C4 de Lunar-Florescer fora', () => {
  it('Domínio Lunar: 40% no nível 10 de Supremo', () => {
    const b = buffOf('Columbina', 'domain');
    expect(b.level.table).toHaveLength(15);
    expect(b.level.table[9]).toBeCloseTo(0.4, 9);
    expect(b.level.table[14]).toBeCloseTo(0.55, 9);
  });
  it('C4 de Lunar-Florescer foi removido; os de Carregado e Cristalizar ficam', () => {
    expect(buffOf('Columbina', 'c4lb')).toBeUndefined();
    expect(buffOf('Columbina', 'c4lc')).toBeDefined();
    expect(buffOf('Columbina', 'c4lcr')).toBeDefined();
  });
});

describe('Viajante Hydro (Aether e Lumine): Carregado: Tidebound', () => {
  for (const who of ['Aether (Hydro)', 'Lumine (Hydro)']) {
    it(`${who}: +150% do ATK em cada um dos 2 acertos e +100% com HP >= 50%`, () => {
      const charged: Act = { talent: 'normal', label: 'Charged Attack DMG' };
      const [tide] = [buffOf(who, 'p3tide')];
      expect(tide).toBeDefined();
      const r = solo(who, 0, charged);
      expect(r.flatDamage).toBeCloseTo((1.5 * 2 + 1 * 2) * r.stats.atk, 6);
      const plain = solo(who, 0, { talent: 'normal', label: '1-Hit DMG' });
      expect(plain.flatDamage).toBe(0);
    });
  }
});

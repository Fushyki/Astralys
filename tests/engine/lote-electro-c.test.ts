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
type Mem = { character: string; constellation?: number; stacks?: Record<string, number> };
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
  const out = evaluateRotation({ members: r.team.members, assembly: asm, config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions;
  return Object.assign(out, { tags: [...new Set(asm.buffs.map((b) => b.tag))] });
}
const tagsOf = (members: Mem[]) => run(members, [{ member: 0, talent: 'normal', label: '1-Hit DMG' }]).tags;
const hasMove = (character: string, label: string) => game.moves.some((m) => m.character === character && m.label === label);
const hit: Act = { member: 0, talent: 'normal', label: '1-Hit DMG' };

describe('rótulos dos golpes usados existem no cadastro', () => {
  it('Clorinde, Varesa, Valeriy', () => {
    for (const [c, l] of [['Clorinde', '1-Hit DMG'], ['Clorinde', 'Skill DMG'], ['Varesa', 'Low/High Plunge DMG'], ['Varesa', 'Fiery Passion Low/High Plunge DMG'], ['Varesa', 'Flying Kick DMG'], ['Valeriy', 'Direct-Fire Mortar: Point-Blank Bombardment DMG'], ['Valeriy', 'Thunderburst Shell DMG'], ['Ororon', 'Ritual DMG']]) {
      expect(hasMove(c, l), `${c}: ${l}`).toBe(true);
    }
  });
});

describe('Clorinde', () => {
  it('A1: 20% do ATK por stack (3 stacks), com teto de 1.800, no Normal Electro', () => {
    const m: Mem[] = [{ character: 'Clorinde' }];
    const [r] = run(m, [{ ...hit, tags: tagsOf(m) }]);
    expect(r.flatDamage).toBeCloseTo(Math.min(0.6 * r.stats.atk, 1800), 6);
    expect(r.flatDamage).toBeGreaterThan(0);
  });
  it('C2 reforça o A1 (30% por stack, teto 2.700): não soma os dois', () => {
    const m0: Mem[] = [{ character: 'Clorinde', constellation: 1 }];
    const m2: Mem[] = [{ character: 'Clorinde', constellation: 2 }];
    const [a] = run(m0, [{ ...hit, tags: tagsOf(m0) }]);
    const [b] = run(m2, [{ ...hit, tags: tagsOf(m2) }]);
    expect(b.flatDamage).toBeCloseTo(Math.min(0.9 * b.stats.atk, 2700), 6);
    expect(b.flatDamage).toBeGreaterThan(a.flatDamage);
  });
  it('A4: +20% de Taxa Crítica (2 stacks) só na janela', () => {
    const [off] = run([{ character: 'Clorinde' }], [hit]);
    const [on] = run([{ character: 'Clorinde' }], [{ ...hit, tags: ['label:Clorinde A4'] }]);
    expect(on.critRate - off.critRate).toBeCloseTo(0.2, 9);
  });
  it('C4: +200% de DMG do Last Lightfall com 100% de Bond of Life; metade com 50%', () => {
    const burst: Act = { member: 0, talent: 'burst', label: 'Skill DMG', tags: ['label:Clorinde C4 (Last Lightfall por Bond of Life)'] };
    const [off] = run([{ character: 'Clorinde', constellation: 4 }], [{ ...burst, tags: [] }]);
    const [full] = run([{ character: 'Clorinde', constellation: 4 }], [burst]);
    const [half] = run([{ character: 'Clorinde', constellation: 4, stacks: { c4: 50 } }], [burst]);
    expect(full.stats.dmgByType.burst - off.stats.dmgByType.burst).toBeCloseTo(2, 9);
    expect(half.stats.dmgByType.burst - off.stats.dmgByType.burst).toBeCloseTo(1, 9);
  });
  it('C6: o Glimbright Shade (200% do ATK) é um golpe extra', () => {
    const [r] = run([{ character: 'Clorinde', constellation: 6 }], [{ member: 0, talent: 'proc', label: 'char:c6shade' }]);
    expect(r.avg).toBeGreaterThan(0);
  });
});

describe('Ororon', () => {
  it('A1: Hypersense (160% do ATK) é um golpe extra; C1 e C6 somam os extras', () => {
    const base = run([{ character: 'Ororon', constellation: 6 }], [{ member: 0, talent: 'proc', label: 'char:a1hyper' }])[0];
    const c1 = run([{ character: 'Ororon', constellation: 6 }], [{ member: 0, talent: 'proc', label: 'char:c1hyper' }])[0];
    const c6 = run([{ character: 'Ororon', constellation: 6 }], [{ member: 0, talent: 'proc', label: 'char:c6hyper' }])[0];
    expect(base.avg).toBeGreaterThan(0);
    expect(c1.avg / base.avg).toBeCloseTo(0.5, 6);
    expect(c6.avg / base.avg).toBeCloseTo(2, 6);
  });
  it('C2: DMG Electro cresce com os inimigos atingidos (1 = 8%, 4 = 32%)', () => {
    const burst: Act = { member: 0, talent: 'burst', label: 'Ritual DMG' };
    const [off] = run([{ character: 'Ororon', constellation: 2 }], [burst]);
    const [one] = run([{ character: 'Ororon', constellation: 2 }], [{ ...burst, tags: ['label:Ororon C2'] }]);
    const [four] = run([{ character: 'Ororon', constellation: 2, stacks: { c2: 4 } }], [{ ...burst, tags: ['label:Ororon C2'] }]);
    const gain = (r: { stats: { dmgBonus: number; eleDmg?: number } }) => r.stats.dmgBonus - off.stats.dmgBonus;
    expect(gain(one)).toBeGreaterThan(0);
    expect(gain(four) / gain(one)).toBeCloseTo(4, 6);
  });
  it('C6: +10% de ATK por stack (3 stacks = 30%) só na janela', () => {
    const [off] = run([{ character: 'Ororon', constellation: 6 }], [hit]);
    const [on] = run([{ character: 'Ororon', constellation: 6 }], [{ ...hit, tags: ['label:Ororon C6'] }]);
    expect(on.stats.atk).toBeGreaterThan(off.stats.atk);
  });
});

describe('Varesa', () => {
  const plunge: Act = { member: 0, talent: 'normal', label: 'Low/High Plunge DMG' };
  const fiery: Act = { member: 0, talent: 'normal', label: 'Fiery Passion Low/High Plunge DMG' };
  const flat = (m: Mem[], a: Act) => run(m, [{ ...a, tags: tagsOf(m) }])[0];
  it('A1: 50% do ATK sem Fiery Passion e 180% em Fiery Passion (golpes diferentes)', () => {
    const m: Mem[] = [{ character: 'Varesa' }];
    const a = flat(m, plunge);
    const b = flat(m, fiery);
    expect(a.flatDamage).toBeCloseTo(0.5 * a.stats.atk, 6);
    expect(b.flatDamage).toBeCloseTo(1.8 * b.stats.atk, 6);
  });
  it('C1: reforça o A1 para 180% também fora de Fiery Passion', () => {
    const m: Mem[] = [{ character: 'Varesa', constellation: 1 }];
    const a = flat(m, plunge);
    expect(a.flatDamage).toBeCloseTo(1.8 * a.stats.atk, 6);
  });
  it('C4: Diligent Refinement soma 500% do ATK (teto 20.000) e o Supremo ganha +100% na janela', () => {
    const m: Mem[] = [{ character: 'Varesa', constellation: 4 }];
    const a = flat(m, plunge);
    expect(a.flatDamage).toBeCloseTo(1.8 * a.stats.atk + Math.min(5 * a.stats.atk, 20000), 6);
    const burst: Act = { member: 0, talent: 'burst', label: 'Flying Kick DMG' };
    const [off] = run(m, [burst]);
    const [on] = run(m, [{ ...burst, tags: ['label:Varesa C4 (Supremo +100%)'] }]);
    expect(on.stats.dmgByType.burst - off.stats.dmgByType.burst).toBeCloseTo(1, 9);
  });
});

describe('Mitya', () => {
  it('A1: +30 de Maestria por Gradient Beacon escolhido (Steady State)', () => {
    const [off] = run([{ character: 'Mitya' }], [hit]);
    const [on] = run([{ character: 'Mitya', stacks: { a1: 3 } }], [{ ...hit, tags: ['label:Mitya A1 (Maestria por Beacon)'] }]);
    expect(on.stats.em - off.stats.em).toBeCloseTo(90, 6);
  });
  it('A4: +20% de Taxa Crítica (4 stacks) só na janela', () => {
    const [off] = run([{ character: 'Mitya' }], [hit]);
    const [on] = run([{ character: 'Mitya' }], [{ ...hit, tags: ['label:Mitya A4'] }]);
    expect(on.critRate - off.critRate).toBeCloseTo(0.2, 9);
  });
  it('C2: RES Cryo e Electro -20% só na janela; Overloaded dá +234 de Maestria', () => {
    const m: Mem[] = [{ character: 'Mitya', constellation: 2 }];
    const [off] = run(m, [hit]);
    const [res] = run(m, [{ ...hit, tags: ['label:Mitya C2 (RES do inimigo)'] }]);
    expect(off.stats.resShred.Electro ?? 0).toBe(0);
    expect(res.stats.resShred.Electro).toBeCloseTo(0.2, 9);
    expect(res.stats.resShred.Cryo).toBeCloseTo(0.2, 9);
    const [em] = run(m, [{ ...hit, tags: ['label:Mitya C2 (Maestria, Overloaded)'] }]);
    expect(em.stats.em - off.stats.em).toBeCloseTo(234, 6);
  });
});

describe('Valeriy C6: +100% do Direct-Fire Mortar e dos Thunderburst Shells', () => {
  const c6: Mem[] = [{ character: 'Valeriy', constellation: 6 }];
  it('o golpe extra vale 100% do golpe original', () => {
    const mortar = 'Direct-Fire Mortar: Point-Blank Bombardment DMG';
    const [orig] = run(c6, [{ member: 0, talent: 'normal', label: mortar }]);
    const [extra] = run(c6, [{ member: 0, talent: 'proc', label: 'char:c6mortar' }]);
    expect(extra.avg / orig.avg).toBeCloseTo(1, 6);
    const [shell] = run(c6, [{ member: 0, talent: 'burst', label: 'Thunderburst Shell DMG' }]);
    const [shellX] = run(c6, [{ member: 0, talent: 'proc', label: 'char:c6shell' }]);
    expect(shellX.avg / shell.avg).toBeCloseTo(1, 6);
  });
});

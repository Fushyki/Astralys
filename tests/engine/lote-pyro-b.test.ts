import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

// Só passa depois de `npx tsx scripts/curate-effects.ts` com o lote pyro-b registrado.
const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };
const effectOf = (name: string) => (effects.characters as { character: string; buffs: any[]; procs: any[]; infos: any[] }[]).find((c) => c.character === name)!;

type Act = { member?: number; talent: 'normal' | 'skill' | 'burst' | 'proc'; label: string; tags?: string[] };
function run(members: { character: string; constellation?: number }[], a: Act) {
  const p = {
    ...sampleProject(), compat: 'none', elementMode: 'personagem',
    members: members.map((m) => ({ ...defaultMember(m.character, game), ...m })),
    actions: [{ id: 'a0', member: a.member ?? 0, move: { character: members[a.member ?? 0].character, talent: a.talent, label: a.label, variant: 0 }, executions: 1, reaction: 'none', activeTags: a.tags ?? [], tagSource: 'manual', dmgAdjust: 0, time: 0 }],
    buffWindows: [], disabled: [],
  };
  const r = resolveProject(p as never, game, effects);
  const asm = assembleTeam(r.team);
  const [out] = evaluateRotation({ members: r.team.members, assembly: asm, config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions;
  return { out, asm, tags: [...new Set(asm.buffs.map((b) => b.tag))] };
}
const solo = (character: string, constellation: number, a: Act) => run([{ character, constellation }], a);

describe('Yanfei C6: o 4º Selo reforça o A1 (antes valia +100% por erro)', () => {
  it('c6 substitui o a1, com 5% por Selo e até 4 Selos', () => {
    const c6 = effectOf('Yanfei').buffs.find((b) => b.id === 'c6');
    expect(c6.replaces).toBe('a1');
    expect(c6.stats.dmgPct).toBeCloseTo(0.2, 9);
    expect(c6.stacks.max).toBe(4);
  });
  it('na C6 o DMG Pyro com o Selo ligado passa do da C5 (3 Selos)', () => {
    const act: Act = { talent: 'normal', label: 'Charged Attack' };
    const c5 = solo('Yanfei', 5, { ...act, tags: ['label:Yanfei A1'] }).out;
    const c6 = solo('Yanfei', 6, { ...act, tags: ['label:Yanfei C6 (A1 com 4 Selos)'] }).out;
    expect(c6.stats.dmgBonus).toBeGreaterThan(c5.stats.dmgBonus);
    expect(c6.stats.dmgBonus - c5.stats.dmgBonus).toBeLessThan(0.1);
  });
});

describe('Thoma A4: 2,2% do HP só no Fiery Collapse', () => {
  it('o Skill DMG do Supremo não recebe; o Fiery Collapse recebe 0,022 x HP', () => {
    const all = solo('Thoma', 0, { talent: 'burst', label: 'Fiery Collapse DMG' }).tags;
    const fc = solo('Thoma', 0, { talent: 'burst', label: 'Fiery Collapse DMG', tags: all }).out;
    const sk = solo('Thoma', 0, { talent: 'burst', label: 'Skill DMG', tags: all }).out;
    expect(fc.flatDamage).toBeCloseTo(0.022 * fc.stats.hp, 6);
    expect(sk.flatDamage).toBe(0);
  });
});

describe('Dehya C1: 3,6% do HP no Molten Inferno, sem o Field DMG', () => {
  it('Indomitable Flame recebe; Field DMG não', () => {
    const all = solo('Dehya', 1, { talent: 'skill', label: 'Indomitable Flame DMG' }).tags;
    const ind = solo('Dehya', 1, { talent: 'skill', label: 'Indomitable Flame DMG', tags: all }).out;
    const field = solo('Dehya', 1, { talent: 'skill', label: 'Field DMG', tags: all }).out;
    expect(ind.flatDamage).toBeCloseTo(0.036 * ind.stats.hp, 6);
    expect(field.flatDamage).toBe(0);
  });
});

describe('Dehya C6: +10% de Taxa e +15% de Dano Crítico por acúmulo (até 60%) no Leonine Bite', () => {
  it('Taxa vem de c6 e o Dano Crítico de c6cd, com 4 acúmulos', () => {
    const e = effectOf('Dehya');
    expect(e.buffs.find((b) => b.id === 'c6').stats.critRateByType.burst).toBeCloseTo(0.1, 9);
    const cd = e.buffs.find((b) => b.id === 'c6cd');
    expect(cd.stats.critDmgByType.burst).toBeCloseTo(0.6, 9);
    expect(cd.stacks.max).toBe(4);
  });
  it('na C6 o Dano Crítico do Supremo sobe sobre a C5', () => {
    const act: Act = { talent: 'burst', label: "Flame-Mane's Fist DMG" };
    const c5 = solo('Dehya', 5, act).out;
    const c6 = solo('Dehya', 6, act).out;
    expect(c6.avg).toBeGreaterThan(c5.avg);
  });
});

describe('Dehya C2: golpe extra de 50% do Field DMG', () => {
  it('só a partir da C2 e vale 0,5 x o Field DMG', () => {
    const field = solo('Dehya', 2, { talent: 'skill', label: 'Field DMG' }).out;
    const extra = solo('Dehya', 2, { talent: 'proc', label: 'char:c2' }).out;
    expect(extra.scale.atk / field.scale.atk).toBeCloseTo(0.5, 6);
    expect(extra.avg).toBeGreaterThan(0);
  });
});

describe('Lyney A4: +60% mais 20% por outro Pyro (teto 100%)', () => {
  const act: Act = { talent: 'skill', label: 'Skill DMG' };
  const dmg = (team: string[]) => run(team.map((character) => ({ character })), act).out.stats.dmgBonus;
  it('2 Pyro somam +20% e 3 Pyro +40% sobre o time só dele', () => {
    const one = dmg(['Lyney']);
    expect(dmg(['Lyney', 'Bennett']) - one).toBeCloseTo(0.2, 6);
    expect(dmg(['Lyney', 'Bennett', 'Mavuika']) - one).toBeCloseTo(0.4, 6);
  });
  it('o time sem outro Pyro fica com os 60% do A4 base', () => {
    const a4 = effectOf('Lyney').buffs.find((b) => b.id === 'a4');
    expect(a4.stats.dmgPct).toBeCloseTo(0.6, 9);
  });
});

describe('Lyney C4: -20% de RES Pyro vira janela', () => {
  it('não muda o mapa fixo de RES; o golpe com a janela ligada causa mais dano', () => {
    const act: Act = { talent: 'normal', label: 'Pyrotechnic Strike DMG' };
    const c3 = solo('Lyney', 3, act);
    const c4 = solo('Lyney', 4, act);
    expect(c4.asm.enemyRes.Pyro).toBeCloseTo(c3.asm.enemyRes.Pyro, 9);
    const on = solo('Lyney', 4, { ...act, tags: ['label:Lyney C4'] }).out;
    expect(on.avg).toBeGreaterThan(c4.out.avg);
  });
});

describe('Lyney A1: +80% do ATK no Pyrotechnic Strike', () => {
  it('só esse golpe recebe o dano fixo', () => {
    const all = solo('Lyney', 0, { talent: 'normal', label: 'Pyrotechnic Strike DMG' }).tags;
    const ps = solo('Lyney', 0, { talent: 'normal', label: 'Pyrotechnic Strike DMG', tags: all }).out;
    const pa = solo('Lyney', 0, { talent: 'normal', label: 'Prop Arrow DMG', tags: all }).out;
    expect(ps.flatDamage).toBeCloseTo(0.8 * ps.stats.atk, 6);
    expect(pa.flatDamage).toBe(0);
  });
});

describe('Chevreuse A1: -40% de RES Pyro e Electro vira janela', () => {
  const team = [{ character: 'Chevreuse' }, { character: 'Bennett' }, { character: 'Raiden Shogun' }];
  const act: Act = { member: 1, talent: 'skill', label: 'Press DMG' };
  it('não muda o mapa fixo e o golpe na janela causa mais dano', () => {
    const off = run(team, act);
    const on = run(team, { ...act, tags: ['label:Chevreuse A1'] });
    expect(off.asm.enemyRes.Pyro).toBeCloseTo(run([{ character: 'Bennett' }], { ...act, member: 0 }).asm.enemyRes.Pyro, 9);
    expect(on.out.avg).toBeGreaterThan(off.out.avg);
  });
});

describe('Informativos: ficam fora do cálculo', () => {
  it('escudo, recarga, energia e cura aparecem como texto com o número do Lunaris', () => {
    expect(effectOf('Yanfei').infos).toContainEqual(expect.objectContaining({ src: 'const4', kind: 'escudo', text: expect.stringContaining('45%') }));
    expect(effectOf('Thoma').infos).toContainEqual(expect.objectContaining({ src: 'const4', kind: 'energia', text: expect.stringContaining('15') }));
    expect(effectOf('Dehya').infos).toContainEqual(expect.objectContaining({ src: 'p2', kind: 'cura' }));
    expect(effectOf('Chevreuse').infos).toContainEqual(expect.objectContaining({ src: 'const1', kind: 'energia', text: expect.stringContaining('6') }));
    expect(effectOf('Yoimiya').infos).toContainEqual(expect.objectContaining({ src: 'const4', kind: 'recarga', text: expect.stringContaining('1.2') }));
  });
});

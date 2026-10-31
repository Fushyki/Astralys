import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

// Só passa depois de `npx tsx scripts/curate-effects.ts` com o lote hydro-a registrado.
const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };
const effectOf = (name: string) => (effects.characters as { character: string; buffs: any[]; procs: any[]; infos: any[] }[]).find((c) => c.character === name)!;
const buffOf = (name: string, id: string) => effectOf(name).buffs.find((b) => b.id === id);

type Act = { member?: number; talent: 'normal' | 'skill' | 'burst' | 'proc'; label: string; tags?: string[] };
type Mem = { character: string; constellation?: number; factions?: ('hexerei' | 'moonsign')[] };
function run(members: Mem[], a: Act) {
  const p = {
    ...sampleProject(), compat: 'none', elementMode: 'personagem',
    members: members.map((m) => ({ ...defaultMember(m.character, game), ...m })),
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
  for (const [c, l] of [['Xingqiu', 'Skill DMG'], ['Mona', 'Charged Attack DMG'], ['Mona', '1-Hit DMG'], ['Fischl', '1-Hit DMG'], ['Sangonomiya Kokomi', '1-Hit DMG'], ['Yelan', 'Skill DMG'], ['Tartaglia', 'Riptide Slash'], ['Tartaglia', 'Riptide Flash DMG']]) expect(has(c, l), `${c} ${l}`).toBe(true);
});

describe('Xingqiu C2: RES Hydro em janela', () => {
  it('-15% só com a janela ligada', () => {
    const act: Act = { talent: 'skill', label: 'Skill DMG' };
    const off = solo('Xingqiu', 2, act);
    const on = solo('Xingqiu', 2, { ...act, tags: [label('Xingqiu', 'c2')] });
    expect(buffOf('Xingqiu', 'c2').timed).toBe(true);
    expect(off.stats.resShred.Hydro ?? 0).toBe(0);
    expect(on.stats.resShred.Hydro).toBeCloseTo(0.15, 9);
  });
});

describe('Mona: C1, C4 (e Hexerei), C6', () => {
  it('C1: +15% de Eletrocarregado, Lunar-Carregado e Lunar-Cristalizar no buff', () => {
    const rb = buffOf('Mona', 'c1').stats.reactionBonus;
    expect(rb.electrocharged).toBeCloseTo(0.15, 9);
    expect(rb.lunarcharged).toBeCloseTo(0.15, 9);
    expect(rb.lunarcrystallize).toBeCloseTo(0.15, 9);
  });
  it('C4: +15% de Taxa Crítica a um aliado, só na janela', () => {
    const team: Mem[] = [{ character: 'Mona', constellation: 4 }, { character: 'Xingqiu' }];
    const act: Act = { member: 1, talent: 'normal', label: '1-Hit DMG' };
    const off = run(team, act);
    const on = run(team, { ...act, tags: [label('Mona', 'c4')] });
    expect(on.critRate - off.critRate).toBeCloseTo(0.15, 9);
  });
  it('C4 Hexerei: +15% de Dano Crítico só para quem é Hexerei', () => {
    const act: Act = { member: 1, talent: 'normal', label: '1-Hit DMG', tags: [label('Mona', 'c4h')] };
    const hex = run([{ character: 'Mona', constellation: 4, factions: ['hexerei'] }, { character: 'Fischl', factions: ['hexerei'] }], act);
    const plain = run([{ character: 'Mona', constellation: 4 }, { character: 'Fischl' }], act);
    expect(hex.critDmg - plain.critDmg).toBeCloseTo(0.15, 9);
  });
  it('C6: +60% por segundo no Carregado, 180% com 3 stacks', () => {
    const b = buffOf('Mona', 'c6');
    expect(b.stacks.max).toBe(3);
    const act: Act = { talent: 'normal', label: 'Charged Attack DMG' };
    const off = solo('Mona', 6, act);
    const on = solo('Mona', 6, { ...act, tags: [label('Mona', 'c6')] });
    expect(on.stats.dmgByType.charged - off.stats.dmgByType.charged).toBeCloseTo(1.8, 9);
  });
});

describe('Sangonomiya Kokomi A4: Taxa Crítica -100%', () => {
  it('a Taxa Crítica final não passa de 0', () => {
    expect(buffOf('Sangonomiya Kokomi', 'p4').stats.critRate).toBeCloseTo(-1, 9);
    const out = solo('Sangonomiya Kokomi', 0, { talent: 'normal', label: '1-Hit DMG' });
    expect(out.critRate).toBeLessThanOrEqual(0);
  });
});

describe('Yelan A4: 1% + 3,5% por segundo, teto de 50%', () => {
  it('tabela de stacks: 1% no início e 50% no último', () => {
    const b = buffOf('Yelan', 'a4');
    expect(b.stacks.max).toBe(15);
    expect(b.stacks.table[1] * b.stats.dmgPct).toBeCloseTo(0.01, 6);
    expect(b.stacks.table[2] * b.stats.dmgPct).toBeCloseTo(0.045, 6);
    expect(b.stacks.table[15] * b.stats.dmgPct).toBeCloseTo(0.5, 6);
  });
  it('+50% de DMG com a janela ligada (stacks no máximo)', () => {
    const act: Act = { talent: 'skill', label: 'Skill DMG' };
    const off = solo('Yelan', 0, act);
    const on = solo('Yelan', 0, { ...act, tags: [label('Yelan', 'a4')] });
    expect(on.stats.dmgBonus - off.stats.dmgBonus).toBeCloseTo(0.5, 9);
  });
});

describe('Informativos', () => {
  it('cura, energia e recarga ficam em infos, sem entrar no cálculo', () => {
    const has = (c: string, src: string) => effectOf(c).infos.some((i) => i.src === src);
    expect(has('Barbara', 'const1')).toBe(true);
    expect(has('Xingqiu', 'p1')).toBe(true);
    expect(has('Tartaglia', 'const2')).toBe(true);
    expect(has('Sangonomiya Kokomi', 'p4')).toBe(true);
  });
});

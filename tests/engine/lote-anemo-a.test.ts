import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

// Só passa depois de `npx tsx scripts/curate-effects.ts` com o lote anemo-a registrado.
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
  for (const [c, l] of [['Jean', 'Burst DMG'], ['Venti', 'Press DMG'], ['Venti', 'Fully-Charged Aimed Shot'], ['Venti', 'DoT'], ['Xiao', 'Skill DMG'], ['Xiao', '1-Hit DMG'], ['Sucrose', '1-Hit DMG'], ['Sucrose', 'DoT'], ['Sayu', 'Fuufuu Whirlwind Kick Hold DMG'], ['Jean', '1-Hit DMG']]) expect(has(c, l), `${c} ${l}`).toBe(true);
});

describe('RES do inimigo em janela (Jean C4, Venti C2 e C6)', () => {
  it('Jean C4: Anemo -40% só na janela', () => {
    const act: Act = { talent: 'burst', label: 'Burst DMG' };
    const off = solo('Jean', 4, act);
    const on = solo('Jean', 4, { ...act, tags: [label('Jean', 'c4')] });
    expect(off.stats.resShred.Anemo ?? 0).toBe(0);
    expect(on.stats.resShred.Anemo).toBeCloseTo(0.4, 9);
  });
  it('Venti C2: Anemo e Física -24% só na janela', () => {
    const act: Act = { talent: 'skill', label: 'Press DMG' };
    const off = solo('Venti', 2, act);
    const on = solo('Venti', 2, { ...act, tags: [label('Venti', 'c2')] });
    expect(off.stats.resShred.Anemo ?? 0).toBe(0);
    expect(on.stats.resShred.Anemo).toBeCloseTo(0.24, 9);
    expect(on.stats.resShred.Physical).toBeCloseTo(0.24, 9);
  });
  it('Venti C6: Anemo -20% só na janela', () => {
    const act: Act = { talent: 'burst', label: 'DoT' };
    const off = solo('Venti', 6, act);
    const on = solo('Venti', 6, { ...act, tags: [label('Venti', 'c6')] });
    expect(off.stats.resShred.Anemo ?? 0).toBe(0);
    expect(on.stats.resShred.Anemo).toBeCloseTo(0.2, 9);
  });
});

describe('Venti C1: flecha extra', () => {
  it('vale 33% do Tiro Mirado Carregado e conta como Carregado', () => {
    const base = solo('Venti', 1, { talent: 'normal', label: 'Fully-Charged Aimed Shot' });
    const extra = solo('Venti', 1, { talent: 'proc', label: 'char:c1' });
    expect(extra.scale.atk / base.scale.atk).toBeCloseTo(0.33, 6);
    expect(extra.avg).toBeGreaterThan(0);
  });
});

describe('Xiao: A1 e A4 com stacks', () => {
  it('A1: +25% de DMG no teto (5 degraus de 5%)', () => {
    expect(buffOf('Xiao', 'a1').stacks.max).toBe(5);
    const act: Act = { talent: 'skill', label: 'Skill DMG' };
    const off = solo('Xiao', 0, act);
    const on = solo('Xiao', 0, { ...act, tags: [label('Xiao', 'a1')] });
    expect(on.stats.dmgBonus - off.stats.dmgBonus).toBeCloseTo(0.25, 9);
  });
  it('A4: +45% de DMG da habilidade no teto (3 stacks de 15%), só nela', () => {
    expect(buffOf('Xiao', 'a4').stacks.max).toBe(3);
    const act: Act = { talent: 'skill', label: 'Skill DMG' };
    const off = solo('Xiao', 0, act);
    const on = solo('Xiao', 0, { ...act, tags: [label('Xiao', 'a4')] });
    expect(on.stats.dmgByType.skill - off.stats.dmgByType.skill).toBeCloseTo(0.45, 9);
    expect(on.stats.dmgByType.normal).toBe(off.stats.dmgByType.normal);
  });
});

describe('Sucrose: Hexerei (p4) e C6 extra', () => {
  const team: Mem[] = [{ character: 'Sucrose', factions: ['hexerei'] }, { character: 'Venti', factions: ['hexerei'] }];
  const hit: Act = { talent: 'normal', label: '1-Hit DMG' };
  it('espírito pequeno: +5,71428% de DMG de Normal com 2 Hexerei, nada sem eles', () => {
    const off = run(team, hit);
    const on = run(team, { ...hit, tags: [label('Sucrose', 'p4s')] });
    expect(on.stats.dmgByType.normal - off.stats.dmgByType.normal).toBeCloseTo(0.057143, 5);
    const alone: Mem[] = [{ character: 'Sucrose', factions: ['hexerei'] }, { character: 'Jean' }];
    const aloneOn = run(alone, { ...hit, tags: [label('Sucrose', 'p4s')] });
    expect(aloneOn.stats.dmgByType.normal).toBe(run(alone, hit).stats.dmgByType.normal);
  });
  it('espírito grande: +7,14285% de DMG de Supremo só para Hexerei', () => {
    const act: Act = { talent: 'burst', label: 'DoT' };
    const off = run(team, act);
    const on = run(team, { ...act, tags: [label('Sucrose', 'p4l')] });
    expect(on.stats.dmgByType.burst - off.stats.dmgByType.burst).toBeCloseTo(0.071429, 5);
    const mixed: Mem[] = [...team, { character: 'Jean' }];
    const jean: Act = { member: 2, talent: 'burst', label: 'Burst DMG' };
    expect(run(mixed, { ...jean, tags: [label('Sucrose', 'p4l')] }).stats.dmgByType.burst).toBe(run(mixed, jean).stats.dmgByType.burst);
  });
  it('C6 Hexerei: +8,57142% de DMG só para Hexerei', () => {
    const six = team.map((m) => ({ ...m, constellation: 6 }));
    const off = run(six, hit);
    const on = run(six, { ...hit, tags: [label('Sucrose', 'c6hex')] });
    expect(on.stats.dmgBonus - off.stats.dmgBonus).toBeCloseTo(0.085714, 5);
  });
});

describe('Sayu C2: 20 degraus de 3,3%', () => {
  it('+66% de DMG da habilidade no teto, só na janela e só na C2', () => {
    expect(buffOf('Sayu', 'c2').stacks.max).toBe(20);
    const act: Act = { talent: 'skill', label: 'Fuufuu Whirlwind Kick Hold DMG' };
    const c1 = solo('Sayu', 1, act);
    const off = solo('Sayu', 2, act);
    const on = solo('Sayu', 2, { ...act, tags: [label('Sayu', 'c2')] });
    expect(on.stats.dmgByType.skill - off.stats.dmgByType.skill).toBeCloseTo(0.66, 9);
    expect(c1.stats.dmgByType.skill).toBe(off.stats.dmgByType.skill);
  });
});

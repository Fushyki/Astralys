import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

// Só passa depois de `npx tsx scripts/curate-effects.ts` com o lote hydro-b registrado.
const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };
const effectOf = (name: string) => (effects.characters as { character: string; buffs: any[]; procs: any[]; infos: any[] }[]).find((c) => c.character === name)!;

type Act = { member?: number; talent: 'normal' | 'skill' | 'burst' | 'proc'; label: string; tags?: string[] };
type Mem = { character: string; constellation?: number; stacks?: Record<string, number>; factions?: ('hexerei' | 'moonsign')[] };
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
  return { out, tags: [...new Set(asm.buffs.map((b) => b.tag))] };
}
const solo = (character: string, constellation: number, a: Act) => run([{ character, constellation }], a);
const L = (c: string, t: Act['talent'], label: string) => expect(game.moves.some((m) => m.character === c && m.talent === t && m.label === label)).toBe(true);
const withStacks = (character: string, constellation: number, stacks: Record<string, number>, a: Act) => run([{ character, constellation, stacks }], a);

describe('rótulos dos golpes usados existem', () => {
  it('moves.json', () => {
    L('Kamisato Ayato', 'skill', 'Shunsuiken 1-Hit DMG');
    L('Neuvillette', 'normal', 'Charged Attack: Equitable Judgment');
    L('Furina', 'burst', 'Skill DMG');
    L('Sigewinne', 'burst', 'Skill DMG');
    L('Nilou', 'burst', 'Skill DMG');
  });
});

describe('Ayato', () => {
  const hit: Act = { talent: 'skill', label: 'Shunsuiken 1-Hit DMG' };
  it('C1: +40% de DMG de Normal na janela (Shunsuiken é Normal)', () => {
    const off = solo('Kamisato Ayato', 1, hit).out;
    const on = solo('Kamisato Ayato', 1, { ...hit, tags: ['label:Ayato C1'] }).out;
    expect(on.stats.dmgByType.normal - off.stats.dmgByType.normal).toBeCloseTo(0.4, 9);
  });
  it('Namisen: mais stacks, mais dano; C2 com 5 stacks passa o máximo de 4', () => {
    const n = (c: number, s: number) => withStacks('Kamisato Ayato', c, { namisen: s, 'namisen-c2': s }, hit).out.avg;
    expect(n(0, 4)).toBeGreaterThan(n(0, 0));
    expect(n(0, 4)).toBeGreaterThan(n(0, 2));
    expect(n(2, 5)).toBeGreaterThan(n(0, 4));
  });
});

describe('Nilou e Sigewinne: RES Hydro só na janela', () => {
  it('Nilou C2: RES Hydro -35% e Dendro -35%', () => {
    const a: Act = { talent: 'burst', label: 'Skill DMG' };
    const off = solo('Nilou', 2, a).out;
    const on = solo('Nilou', 2, { ...a, tags: ['label:Nilou C2', 'label:Nilou C2 (RES Dendro)'] }).out;
    expect(off.stats.resShred.Hydro ?? 0).toBe(0);
    expect(on.stats.resShred.Hydro).toBeCloseTo(0.35, 9);
    expect(on.stats.resShred.Dendro).toBeCloseTo(0.35, 9);
  });
  it('Sigewinne C2: RES Hydro -35% na janela', () => {
    const a: Act = { talent: 'burst', label: 'Skill DMG' };
    const off = solo('Sigewinne', 2, a).out;
    const on = solo('Sigewinne', 2, { ...a, tags: ['label:Sigewinne C2'] }).out;
    expect(off.stats.resShred.Hydro ?? 0).toBe(0);
    expect(on.stats.resShred.Hydro).toBeCloseTo(0.35, 9);
  });
});

describe('Neuvillette', () => {
  const hit: Act = { talent: 'normal', label: 'Charged Attack: Equitable Judgment' };
  it('A1: 3 stacks multiplicam o dano base em +60%; 1 stack, +10%', () => {
    const t = ['label:Neuvillette A1'];
    expect(withStacks('Neuvillette', 0, { a1: 3 }, { ...hit, tags: t }).out.stats.baseMultByType.charged).toBeCloseTo(0.6, 9);
    expect(withStacks('Neuvillette', 0, { a1: 1 }, { ...hit, tags: t }).out.stats.baseMultByType.charged).toBeCloseTo(0.1, 5);
  });
  it('A4: +30% de DMG Hydro com HP alto, menos com HP baixo', () => {
    const hi = withStacks('Neuvillette', 0, { a4: 50 }, hit).out.stats.dmgBonus;
    const lo = withStacks('Neuvillette', 0, { a4: 25 }, hit).out.stats.dmgBonus;
    expect(hi - lo).toBeCloseTo(0.15, 9);
  });
  it('C2: +14% de Dano Crítico do Carregado por stack do A1', () => {
    const t = ['label:Neuvillette C2'];
    const off = withStacks('Neuvillette', 2, { a1: 2 }, hit).out.stats.critDmgByType.charged;
    const on = withStacks('Neuvillette', 2, { a1: 2 }, { ...hit, tags: t }).out.stats.critDmgByType.charged;
    expect(on - off).toBeCloseTo(0.28, 9);
  });
});

describe('Furina', () => {
  const burst: Act = { talent: 'burst', label: 'Skill DMG' };
  it('C2: HP sobe 0,35% por ponto de Fanfare acima do limite', () => {
    const hp = (s: number, tags: string[]) => withStacks('Furina', 2, { c2: s }, { ...burst, tags }).out.stats.hp;
    const off = hp(400, []);
    const hi = hp(400, ['label:Furina C2']);
    const lo = hp(100, ['label:Furina C2']);
    expect(hi).toBeGreaterThan(lo);
    expect(lo).toBeGreaterThan(off);
  });
  it('C1: a Fanfare vai até 400 e substitui o buff de 300', () => {
    const dmg = (c: number, s: number, tag: string) => withStacks('Furina', c, { burst: s, 'burst-c1': s }, { ...burst, tags: [tag] }).out.stats.dmgBonus;
    const base = dmg(0, 0, 'label:Furina: Fanfarra');
    expect(dmg(1, 400, 'label:Furina C1: Fanfare até 400') - base).toBeGreaterThan(dmg(0, 300, 'label:Furina: Fanfarra') - base);
  });
});

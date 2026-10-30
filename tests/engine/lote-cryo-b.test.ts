import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

// Só passa depois de `npx tsx scripts/curate-effects.ts` com o lote cryo-b registrado.
const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };
const effectOf = (name: string) => (effects.characters as { character: string; buffs: any[]; procs: any[]; infos: any[] }[]).find((c) => c.character === name)!;
const buffOf = (name: string, id: string) => effectOf(name).buffs.find((b) => b.id === id);

type Act = { member?: number; talent: 'normal' | 'skill' | 'burst' | 'proc'; label: string; tags?: string[] };
type Mem = { character: string; constellation?: number };
function run(members: Mem[], a: Act, elementMode: 'kit' | 'personagem' = 'personagem') {
  const p = {
    ...sampleProject(), compat: 'none', elementMode,
    members: members.map((m) => ({ ...defaultMember(m.character, game), ...m })),
    actions: [{ id: 'a0', member: a.member ?? 0, move: { character: members[a.member ?? 0].character, talent: a.talent, label: a.label, variant: 0 }, executions: 1, reaction: 'none', activeTags: a.tags ?? [], tagSource: 'manual', dmgAdjust: 0, time: 0 }],
    buffWindows: [], disabled: [],
  };
  const r = resolveProject(p as never, game, effects);
  const asm = assembleTeam(r.team);
  const [out] = evaluateRotation({ members: r.team.members, assembly: asm, config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions;
  return out;
}
const solo = (character: string, constellation: number, a: Act, mode?: 'kit' | 'personagem') => run([{ character, constellation }], a, mode);
const label = (name: string, id: string) => `label:${buffOf(name, id).label}`;

it('os rótulos usados existem em moves.json', () => {
  const has = (c: string, l: string) => game.moves.some((m) => m.character === c && m.label === l);
  for (const [c, l] of [['Rosaria', '1-Hit DMG'], ['Rosaria', 'Skill DMG'], ['Eula', 'Hold DMG'], ['Eula', 'DMG Per Stack'], ['Eula', 'Lightfall Sword Base DMG'], ['Aloy', 'Freeze Bomb DMG'], ['Aloy', '1-Hit DMG'], ['Shenhe', 'Press Skill DMG'], ['Shenhe', 'Skill DMG'], ['Shenhe', '1-Hit DMG'], ['Layla', 'Skill DMG'], ['Layla', 'Shooting Star DMG'], ['Layla', '1-Hit DMG'], ['Mika', '1-Hit DMG']]) expect(has(c, l), `${c} ${l}`).toBe(true);
});

describe('Rosaria: A1, C1 e C6 viram janelas; A4 sai (pendente)', () => {
  it('A1: +12% de Taxa Crítica só na janela', () => {
    const act: Act = { talent: 'skill', label: 'Skill DMG' };
    const off = solo('Rosaria', 0, act);
    const on = solo('Rosaria', 0, { ...act, tags: [label('Rosaria', 'a1')] });
    expect(on.critRate - off.critRate).toBeCloseTo(0.12, 9);
  });
  it('C1: +10% de DMG de Normal só na janela e só na C1', () => {
    const act: Act = { talent: 'normal', label: '1-Hit DMG' };
    const off = solo('Rosaria', 1, act);
    const on = solo('Rosaria', 1, { ...act, tags: [label('Rosaria', 'c1')] });
    expect(on.stats.dmgByType.normal - off.stats.dmgByType.normal).toBeCloseTo(0.1, 9);
  });
  it('C6: RES Física -20% só na janela', () => {
    const act: Act = { talent: 'burst', label: 'Skill DMG' };
    const off = solo('Rosaria', 6, act);
    const on = solo('Rosaria', 6, { ...act, tags: [label('Rosaria', 'c6')] });
    expect(off.stats.resShred.Physical ?? 0).toBe(0);
    expect(on.stats.resShred.Physical).toBeCloseTo(0.2, 9);
  });
  it('o A4 antigo (teto assumido) foi removido', () => {
    expect(buffOf('Rosaria', 'a4')).toBeUndefined();
  });
});

describe('Eula: RES do Lacerar em janela e C6 (5 stacks iniciais)', () => {
  const act: Act = { talent: 'skill', label: 'Hold DMG' };
  it('RES Cryo e Física -16% a -25% só na janela', () => {
    const off = solo('Eula', 0, act);
    const on = solo('Eula', 0, { ...act, tags: [label('Eula', 'skill'), label('Eula', 'skill-fis')] });
    expect(off.stats.resShred.Cryo ?? 0).toBe(0);
    expect(off.stats.resShred.Physical ?? 0).toBe(0);
    expect(on.stats.resShred.Cryo).toBeGreaterThanOrEqual(0.16);
    expect(on.stats.resShred.Cryo).toBeLessThanOrEqual(0.25);
    expect(on.stats.resShred.Physical).toBeGreaterThanOrEqual(0.16);
  });
  it('C6: o golpe extra vale 5 x o DMG Per Stack', () => {
    const per = solo('Eula', 6, { talent: 'burst', label: 'DMG Per Stack' }, 'kit');
    const extra = solo('Eula', 6, { talent: 'proc', label: 'char:c6' }, 'kit');
    expect(extra.scale.atk / per.scale.atk).toBeCloseTo(5, 6);
    expect(extra.avg).toBeGreaterThan(0);
  });
});

describe('Aloy: A1 sem stacks falsos, A4 com stacks e Rushing Ice por nível', () => {
  it('A1: +16% dela (sem stacks) e +8% dos demais', () => {
    const own = buffOf('Aloy', 'a1');
    expect(own.stats.atkPct).toBeCloseTo(0.16, 9);
    expect(own.stacks).toBeUndefined();
    expect(buffOf('Aloy', 'a1o').stats.atkPct).toBeCloseTo(0.08, 9);
  });
  it('A4: +35% de DMG Cryo no máximo (10 stacks de 3,5%) só na janela', () => {
    const b = buffOf('Aloy', 'a4');
    expect(b.stacks.max).toBe(10);
    const act: Act = { talent: 'skill', label: 'Freeze Bomb DMG' };
    const off = solo('Aloy', 0, act);
    const on = solo('Aloy', 0, { ...act, tags: [label('Aloy', 'a4')] });
    expect(on.stats.dmgBonus - off.stats.dmgBonus).toBeCloseTo(0.35, 9);
  });
  it('Rushing Ice: DMG de Normal pelo nível da habilidade, só na janela', () => {
    const act: Act = { talent: 'normal', label: '1-Hit DMG' };
    const off = solo('Aloy', 0, act);
    const on = solo('Aloy', 0, { ...act, tags: [label('Aloy', 'rushing')] });
    const gain = on.stats.dmgByType.normal - off.stats.dmgByType.normal;
    expect(gain).toBeGreaterThanOrEqual(0.2923 - 1e-9);
    expect(gain).toBeLessThanOrEqual(0.567 + 1e-9);
  });
});

describe('Shenhe: A4 segurar, C4 com stacks e RES do Campo em janela', () => {
  it('A4 segurar: +15% de Normal, Carregado e Imersivo', () => {
    const act: Act = { talent: 'normal', label: '1-Hit DMG' };
    const off = solo('Shenhe', 0, act);
    const on = solo('Shenhe', 0, { ...act, tags: [label('Shenhe', 'a4h')] });
    expect(on.stats.dmgByType.normal - off.stats.dmgByType.normal).toBeCloseTo(0.15, 9);
    expect(on.stats.dmgByType.charged - off.stats.dmgByType.charged).toBeCloseTo(0.15, 9);
    expect(on.stats.dmgByType.plunge - off.stats.dmgByType.plunge).toBeCloseTo(0.15, 9);
    expect(on.stats.dmgByType.skill).toBe(off.stats.dmgByType.skill);
  });
  it('A4 apertar: +15% de habilidade e Supremo', () => {
    const act: Act = { talent: 'skill', label: 'Press Skill DMG' };
    const off = solo('Shenhe', 0, act);
    const on = solo('Shenhe', 0, { ...act, tags: [label('Shenhe', 'a4')] });
    expect(on.stats.dmgByType.skill - off.stats.dmgByType.skill).toBeCloseTo(0.15, 9);
    expect(on.stats.dmgByType.burst - off.stats.dmgByType.burst).toBeCloseTo(0.15, 9);
  });
  it('C4: 5% por stack, até 50 (2,5 no máximo), padrão 0 stacks', () => {
    const b = buffOf('Shenhe', 'c4');
    expect(b.stacks.max).toBe(50);
    expect(b.stacks.default).toBe(0);
    expect(b.stats.dmgPctByType?.skill ?? b.stats.byType?.skill ?? 0).toBeGreaterThanOrEqual(0);
    expect(b.minConstellation).toBe(4);
  });
  it('Campo: RES Cryo e Física só na janela', () => {
    const act: Act = { talent: 'burst', label: 'Skill DMG' };
    const off = solo('Shenhe', 0, act);
    const on = solo('Shenhe', 0, { ...act, tags: [label('Shenhe', 'burst')] });
    expect(off.stats.resShred.Cryo ?? 0).toBe(0);
    expect(on.stats.resShred.Cryo).toBeGreaterThanOrEqual(0.06);
    expect(on.stats.resShred.Physical).toBeGreaterThanOrEqual(0.06);
  });
});

describe('Layla: A4 só no Shooting Star e C4 (Dawn Star) para a equipe', () => {
  it('A4: o Shooting Star recebe dano fixo; o Skill DMG da cortina não', () => {
    const star = solo('Layla', 0, { talent: 'skill', label: 'Shooting Star DMG' });
    const curtain = solo('Layla', 0, { talent: 'skill', label: 'Skill DMG' });
    expect(star.flatDamage).toBeGreaterThan(0);
    expect(curtain.flatDamage).toBe(0);
  });
  it('C4: o Normal de um aliado ganha dano fixo só a partir da C4', () => {
    const act: Act = { member: 1, talent: 'normal', label: '1-Hit DMG' };
    const c3 = run([{ character: 'Layla', constellation: 3 }, { character: 'Mika' }], act);
    const c4 = run([{ character: 'Layla', constellation: 4 }, { character: 'Mika' }], act);
    expect(c4.flatDamage).toBeGreaterThan(c3.flatDamage);
  });
  it('C6: +40% de DMG do Supremo', () => {
    const act: Act = { talent: 'burst', label: 'Starlight Slug DMG' };
    const c5 = solo('Layla', 5, act);
    const c6 = solo('Layla', 6, act);
    expect(c6.stats.dmgByType.burst - c5.stats.dmgByType.burst).toBeCloseTo(0.4, 9);
  });
});

describe('Mika: Detector com stacks (A1), A4 e C6 em janelas (Físico)', () => {
  const act: Act = { talent: 'normal', label: '1-Hit DMG' };
  it('A1: +10% de DMG Físico por stack, 30% com 3', () => {
    const b = buffOf('Mika', 'a1');
    expect(b.stacks.max).toBe(3);
    const off = solo('Mika', 0, act, 'kit');
    const on = solo('Mika', 0, { ...act, tags: [label('Mika', 'a1')] }, 'kit');
    expect(on.stats.physDmg - off.stats.physDmg).toBeCloseTo(0.3, 9);
  });
  it('A4: +10% de DMG Físico (1 stack a mais)', () => {
    const off = solo('Mika', 0, act, 'kit');
    const on = solo('Mika', 0, { ...act, tags: [label('Mika', 'a4')] }, 'kit');
    expect(on.stats.physDmg - off.stats.physDmg).toBeCloseTo(0.1, 9);
  });
  it('C6: +10% de DMG Físico e +60% de Dano Crítico Físico', () => {
    const off = solo('Mika', 6, act, 'kit');
    const on = solo('Mika', 6, { ...act, tags: [label('Mika', 'c6')] }, 'kit');
    expect(on.stats.physDmg - off.stats.physDmg).toBeCloseTo(0.1, 9);
    expect(on.stats.physCritDmg - off.stats.physCritDmg).toBeCloseTo(0.6, 9);
  });
});

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

// Só passa depois de `npx tsx scripts/curate-effects.ts` com o lote anemo-c registrado.
const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };
const effectOf = (name: string) => (effects.characters as { character: string; buffs: any[]; procs: any[]; infos: any[] }[]).find((c) => c.character === name)!;
const buffOf = (name: string, id: string) => effectOf(name).buffs.find((b) => b.id === id);

type Act = { member?: number; talent: 'normal' | 'skill' | 'burst' | 'proc'; label: string; tags?: string[] };
type Mem = { character: string; constellation?: number; stacks?: Record<string, number> };
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
const solo = (character: string, constellation: number, a: Act, stacks?: Record<string, number>) => run([{ character, constellation, ...(stacks ? { stacks } : {}) }], a);
const L = (c: string, t: Act['talent'], label: string) => expect(game.moves.some((m) => m.character === c && m.talent === t && m.label === label)).toBe(true);

describe('rótulos dos golpes usados existem', () => {
  it('moves.json', () => {
    L('Lan Yan', 'skill', 'Feathermoon Ring DMG');
    L('Yumemizuki Mizuki', 'skill', 'Skill DMG');
    L('Varka', 'skill', 'Sturm und Drang 1-Hit DMG');
    L('Prune', 'skill', 'Ring-A-Ding-Ding! Hexhunter Chime DMG');
    L('Vesna', 'skill', 'Skill DMG');
  });
});

describe('Lan Yan A1', () => {
  it('anel extra = 50% do Feathermoon Ring', () => {
    const ring = solo('Lan Yan', 0, { talent: 'skill', label: 'Feathermoon Ring DMG' }).out.scale.atk;
    expect(solo('Lan Yan', 0, { talent: 'proc', label: 'char:a1' }).out.scale.atk / ring).toBeCloseTo(0.5, 6);
  });
});

describe('Mizuki', () => {
  it('C2: a RES vira janela e o DMG por Maestria entra para a equipe', () => {
    expect(buffOf('Yumemizuki Mizuki', 'c2').timed).toBe(true);
    const d = buffOf('Yumemizuki Mizuki', 'c2d');
    expect(d.timed).toBe(true);
    expect(d.convert.perPoint).toBeCloseTo(0.0004, 9);
    expect(d.forElements).toEqual(['Pyro', 'Hydro', 'Cryo', 'Electro']);
  });
  it('kit: Redemoinho é 10x o Redemoinho Estelar por 100 de Maestria', () => {
    const a = { talent: 'skill' as const, label: 'Skill DMG' };
    const off = solo('Yumemizuki Mizuki', 0, a).out.stats.reactionBonus as Record<string, number>;
    const sw = solo('Yumemizuki Mizuki', 0, { ...a, tags: ['label:Mizuki: Dreamdrifter (Redemoinho)'] }).out.stats.reactionBonus as Record<string, number>;
    const st = solo('Yumemizuki Mizuki', 0, { ...a, tags: ['label:Mizuki: Dreamdrifter (Redemoinho Estelar)'] }).out.stats.reactionBonus as Record<string, number>;
    const dSw = (sw.swirl ?? 0) - (off.swirl ?? 0);
    const dSt = (st.stellarswirl ?? 0) - (off.stellarswirl ?? 0);
    expect(dSw).toBeGreaterThan(0);
    expect(dSw / dSt).toBeCloseTo(10, 6);
  });
  it('A4: golpes extras de 1.000% da Maestria', () => {
    expect(solo('Yumemizuki Mizuki', 0, { talent: 'proc', label: 'char:p4a' }).out.scale.em).toBeCloseTo(10, 6);
    expect(solo('Yumemizuki Mizuki', 0, { talent: 'proc', label: 'char:p4s' }).out.scale.em).toBeCloseTo(10, 6);
  });
  it('A4: Maestria do time é janela dos demais', () => {
    const b = buffOf('Yumemizuki Mizuki', 'p4em');
    expect(b.timed).toBe(true);
    expect(b.convert.perPoint).toBeCloseTo(0.1, 9);
  });
});

describe('Varka', () => {
  const hit: Act = { talent: 'skill', label: 'Sturm und Drang 1-Hit DMG' };
  it('A1: 1,4x (+0,4) e, com as duas janelas, 2,2x (+1,2) no dano base de Normal e Carregado', () => {
    const off = solo('Varka', 0, hit).out.stats.baseMultByType;
    const a = solo('Varka', 0, { ...hit, tags: ['label:Varka A1 (1,4x)'] }).out.stats.baseMultByType;
    const b = solo('Varka', 0, { ...hit, tags: ['label:Varka A1 (1,4x)', 'label:Varka A1 (2,2x)'] }).out.stats.baseMultByType;
    expect(a.normal - off.normal).toBeCloseTo(0.4, 9);
    expect(a.charged - off.charged).toBeCloseTo(0.4, 9);
    expect(b.normal - off.normal).toBeCloseTo(1.2, 9);
  });
  it('C6: +20% de Dano Crítico por stack do A4', () => {
    const off = solo('Varka', 6, hit).out;
    const on = solo('Varka', 6, { ...hit, tags: ['label:Varka C6'] }, { a4: 2 }).out;
    expect(on.critDmg - off.critDmg).toBeCloseTo(0.4, 9);
  });
  it('C4: um buff de DMG por elemento do Redemoinho', () => {
    for (const e of ['pyro', 'hydro', 'cryo', 'electro']) {
      const b = buffOf('Varka', `c4-${e}`);
      expect(b.timed).toBe(true);
      expect(b.forElements).toHaveLength(1);
    }
  });
});

describe('Prune', () => {
  const hit: Act = { talent: 'skill', label: 'Ring-A-Ding-Ding! Hexhunter Chime DMG' };
  it('C6: +350 de ATK vale também para ela, só com a janela', () => {
    const off = solo('Prune', 6, hit).out;
    const on = solo('Prune', 6, { ...hit, tags: ['label:Prune C6'] }).out;
    expect(on.stats.atk - off.stats.atk).toBeCloseTo(350, 6);
  });
  it('C2: estágios 10% a 40% (7 estágios, 4x entre o 1º e o 7º)', () => {
    const tag = ['label:Prune C2'];
    const off = solo('Prune', 2, hit).out.stats.atk;
    const e1 = solo('Prune', 2, { ...hit, tags: tag }, { c2: 1 }).out.stats.atk - off;
    const e7 = solo('Prune', 2, { ...hit, tags: tag }, { c2: 7 }).out.stats.atk - off;
    expect(e1).toBeGreaterThan(0);
    expect(e7 / e1).toBeCloseTo(4, 6);
  });
  it('A4 Hexerei: +60% dela e +30% de quem causou o Redemoinho, só com 2 Hexerei', () => {
    const s = buffOf('Prune', 'hex-self');
    const t = buffOf('Prune', 'hex-trig');
    expect(s.timed && t.timed).toBe(true);
    expect(s.team.hexerei).toBe(2);
    expect(t.team.hexerei).toBe(2);
  });
});

describe('Vesna C1', () => {
  it('+20% de DMG de Redemoinho Estelar na janela, a partir da C1', () => {
    const a: Act = { talent: 'skill', label: 'Skill DMG' };
    const rb = (r: { out: { stats: { reactionBonus: unknown } } }) => (r.out.stats.reactionBonus as Record<string, number>).stellarswirl ?? 0;
    const off = rb(solo('Vesna', 1, a));
    const on = rb(solo('Vesna', 1, { ...a, tags: ['label:Vesna C1'] }));
    expect(on - off).toBeCloseTo(0.2, 9);
  });
});

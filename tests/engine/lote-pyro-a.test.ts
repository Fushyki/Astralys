import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

// Só passa depois de `npx tsx scripts/curate-effects.ts` com o lote pyro-a registrado.
const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };

type Act = { talent: 'normal' | 'skill' | 'burst' | 'proc'; label: string; tags?: string[] };
function run(character: string, constellation: number, a: Act, mode: 'personagem' | 'kit' = 'personagem') {
  const p = {
    ...sampleProject(), compat: 'none', elementMode: mode,
    members: [{ ...defaultMember(character, game), constellation }],
    actions: [{ id: 'a0', member: 0, move: { character, talent: a.talent, label: a.label, variant: 0 }, executions: 1, reaction: 'none', activeTags: a.tags ?? [], tagSource: 'manual', dmgAdjust: 0, time: 0 }],
    buffWindows: [], disabled: [],
  };
  const r = resolveProject(p as never, game, effects);
  const asm = assembleTeam(r.team);
  const [out] = evaluateRotation({ members: r.team.members, assembly: asm, config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions;
  return { out, tags: [...new Set(asm.buffs.map((b) => b.tag))] };
}
const hit = { talent: 'normal' as const, label: '1-Hit DMG' };

describe('debuffs com duração viram janela (não ficam sempre ligados)', () => {
  it('Xiangling C1: -15% de RES Pyro só com a janela ligada', () => {
    const off = run('Xiangling', 1, hit).out.avg;
    const on = run('Xiangling', 1, { ...hit, tags: ['label:Xiangling C1'] }).out.avg;
    expect(on).toBeGreaterThan(off);
  });
  it('Klee C2: -23% de DEF só com a janela ligada', () => {
    const off = run('Klee', 2, hit).out.avg;
    const on = run('Klee', 2, { ...hit, tags: ['label:Klee C2'] }).out.avg;
    expect(on).toBeGreaterThan(off);
  });
  it('Xinyan C4: -15% de RES Física só com a janela ligada (golpe Físico)', () => {
    const off = run('Xinyan', 4, hit, 'kit').out.avg;
    const on = run('Xinyan', 4, { ...hit, tags: ['label:Xinyan C4'] }, 'kit').out.avg;
    expect(on).toBeGreaterThan(off);
  });
});

describe('Hu Tao C2: 10% do HP máximo só no Blood Blossom', () => {
  it('soma 0,1 x HP no Blood Blossom e nada no Supremo', () => {
    const all = run('Hu Tao', 2, { talent: 'skill', label: 'Blood Blossom DMG' }).tags;
    const bb = run('Hu Tao', 2, { talent: 'skill', label: 'Blood Blossom DMG', tags: all }).out;
    const burst = run('Hu Tao', 2, { talent: 'burst', label: 'Skill DMG', tags: all }).out;
    expect(bb.flatDamage).toBeCloseTo(0.1 * bb.stats.hp, 6);
    expect(burst.flatDamage).toBe(0);
    const c1 = run('Hu Tao', 1, { talent: 'skill', label: 'Blood Blossom DMG', tags: all }).out;
    expect(c1.flatDamage).toBe(0);
  });
});

describe('Klee C1: faíscas (120% do dano do Sparks n Splash)', () => {
  it('só existe a partir da C1 e vale 1,2 x o golpe do Supremo', () => {
    const spark = run('Klee', 1, { talent: 'proc', label: 'char:c1' }).out;
    const burst = run('Klee', 1, { talent: 'burst', label: "Sparks 'n' Splash DMG" }).out;
    expect(spark.avg).toBeGreaterThan(0);
    expect(spark.avg / burst.avg).toBeCloseTo(1.2, 3);
  });
});

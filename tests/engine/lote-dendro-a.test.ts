import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

// Só passa depois de `npx tsx scripts/curate-effects.ts` com o lote dendro-a registrado.
const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };
const effectOf = (name: string) => (effects.characters as { character: string; buffs: any[]; procs: any[] }[]).find((c) => c.character === name)!;

type Act = { member?: number; talent: 'normal' | 'skill' | 'burst' | 'proc'; label: string; tags?: string[] };
type Mem = { character: string; constellation?: number };
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
const has = (character: string, talent: string, label: string) => game.moves.some((m) => m.character === character && m.talent === talent && m.label === label);

describe('rótulos usados existem no cadastro', () => {
  it('golpes', () => {
    expect(has('Tighnari', 'burst', 'Tanglevine Shaft DMG')).toBe(true);
    expect(has('Nahida', 'skill', 'Tri-Karma Purification DMG')).toBe(true);
    expect(has('Alhaitham', 'burst', 'Single-Instance DMG')).toBe(true);
    expect(has('Alhaitham', 'normal', '1-Hit DMG')).toBe(true);
  });
});

describe('Tighnari: A4 também no Supremo e C4 com +60 extra', () => {
  it('A4 alcança Carregado e Supremo', () => {
    const a4 = effectOf('Tighnari').buffs.find((b) => b.id === 'a4');
    expect(a4.convert.to).toEqual(expect.arrayContaining(['charged', 'burst']));
    expect(a4.convert.cap).toBeCloseTo(0.6, 9);
  });
  it('C4: a janela da reação soma mais 60 de Maestria', () => {
    const act: Act = { talent: 'burst', label: 'Tanglevine Shaft DMG' };
    const off = solo('Tighnari', 4, act);
    const on = solo('Tighnari', 4, { ...act, tags: ['label:Tighnari C4 (reação)'] });
    expect(on.stats.em - off.stats.em).toBeCloseTo(60, 6);
  });
});

describe('Nahida C2: DEF em janela e crítico das reações', () => {
  const act: Act = { talent: 'skill', label: 'Tri-Karma Purification DMG' };
  it('DEF -30% só com a janela ligada', () => {
    const off = solo('Nahida', 2, act);
    const on = solo('Nahida', 2, { ...act, tags: ['label:Nahida C2 (DEF)'] });
    expect(off.stats.defShred).toBe(0);
    expect(on.stats.defShred).toBeCloseTo(0.3, 9);
  });
  it('crítico de Queimadura, Florescer, Hiperflorescer e Brotar: 20% e 100%', () => {
    const on = solo('Nahida', 2, { ...act, tags: ['label:Nahida C2 (crítico das reações)'] });
    const rb = on.stats.reactionBonus as Record<string, number>;
    for (const r of ['burning', 'bloom', 'hyperbloom', 'burgeon']) {
      expect(rb[`${r}CritRate`]).toBeCloseTo(0.2, 9);
      expect(rb[`${r}CritDmg`]).toBeCloseTo(1, 9);
    }
    expect(rb.lunarbloomCritRate).toBeCloseTo(0.1, 9);
    expect(rb.lunarbloomCritDmg).toBeCloseTo(0.2, 9);
  });
});

describe('Alhaitham C4: Espelhos consumidos e gerados', () => {
  const act: Act = { talent: 'normal', label: '1-Hit DMG' };
  it('+30 de Maestria por Espelho consumido para os demais (3 por padrão)', () => {
    const team: Mem[] = [{ character: 'Alhaitham', constellation: 4 }, { character: 'Kaveh' }];
    const off = run(team, { ...act, member: 1 });
    const on = run(team, { ...act, member: 1, tags: ['label:Alhaitham C4 (Maestria dos aliados)'] });
    expect(on.stats.em - off.stats.em).toBeCloseTo(90, 6);
  });
  it('a Maestria dos aliados não vai para ele mesmo', () => {
    const off = solo('Alhaitham', 4, act);
    const on = solo('Alhaitham', 4, { ...act, tags: ['label:Alhaitham C4 (Maestria dos aliados)'] });
    expect(on.stats.em).toBeCloseTo(off.stats.em, 6);
  });
  it('+10% de DMG Dendro por Espelho gerado, só na janela', () => {
    const off = solo('Alhaitham', 4, act);
    const on = solo('Alhaitham', 4, { ...act, tags: ['label:Alhaitham C4 (DMG Dendro)'] });
    expect(on.stats.dmgBonus - off.stats.dmgBonus).toBeCloseTo(0.3, 9);
  });
});

describe('Golpes extras sem tipo inventado (Tighnari C6, Yaoyao C6)', () => {
  it('entram na rotação e não têm tipo de golpe', () => {
    const tig = effectOf('Tighnari').procs.find((p) => p.id === 'c6');
    const yao = effectOf('Yaoyao').procs.find((p) => p.id === 'c6');
    expect(tig.hitType).toBeUndefined();
    expect(yao.hitType).toBeUndefined();
    expect(solo('Tighnari', 6, { talent: 'proc', label: 'char:c6' }).avg).toBeGreaterThan(0);
    expect(solo('Yaoyao', 6, { talent: 'proc', label: 'char:c6' }).avg).toBeGreaterThan(0);
  });
});

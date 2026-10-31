import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

// Só passa depois de `npx tsx scripts/curate-effects.ts` com o lote electro-a registrado.
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
const hasMove = (character: string, label: string) => game.moves.some((m) => m.character === character && m.label === label);

describe('rótulos dos golpes usados existem no cadastro', () => {
  it('Lisa, Razor, Beidou, Keqing', () => {
    for (const [c, l] of [['Lisa', 'Press DMG'], ['Razor', 'Press Skill DMG'], ['Beidou', 'Skill DMG'], ['Keqing', '1-Hit DMG']]) {
      expect(hasMove(c, l), `${c}: ${l}`).toBe(true);
    }
  });
});

describe('Lisa A4: -15% de DEF vira janela', () => {
  it('só vale com a etiqueta ligada', () => {
    const act: Act = { member: 0, talent: 'skill', label: 'Press DMG' };
    const [off] = run([{ character: 'Lisa' }], [act]);
    const [on] = run([{ character: 'Lisa' }], [{ ...act, tags: ['label:Lisa A4'] }]);
    expect(on.avg).toBeGreaterThan(off.avg);
  });
});

describe('Razor', () => {
  it('C4: -15% de DEF por 7 s só com a etiqueta ligada', () => {
    const act: Act = { member: 0, talent: 'skill', label: 'Press Skill DMG' };
    const [off] = run([{ character: 'Razor', constellation: 4 }], [act]);
    const [on] = run([{ character: 'Razor', constellation: 4 }], [{ ...act, tags: ['label:Razor C4'] }]);
    expect(on.avg).toBeGreaterThan(off.avg);
  });
  it('C6: o relâmpago de 100% do ATK é um golpe extra', () => {
    const [r] = run([{ character: 'Razor', constellation: 6 }], [{ member: 0, talent: 'proc', label: 'char:c6l' }]);
    expect(r.avg).toBeGreaterThan(0);
  });
  it('A4: o raio Hexerei de 150% do ATK é um golpe extra', () => {
    const [r] = run([{ character: 'Razor' }], [{ member: 0, talent: 'proc', label: 'char:a4h' }]);
    expect(r.avg).toBeGreaterThan(0);
  });
});

describe('Beidou C6: -15% de RES Electro vira janela', () => {
  it('só vale com a etiqueta ligada', () => {
    const act: Act = { member: 0, talent: 'burst', label: 'Skill DMG' };
    const [off] = run([{ character: 'Beidou', constellation: 6 }], [act]);
    const [on] = run([{ character: 'Beidou', constellation: 6 }], [{ ...act, tags: ['label:Beidou C6'] }]);
    expect(on.avg).toBeGreaterThan(off.avg);
  });
});

describe('Keqing', () => {
  const hit: Act = { member: 0, talent: 'normal', label: '1-Hit DMG' };
  it('A4: +15% de Taxa Crítica e +15% de Recarga só na janela', () => {
    const [off] = run([{ character: 'Keqing' }], [hit]);
    const [on] = run([{ character: 'Keqing' }], [{ ...hit, tags: ['label:Keqing A4'] }]);
    expect(on.critRate - off.critRate).toBeCloseTo(0.15, 9);
    expect(on.stats.er - off.stats.er).toBeCloseTo(0.15, 9);
  });
  it('C6: +6% de DMG por efeito, 4 efeitos = 24%; 2 efeitos = 12%', () => {
    const [off] = run([{ character: 'Keqing', constellation: 6 }], [hit]);
    const [four] = run([{ character: 'Keqing', constellation: 6 }], [{ ...hit, tags: ['label:Keqing C6'] }]);
    const [two] = run([{ character: 'Keqing', constellation: 6, stacks: { c6: 2 } }], [{ ...hit, tags: ['label:Keqing C6'] }]);
    const gain = (r: { stats: { dmgBonus: number } }) => r.stats.dmgBonus - off.stats.dmgBonus;
    expect(gain(four)).toBeCloseTo(0.24, 9);
    expect(gain(two)).toBeCloseTo(0.12, 9);
  });
});

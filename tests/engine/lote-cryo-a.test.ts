import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

// Só passa depois de `npx tsx scripts/curate-effects.ts` com o lote cryo-a registrado.
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
    expect(has('Kamisato Ayaka', 'burst', 'Cutting DMG')).toBe(true);
    expect(has('Qiqi', 'burst', 'Skill DMG')).toBe(true);
    expect(has('Chongyun', 'skill', 'Skill DMG')).toBe(true);
    expect(has('Chongyun', 'burst', 'Skill DMG')).toBe(true);
    expect(has('Ganyu', 'normal', 'Frostflake Arrow DMG')).toBe(true);
    expect(has('Ganyu', 'skill', 'Skill DMG')).toBe(true);
    expect(has('Diona', 'skill', 'Icy Paw DMG')).toBe(true);
  });
});

describe('Ayaka C4: DEF -30% vira janela', () => {
  it('só com a janela ligada', () => {
    const act: Act = { talent: 'burst', label: 'Cutting DMG' };
    const off = solo('Kamisato Ayaka', 4, act);
    const on = solo('Kamisato Ayaka', 4, { ...act, tags: ['label:Ayaka C4'] });
    expect(off.stats.defShred).toBe(0);
    expect(on.stats.defShred).toBeCloseTo(0.3, 9);
  });
});

describe('Qiqi: Radiance (A4, C2) e C6', () => {
  const act: Act = { talent: 'burst', label: 'Skill DMG' };
  it('A4: +50% de Supercondutor, Estelar-Conduct e Redemoinho Estelar na janela', () => {
    const on = solo('Qiqi', 0, { ...act, tags: ['label:Qiqi A4 (Radiance)'] });
    const rb = on.stats.reactionBonus as Record<string, number>;
    expect(rb.superconduct).toBeCloseTo(0.5, 9);
    expect(rb.stellarconduct).toBeCloseTo(0.5, 9);
    expect(rb.stellarswirl).toBeCloseTo(0.5, 9);
  });
  it('C2: +50% de ATK na janela', () => {
    const off = solo('Qiqi', 2, act);
    const on = solo('Qiqi', 2, { ...act, tags: ['label:Qiqi C2 (Radiance: ATK)'] });
    expect(on.stats.atk).toBeGreaterThan(off.stats.atk);
    expect(effectOf('Qiqi').buffs.find((b) => b.id === 'c2atk').stats.atkPct).toBeCloseTo(0.5, 9);
  });
  it('C6: dano fixo Estelar = 6 x ATK dela, para o outro membro', () => {
    const team: Mem[] = [{ character: 'Qiqi', constellation: 6 }, { character: 'Kaeya' }];
    const k = run(team, { member: 1, talent: 'burst', label: 'Skill DMG', tags: ['label:Qiqi C6 (Glimpse of Mystery)'] });
    const rb = k.stats.reactionBonus as Record<string, number>;
    // a conversão usa o ATK da montagem (rolls do build), não o da ação avaliada; por isso confere o coeficiente 6 no efeito
    expect(effectOf('Qiqi').buffs.find((b) => b.id === 'c6').convert.perPoint).toBe(6);
    expect(rb.stellarconductFlat).toBeGreaterThan(0);
    expect(rb.stellarswirlFlat).toBeCloseTo(rb.stellarconductFlat, 6);
  });
});

describe('Chongyun A4: RES Cryo -10% (janela) e lâmina de 100% da habilidade', () => {
  it('RES só na janela', () => {
    const act: Act = { talent: 'burst', label: 'Skill DMG' };
    const off = solo('Chongyun', 0, act);
    const on = solo('Chongyun', 0, { ...act, tags: ['label:Chongyun A4'] });
    expect(off.stats.resShred.Cryo ?? 0).toBe(0);
    expect(on.stats.resShred.Cryo).toBeCloseTo(0.1, 9);
  });
  it('a lâmina vale 1 x o Skill DMG da habilidade', () => {
    const skill = solo('Chongyun', 0, { talent: 'skill', label: 'Skill DMG' });
    const extra = solo('Chongyun', 0, { talent: 'proc', label: 'char:a4' });
    expect(extra.scale.atk / skill.scale.atk).toBeCloseTo(1, 6);
    expect(extra.avg).toBeGreaterThan(0);
  });
});

describe('Ganyu: A1 só em Normal, C1 em janela e C4 em degraus', () => {
  it('A1: +20% de Taxa Crítica na Frostflake Arrow e nada na habilidade', () => {
    const arrow: Act = { talent: 'normal', label: 'Frostflake Arrow DMG' };
    const off = solo('Ganyu', 0, arrow);
    const on = solo('Ganyu', 0, { ...arrow, tags: ['label:Ganyu A1'] });
    expect(on.critRate - off.critRate).toBeCloseTo(0.2, 9);
    const sk: Act = { talent: 'skill', label: 'Skill DMG' };
    expect(solo('Ganyu', 0, { ...sk, tags: ['label:Ganyu A1'] }).critRate).toBeCloseTo(solo('Ganyu', 0, sk).critRate, 9);
  });
  it('C1: RES Cryo -15% só na janela', () => {
    const act: Act = { talent: 'normal', label: 'Frostflake Arrow DMG' };
    const off = solo('Ganyu', 1, act);
    const on = solo('Ganyu', 1, { ...act, tags: ['label:Ganyu C1'] });
    expect(off.stats.resShred.Cryo ?? 0).toBe(0);
    expect(on.stats.resShred.Cryo).toBeCloseTo(0.15, 9);
  });
  it('C4: 5 degraus de 5%, +25% no máximo', () => {
    const act: Act = { talent: 'burst', label: 'Ice Shard DMG' };
    const off = solo('Ganyu', 4, act);
    const on = solo('Ganyu', 4, { ...act, tags: ['label:Ganyu C4'] });
    expect(on.stats.dmgBonus - off.stats.dmgBonus).toBeCloseTo(0.25, 9);
    expect(effectOf('Ganyu').buffs.find((b) => b.id === 'c4').stacks.max).toBe(5);
  });
});

describe('Diona: A4 (Icy Paws extras) e C6 (HP e Radiance)', () => {
  it('A4: cada Icy Paw extra vale 1 x o Icy Paw DMG', () => {
    const paw = solo('Diona', 0, { talent: 'skill', label: 'Icy Paw DMG' });
    const extra = solo('Diona', 0, { talent: 'proc', label: 'char:a4' });
    expect(extra.scale.atk / paw.scale.atk).toBeCloseTo(1, 6);
    expect(extra.avg).toBeGreaterThan(0);
  });
  it('C6: +25% de HP só a partir da C6', () => {
    const act: Act = { talent: 'burst', label: 'Skill DMG' };
    expect(solo('Diona', 6, act).stats.hp).toBeGreaterThan(solo('Diona', 5, act).stats.hp);
    expect(effectOf('Diona').buffs.find((b) => b.id === 'c6hp').stats.hpPct).toBeCloseTo(0.25, 9);
  });
  it('C6 Radiance: +40% de reação Estelar/Supercondutor na janela', () => {
    const on = solo('Diona', 6, { talent: 'burst', label: 'Skill DMG', tags: ['label:Diona C6 (Radiance)'] });
    const rb = on.stats.reactionBonus as Record<string, number>;
    expect(rb.superconduct).toBeCloseTo(0.4, 9);
    expect(rb.stellarswirl).toBeCloseTo(0.4, 9);
  });
});

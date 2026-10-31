import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

// Só passa depois de `npx tsx scripts/curate-effects.ts` com o lote geo-a registrado.
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
  for (const [c, l] of [
    ['Zhongli', 'Hold DMG'], ['Zhongli', '1-Hit DMG'], ['Zhongli', 'Stone Stele/Resonance DMG'],
    ['Gorou', '1-Hit DMG'], ['Gorou', 'Skill DMG'],
    ['Arataki Itto', 'Arataki Kesagiri Combo Slash DMG'], ['Arataki Itto', 'Arataki Kesagiri Final Slash DMG'], ['Arataki Itto', 'Saichimonji Slash DMG'], ['Arataki Itto', '1-Hit DMG'],
    ['Albedo', '1-Hit DMG'], ['Fischl', '1-Hit DMG'], ['Noelle', 'Charged Attack Cyclic DMG'],
  ]) expect(has(c, l), `${c} ${l}`).toBe(true);
});

describe('Zhongli', () => {
  it('Escudo de Jade: RES elemental e Física -20% só na janela', () => {
    const act: Act = { talent: 'normal', label: '1-Hit DMG' };
    const off = solo('Zhongli', 0, act);
    const on = solo('Zhongli', 0, { ...act, tags: [label('Zhongli', 'shield')] });
    expect(buffOf('Zhongli', 'shield').timed).toBe(true);
    expect(off.stats.resShred.Pyro ?? 0).toBe(0);
    expect(on.stats.resShred.Pyro).toBeCloseTo(0.2, 9);
    expect(on.stats.resShred.Physical).toBeCloseTo(0.2, 9);
  });
  it('A4: a Stele/Hold soma 1,9% do HP, contra 1,39% do Normal', () => {
    const hold = solo('Zhongli', 0, { talent: 'skill', label: 'Hold DMG' });
    const hit = solo('Zhongli', 0, { talent: 'normal', label: '1-Hit DMG' });
    expect(hold.flatDamage).toBeGreaterThan(0);
    expect(hold.flatDamage / hit.flatDamage).toBeCloseTo(0.019 / 0.0139, 6);
  });
});

describe('Noelle (conferida): C2 no Carregado e C4 em golpe extra', () => {
  it('C2: +15% de DMG de Carregado só a partir da C2', () => {
    const act: Act = { talent: 'normal', label: 'Charged Attack Cyclic DMG' };
    expect(solo('Noelle', 2, act).stats.dmgByType.charged - solo('Noelle', 1, act).stats.dmgByType.charged).toBeCloseTo(0.15, 9);
  });
  it('C4: golpe extra de 400% do ATK', () => {
    expect(solo('Noelle', 4, { talent: 'proc', label: 'char:c4' }).scale.atk).toBeCloseTo(4, 6);
  });
  it('C6: +50% da DEF como ATK fixo (convert)', () => {
    expect(buffOf('Noelle', 'c6').convert.perPoint).toBeCloseTo(0.5, 9);
  });
});

describe('Albedo: A4 Hexerei (DMG pela DEF dele)', () => {
  const team: Mem[] = [{ character: 'Albedo', factions: ['hexerei'] }, { character: 'Fischl', factions: ['hexerei'] }];
  const hit: Act = { member: 1, talent: 'normal', label: '1-Hit DMG' };
  it('Solar Isotoma: até +12% de DMG, só na janela', () => {
    const off = run(team, hit);
    const on = run(team, { ...hit, tags: [label('Albedo', 'a4hs')] });
    const gain = on.stats.dmgBonus - off.stats.dmgBonus;
    expect(gain).toBeGreaterThan(0);
    expect(gain).toBeLessThanOrEqual(0.12 + 1e-9);
  });
  it('Silver Isotoma: até +30% e só para membro Hexerei', () => {
    const off = run(team, hit);
    const on = run(team, { ...hit, tags: [label('Albedo', 'a4hx')] });
    const gain = on.stats.dmgBonus - off.stats.dmgBonus;
    expect(gain).toBeGreaterThan(0);
    expect(gain).toBeLessThanOrEqual(0.3 + 1e-9);
    const plain: Mem[] = [{ character: 'Albedo', factions: ['hexerei'] }, { character: 'Fischl' }];
    expect(run(plain, { ...hit, tags: [label('Albedo', 'a4hx')] }).stats.dmgBonus).toBe(run(plain, hit).stats.dmgBonus);
  });
  it('sem 2 Hexerei no time o bônus não vale', () => {
    const solo1: Mem[] = [{ character: 'Albedo', factions: ['hexerei'] }, { character: 'Fischl' }];
    expect(run(solo1, { ...hit, tags: [label('Albedo', 'a4hs')] }).stats.dmgBonus).toBe(run(solo1, hit).stats.dmgBonus);
  });
});

describe('Gorou C6: o Dano Crítico Geo depende de quantos Geo há no time', () => {
  const act: Act = { talent: 'normal', label: '1-Hit DMG' };
  const gain = (team: string[]) => {
    const members: Mem[] = team.map((character, i) => ({ character, constellation: i === 0 ? 6 : 0 }));
    return run(members, { ...act, tags: [label('Gorou', 'c6')] }).critDmg - run(members, act).critDmg;
  };
  it('1 Geo: +10%, 2: +20%, 3: +40%', () => {
    expect(gain(['Gorou'])).toBeCloseTo(0.1, 9);
    expect(gain(['Gorou', 'Zhongli'])).toBeCloseTo(0.2, 9);
    expect(gain(['Gorou', 'Zhongli', 'Ningguang'])).toBeCloseTo(0.4, 9);
  });
});

describe('Itto: A4 só no Arataki Kesagiri; C6 saiu (pendente)', () => {
  it('A4: Combo e Final Slash somam 35% da DEF; Saichimonji e Normal não', () => {
    const combo = solo('Arataki Itto', 0, { talent: 'normal', label: 'Arataki Kesagiri Combo Slash DMG' });
    const fin = solo('Arataki Itto', 0, { talent: 'normal', label: 'Arataki Kesagiri Final Slash DMG' });
    expect(combo.flatDamage).toBeGreaterThan(0);
    expect(fin.flatDamage).toBeCloseTo(combo.flatDamage, 6);
    expect(solo('Arataki Itto', 0, { talent: 'normal', label: 'Saichimonji Slash DMG' }).flatDamage).toBe(0);
    expect(solo('Arataki Itto', 0, { talent: 'normal', label: '1-Hit DMG' }).flatDamage).toBe(0);
  });
  it('o C6 antigo (tipo "charged", que não casa com nenhum golpe) foi removido', () => {
    expect(buffOf('Arataki Itto', 'c6')).toBeUndefined();
  });
});

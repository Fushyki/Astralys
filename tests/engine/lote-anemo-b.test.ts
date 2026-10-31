import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, evaluateRotation, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { minimumRolls } from '../../src/engine/stats';
import { sampleProject } from '../../src/features/rotation/persistence';
import { defaultMember } from '../../src/features/rotation/teamOps';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };
const effectOf = (name: string) => (effects.characters as { character: string; buffs: any[]; procs: any[]; infos: any[] }[]).find((c) => c.character === name)!;

type Act = { talent: 'normal' | 'skill' | 'burst' | 'proc'; label: string; tags?: string[] };
function solo(character: string, constellation: number, a: Act, stacks?: Record<string, number>) {
  const p = {
    ...sampleProject(), compat: 'none', elementMode: 'personagem',
    members: [{ ...defaultMember(character, game), constellation, ...(stacks ? { stacks } : {}) }],
    actions: [{ id: 'a0', member: 0, move: { character, talent: a.talent, label: a.label, variant: 0 }, executions: 1, reaction: 'none', activeTags: a.tags ?? [], tagSource: 'manual', dmgAdjust: 0, time: 0 }],
    buffWindows: [], disabled: [],
  };
  const r = resolveProject(p as never, game, effects);
  const asm = assembleTeam(r.team);
  return evaluateRotation({ members: r.team.members, assembly: asm, config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions[0];
}
const L = (c: string, t: Act['talent'], label: string) => expect(game.moves.some((m) => m.character === c && m.talent === t && m.label === label)).toBe(true);

describe('rótulos dos golpes usados existem', () => {
  it('moves.json', () => {
    L('Shikanoin Heizou', 'skill', 'Skill DMG');
    L('Wanderer', 'burst', 'Skill DMG');
    L('Faruzan', 'burst', 'Skill DMG');
    L('Xianyun', 'skill', 'Driftcloud Wave DMG');
    L('Xianyun', 'normal', 'Plunge DMG');
    L('Chasca', 'skill', 'Shining Shadowhunt Shell DMG');
  });
});

describe('Heizou C6', () => {
  const hit: Act = { talent: 'skill', label: 'Skill DMG' };
  it('+4% de Taxa Crítica por Declension (4 stacks = 16%), só com a janela e a partir da C6', () => {
    const off = solo('Shikanoin Heizou', 6, hit);
    const on = solo('Shikanoin Heizou', 6, { ...hit, tags: ['label:Heizou C6 (Taxa Crítica)'] });
    expect(on.critRate - off.critRate).toBeCloseTo(0.16, 9);
    const two = solo('Shikanoin Heizou', 6, { ...hit, tags: ['label:Heizou C6 (Taxa Crítica)'] }, { c6: 2 });
    expect(two.critRate - off.critRate).toBeCloseTo(0.08, 9);
  });
  it('+32% de Dano Crítico só com a janela da Convicção', () => {
    const off = solo('Shikanoin Heizou', 6, hit);
    const on = solo('Shikanoin Heizou', 6, { ...hit, tags: ['label:Heizou C6 (Convicção)'] });
    expect(on.critDmg - off.critDmg).toBeCloseTo(0.32, 9);
  });
});

describe('Wanderer', () => {
  it('C2: +4% de DMG do Supremo por ponto, 200% com 50; padrão 0', () => {
    const burst: Act = { talent: 'burst', label: 'Skill DMG', tags: ['label:Wanderer C2'] };
    const off = solo('Wanderer', 2, { ...burst, tags: [] });
    expect(solo('Wanderer', 2, burst).stats.dmgByType.burst).toBeCloseTo(off.stats.dmgByType.burst, 9);
    const full = solo('Wanderer', 2, burst, { c2: 50 });
    expect(full.stats.dmgByType.burst - off.stats.dmgByType.burst).toBeCloseTo(2, 9);
    const ten = solo('Wanderer', 2, burst, { c2: 10 });
    expect(ten.stats.dmgByType.burst - off.stats.dmgByType.burst).toBeCloseTo(0.4, 9);
  });
  it('flechas do Descent: 4 x 35% do ATK; C1 soma 4 x 25%', () => {
    expect(solo('Wanderer', 0, { talent: 'proc', label: 'char:p2' }).scale.atk).toBeCloseTo(1.4, 6);
    expect(solo('Wanderer', 1, { talent: 'proc', label: 'char:c1' }).scale.atk).toBeCloseTo(1, 6);
  });
});

describe('Faruzan: RES Anemo do Supremo é janela', () => {
  it('só vale com a janela ligada', () => {
    expect(effectOf('Faruzan').buffs.find((b) => b.id === 'burst-res').timed).toBe(true);
    const hit: Act = { talent: 'burst', label: 'Skill DMG' };
    const off = solo('Faruzan', 0, hit);
    const on = solo('Faruzan', 0, { ...hit, tags: ['label:Faruzan: Pulso (RES)'] });
    expect(off.stats.resShred.Anemo ?? 0).toBe(0);
    expect(on.stats.resShred.Anemo).toBeGreaterThan(0);
  });
});

describe('Xianyun', () => {
  it('C6: Dano Crítico do Driftcloud Wave (habilidade) 15/35/70% por Skyladders', () => {
    const wave: Act = { talent: 'skill', label: 'Driftcloud Wave DMG', tags: ['label:Xianyun C6'] };
    const off = solo('Xianyun', 6, { ...wave, tags: [] });
    expect(solo('Xianyun', 6, wave).critDmg - off.critDmg).toBeCloseTo(0.7, 9);
    expect(solo('Xianyun', 6, wave, { c6: 1 }).critDmg - off.critDmg).toBeCloseTo(0.15, 5);
  });
  it('C2: Starwicker 400% do ATK (teto 18.000) no lugar de 200% (teto 9.000)', () => {
    const plunge: Act = { talent: 'normal', label: 'Plunge DMG' };
    const c1 = solo('Xianyun', 1, plunge);
    const c2 = solo('Xianyun', 2, plunge);
    // O dano fixo lê o ATK com todos os buffs ligados, não o da ação: compara os dois com o teto.
    expect(c1.flatDamage).toBeLessThanOrEqual(9000);
    expect(c2.flatDamage).toBeLessThanOrEqual(18000);
    expect(c2.flatDamage).toBeGreaterThan(1.9 * c1.flatDamage); // 2x pelo 400%, mais o ATK do C2
  });
});

describe('Chasca', () => {
  const shell: Act = { talent: 'skill', label: 'Shining Shadowhunt Shell DMG' };
  it('A1: +15/35/65% de DMG (3 stacks = 65%) só na janela', () => {
    const off = solo('Chasca', 0, shell);
    const on = solo('Chasca', 0, { ...shell, tags: ['label:Chasca A1 (Spirit of the Radiant Shadow)'] });
    expect(on.stats.dmgByType.skill - off.stats.dmgByType.skill).toBeCloseTo(0.65, 5);
    const one = solo('Chasca', 0, { ...shell, tags: ['label:Chasca A1 (Spirit of the Radiant Shadow)'] }, { a1: 1 });
    expect(one.stats.dmgByType.skill - off.stats.dmgByType.skill).toBeCloseTo(0.15, 5);
  });
  it('C6: +120% de Dano Crítico só com a janela e a partir da C6', () => {
    const off = solo('Chasca', 6, shell);
    const on = solo('Chasca', 6, { ...shell, tags: ['label:Chasca C6 (Fatal Rounds)'] });
    expect(on.critDmg - off.critDmg).toBeCloseTo(1.2, 9);
  });
});

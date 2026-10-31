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
type Mem = { character: string; constellation?: number; factions?: ('hexerei' | 'moonsign')[] };
function team(members: Mem[], a: Act, stacks?: Record<string, number>) {
  const p = {
    ...sampleProject(), compat: 'none', elementMode: 'personagem',
    members: members.map((m, i) => ({ ...defaultMember(m.character, game), ...m, ...(i === 0 && stacks ? { stacks } : {}) })),
    actions: [{ id: 'a0', member: 0, move: { character: members[0].character, talent: a.talent, label: a.label, variant: 0 }, executions: 1, reaction: 'none', activeTags: a.tags ?? [], tagSource: 'manual', dmgAdjust: 0, time: 0 }],
    buffWindows: [], disabled: [],
  };
  const r = resolveProject(p as never, game, effects);
  const asm = assembleTeam(r.team);
  return evaluateRotation({ members: r.team.members, assembly: asm, config: r.team.config, rolls: r.team.members.map(() => minimumRolls(2)), flatEffects: r.flatEffects }, r.actions).actions[0];
}
const solo = (character: string, constellation: number, a: Act, stacks?: Record<string, number>) => team([{ character, constellation }], a, stacks);
const L = (c: string, t: Act['talent'], label: string) => expect(game.moves.some((m) => m.character === c && m.talent === t && m.label === label)).toBe(true);

describe('rótulos dos golpes usados existem', () => {
  it('moves.json', () => {
    L('Baizhu', 'burst', 'Spiritvein DMG');
    L('Kinich', 'skill', 'Scalespiker Cannon DMG');
    L('Kinich', 'skill', 'Loop Shot DMG');
    L('Lauma', 'skill', 'Press DMG');
    L('Nefer', 'skill', 'Skill DMG');
    L('Aether (Dendro)', 'normal', 'Charged Attack DMG');
    L('Lumine (Dendro)', 'normal', 'Charged Attack DMG');
  });
});

describe('Baizhu', () => {
  it('A1: +25% de DMG Dendro só com a janela ligada', () => {
    const hit: Act = { talent: 'skill', label: 'Skill DMG' };
    const off = solo('Baizhu', 0, hit);
    const on = solo('Baizhu', 0, { ...hit, tags: ['label:Baizhu A1'] });
    expect(on.stats.dmgBonus - off.stats.dmgBonus).toBeCloseTo(0.25, 9);
  });
  it('C6: 8% do HP máximo soma só ao Spiritvein', () => {
    const sv = solo('Baizhu', 6, { talent: 'burst', label: 'Spiritvein DMG' });
    expect(sv.flatDamage).toBeCloseTo(0.08 * sv.stats.hp, 6);
    expect(solo('Baizhu', 6, { talent: 'skill', label: 'Skill DMG' }).flatDamage).toBe(0);
    expect(solo('Baizhu', 5, { talent: 'burst', label: 'Spiritvein DMG' }).flatDamage).toBe(0);
  });
});

describe('Emilie', () => {
  const hit: Act = { talent: 'skill', label: 'Skill DMG' };
  it('A4 vira janela: +15% por 1.000 de ATK, até 36%', () => {
    expect(effectOf('Emilie').buffs.find((b) => b.id === 'a4').timed).toBe(true);
    const off = solo('Emilie', 0, hit);
    const on = solo('Emilie', 0, { ...hit, tags: ['label:Emilie A4'] });
    expect(on.stats.dmgBonus - off.stats.dmgBonus).toBeCloseTo(Math.min(0.15 * (on.stats.atk / 1000), 0.36), 6);
  });
  it('C2: RES Dendro -30% só na janela', () => {
    const off = solo('Emilie', 2, hit);
    const on = solo('Emilie', 2, { ...hit, tags: ['label:Emilie C2'] });
    expect(off.stats.resShred.Dendro ?? 0).toBe(0);
    expect(on.stats.resShred.Dendro).toBeCloseTo(0.3, 9);
  });
  it('C1: Cleardew Cologne +20% = golpe extra de 120% do ATK, só a partir da C1', () => {
    expect(solo('Emilie', 1, { talent: 'proc', label: 'char:c1' }).scale.atk).toBeCloseTo(1.2, 6);
    expect(effectOf('Emilie').procs.find((p) => p.id === 'c1').minConstellation).toBe(1);
  });
});

describe('Kinich', () => {
  const cannon: Act = { talent: 'skill', label: 'Scalespiker Cannon DMG' };
  it('A4: 320% do ATK por stack só no Scalespiker Cannon (2 stacks = 640%)', () => {
    const r = solo('Kinich', 0, cannon, { a4: 2 });
    expect(r.flatDamage).toBeCloseTo(6.4 * r.stats.atk, 6);
    expect(solo('Kinich', 0, { talent: 'skill', label: 'Loop Shot DMG' }, { a4: 2 }).flatDamage).toBe(0);
  });
  it('C2: RES Dendro -30% só na janela e o 1º canhão +100% como golpe extra', () => {
    const off = solo('Kinich', 2, cannon);
    const on = solo('Kinich', 2, { ...cannon, tags: ['label:Kinich C2'] });
    expect(off.stats.resShred.Dendro ?? 0).toBe(0);
    expect(on.stats.resShred.Dendro).toBeCloseTo(0.3, 9);
    expect(effectOf('Kinich').procs.some((p) => p.id === 'c2p')).toBe(true);
    expect(solo('Kinich', 2, { talent: 'proc', label: 'char:c2p' }).avg).toBeGreaterThan(0);
  });
  it('C6: ricochete de 700% do ATK, sem tipo de golpe', () => {
    const r = solo('Kinich', 6, { talent: 'proc', label: 'char:c6' });
    expect(r.scale.atk).toBeCloseTo(7, 6);
    expect(effectOf('Kinich').procs.find((p) => p.id === 'c6').hitType).toBeUndefined();
  });
});

describe('Lauma', () => {
  it('Pale Hymn do Supremo e queda de RES da habilidade são janelas do kit', () => {
    const l = effectOf('Lauma');
    for (const id of ['pale', 'palelb', 'skill-res']) {
      const b = l.buffs.find((x) => x.id === id);
      expect(b.timed).toBe(true);
      expect(b.level?.table).toHaveLength(15);
    }
  });
  it('RES Dendro e Hydro -25% (nível 10 da habilidade) só na janela', () => {
    const hit: Act = { talent: 'skill', label: 'Press DMG' };
    const off = solo('Lauma', 0, hit);
    const on = solo('Lauma', 0, { ...hit, tags: ['label:Lauma: Runo (RES Dendro e Hydro)'] });
    expect(off.stats.resShred.Dendro ?? 0).toBe(0);
    expect(on.stats.resShred.Dendro).toBeGreaterThan(0.2);
    expect(on.stats.resShred.Hydro).toBeCloseTo(on.stats.resShred.Dendro, 9);
  });
});

describe('Nefer', () => {
  const hit: Act = { talent: 'skill', label: 'Skill DMG' };
  it('C4: RES Dendro -20% só na janela', () => {
    const off = solo('Nefer', 4, hit);
    const on = solo('Nefer', 4, { ...hit, tags: ['label:Nefer C4'] });
    expect(off.stats.resShred.Dendro ?? 0).toBe(0);
    expect(on.stats.resShred.Dendro).toBeCloseTo(0.2, 9);
  });
  it('A1 exige Moonsign Ascendant (a própria Nefer conta 1; precisa de mais um Moonsign)', () => {
    expect(effectOf('Nefer').buffs.find((b) => b.id === 'a1').team?.moonsign).toBe(2);
  });
});

describe('Viajante Dendro (Aether e Lumine)', () => {
  for (const who of ['Aether (Dendro)', 'Lumine (Dendro)']) {
    it(`${who} A4: Verdessence soma 80% do ATK em cada um dos 2 acertos do Carregado`, () => {
      const r = solo(who, 0, { talent: 'normal', label: 'Charged Attack DMG' });
      expect(r.flatDamage).toBeCloseTo(2 * 0.8 * r.stats.atk, 6);
      expect(solo(who, 0, { talent: 'normal', label: '1-Hit DMG' }).flatDamage).toBe(0);
    });
    it(`${who} A4: Vinecore = 120% do ATK como Carregado`, () => {
      const r = solo(who, 0, { talent: 'proc', label: 'char:a4vine' });
      expect(r.scale.atk).toBeCloseTo(1.2, 6);
    });
    it(`${who} C6: +12% Dendro e +12% do elemento transfigurado, só nas janelas`, () => {
      const hit: Act = { talent: 'normal', label: '1-Hit DMG' };
      const off = solo(who, 6, hit);
      const on = solo(who, 6, { ...hit, tags: ['label:Viajante C6'] });
      expect(on.stats.dmgBonus - off.stats.dmgBonus).toBeCloseTo(0.12, 9);
      const b = effectOf(who).buffs;
      expect(['c6h', 'c6e', 'c6p'].map((id) => b.find((x) => x.id === id)?.forElements?.[0])).toEqual(['Hydro', 'Electro', 'Pyro']);
    });
  }
});

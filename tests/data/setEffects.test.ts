import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SetEffectSchema, type SetEffect } from '../../src/effects/schema';
import { analyzeProject, assembleTeam, resolveProject, type EffectsData, type GameData, type RotationProject } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';
import { parseTwoPiece } from '../../scripts/lib/twoPiece';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const sets = json<SetEffect[]>('src/effects/sets.json');
const artifacts = json<{ name: string; bonuses: { twoPiece?: { description: string }; fourPiece?: { description: string } } }[]>('src/data/generated/artifacts.json');
const game: GameData = {
  characters: json('src/data/generated/characters.json'),
  moves: json('src/data/generated/moves.json'),
  weapons: json('src/data/generated/weapons.json'),
  artifacts: json('src/data/generated/artifacts.json'),
};
const effects: EffectsData = {
  characters: json('src/effects/characters.json'),
  weapons: json('src/effects/weapons.json'),
  sets,
  flatDamage: json('src/effects/flatDamage.json'),
};

describe('leitura dos bônus de 2 peças', () => {
  it('padrões da descrição do Lunaris', () => {
    expect(parseTwoPiece('ATK +18%.')).toEqual([{ stat: 'ATK%', value: 0.18 }]);
    expect(parseTwoPiece('Increases Elemental Mastery by 80.')).toEqual([{ stat: 'EM', value: 80 }]);
    expect(parseTwoPiece('Energy Recharge +20%')).toEqual([{ stat: 'ER', value: 0.2 }]);
    expect(parseTwoPiece('Cryo DMG Bonus +15%')).toEqual([{ stat: 'DMG%', value: 0.15, element: 'Cryo' }]);
    expect(parseTwoPiece('Gain a 15% Geo DMG Bonus.')).toEqual([{ stat: 'DMG%', value: 0.15, element: 'Geo' }]);
    expect(parseTwoPiece('Normal and Charged Attack DMG +15%')).toEqual([{ stat: 'DMG% Normal', value: 0.15 }, { stat: 'DMG% Charged', value: 0.15 }]);
    expect(parseTwoPiece('Increases Elemental Skill DMG by 20%.')).toEqual([{ stat: 'DMG% Skill', value: 0.2 }]);
    expect(parseTwoPiece('CRIT Rate +12%')).toEqual([{ stat: 'CR', value: 0.12 }]);
    expect(parseTwoPiece('Physical DMG +25%')).toEqual([{ stat: 'Physical DMG%', value: 0.25 }]);
    expect(parseTwoPiece('Physical DMG is increased by 25%.')).toEqual([{ stat: 'Physical DMG%', value: 0.25 }]);
  });

  it('o que o motor não aplica fica de fora (resistências, cura, escudo)', () => {
    for (const d of ['Electro RES increased by 40%.', 'Healing Bonus +15%.', 'Increases Shield Strength by 35%.']) {
      expect(parseTwoPiece(d), d).toBeNull();
    }
  });
});

describe('efeitos de sets cadastrados', () => {
  it('todos passam no esquema, têm fonte e correspondem a um set do Lunaris', () => {
    for (const s of sets) {
      expect(() => SetEffectSchema.parse(s), s.set).not.toThrow();
      expect(s.fonte_info.length, s.set).toBeGreaterThan(10);
      expect(artifacts.some((a) => a.name === s.set), s.set).toBe(true);
    }
  });

  it('cobre quase todos os sets de 2+4 peças em 2 peças', () => {
    const full = artifacts.filter((a) => a.bonuses.twoPiece && a.bonuses.fourPiece);
    const withTwo = full.filter((a) => sets.find((s) => s.set === a.name)?.twoPiece);
    expect(withTwo.length / full.length).toBeGreaterThan(0.7);
  });

  it('cada 4 peças curado diz o que assumiu', () => {
    for (const s of sets.filter((x) => x.fourPiece && !x.fonte_info.includes('planilha'))) expect(s.note?.length ?? 0, s.set).toBeGreaterThan(15);
  });

  it('valores conferidos à mão contra o texto do Lunaris', () => {
    const get = (n: string) => sets.find((s) => s.set === n)!;
    /** Soma da raiz do 4 peças com o buff `stacks` (no máximo de stacks). */
    const stack = (n: string) => get(n).fourPiece!.buffs.filter((b) => b.stacks).map((b) => b.stats);
    expect(stack("Nymph's Dream").reduce((a, x) => ({ atk: a.atk + (x?.atkPct ?? 0), dmg: a.dmg + (x?.dmgPct ?? 0) }), { atk: 0, dmg: 0 })).toEqual({ atk: 0.25, dmg: 0.15 });
    expect(get('Marechaussee Hunter').fourPiece!.critRate + stack('Marechaussee Hunter').reduce((a, x) => a + (x?.critRate ?? 0), 0)).toBeCloseTo(0.36, 6);
    expect(get('Marechaussee Hunter').fourPiece!.buffs.find((b) => b.id === 'stacks')?.stacks).toEqual({ max: 3 });
    expect((get("Long Night's Oath").fourPiece!.dmgPctByType.plunge ?? 0) + stack("Long Night's Oath").reduce((a, x) => a + (x?.dmgPctByType?.plunge ?? 0), 0)).toBeCloseTo(0.75, 6);
    expect(get('Deepwood Memories').fourPiece?.resShred).toEqual({ value: 0.3, elements: ['Dendro'] });
    expect(get('Retracing Bolide').fourPiece?.dmgPctByType).toEqual({ normal: 0.4, charged: 0.4 });
    expect(get('Heart of Depth').twoPiece).toEqual({ stat: 'DMG%', value: 0.15, element: 'Hydro' });
  });

  it('os 7 efeitos da planilha continuam iguais', () => {
    const obsidian = sets.find((s) => s.set === 'Obsidian Codex')!;
    expect(obsidian.fourPiece?.critRate).toBe(0.4);
    expect(sets.find((s) => s.set === "Gladiator's Finale")?.fourPiece?.dmgPctByType).toEqual({ normal: 0.35 });
  });
});

describe('sets no motor', () => {
  const statsOf = (p: RotationProject, i = 0) => {
    const r = resolveProject(p, game, effects);
    return analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient }).memberStats[i];
  };
  const withSets = (primary?: string, secondary?: string, fourPiece?: boolean, member = 0): RotationProject => {
    const base = sampleProject();
    return {
      ...base,
      members: base.members.map((m, i) =>
        i === member ? { ...m, primarySet: primary, secondarySet: secondary, fourPiece, manualRolls: { CR: 0, CD: 0, 'ATK%': 0, EM: 0, ER: 0, ATK: 0, 'HP%': 0, HP: 0, 'DEF%': 0, DEF: 0 } } : m,
      ),
    };
  };

  it('bônus de dano elemental de 2 peças só vale para o elemento do personagem', () => {
    // Mavuika é Pyro: Blizzard Strayer (Cryo) não dá nada; Crimson Witch (Pyro) dá +15%.
    const none = statsOf(withSets(undefined));
    const cryoSet = statsOf(withSets('Blizzard Strayer', 'Heart of Depth'));
    const pyroSet = statsOf(withSets('Crimson Witch of Flames', 'Heart of Depth'));
    expect(cryoSet.dmgBonus).toBeCloseTo(none.dmgBonus, 9);
    expect(pyroSet.dmgBonus - none.dmgBonus).toBeCloseTo(0.15, 9);
  });

  it('2 peças soltas (fourPiece=false) não ativam o bônus de 4 peças', () => {
    const four = statsOf(withSets('Obsidian Codex'));
    const two = statsOf(withSets('Obsidian Codex', undefined, false));
    expect(four.critRate - two.critRate).toBeCloseTo(0.4, 9);
  });

  it('bônus de 2 peças com dois efeitos (Normal e Carregado) soma nos dois tipos', () => {
    const s = statsOf(withSets('Martial Artist', "Gladiator's Finale"));
    const none = statsOf(withSets(undefined));
    expect(s.dmgByType.normal - none.dmgByType.normal).toBeCloseTo(0.15, 9);
    expect(s.dmgByType.charged - none.dmgByType.charged).toBeCloseTo(0.15, 9);
  });

  it('RES do inimigo cai com o 4 peças do Deepwood Memories', () => {
    const base = sampleProject();
    const mk = (primary?: string): RotationProject => ({ ...base, members: base.members.map((m, i) => (i === 1 ? { ...m, primarySet: primary, secondarySet: undefined } : m)) });
    const a = resolveProject(mk('Deepwood Memories'), game, effects);
    const b = resolveProject(mk(undefined), game, effects);
    const dendro = (p: typeof a) => assembleTeam(p.team).enemyRes.Dendro!;
    expect(dendro(b) - dendro(a)).toBeCloseTo(0.3, 9);
    expect(assembleTeam(a.team).enemyRes.Pyro).toBeCloseTo(assembleTeam(b.team).enemyRes.Pyro!, 9);
  });
});

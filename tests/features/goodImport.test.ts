import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData, type RotationProject } from '../../src/engine';
import { buildFromGood, goodCharacterNames, norm, parseGood } from '../../src/features/good/goodImport';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = {
  characters: json('src/data/generated/characters.json'),
  moves: json('src/data/generated/moves.json'),
  weapons: json('src/data/generated/weapons.json'),
  artifacts: json('src/data/generated/artifacts.json'),
};
const effects: EffectsData = {
  characters: json('src/effects/characters.json'),
  weapons: json('src/effects/weapons.json'),
  sets: json('src/effects/sets.json'),
  flatDamage: json('src/effects/flatDamage.json'),
};

const art = (slotKey: string, setKey: string, mainStatKey: string, substats: { key: string; value: number }[], rarity = 5, location = 'Mavuika') =>
  ({ setKey, slotKey, rarity, mainStatKey, substats, location, level: 20 });

const GOOD = {
  format: 'GOOD',
  source: 'teste',
  characters: [{ key: 'Mavuika', level: 90, constellation: 0, talent: { auto: 10, skill: 10, burst: 10 } }, { key: 'KamisatoAyaka', level: 90, constellation: 0 }],
  weapons: [{ key: 'AThousandBlazingSuns', level: 90, refinement: 1, location: 'Mavuika' }],
  artifacts: [
    art('flower', 'ObsidianCodex', 'hp', [{ key: 'critRate_', value: 6.6 }, { key: 'critDMG_', value: 13.2 }, { key: 'atk_', value: 4.95 }]),
    art('plume', 'ObsidianCodex', 'atk', [{ key: 'critDMG_', value: 7.0 }, { key: 'eleMas', value: 39 }]),
    art('sands', 'ObsidianCodex', 'eleMas', [{ key: 'critRate_', value: 3.3 }, { key: 'critDMG_', value: 6.6 }, { key: 'atk', value: 18 }]),
    art('goblet', 'ObsidianCodex', 'pyro_dmg_', [{ key: 'critRate_', value: 9.9 }, { key: 'enerRech_', value: 5.5 }]),
    art('circlet', 'GladiatorsFinale', 'critDMG_', [{ key: 'critRate_', value: 3.9 }, { key: 'atk_', value: 5.8 }]),
  ],
};

const statsOf = (p: RotationProject) => {
  const r = resolveProject(p, game, effects);
  return analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient }).memberStats[0];
};

describe('importação do inventário GOOD', () => {
  const good = parseGood(GOOD);
  const build = buildFromGood(good, 'Mavuika', game);

  it('reconhece nomes com e sem espaços e apóstrofos', () => {
    expect(norm("Wolf's Gravestone")).toBe(norm('WolfsGravestone'));
    expect(goodCharacterNames(good, game.characters)).toEqual(['Mavuika', 'Kamisato Ayaka']);
  });

  it('arma, set de 4 peças e main stats', () => {
    expect(build.patch.weapon).toBe('A Thousand Blazing Suns');
    expect(build.patch.refinement).toBe(1);
    expect(build.patch.primarySet).toBe('Obsidian Codex');
    expect(build.patch.secondarySet).toBeUndefined();
    expect(build.patch.artifacts).toMatchObject({ sands: 'EM', goblet: 'DMG%', circlet: 'CD' });
    expect(build.patch.talents).toEqual({ normal: 10, skill: 10, burst: 10 });
  });

  it('os rolls fracionários reproduzem a soma exata dos substats (Taxa Crítica = 6,6+3,3+9,9+3,9 = 23,7%)', () => {
    const m = build.patch.manualRolls!;
    expect(m.CR * 0.033).toBeCloseTo(0.237, 3);
    expect(m.CD * 0.066).toBeCloseTo(0.132 + 0.07 + 0.066, 3);
    expect(m.EM * 19.5).toBeCloseTo(39, 1);
    expect(m['ATK%'] * 0.0495).toBeCloseTo(0.0495 + 0.058, 3);
    expect(m.HP).toBe(0);
  });

  it('o motor usa os rolls reais: a Taxa e o Dano Crítico finais sobem exatamente a soma dos substats', () => {
    const base = sampleProject();
    const imported: RotationProject = { ...base, members: base.members.map((m, i) => (i === 0 ? { ...m, ...build.patch } : m)) };
    const zeroRolls = { CR: 0, CD: 0, 'ATK%': 0, EM: 0, ER: 0, ATK: 0, 'HP%': 0, HP: 0, 'DEF%': 0, DEF: 0 };
    const noSubstats: RotationProject = { ...imported, members: imported.members.map((m, i) => (i === 0 ? { ...m, manualRolls: zeroRolls } : m)) };
    const withSubs = statsOf(imported);
    const without = statsOf(noSubstats);
    expect(withSubs.critRate - without.critRate).toBeCloseTo(0.237, 3);
    expect(withSubs.critDmg - without.critDmg).toBeCloseTo(0.268, 3);
    expect(withSubs.em - without.em).toBeCloseTo(39, 1);
  });

  it('2 peças de um set e as outras soltas: só o bônus de 2 peças', () => {
    const g = parseGood({
      ...GOOD,
      artifacts: [art('flower', 'ObsidianCodex', 'hp', []), art('plume', 'ObsidianCodex', 'atk', []), art('sands', 'GladiatorsFinale', 'atk_', []), art('goblet', 'ShimenawasReminiscence', 'pyro_dmg_', []), art('circlet', 'EmblemOfSeveredFate', 'critRate_', [])],
    });
    const b = buildFromGood(g, 'Mavuika', game);
    expect(b.patch.primarySet).toBe('Obsidian Codex');
    expect(b.patch.fourPiece).toBe(false);
    expect(b.patch.secondarySet).toBeUndefined();
  });

  it('2+2 vira primário e secundário', () => {
    const g = parseGood({
      ...GOOD,
      artifacts: [art('flower', 'ObsidianCodex', 'hp', []), art('plume', 'ObsidianCodex', 'atk', []), art('sands', 'GladiatorsFinale', 'atk_', []), art('goblet', 'GladiatorsFinale', 'pyro_dmg_', []), art('circlet', 'EmblemOfSeveredFate', 'critRate_', [])],
    });
    const b = buildFromGood(g, 'Mavuika', game);
    expect([b.patch.primarySet, b.patch.secondarySet].sort()).toEqual(["Gladiator's Finale", 'Obsidian Codex']);
  });

  it('avisa sobre peças que faltam, main stat desconhecido e arma de outro tipo', () => {
    const g = parseGood({ ...GOOD, weapons: [{ key: 'Absolution', location: 'Mavuika' }], artifacts: [art('sands', 'ObsidianCodex', 'physical_dmg_', [])] });
    const b = buildFromGood(g, 'Mavuika', game);
    expect(b.notes.join(' ')).toMatch(/Faltam peças/);
    expect(b.notes.join(' ')).toMatch(/Main stat "physical_dmg_"/);
    expect(b.notes.join(' ')).toMatch(/não é do tipo/);
    expect(b.patch.weapon).toBeUndefined();
  });

  it('arquivo que não é GOOD ou personagem ausente dão erro claro', () => {
    expect(() => parseGood({ characters: [] })).toThrow(/não é um inventário GOOD/);
    expect(() => buildFromGood(good, 'Citlali', game)).toThrow(/não está neste inventário/);
  });
});

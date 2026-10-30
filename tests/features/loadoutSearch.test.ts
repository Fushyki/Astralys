import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { parseGood } from '../../src/features/good/goodImport';
import { searchBestLoadout, weightsFromGains } from '../../src/features/good/loadoutSearch';
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

const art = (slotKey: string, setKey: string, mainStatKey: string, substats: { key: string; value: number }[], location = '', rarity = 5) =>
  ({ setKey, slotKey, rarity, mainStatKey, substats, location, level: 20 });

const EQUIPPED = [
  art('flower', 'ObsidianCodex', 'hp', [{ key: 'atk_', value: 4.95 }, { key: 'hp_', value: 5.8 }], 'Mavuika'),
  art('plume', 'ObsidianCodex', 'atk', [{ key: 'def_', value: 7.3 }, { key: 'hp', value: 299 }], 'Mavuika'),
  art('sands', 'ObsidianCodex', 'eleMas', [{ key: 'critRate_', value: 3.3 }, { key: 'def', value: 21 }], 'Mavuika'),
  art('goblet', 'ObsidianCodex', 'pyro_dmg_', [{ key: 'hp_', value: 4.1 }, { key: 'enerRech_', value: 4.5 }], 'Mavuika'),
  art('circlet', 'ObsidianCodex', 'critDMG_', [{ key: 'critRate_', value: 3.9 }, { key: 'def_', value: 5.1 }], 'Mavuika'),
];
// Peças melhores, soltas: crítico e ATK%
const BETTER = [
  art('flower', 'ObsidianCodex', 'hp', [{ key: 'critRate_', value: 10.5 }, { key: 'critDMG_', value: 14.0 }, { key: 'atk_', value: 9.9 }]),
  art('plume', 'ObsidianCodex', 'atk', [{ key: 'critRate_', value: 6.6 }, { key: 'critDMG_', value: 20.2 }]),
  art('circlet', 'ObsidianCodex', 'critDMG_', [{ key: 'critRate_', value: 10.1 }, { key: 'eleMas', value: 58 }]),
];
// Uma peça ótima, mas equipada em outro personagem
const OTHERS = [art('goblet', 'ObsidianCodex', 'pyro_dmg_', [{ key: 'critRate_', value: 13.2 }, { key: 'critDMG_', value: 21.0 }], 'Citlali')];

const GOOD = (artifacts: unknown[]) =>
  parseGood({ format: 'GOOD', characters: [{ key: 'Mavuika', talent: { auto: 10, skill: 10, burst: 10 } }], weapons: [{ key: 'AThousandBlazingSuns', refinement: 1, location: 'Mavuika' }], artifacts });

const project = sampleProject();
const resolved = resolveProject(project, game, effects);
const bundle = analyzeProject({ team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });

const run = (artifacts: unknown[], allowEquippedByOthers = false) =>
  searchBestLoadout({
    good: GOOD(artifacts),
    characterName: 'Mavuika',
    member: 0,
    team: resolved.team,
    ref: project.members[0],
    rolls: bundle.optimization.rolls,
    actions: resolved.actions,
    flatEffects: resolved.flatEffects,
    ampCoefficient: resolved.ampCoefficient,
    game,
    effects,
    minRolls: project.config.minRollsPerSubstat, planilha: true,
    weights: weightsFromGains(bundle.gains, 0),
    allowEquippedByOthers,
  });

describe('busca do melhor build no inventário', () => {
  it('troca as peças fracas pelas que dão crítico e rende mais que o conjunto equipado', async () => {
    const r = await run([...EQUIPPED, ...BETTER]);
    expect(r.equippedAvg).not.toBeNull();
    expect(r.teamAvg).toBeGreaterThan(r.equippedAvg! * 1.05);
    expect(r.pieces.flower.substats.some((s) => s.key === 'critRate_')).toBe(true);
    expect(r.pieces.plume.substats.some((s) => s.key === 'critDMG_')).toBe(true);
    expect(r.pieces.circlet.substats.some((s) => s.key === 'critRate_' && s.value === 10.1)).toBe(true);
    expect(r.evaluated).toBeGreaterThan(5);
  });

  it('nunca devolve algo pior que o conjunto equipado', async () => {
    const r = await run(EQUIPPED); // sem nada melhor: devolve o próprio equipado
    expect(r.teamAvg).toBeGreaterThanOrEqual(r.equippedAvg! - 1e-6);
  });

  it('por padrão ignora peças equipadas em outros personagens; com a opção ligada, usa', async () => {
    const without = await run([...EQUIPPED, ...BETTER, ...OTHERS], false);
    expect(without.pieces.goblet.location).not.toBe('Citlali');
    const withOthers = await run([...EQUIPPED, ...BETTER, ...OTHERS], true);
    expect(withOthers.pieces.goblet.location).toBe('Citlali');
    expect(withOthers.teamAvg).toBeGreaterThan(without.teamAvg);
  });

  it('o resultado reproduz o cálculo do motor para o mesmo conjunto (consistência)', async () => {
    const r = await run([...EQUIPPED, ...BETTER]);
    const members = project.members.map((m, i) => (i === 0 ? { ...m, ...r.loadout } : m));
    const check = resolveProject({ ...project, members }, game, effects);
    const total = analyzeProject({ team: check.team, actions: check.actions, flatEffects: check.flatEffects, ampCoefficient: check.ampCoefficient }).optimization.result.totals.avg;
    // os outros membros são reotimizados na análise completa; aqui eles ficam fixos, então aceito diferença pequena
    expect(Math.abs(total / r.teamAvg - 1)).toBeLessThan(0.02);
  });

  it('inventário sem peças de uma posição dá erro claro', async () => {
    await expect(run(EQUIPPED.filter((a) => a.slotKey !== 'plume'))).rejects.toThrow(/plume/);
  });

  it('pode ser interrompido', async () => {
    const g = GOOD([...EQUIPPED, ...BETTER]);
    const r = await searchBestLoadout({
      good: g, characterName: 'Mavuika', member: 0, team: resolved.team, ref: project.members[0], rolls: bundle.optimization.rolls,
      actions: resolved.actions, game, effects, minRolls: 2, weights: {}, allowEquippedByOthers: false, shouldStop: () => true,
    });
    expect(r.stopped).toBe(true);
  });
});

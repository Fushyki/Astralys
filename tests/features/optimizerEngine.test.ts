import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { parseGood } from '../../src/features/good/goodImport';
import { createEvaluator } from '../../src/features/optimizer/evaluator';
import { DEFAULT_CONFIG, filterInventory, runOptimizer, type OptimizerConfig } from '../../src/features/optimizer/run';
import { bruteForce, configOfPieces } from '../../src/features/optimizer/solver';
import { DIMS, addInto } from '../../src/features/optimizer/vector';
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

const project = { ...sampleProject(), compat: 'none' as const };
const resolved = resolveProject(project, game, effects);
const bundle = analyzeProject({ team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });

let seed = 5;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
const SUBS: [string, number][] = [['critRate_', 3.3], ['critDMG_', 6.6], ['atk_', 4.95], ['atk', 18], ['eleMas', 19.5], ['enerRech_', 5.5], ['hp_', 4.95], ['def_', 6.2]];
const MAIN: Record<string, string[]> = { flower: ['hp'], plume: ['atk'], sands: ['eleMas', 'atk_', 'enerRech_'], goblet: ['pyro_dmg_', 'atk_', 'eleMas', 'hydro_dmg_'], circlet: ['critRate_', 'critDMG_', 'atk_'] };
const SETS = ['ObsidianCodex', 'GladiatorsFinale', 'EmblemOfSeveredFate'];

function inventory(perSlot: number) {
  const artifacts = (['flower', 'plume', 'sands', 'goblet', 'circlet'] as const).flatMap((slotKey) =>
    Array.from({ length: perSlot }, () => {
      const main = pick(MAIN[slotKey]);
      const subs = [...SUBS].sort(() => rnd() - 0.5).filter(([k]) => k !== main).slice(0, 4);
      return {
        setKey: pick(SETS), slotKey, rarity: 5, mainStatKey: main, level: 20, location: '',
        substats: subs.map(([key, v]) => ({ key, value: Math.round(v * (1 + Math.floor(rnd() * 4)) * 10) / 10 })),
      };
    }),
  );
  return parseGood({ format: 'GOOD', characters: [{ key: 'Mavuika' }], weapons: [], artifacts });
}

const base = { resolved, member: 0, rolls: bundle.optimization.rolls, ref: project.members[0], game, effects };
const setName = (key: string) => game.artifacts.find((x) => x.name.replace(/[^A-Za-z]/g, '').toLowerCase() === key.toLowerCase())?.name ?? key;

function compare(config: OptimizerConfig, perSlot: number) {
  const good = inventory(perSlot);
  const inv = filterInventory(good, 'Mavuika', 'Pyro', config, setName);
  const evaluator = createEvaluator({ ...base, objective: config.objective, constraints: config.constraints });
  const expected = bruteForce(inv.slots, evaluator.evaluate, config.topN);
  const got = runOptimizer({ ...base, good, characterKey: 'Mavuika', config });
  return { expected, got };
}

describe('otimizador com o motor real', () => {
  it('acha os mesmos melhores que a força bruta: foco no dano do time', () => {
    const { expected, got } = compare({ ...DEFAULT_CONFIG, topN: 5 }, 4);
    expect(got.builds.length).toBe(expected.length);
    got.builds.forEach((b, i) => expect(b.report.value).toBeCloseTo(expected[i].value, 3));
  });

  it('com restrição de Recarga mínima de 130%', () => {
    const { expected, got } = compare({ ...DEFAULT_CONFIG, topN: 5, constraints: { er: 1.3 } }, 4);
    expect(got.builds.length).toBe(expected.length);
    got.builds.forEach((b, i) => {
      expect(b.report.value).toBeCloseTo(expected[i].value, 3);
      expect(b.report.stats.er).toBeGreaterThanOrEqual(1.3 - 1e-9);
    });
  });

  it('foco no dano só do personagem e foco num stat (Maestria)', () => {
    for (const objective of [{ kind: 'member' } as const, { kind: 'stat', stat: 'em' } as const]) {
      const { expected, got } = compare({ ...DEFAULT_CONFIG, topN: 3, objective }, 4);
      expect(got.builds.length).toBe(expected.length);
      got.builds.forEach((b, i) => expect(b.report.value).toBeCloseTo(expected[i].value, 3));
    }
  });

  it('filtros: main stats permitidos e sets permitidos tiram peças', () => {
    const good = inventory(6);
    const all = filterInventory(good, 'Mavuika', 'Pyro', DEFAULT_CONFIG, setName);
    const some = filterInventory(good, 'Mavuika', 'Pyro', { ...DEFAULT_CONFIG, mainStats: { sands: ['atk_'] }, allowedSets: ['ObsidianCodex'] }, setName);
    expect(some.artifacts.length).toBeLessThan(all.artifacts.length);
    expect(some.slots[2].every((p) => all.artifacts[p.index] && good.artifacts.includes(some.artifacts[p.index]) && some.artifacts[p.index].mainStatKey === 'atk_')).toBe(true);
    expect(some.removed.main + some.removed.set).toBeGreaterThan(0);
  });

  it('peças de outros personagens só entram se o usuário deixar', () => {
    const good = inventory(3);
    good.artifacts[0].location = 'Citlali';
    const off = filterInventory(good, 'Mavuika', 'Pyro', DEFAULT_CONFIG, setName);
    const on = filterInventory(good, 'Mavuika', 'Pyro', { ...DEFAULT_CONFIG, borrowFrom: 'all' }, setName);
    expect(off.removed.equippedByOthers).toBe(1);
    expect(on.artifacts.length).toBe(off.artifacts.length + 1);
  });

  it('o conjunto equipado entra como comparação e o valor do relatório bate com o avaliador', () => {
    const good = inventory(3);
    for (const slotKey of ['flower', 'plume', 'sands', 'goblet', 'circlet']) {
      const a = good.artifacts.find((x) => x.slotKey === slotKey)!;
      a.location = 'Mavuika';
    }
    const r = runOptimizer({ ...base, good, characterKey: 'Mavuika', config: { ...DEFAULT_CONFIG, topN: 3 } });
    expect(r.equipped).not.toBeNull();
    expect(r.builds[0].report.teamAvg).toBeGreaterThanOrEqual(r.equipped!.report.teamAvg - 1e-6);
  });

  it('a configuração de set vem das próprias peças (mesma regra do motor)', () => {
    const good = inventory(4);
    const inv = filterInventory(good, 'Mavuika', 'Pyro', DEFAULT_CONFIG, setName);
    const pieces = inv.slots.map((l) => l[0]);
    const vec = new Float64Array(DIMS);
    pieces.forEach((p) => addInto(vec, p.vec));
    expect(configOfPieces(pieces)).toBeDefined();
  });
});

describe('Equipar reproduz o dano pelo caminho normal do projeto', () => {
  it('o melhor build, aplicado ao membro, dá o mesmo dano médio da equipe que o otimizador mostrou', () => {
    const good = inventory(4);
    // peças sem cálice de outro elemento: o caminho normal conta qualquer DMG% de cálice, o otimizador só o do elemento
    for (const a of good.artifacts) if (a.mainStatKey === 'hydro_dmg_') a.mainStatKey = 'pyro_dmg_';
    const r = runOptimizer({ ...base, good, characterKey: 'Mavuika', config: { ...DEFAULT_CONFIG, topN: 1 } });
    const top = r.builds[0];
    const patched = {
      ...project,
      members: project.members.map((m, i) => (i === 0 ? { ...m, artifacts: top.loadout.artifacts, primarySet: top.loadout.primarySet, secondarySet: top.loadout.secondarySet, fourPiece: top.loadout.fourPiece, manualRolls: top.loadout.manualRolls } : m)),
    };
    const rp = resolveProject(patched, game, effects);
    const b = analyzeProject({ team: rp.team, actions: rp.actions, flatEffects: rp.flatEffects, ampCoefficient: rp.ampCoefficient });
    const avg = b.optimization.result.totals.avg;
    expect(avg / top.report.teamAvg).toBeCloseTo(1, 3);
  });
});

describe('busca dividida em partes (workers)', () => {
  it('3 partes juntas dão os mesmos melhores que a busca inteira, com e sem piso compartilhado', async () => {
    const { mergeResults } = await import('../../src/features/optimizer/client');
    const { startOptimizer } = await import('../../src/features/optimizer/run');
    const good = inventory(4);
    const config = { ...DEFAULT_CONFIG, topN: 5 };
    const whole = runOptimizer({ ...base, good, characterKey: 'Mavuika', config });
    for (const shareFloor of [false, true]) {
      let floor = -Infinity;
      const parts = [0, 1, 2].map((index) => {
        const h = startOptimizer({ ...base, good, characterKey: 'Mavuika', config }, {
          partition: { index, count: 3 },
          floor: shareFloor ? () => floor : undefined,
          onThreshold: shareFloor ? (v) => { floor = Math.max(floor, v); } : undefined,
        });
        for (const _ of h.steps) void _;
        return h.result();
      });
      const merged = mergeResults(parts, 5);
      expect(merged.builds.map((b) => b.key)).toEqual(whole.builds.map((b) => b.key));
      merged.builds.forEach((b, i) => expect(b.report.value).toBeCloseTo(whole.builds[i].report.value, 3));
    }
  });
});

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { artifactSig, parseGood } from '../../src/features/good/goodImport';
import { createEvaluator } from '../../src/features/optimizer/evaluator';
import { DEFAULT_CONFIG, evaluateEquipped, filterInventory, runOptimizer, startOptimizer, type OptimizerConfig } from '../../src/features/optimizer/run';
import { bruteForce, configOfPieces } from '../../src/features/optimizer/solver';
import { DIM, DIMS, addInto } from '../../src/features/optimizer/vector';
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

  it('com um set marcado, as peças dos outros sets completam o build sem bônus (não força 5 do mesmo set)', () => {
    const good = inventory(5);
    const config: OptimizerConfig = { ...DEFAULT_CONFIG, topN: 5, allowedSets: ['ObsidianCodex'] };
    const inv = filterInventory(good, 'Mavuika', 'Pyro', config, setName);
    // as peças dos outros sets continuam no inventário filtrado
    expect(inv.artifacts.some((a) => a.setKey !== 'ObsidianCodex')).toBe(true);
    expect(inv.removed.set).toBe(0);
    const evaluator = createEvaluator({ ...base, objective: config.objective, constraints: config.constraints });
    const allowedOnly = (vec: Float64Array, cfg: { primarySet?: string; secondarySet?: string; fourPiece?: boolean }) =>
      [cfg.primarySet, cfg.secondarySet].every((x) => !x || x === 'Obsidian Codex') ? evaluator.evaluate(vec, cfg) : -Infinity;
    const expected = bruteForce(inv.slots, allowedOnly, 5);
    const got = runOptimizer({ ...base, good, characterKey: 'Mavuika', config });
    expect(got.builds.length).toBe(expected.length);
    got.builds.forEach((b, i) => expect(b.report.value).toBeCloseTo(expected[i].value, 3));
    // nenhum build usa bônus de set que não foi marcado
    for (const b of got.builds) for (const k of [b.config.primarySet, b.config.secondarySet]) expect(!k || k === 'Obsidian Codex').toBe(true);
    // modo estrito (como antes): só peças do set marcado
    const strict = filterInventory(good, 'Mavuika', 'Pyro', { ...config, fillerSets: false }, setName);
    expect(strict.artifacts.every((a) => a.setKey === 'ObsidianCodex')).toBe(true);
    expect(strict.removed.set).toBeGreaterThan(0);
  });

  it('avisa quando o build equipado usa peças que os filtros deixam de fora', () => {
    const good = inventory(3);
    for (const slotKey of ['flower', 'plume', 'sands', 'goblet', 'circlet']) {
      const a = good.artifacts.find((x) => x.slotKey === slotKey)!;
      a.location = 'Mavuika';
      a.setKey = slotKey === 'flower' ? 'GladiatorsFinale' : 'ObsidianCodex';
    }
    const strict = runOptimizer({ ...base, good, characterKey: 'Mavuika', config: { ...DEFAULT_CONFIG, topN: 2, allowedSets: ['ObsidianCodex'], fillerSets: false } });
    expect(strict.equippedOutside).toBe(true);
    const loose = runOptimizer({ ...base, good, characterKey: 'Mavuika', config: { ...DEFAULT_CONFIG, topN: 2, allowedSets: ['ObsidianCodex'] } });
    expect(loose.equippedOutside).toBe(false);
    // com a peça de outro set permitida como extra, o build equipado (4 Obsidian + 1 outra) volta a ser achável
    expect(loose.builds[0].report.value).toBeGreaterThanOrEqual(loose.equipped!.report.value - 1e-6);
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

describe('alvo da otimização: golpe do kit e buff', () => {
  it('um golpe do kit (com reação e crítico) acha o mesmo que a força bruta', () => {
    const burst = game.moves.find((m) => m.character === 'Mavuika' && m.talent === 'burst')!;
    for (const [reaction, crit] of [['none', 'avg'], ['melt', 'crit']] as const) {
      const { expected, got } = compare({ ...DEFAULT_CONFIG, topN: 3, objective: { kind: 'move', moveId: burst.id, reaction, crit } }, 4);
      expect(got.builds.length).toBe(expected.length);
      got.builds.forEach((b, i) => expect(b.report.value).toBeCloseTo(expected[i].value, 3));
    }
  });

  it('o valor do golpe muda com a reação (Derreter vale mais que sem reação)', () => {
    const burst = game.moves.find((m) => m.character === 'Mavuika' && m.talent === 'burst')!;
    const none = compare({ ...DEFAULT_CONFIG, topN: 1, objective: { kind: 'move', moveId: burst.id, reaction: 'none', crit: 'avg' } }, 3).got.builds[0].report.value;
    const melt = compare({ ...DEFAULT_CONFIG, topN: 1, objective: { kind: 'move', moveId: burst.id, reaction: 'melt', crit: 'avg' } }, 3).got.builds[0].report.value;
    expect(melt).toBeGreaterThan(none);
  });

  it('buff da Vodyanitsa C1 (ATK dos aliados = 0,8% do HP): o melhor build maximiza o HP', () => {
    const base = sampleProject();
    const members = ['Vodyanitsa', 'Mavuika', 'Citlali', 'Bennett'].map((name) => {
      const ref = { ...project.members[0], character: name, weapon: game.weapons.find((w) => w.type === game.characters.find((c) => c.name === name)!.weapon && w.rarity === 4)!.name, constellation: name === 'Vodyanitsa' ? 1 : undefined, primarySet: undefined, secondarySet: undefined };
      return ref;
    });
    const p = { ...base, compat: 'none' as const, members, actions: [], buffWindows: [] };
    const r = resolveProject(p as never, game, effects);
    const buffId = 'cbuff-0-c1';
    const ev = (objective: never) => runOptimizer({ resolved: r, member: 0, rolls: r.team.members.map(() => ({ CR: 0, CD: 0, 'ATK%': 0, EM: 0, ER: 0, ATK: 0, 'HP%': 0, HP: 0, 'DEF%': 0, DEF: 0 })), ref: p.members[0] as never, game, effects, good: inventoryFor('Vodyanitsa'), characterKey: 'Vodyanitsa', config: { ...DEFAULT_CONFIG, topN: 1, objective } });
    const byBuff = ev({ kind: 'buff', buffId } as never).builds[0];
    const byHp = ev({ kind: 'stat', stat: 'hp' } as never).builds[0];
    expect(byBuff.report.value).toBeGreaterThan(0);
    // 0,8% do HP máximo: o valor do buff é 0,008 × HP final (ao menos dentro de 1% do melhor HP)
    expect(byBuff.report.stats.hp * 0.008).toBeCloseTo(byBuff.report.value, 0);
    expect(byBuff.report.stats.hp).toBeGreaterThanOrEqual(byHp.report.stats.hp * 0.99);
  });
});

describe('golpe Lunar do kit como alvo', () => {
  it('Carga Lunar de Interferência Kuuvahki (Columbina) não ganha nada do DMG% Hydro', () => {
    const base0 = sampleProject();
    const members = ['Columbina', 'Mavuika', 'Citlali', 'Bennett'].map((name) => ({ ...project.members[0], character: name, weapon: game.weapons.find((w) => w.type === game.characters.find((c) => c.name === name)!.weapon && w.rarity === 4)!.name, primarySet: undefined, secondarySet: undefined }));
    const p = { ...base0, compat: 'none' as const, members, actions: [], buffWindows: [] };
    const r = resolveProject(p as never, game, effects);
    const move = game.moves.find((m) => m.character === 'Columbina' && m.label === 'Gravity Interference: Lunar-Charged DMG')!;
    const objective = { kind: 'move', moveId: move.id, reaction: 'none', crit: 'avg' } as never;
    const rolls = r.team.members.map(() => ({ CR: 0, CD: 0, 'ATK%': 0, EM: 0, ER: 0, ATK: 0, 'HP%': 0, HP: 0, 'DEF%': 0, DEF: 0 }));
    const ev = createEvaluator({ resolved: r, member: 0, rolls, ref: p.members[0] as never, game, effects, objective, constraints: {} });
    const vec = new Float64Array(DIMS);
    vec[DIM.hpFlat] = 4780; vec[DIM.hpPct] = 0.3; vec[DIM.cr] = 0.5; vec[DIM.cd] = 1;
    const withHydro = Float64Array.from(vec);
    withHydro[DIM.dmg] = 0.466;
    const cfg = {};
    expect(ev.evaluate(withHydro, cfg)).toBeCloseTo(ev.evaluate(vec, cfg), 6);
    expect(ev.evaluate(vec, cfg)).toBeGreaterThan(0);
  });
});

function inventoryFor(character: string) {
  const g = inventory(4);
  return { ...g, characters: [{ key: character }] };
}

describe('peças reais no personagem (MemberRef.pieces)', () => {
  it('o build com as 5 peças reais dá EXATAMENTE o dano que o otimizador mostrou (inclusive cálice de outro elemento)', () => {
    const good = inventory(4);
    const r = runOptimizer({ ...base, good, characterKey: 'Mavuika', config: { ...DEFAULT_CONFIG, topN: 1 } });
    const top = r.builds[0];
    const patched = { ...project, members: project.members.map((m, i) => (i === 0 ? { ...m, pieces: top.pieces } : m)) };
    const rp = resolveProject(patched, game, effects);
    const b = analyzeProject({ team: rp.team, actions: rp.actions, flatEffects: rp.flatEffects, ampCoefficient: rp.ampCoefficient });
    expect(b.optimization.result.totals.avg).toBeCloseTo(top.report.teamAvg, 3);
    expect(rp.team.members[0].primarySet?.name).toBe(top.config.primarySet);
  });

  it('com menos de 5 peças, as posições vazias não contam (sem ATK de pluma nem HP de flor)', () => {
    const good = inventory(2);
    const flower = good.artifacts.find((a) => a.slotKey === 'flower')!;
    const one = resolveProject({ ...project, members: project.members.map((m, i) => (i === 0 ? { ...m, pieces: [flower] } : m)) }, game, effects);
    const stats = one.team.members[0].externalStats!;
    expect(stats.hpFlat).toBeGreaterThan(4000);
    expect(stats.atkFlat ?? 0).toBeLessThan(100);
  });
});

describe('nível da peça e builds completos', () => {
  it('sem peça em alguma posição o otimizador não devolve build (nem parcial)', () => {
    const good = inventory(3);
    const noCirclet = { ...good, artifacts: good.artifacts.filter((a) => a.slotKey !== 'circlet') };
    expect(() => runOptimizer({ ...base, good: noCirclet, characterKey: 'Mavuika', config: DEFAULT_CONFIG })).toThrow(/circlet/);
  });

  it('todo build devolvido tem as 5 posições', () => {
    const got = runOptimizer({ ...base, good: inventory(3), characterKey: 'Mavuika', config: { ...DEFAULT_CONFIG, topN: 5 } });
    expect(got.builds.length).toBeGreaterThan(0);
    for (const b of got.builds) expect(b.pieces.map((p) => p.slotKey).sort()).toEqual(['circlet', 'flower', 'goblet', 'plume', 'sands']);
  });

  it('o main stat entra no nível real da peça: a mesma peça em +0 perde para a de +20', () => {
    const good = inventory(1);
    const sands = good.artifacts.find((a) => a.slotKey === 'sands')!;
    const low = { ...sands, level: 0 };
    const got = runOptimizer({ ...base, good: { ...good, artifacts: [...good.artifacts, low] }, characterKey: 'Mavuika', config: { ...DEFAULT_CONFIG, topN: 2 } });
    expect(got.builds[0].pieces.find((p) => p.slotKey === 'sands')!.level).toBe(20);
    expect(got.builds[1].pieces.find((p) => p.slotKey === 'sands')!.level).toBe(0);
    expect(got.builds[1].report.value).toBeLessThan(got.builds[0].report.value);
  });
});

describe('build atual sem rodar a busca', () => {
  it('evaluateEquipped dá o mesmo relatório do equipado do resultado e traz os stats em campo', () => {
    const good = inventory(4);
    const eq = ['flower', 'plume', 'sands', 'goblet', 'circlet'].map((slot) => good.artifacts.find((a) => a.slotKey === slot)!);
    const withOwner = { ...good, artifacts: good.artifacts.map((a) => (eq.includes(a) ? { ...a, location: 'Mavuika' } : a)) };
    const input = { ...base, good: withOwner, characterKey: 'Mavuika', config: { ...DEFAULT_CONFIG, topN: 1 } };
    const now = evaluateEquipped(input as never)!;
    const result = runOptimizer(input as never);
    expect(now.report.value).toBeCloseTo(result.equipped!.report.value, 6);
    expect(now.report.stats.atk).toBeCloseTo(result.equipped!.report.stats.atk, 6);
    // em campo: com todos os buffs do time ligados o ATK não cai e, no exemplo, sobe
    expect(now.report.fieldStats.atk).toBeGreaterThan(now.report.stats.atk);
  });
});

describe('responsividade do "Parar"', () => {
  it('a busca cede o controle com frequência (nenhum intervalo longo entre dois passos), para o Parar chegar logo', () => {
    const good = inventory(9);
    const h = startOptimizer({ ...base, good, characterKey: 'Mavuika', config: { ...DEFAULT_CONFIG, topN: 5 } });
    let last = performance.now();
    let worst = 0;
    for (const _ of h.steps) {
      void _;
      const now = performance.now();
      worst = Math.max(worst, now - last);
      last = now;
    }
    // sem a regra de tempo, iterações pesadas de poda passavam de 1 s sem ceder
    expect(worst).toBeLessThan(250);
  });
});

describe('artefatos bloqueados', () => {
  it('um artefato bloqueado sai da busca (e nenhum build o usa)', () => {
    const good = inventory(4);
    const target = good.artifacts.find((a) => a.slotKey === 'sands')!;
    const sig = artifactSig(target);
    const free = filterInventory(good, 'Mavuika', 'Pyro', { ...DEFAULT_CONFIG }, (k) => k);
    const blocked = filterInventory(good, 'Mavuika', 'Pyro', { ...DEFAULT_CONFIG, blocked: [sig] }, (k) => k);
    const same = good.artifacts.filter((a) => artifactSig(a) === sig).length;
    expect(blocked.artifacts.length).toBe(free.artifacts.length - same);
    expect(blocked.removed.blocked).toBe(same);
    expect(blocked.artifacts.some((a) => artifactSig(a) === sig)).toBe(false);
    const r = runOptimizer({ ...base, good, characterKey: 'Mavuika', config: { ...DEFAULT_CONFIG, topN: 3, blocked: [sig] } });
    expect(r.builds.length).toBeGreaterThan(0);
    for (const b of r.builds) expect(b.pieces.some((a) => artifactSig(a) === sig)).toBe(false);
  });
});

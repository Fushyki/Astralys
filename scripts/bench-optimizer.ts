/** Mede o otimizador de artefatos (avaliações por segundo) num inventário sintético: `npx tsx scripts/bench-optimizer.ts [peças por posição]`; com `node --cpu-prof --import tsx` mostra onde gasta tempo. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../src/engine';
import { parseGood } from '../src/features/good/goodImport';
import { DEFAULT_CONFIG, runOptimizer } from '../src/features/optimizer/run';
import { sampleProject } from '../src/features/rotation/persistence';
const json = <T,>(rel: string): T => JSON.parse(readFileSync(path.join(process.cwd(), rel), 'utf8'));
const game: GameData = { characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'), weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json') };
const effects: EffectsData = { characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'), sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json') };
const project = { ...sampleProject(), compat: 'none' as const };
const resolved = resolveProject(project, game, effects);
const bundle = analyzeProject({ team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });
let seed = 5;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
const SUBS: [string, number][] = [['critRate_', 3.3], ['critDMG_', 6.6], ['atk_', 4.95], ['atk', 18], ['eleMas', 19.5], ['enerRech_', 5.5], ['hp_', 4.95], ['def_', 6.2]];
const MAIN: Record<string, string[]> = { flower: ['hp'], plume: ['atk'], sands: ['eleMas', 'atk_', 'enerRech_'], goblet: ['pyro_dmg_', 'atk_', 'eleMas'], circlet: ['critRate_', 'critDMG_', 'atk_'] };
const SETS = ['ObsidianCodex', 'GladiatorsFinale', 'EmblemOfSeveredFate'];
const per = Number(process.argv[2] ?? 14);
const artifacts = (['flower', 'plume', 'sands', 'goblet', 'circlet'] as const).flatMap((slotKey) => Array.from({ length: per }, () => {
  const main = pick(MAIN[slotKey]);
  const subs = [...SUBS].sort(() => rnd() - 0.5).filter(([k]) => k !== main).slice(0, 4);
  return { setKey: pick(SETS), slotKey, rarity: 5, mainStatKey: main, level: 20, location: '', substats: subs.map(([key, v]) => ({ key, value: Math.round(v * (1 + Math.floor(rnd() * 4)) * 10) / 10 })) };
}));
const good = parseGood({ format: 'GOOD', characters: [{ key: 'Mavuika' }], weapons: [], artifacts });
const t0 = performance.now();
const r = runOptimizer({ resolved, member: 0, rolls: bundle.optimization.rolls, ref: project.members[0], game, effects, good, characterKey: 'Mavuika', config: { ...DEFAULT_CONFIG, topN: 5 } });
console.log(`${per}/posição: ${(performance.now() - t0).toFixed(0)} ms, ${r.stats.evaluations} avaliações, ${(((performance.now() - t0)) / r.stats.evaluations).toFixed(3)} ms/avaliação`);

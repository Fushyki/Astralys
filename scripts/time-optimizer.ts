/**
 * Mede ONDE o otimizador gasta tempo (etapas), num inventário sintético: `npx tsx scripts/time-optimizer.ts [peças por posição] [team|member|move]`.
 * Etapas: preparar (filtros, avaliador, sementes), sensibilidade (quais stats importam, por padrão de set), busca, e dentro das
 * avaliações: montar o time (assembleTeam), stats finais e o valor (rotação). Não otimiza nada: só mede.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../src/engine';
import { parseGood } from '../src/features/good/goodImport';
import { evalTimes } from '../src/features/optimizer/evaluator';
import { DEFAULT_CONFIG, startOptimizer } from '../src/features/optimizer/run';
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
const scope = (process.argv[3] ?? 'team') as 'team' | 'member' | 'move';
const artifacts = (['flower', 'plume', 'sands', 'goblet', 'circlet'] as const).flatMap((slotKey) => Array.from({ length: per }, () => {
  const main = pick(MAIN[slotKey]);
  const subs = [...SUBS].sort(() => rnd() - 0.5).filter(([k]) => k !== main).slice(0, 4);
  return { setKey: pick(SETS), slotKey, rarity: 5, mainStatKey: main, level: 20, location: '', substats: subs.map(([key, v]) => ({ key, value: Math.round(v * (1 + Math.floor(rnd() * 4)) * 10) / 10 })) };
}));
const good = parseGood({ format: 'GOOD', characters: [{ key: 'Mavuika' }], weapons: [], artifacts });

const burst = game.moves.find((m) => m.character === 'Mavuika' && m.talent === 'burst')!;
const objective = scope === 'move' ? { kind: 'move' as const, moveId: burst.id, reaction: 'melt' as const, crit: 'avg' as const } : scope === 'member' ? { kind: 'member' as const } : { kind: 'team' as const };
const lap = (label: string, t: number) => console.log(`${label.padEnd(34)} ${t.toFixed(0).padStart(8)} ms`);

evalTimes.on = true;
const t0 = performance.now();
const h = startOptimizer({ resolved, member: 0, rolls: bundle.optimization.rolls, ref: project.members[0], game, effects, good, characterKey: 'Mavuika', config: { ...DEFAULT_CONFIG, topN: 5, objective } });
const tSetup = performance.now();
let first = 0;
for (const _ of h.steps) {
  void _;
  if (!first) first = performance.now();
}
const tSolve = performance.now();
const r = h.result();
const tReport = performance.now();

console.log(`\n${per} peças por posição · alvo: ${scope} · ${r.stats.evaluations} avaliações · ${r.inventory.pieces} peças · ${r.stats.patterns} padrões de set`);
lap('preparar (filtros, avaliador, sementes)', tSetup - t0);
lap('busca (todas as etapas abaixo)', tSolve - tSetup);
lap('relatórios dos melhores', tReport - tSolve);
lap('TOTAL', tReport - t0);
console.log('--- dentro das avaliações (soma de todas as chamadas) ---');
lap('montar o time (assembleTeam)', evalTimes.assembleMs);
lap('stats finais do membro', evalTimes.finalStatsMs);
lap('valor do alvo (rotação/golpe)', evalTimes.valueMs);
console.log(`avaliações medidas: ${evalTimes.calls} · ${((tSolve - tSetup) / Math.max(1, evalTimes.calls)).toFixed(3)} ms por avaliação (com a medição ligada)`);

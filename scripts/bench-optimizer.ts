/**
 * Roda o otimizador exato num inventário GOOD real e mostra o tempo e os melhores builds.
 *   npx tsx scripts/bench-optimizer.ts <arquivo.json> [Personagem] [borrow=none|all]
 * Usa o projeto de exemplo (Mavuika, Citlali, Iansan, Bennett) e troca o membro pelo personagem pedido, se ele estiver no time.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../src/engine';
import { parseGood } from '../src/features/good/goodImport';
import { DEFAULT_CONFIG, runOptimizer } from '../src/features/optimizer/run';
import { sampleProject } from '../src/features/rotation/persistence';

const root = process.cwd();
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = {
  characters: json('src/data/generated/characters.json'), moves: json('src/data/generated/moves.json'),
  weapons: json('src/data/generated/weapons.json'), artifacts: json('src/data/generated/artifacts.json'),
};
const effects: EffectsData = {
  characters: json('src/effects/characters.json'), weapons: json('src/effects/weapons.json'),
  sets: json('src/effects/sets.json'), flatDamage: json('src/effects/flatDamage.json'),
};

const [file, who = 'Mavuika', borrow = 'none'] = process.argv.slice(2);
if (!file) throw new Error('Informe o arquivo GOOD.');
const good = parseGood(JSON.parse(readFileSync(file, 'utf8')));
const project = { ...sampleProject(), compat: 'none' as const };
const member = project.members.findIndex((m) => m.character === who);
if (member < 0) throw new Error(`${who} não está no projeto de exemplo.`);
const resolved = resolveProject(project, game, effects);
const bundle = analyzeProject({ team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });

const t0 = performance.now();
let last = t0;
const r = runOptimizer({
  good, characterKey: who, member, resolved, rolls: bundle.optimization.rolls, ref: project.members[member], game, effects,
  config: { ...DEFAULT_CONFIG, borrowFrom: borrow === 'all' ? 'all' : 'none', epsilon: Number(process.env.EPS ?? 0) },
  onProgress: (st, best) => {
    const now = performance.now();
    if (now - last > 5000) {
      last = now;
      console.log(`  ${((now - t0) / 1000).toFixed(0)} s: avaliações ${st.evaluations}, padrões ${st.patternsDone}/${st.patterns}, melhor ${Math.round(best)}`);
    }
  },
  onPattern: (p) => {
    if (process.env.PATTERNS) console.log(`  [${p.skipped ? 'pulado' : 'rodou '}] ${p.pattern.kind} ${p.pattern.sets.join('+')} listas ${p.sizes.join('/')} avaliações ${p.evaluations} limite ${Math.round(p.bound)}`);
  },
  shouldStop: () => performance.now() - t0 > Number(process.env.LIMIT_S ?? 1e9) * 1000,
});
const s = (performance.now() - t0) / 1000;
console.log(`${who}: ${r.inventory.pieces} peças, ${r.stats.combinations.toExponential(2)} combinações brutas`);
console.log(`avaliações ${r.stats.evaluations}, peças dominadas ${r.stats.dominated}, padrões ${r.stats.patternsDone}/${r.stats.patterns}, ${s.toFixed(1)} s`);
const fmt = (n: number) => Math.round(n).toLocaleString('pt-BR');
if (r.equipped) console.log(`equipado hoje: DPR ${fmt(r.equipped.report.teamAvg)} (${r.equipped.setLabel})`);
r.builds.forEach((b, i) => console.log(`#${i + 1} DPR ${fmt(b.report.teamAvg)}  ${b.setLabel}  ATK ${fmt(b.report.stats.atk)} CR ${(b.report.stats.critRate * 100).toFixed(1)}% CD ${(b.report.stats.critDmg * 100).toFixed(1)}% EM ${fmt(b.report.stats.em)} ER ${(b.report.stats.er * 100).toFixed(0)}%`));

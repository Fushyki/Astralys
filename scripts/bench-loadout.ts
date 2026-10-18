/** Mede o tempo da busca de build com um inventário sintético grande (200 peças por posição). npx tsx scripts/bench-loadout.ts */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { analyzeProject, resolveProject, type EffectsData, type GameData } from '../src/engine';
import { parseGood } from '../src/features/good/goodImport';
import { searchBestLoadout, weightsFromGains } from '../src/features/good/loadoutSearch';
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

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const KEYS = ['critRate_', 'critDMG_', 'atk_', 'atk', 'eleMas', 'enerRech_', 'hp_', 'def_'];
const VAL: Record<string, number> = { critRate_: 3.3, critDMG_: 6.6, atk_: 4.95, atk: 18, eleMas: 19.5, enerRech_: 5.5, hp_: 4.95, def_: 6.2 };
const SETS = ['ObsidianCodex', 'GladiatorsFinale', 'ShimenawasReminiscence', 'EmblemOfSeveredFate', 'CrimsonWitchOfFlames', 'NoblesseOblige'];
const MAIN: Record<string, string[]> = { flower: ['hp'], plume: ['atk'], sands: ['eleMas', 'atk_', 'enerRech_'], goblet: ['pyro_dmg_', 'atk_', 'eleMas'], circlet: ['critRate_', 'critDMG_', 'atk_'] };
const artifacts = ['flower', 'plume', 'sands', 'goblet', 'circlet'].flatMap((slotKey) =>
  Array.from({ length: 200 }, () => {
    const keys = [...KEYS].sort(() => rnd() - 0.5).slice(0, 4);
    const main = MAIN[slotKey][Math.floor(rnd() * MAIN[slotKey].length)];
    return {
      setKey: SETS[Math.floor(rnd() * SETS.length)], slotKey, rarity: 5, mainStatKey: main, level: 20, location: '',
      substats: keys.filter((k) => k !== main).map((key) => ({ key, value: VAL[key] * (1 + Math.floor(rnd() * 5)) })),
    };
  }),
);
const good = parseGood({ format: 'GOOD', characters: [{ key: 'Mavuika' }], weapons: [], artifacts });
const project = sampleProject();
const resolved = resolveProject(project, game, effects);
const bundle = analyzeProject({ team: resolved.team, actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient });

const t0 = performance.now();
const r = await searchBestLoadout({
  good, characterName: 'Mavuika', member: 0, team: resolved.team, ref: project.members[0], rolls: bundle.optimization.rolls,
  actions: resolved.actions, flatEffects: resolved.flatEffects, ampCoefficient: resolved.ampCoefficient, game, effects,
  minRolls: project.config.minRollsPerSubstat, weights: weightsFromGains(bundle.gains, 0), allowEquippedByOthers: true,
});
const ms = performance.now() - t0;
console.log(`avaliados ${r.evaluated} conjuntos em ${(ms / 1000).toFixed(1)} s (${(ms / r.evaluated).toFixed(2)} ms cada); DPR ${Math.round(r.teamAvg)}`);

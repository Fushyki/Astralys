/** Carrega a planilha de referência + dados gerados + efeitos e monta equipa, ações e rolls otimizados. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import {
  PLANILHA_AMP_COEFFICIENT,
  assembleTeam,
  importPlanilha,
  optimizeTeam,
  type EffectsData,
  type GameData,
  type OptimizerContext,
} from '../../src/engine';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));

export function loadPlanilhaFixture() {
  const data: GameData = {
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
  const wb = XLSX.read(readFileSync(path.join(root, 'reference/Mavuika_Iansan_Combo2.xlsx')));
  const imported = importPlanilha(wb, data, effects);
  const assembly = assembleTeam(imported.team);
  const ctx: OptimizerContext = {
    members: imported.team.members,
    assembly,
    config: imported.team.config,
    actions: imported.actions,
    flatEffects: imported.flatEffects,
    ampCoefficient: PLANILHA_AMP_COEFFICIENT,
  };
  const optimized = optimizeTeam(ctx);
  return { wb, data, effects, imported, assembly, ctx, optimized };
}

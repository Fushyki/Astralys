/**
 * Gera o projeto de exemplo (src/features/rotation/sample/mavuika-iansan.json) a partir da planilha de referência.
 * Os tempos da Mavuika vêm das notas da planilha; os dos outros três personagens são ilustrativos.
 *   npx tsx scripts/make-sample-project.ts [--force]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { importPlanilha, projectFromPlanilha, RotationProjectSchema, type EffectsData, type GameData } from '../src/engine';

const root = process.cwd();
const out = path.join(root, 'src/features/rotation/sample/mavuika-iansan.json');
if (existsSync(out) && !process.argv.includes('--force')) {
  console.log('Já existe; use --force para sobrescrever.');
  process.exit(0);
}

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
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
const meta = json<{ gameVersion: string }>('src/data/generated/meta.json');

const wb = XLSX.read(readFileSync(path.join(root, 'reference/Mavuika_Iansan_Combo2.xlsx')));
const imported = importPlanilha(wb, data, effects);

// Ordem das ações na planilha: 17 da Mavuika, 4 da Citlali, 2 da Iansan, 1 do Bennett.
const TIMES = [
  6.9, 7.4, 8.2, 8.9, 9.5, 10.2, 10.8, 11.5, 12.1, 12.8, 13.5, 14.1, 14.8, 15.4, 16.1, 16.7, 17.4, // Mavuika (notas da planilha)
  0.4, 1.6, 2.0, 2.6, // Citlali (ilustrativo)
  3.4, 4.6, // Iansan (ilustrativo)
  5.8, // Bennett (ilustrativo)
];
if (TIMES.length !== imported.actions.length) throw new Error(`Esperava ${TIMES.length} ações, a planilha tem ${imported.actions.length}`);

const project = projectFromPlanilha(imported, {
  id: 'exemplo',
  name: 'Exemplo: Mavuika, Citlali, Iansan e Bennett',
  gameVersion: meta.gameVersion,
  timeOf: (_a, i) => TIMES[i],
  now: '2026-10-18T00:00:00.000Z',
});
RotationProjectSchema.parse(project);
writeFileSync(out, JSON.stringify(project, null, 2) + '\n');
console.log(`Escrito ${path.relative(root, out)}: ${project.members.length} membros, ${project.actions.length} ações`);

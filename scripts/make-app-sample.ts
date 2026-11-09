/**
 * Gera o exemplo que o site abre (src/features/rotation/sample/mavuika-iansan.app.json): o exemplo da planilha com os buffs em janelas,
 * sem o modo planilha (todos os efeitos curados valem) e sem os extras que repetem um buff já calculado.
 * O JSON original (mavuika-iansan.json) continua sendo o gabarito dos testes.
 *   npx tsx scripts/make-app-sample.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseProject, type EffectsData, type GameData } from '../src/engine';
import { dropDuplicateExtras } from '../src/features/rotation/extraDedupe';
import { windowsFromProfiles } from '../src/features/rotation/projectOps';

const root = process.cwd();
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = {
  characters: json('src/data/generated/characters.json'),
  moves: json('src/data/generated/moves.json'),
  weapons: json('src/data/generated/weapons.json'),
  artifacts: json('src/data/generated/artifacts.json'),
  levels: json('src/data/generated/levels.json'),
};
const effects: EffectsData = {
  characters: json('src/effects/characters.json'),
  weapons: json('src/effects/weapons.json'),
  sets: json('src/effects/sets.json'),
  flatDamage: json('src/effects/flatDamage.json'),
};

const sample = windowsFromProfiles(parseProject(json('src/features/rotation/sample/mavuika-iansan.json')));
// Sem o modo planilha a duração deixa de ser forçada: fica fixa na da planilha.
const free = { ...sample, compat: 'none' as const, config: { ...sample.config, durationManual: true } };
const { project, warnings } = dropDuplicateExtras(free, game, effects);
writeFileSync(path.join(root, 'src/features/rotation/sample/mavuika-iansan.app.json'), JSON.stringify(project, null, 2) + '\n');
console.log(`Exemplo do site gerado (${project.extras.length} extras, ${warnings.length} duplicados removidos).`);
warnings.forEach((w) => console.log(' -', w));

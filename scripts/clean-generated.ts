/** Limpa as marcas do Lunaris dos JSON gerados (também roda no fim dos syncs). `npx tsx scripts/clean-generated.ts` */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { cleanGeneratedJsonText } from '../src/data/clean';

export function cleanGenerated(dir = path.resolve('src/data/generated')): number {
  let changed = 0;
  for (const f of ['talents.json', 'weapons.json', 'artifacts.json', 'characters.json', 'moves.json']) {
    const p = path.join(dir, f);
    const raw = readFileSync(p, 'utf8');
    const out = cleanGeneratedJsonText(raw);
    if (out !== raw) {
      JSON.parse(out); // continua JSON válido
      writeFileSync(p, out);
      changed++;
      console.log(`limpo: ${f}`);
    }
  }
  return changed;
}

if (process.argv[1] && /clean-generated/.test(process.argv[1])) cleanGenerated();

/**
 * Comparação com o Genshin Optimizer (Fase 3, item 3): toda constelação e passiva que o GO modela como efeito tem destino aqui?
 * Uso: `npx tsx scripts/compare-go.ts <pasta libs/gi/sheets/src/Characters do clone do GO>`
 * (clone raso: `git clone --depth 1 --filter=blob:none --sparse https://github.com/frzyc/genshin-optimizer.git && git sparse-checkout set libs/gi/sheets`).
 * Limite: confere a EXISTÊNCIA do destino (buff, golpe extra, nota ou informativo), não valor nem condição: os números do GO vêm do mesmo
 * datamine (`skillParam_gen`), e a passiva só é checada por personagem (o GO e o Lunaris numeram as passivas de forma diferente).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { CharacterEffect } from '../src/effects/schema';

const dir = process.argv[2];
if (!dir || !existsSync(dir)) { console.error('Passe a pasta Characters do clone do GO.'); process.exit(2); }
const effects: CharacterEffect[] = JSON.parse(readFileSync('src/effects/characters.json', 'utf8'));
const ALIAS: Record<string, string> = { 'Kamisato Ayaka': 'Ayaka', 'Kamisato Ayato': 'Ayato', 'Kaedehara Kazuha': 'Kazuha', 'Kujou Sara': 'Sara', 'Raiden Shogun': 'Raiden', 'Sangonomiya Kokomi': 'Kokomi', 'Shikanoin Heizou': 'Heizou', 'Arataki Itto': 'Itto', 'Yumemizuki Mizuki': 'Mizuki' };
const folders = new Set(readdirSync(dir));
const count = (src: string, node: string) => (src.match(new RegExp(`dm\.${node}\.`, 'g')) ?? []).length;
const gaps: string[] = [];
let checked = 0;
for (const e of effects) {
  const folder = ALIAS[e.character] ?? e.character.replace(/\s/g, '');
  if (!folders.has(folder)) continue; // Viajantes, Mitya e Valeriy não existem no GO
  const src = readFileSync(path.join(dir, folder, 'index.tsx'), 'utf8');
  const ids = [e.buffs, e.procs, e.specialMoves, e.pointMoves].flatMap((l) => ((l ?? []) as { id?: string }[]).map((x) => x.id ?? ''));
  const notes = (e.notes ?? []).map((n) => n.src as string);
  const infos = (e.infos ?? []).map((i) => i.src as string);
  for (let n = 1; n <= 6; n++) {
    if (!count(src, `constellation${n}`)) continue;
    checked++;
    if (!ids.some((i) => i.startsWith(`c${n}`)) && !notes.includes(`const${n}`) && !infos.includes(`const${n}`)) gaps.push(`${e.character} C${n}`);
  }
  for (let n = 1; n <= 4; n++) {
    if (!count(src, `passive${n}`)) continue;
    checked++;
    if (!ids.some((i) => /^(a|p)\d/.test(i)) && !notes.some((x) => /^p\d$/.test(x)) && !infos.length) gaps.push(`${e.character} passiva ${n}`);
  }
}
console.log(`${checked} nós modelados pelo GO, ${gaps.length} sem destino aqui.`);
for (const g of gaps) console.log(`  ${g}`);
process.exitCode = gaps.length ? 1 : 0;

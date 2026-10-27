/**
 * Stats base dos personagens em qualquer nível (1 a 90): o Lunaris só traz o nível 90, então a curva de nível e os bônus de
 * ascensão vêm do Genshin Optimizer (MIT, `libs/gi/stats/src/allStat_gen.json`; ver THIRD_PARTY_NOTICES.md).
 * Rode `npx tsx scripts/sync-levels.ts [--refresh]`. Saída: src/data/generated/levels.json.
 *   stat(nível, ascensão) = base × curva[nível] + bônus[ascensão]
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const URL = 'https://raw.githubusercontent.com/frzyc/genshin-optimizer/master/libs/gi/stats/src/allStat_gen.json';
const CACHE = path.resolve('data/raw/go/allStat_gen.json');
const OUT = path.resolve('src/data/generated/levels.json');

interface GoChar {
  lvlCurves: { key: 'hp' | 'atk' | 'def'; base: number; curve: string }[];
  ascensionBonus: Record<string, number[]>;
}
interface GoStats { char: { expCurve: Record<string, number[]>; data: Record<string, GoChar> } }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const r6 = (n: number) => Math.round(n * 1e6) / 1e6;

async function load(): Promise<GoStats> {
  if (!process.argv.includes('--refresh') && existsSync(CACHE)) return JSON.parse(await readFile(CACHE, 'utf8')) as GoStats;
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Não foi possível baixar ${URL}: ${res.status}`);
  const text = await res.text();
  await mkdir(path.dirname(CACHE), { recursive: true });
  await writeFile(CACHE, text);
  return JSON.parse(text) as GoStats;
}

const go = await load();
const characters = JSON.parse(await readFile(path.resolve('src/data/generated/characters.json'), 'utf8')) as { name: string }[];
const goByNorm = new Map(Object.entries(go.char.data).map(([k, v]) => [norm(k), v]));

const used = new Set<string>();
const chars: Record<string, unknown> = {};
const missing: string[] = [];
for (const c of characters) {
  // O Viajante (Aether/Lumine, qualquer elemento) usa a mesma curva do "Traveler".
  const data = goByNorm.get(norm(c.name)) ?? (/^(Aether|Lumine) \(/.test(c.name) ? goByNorm.get('traveler') : undefined);
  if (!data) {
    missing.push(c.name);
    continue;
  }
  const lc = (key: 'hp' | 'atk' | 'def') => data.lvlCurves.find((x) => x.key === key)!;
  for (const x of data.lvlCurves) used.add(x.curve);
  // Bônus de ascensão: HP, ATK, DEF e o stat especial (o único outro que existe, ex.: critRate_ ou eleMas).
  const special = Object.keys(data.ascensionBonus).find((k) => !['hp', 'atk', 'def'].includes(k));
  chars[c.name] = {
    hp: [r6(lc('hp').base), lc('hp').curve],
    atk: [r6(lc('atk').base), lc('atk').curve],
    def: [r6(lc('def').base), lc('def').curve],
    asc: {
      hp: data.ascensionBonus.hp.map(r6),
      atk: data.ascensionBonus.atk.map(r6),
      def: data.ascensionBonus.def.map(r6),
      ...(special ? { special: data.ascensionBonus[special].map(r6) } : {}),
    },
  };
}

const curves = Object.fromEntries([...used].sort().map((k) => [k, go.char.expCurve[k].slice(0, 91).map((v, i) => (i === 0 ? 0 : r6(v)))]));
await writeFile(OUT, JSON.stringify({ source: 'Genshin Optimizer (MIT): libs/gi/stats/src/allStat_gen.json', curves, chars }, null, 1) + '\n');
console.log(`levels.json: ${Object.keys(chars).length} personagens, ${Object.keys(curves).length} curvas`);
if (missing.length) console.log(`sem dados de nível (ficam no nível 90): ${missing.join(', ')}`);

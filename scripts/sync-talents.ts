/**
 * Textos dos talentos, passivas e constelações (em português) a partir do cache do Lunaris em `data/raw/` (sem pedidos novos).
 * Rode `npm run sync:data` antes (ele enche o cache) e depois `npx tsx scripts/sync-talents.ts`.
 * Saída: src/data/generated/talents.json (um objeto por personagem, na ordem de characters.json). Só texto; os números dos golpes vêm de moves.json.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { cleanGenerated } from './clean-generated';

const RAW = path.resolve('data/raw/lunaris');
const OUT = path.resolve('src/data/generated/talents.json');

interface RawText {
  name?: string;
  icon?: string;
  description?: string;
  /** Linhas de números por nível (15 valores como texto): dano, duração, recarga, consumo de Stamina… */
  multipliers?: Record<string, unknown[]>;
}
interface RawChar {
  skills?: Record<string, RawText>;
  passives?: Record<string, RawText | string>;
  constellations?: Record<string, RawText>;
}

/** Marcas de cor do jogo viram texto puro; as quebras de linha ficam como \n e as linhas em branco repetidas somem. */
export function cleanLunaris(text: string | undefined): string {
  return (text ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\\n|\r?\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function readChar(version: string, lang: string, id: string): Promise<RawChar | null> {
  const file = path.join(RAW, version, lang, 'char', `${id}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(await readFile(file, 'utf8')) as RawChar;
}

const item = (t: RawText | string | undefined) => {
  if (!t || typeof t === 'string') return null;
  const description = cleanLunaris(t.description);
  return t.name || description ? { name: (t.name ?? '').trim(), icon: t.icon ?? '', description } : null;
};

async function main() {
  const version = JSON.parse(await readFile(path.join(RAW, 'version.json'), 'utf8')).version as string | undefined;
  const ver = version ?? (await import('node:fs/promises').then((f) => f.readdir(RAW))).find((d) => /^\d+\.\d+\.\d+$/.test(d))!;
  const characters = (await readFile(path.resolve('src/data/generated/characters.json'), 'utf8'))
    .split('\n')
    .filter((l) => l.trim().startsWith('{'))
    .map((l) => JSON.parse(l.trim().replace(/,$/, '')) as { id: string; name: string });

  const out: string[] = [];
  const missing: string[] = [];
  for (const c of characters) {
    const raw = (await readChar(ver, 'pt', c.id)) ?? (await readChar(ver, 'en', c.id));
    if (!raw) {
      missing.push(c.name);
      continue;
    }
    const skills = (['normalattack', 'elementalskill', 'elementalburst'] as const).map((k, i) => {
      const s = item(raw.skills?.[k]);
      // Linhas que não são dano (duração, recarga, Stamina, limites): o dano vem de moves.json.
      const params = Object.entries(raw.skills?.[k]?.multipliers ?? {})
        .filter(([label, values]) => !/dano|dmg/i.test(label) && Array.isArray(values) && values.length >= 1)
        .map(([label, values]) => ({ label: label.trim(), values: values.map((x) => String(x)) }));
      return s ? { talent: (['normal', 'skill', 'burst'] as const)[i], ...s, params } : null;
    });
    const passives = ['p1', 'p2', 'p3', 'p4'].map((k) => {
      const p = item(raw.passives?.[k]);
      return p ? { id: k, ...p } : null;
    });
    const constellations = ['const1', 'const2', 'const3', 'const4', 'const5', 'const6'].map((k, i) => {
      const t = item(raw.constellations?.[k]);
      return t ? { n: i + 1, ...t } : null;
    });
    out.push(
      JSON.stringify({
        character: c.name,
        skills: skills.filter(Boolean),
        passives: passives.filter(Boolean),
        constellations: constellations.filter(Boolean),
      }),
    );
  }
  await writeFile(OUT, '[\n  ' + out.join(',\n  ') + '\n]\n');
  cleanGenerated(path.dirname(OUT));
  console.log(`talents.json: ${out.length} personagens (${(out.join('').length / 1024).toFixed(0)} KB)${missing.length ? `; sem dados: ${missing.join(', ')}` : ''}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

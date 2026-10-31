/**
 * Leitor independente (Fase 3, item 2): compara os efeitos que um segundo agente leu SÓ do texto do Lunaris com a curadoria.
 * Uso: `npx tsx scripts/compare-reader.ts <leitor.json> [saida.md]`. Não resolve discordância: escreve a fila de revisão.
 * Compara por personagem: (stat, valor, alvo). Não compara nó nem condição (o buff não guarda o nó).
 * shortcut: golpes extras (`extraDamage`) e valores por nível de talento ficam de fora; ampliar quando precisar.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { CharacterEffect } from '../src/effects/schema';

interface Read { character: string; node: string; stat: string; value: number; scope?: string; timed?: boolean; condition?: string }
const [, , readerFile, outFile] = process.argv;
const reader: Read[] = JSON.parse(readFileSync(readerFile, 'utf8'));
const ours: CharacterEffect[] = JSON.parse(readFileSync('src/effects/characters.json', 'utf8'));

const SKIP = new Set(['extraDamage', 'pendente']);
const close = (a: number, b: number) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b)) + 1e-9;
interface Item { stat: string; value: number; label: string }

function ourItems(c: string): Item[] {
  const e = ours.find((x) => x.character === c);
  const out: Item[] = [];
  for (const b of e?.buffs ?? []) {
    const label = `${b.id} (${b.scope}${b.timed ? ', janela' : ''})`;
    for (const [k, v] of Object.entries(b.stats ?? {})) {
      if (typeof v === 'number' && v) out.push({ stat: k, value: v, label });
      else if (v && typeof v === 'object') for (const x of Object.values(v as Record<string, number>)) if (x) out.push({ stat: k.replace(/ByType$/, ''), value: x, label });
    }
    if (b.resShred) out.push({ stat: 'resShred', value: b.resShred.value, label });
    if (b.defShred) out.push({ stat: 'defShred', value: b.defShred, label });
  }
  return out;
}

const names = [...new Set(reader.map((r) => r.character))];
const md: string[] = ['# Fila de revisão do leitor independente', '', 'Gerado por `scripts/compare-reader.ts`. Discordância não é resolvida sozinha: o Davi decide.', ''];
let agree = 0, onlyReader = 0, onlyOurs = 0;
for (const c of names) {
  const theirs = reader.filter((r) => r.character === c && !SKIP.has(r.stat));
  const mine = ourItems(c);
  const used = new Set<number>();
  const miss: Read[] = [];
  for (const r of theirs) {
    const i = mine.findIndex((m, j) => !used.has(j) && close(m.value, Math.abs(r.value)) && (m.stat === r.stat || m.stat === 'dmgPct' || r.stat === 'dmgPct'));
    if (i < 0) miss.push(r); else { used.add(i); agree++; }
  }
  const extra = mine.filter((_, j) => !used.has(j));
  onlyReader += miss.length; onlyOurs += extra.length;
  md.push(`## ${c}`, '');
  for (const r of miss) md.push(`- SÓ NO LEITOR: ${r.node} ${r.stat} = ${r.value} (${r.scope ?? '?'}) ${r.condition ?? ''}`);
  for (const m of extra) md.push(`- SÓ NA CURADORIA: ${m.label} ${m.stat} = ${m.value}`);
  if (!miss.length && !extra.length) md.push('- Sem discordância.');
  md.push('');
}
md.splice(3, 0, `Concordam: ${agree}. Só no leitor: ${onlyReader}. Só na curadoria: ${onlyOurs}.`, '');
console.log(md.slice(0, 5).join('\n'));
if (outFile) writeFileSync(outFile, md.join('\n'), 'utf8');

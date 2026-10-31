/**
 * Leitor independente (Fase 3, item 2): compara os efeitos que um segundo agente leu SÓ do texto do Lunaris com a curadoria.
 * Uso: `npx tsx scripts/compare-reader.ts <leitor.json> [saida.md]`. Não resolve discordância: escreve a fila de revisão.
 * Compara por personagem: (stat, valor, alvo). Não compara nó nem condição (o buff não guarda o nó).
 * Buffs com `level`/`convert` ficam de fora; bônus de reação conta como dano; valor com stacks casa também pelo máximo. Cada discordância ainda pede olho humano (o leitor lê o valor máximo, a curadoria pode usar stacks).
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
interface Item { stat: string; value: number; label: string; /** bônus de reação: pode casar com o dano do leitor, mas sem par não é discordância (o leitor não modela reação) */ soft?: boolean; /** valores aceitos: o do buff e o do buff com todos os stacks (o leitor lê o máximo) */ any: number[] }

function ourItems(c: string): Item[] {
  const e = ours.find((x) => x.character === c);
  const out: Item[] = [];
  for (const b of e?.buffs ?? []) {
    if (b.level || b.convert) continue; // valor por nível de talento ou por ponto de stat: o leitor lê o valor máximo, não comparável
    const label = `${b.id} (${b.scope}${b.timed ? ', janela' : ''})`;
    const mult = Math.max(1, b.stacks?.max ?? 1, ...(b.stacks?.table ?? []));
    const push = (stat: string, value: number, soft = false) => out.push({ stat: stat === 'defIgnore' ? 'defShred' : stat, value, label, soft, any: [value, value * mult] });
    for (const [k, v] of Object.entries(b.stats ?? {})) {
      if (k === 'baseMultByType') continue;
      if (typeof v === 'number' && v) push(k, v);
      else if (v && typeof v === 'object') for (const x of Object.values(v as Record<string, number>)) if (x) push(k === 'reactionBonus' ? 'dmgPct' : k.replace(/ByType$/, ''), x, k === 'reactionBonus'); // o leitor não separa reação do dano comum
    }
    if (b.resShred) push('resShred', b.resShred.value);
    if (b.defShred) push('defShred', b.defShred);
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
  const matched = new Set<Read>();
  const hit = (m: Item, r: Read, anyStat: boolean) => m.any.some((a) => close(a, Math.abs(r.value))) && (m.stat === r.stat || (anyStat && (m.stat === 'dmgPct' || r.stat === 'dmgPct')));
  for (const anyStat of [false, true]) {
    for (const r of theirs) {
      if (matched.has(r)) continue;
      const i = mine.findIndex((m, j) => !used.has(j) && hit(m, r, anyStat));
      if (i >= 0) { used.add(i); matched.add(r); agree++; }
    }
  }
  for (const r of theirs) if (!matched.has(r)) miss.push(r);
  const extra = mine.filter((m, j) => !used.has(j) && !m.soft);
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

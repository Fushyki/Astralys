import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import type { CharacterEffect } from '../../src/effects/schema';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.resolve(__dirname, '../..', rel), 'utf8'));
const effects = json<CharacterEffect[]>('src/effects/characters.json');
const talents = json<{ character: { name?: string } | string; passives: { id: string; description: string }[]; constellations: { n: number; description: string }[] }[]>('src/data/generated/talents.json');

/** Teto de órfãos aceitos hoje. Só pode DESCER: ao curar nós, baixe o número; subir quebra o teste. */
const MAX_ORPHANS = 0;

/**
 * Órfão (aproximado): nó com número no texto e nenhum destino: nota `src`, buff da constelação (`minConstellation`),
 * golpe extra ou buff com id `cN` (constelação N), qualquer buff/golpe extra/golpe especial do personagem (passivas), ou +3 de talento (C3 e C5).
 * shortcut: o buff não guarda o nó de origem, então passiva com algum buff conta como coberta; apertar quando o buff guardar `src`.
 */
function orphans(): string[] {
  const out: string[] = [];
  for (const e of effects) {
    const t = talents.find((x) => (typeof x.character === 'string' ? x.character : x.character.name) === e.character);
    if (!t) continue;
    const notes = new Set((e.notes ?? []).map((n) => n.src));
    const hasEffect = [e.buffs, e.procs, e.specialMoves, e.pointMoves, e.infos].some((l) => (l ?? []).length > 0);
    const byConst = new Set((e.buffs ?? []).filter((b) => b.minConstellation).map((b) => `const${b.minConstellation}`));
    const ids = [e.buffs, e.procs, e.specialMoves, e.pointMoves].flatMap((l) => ((l ?? []) as { id?: string }[]).map((x) => x.id ?? ''));
    const nodes: [string, string][] = [...t.passives.map((p): [string, string] => [p.id, p.description]), ...t.constellations.map((c): [string, string] => [`const${c.n}`, c.description])];
    for (const [id, text] of nodes) {
      if (!/\d/.test(text) || notes.has(id) || byConst.has(id) || ids.some((i) => i.startsWith(`c${id.slice(5)}`) && id.startsWith('const')) || id === 'const3' || id === 'const5') continue;
      if (id.startsWith('p') && hasEffect) continue;
      out.push(`${e.character}:${id}`);
    }
  }
  return out;
}

it('nenhum número do texto fica sem destino (cálculo, só exibido ou pendente)', () => {
  const found = orphans();
  expect(found.length, found.slice(0, 20).join(', ')).toBeLessThanOrEqual(MAX_ORPHANS);
});

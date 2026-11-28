/** Todo buff de personagem que depende de janela ou nasce com uma (`charTiming.ts`) ou diz por que não (#75). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHARACTER_NO_WINDOW, CHARACTER_TIMING } from '../../scripts/curation/charTiming';
import type { CharacterEffect } from '../../src/effects/schema';

const effects = JSON.parse(readFileSync(path.join(__dirname, '../../src/effects/characters.json'), 'utf8')) as CharacterEffect[];

describe('duração dos buffs de personagem', () => {
  it('nenhum buff de janela fica fora das duas listas, e nenhum está nas duas', () => {
    const missing: string[] = [];
    const both: string[] = [];
    for (const e of effects) {
      for (const b of e.buffs.filter((x) => x.timed)) {
        const timed = !!CHARACTER_TIMING[e.character]?.[b.id];
        const open = !!CHARACTER_NO_WINDOW[e.character]?.[b.id];
        if (!timed && !open) missing.push(`${e.character} ${b.id}`);
        if (timed && open) both.push(`${e.character} ${b.id}`);
      }
    }
    expect(missing).toEqual([]);
    expect(both).toEqual([]);
  });

  it('o que está na tabela de tempo saiu com duração no efeito gerado', () => {
    for (const [name, ids] of Object.entries(CHARACTER_TIMING)) {
      for (const id of Object.keys(ids)) {
        const b = effects.find((e) => e.character === name)?.buffs.find((x) => x.id === id);
        expect(b?.timed ? b.duration : b?.flat?.every((f) => f.duration), `${name} ${id}`).toBeTruthy();
      }
    }
  });
});

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Consertos de docs/VARREDURA_GO.md (#41): se um sync ou curadoria desfizer algum, falha aqui.
const json = (rel: string) => JSON.parse(readFileSync(path.join(__dirname, '../..', rel), 'utf8'));
const moves: { character: string; talent: string; label: string; hitType: string }[] = json('src/data/generated/moves.json');
const characters: { name: string; baseHp: number; baseAtk: number; baseDef: number }[] = json('src/data/generated/characters.json');
const effects: { character: string; buffs: { id: string; forElements?: string[] }[] }[] = json('src/effects/characters.json');

describe('varredura contra o Genshin Optimizer', () => {
  it.each([
    ['Raiden Shogun', 'burst', '1-Hit DMG', 'burst'], ['Diluc', 'skill', '1-Hit DMG', 'skill'], ['Xiangling', 'burst', '1-Hit Swing DMG', 'burst'],
    ['Ganyu', 'normal', 'Frostflake Arrow DMG', 'charged'], ['Clorinde', 'skill', 'Swift Hunt DMG', 'normal'], ['Cyno', 'burst', '1-Hit DMG', 'normal'],
  ])('%s %s %s é %s', (c, talent, label, hitType) => {
    expect(moves.find((m) => m.character === c && m.talent === talent && m.label === label)?.hitType).toBe(hitType);
  });
  it('Aloy e o Viajante usam a base do GO', () => {
    expect(characters.find((c) => c.name === 'Aloy')!.baseAtk).toBeCloseTo(233.916, 3);
    expect(characters.find((c) => c.name === 'Lumine (Anemo)')!.baseHp).toBeCloseTo(10874.915, 3);
  });
  it('bônus de um elemento só não vale para o resto', () => {
    const buff = (c: string, id: string) => effects.find((e) => e.character === c)!.buffs.find((b) => b.id === id)!;
    expect(buff('Xingqiu', 'a4').forElements).toEqual(['Hydro']);
    expect(buff('Kaedehara Kazuha', 'a4').forElements).not.toContain('Anemo');
  });
});

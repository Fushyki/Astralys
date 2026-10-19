import { describe, expect, it } from 'vitest';
import characters from '../../src/effects/characters.json';
import generated from '../../src/data/generated/characters.json';

type Buff = { id: string; label: string; stats?: Record<string, unknown>; resShred?: { value: number; elements: string[] }; team?: { scale?: { table: number[] } }; level?: { talent: string; table: number[] }; convert?: { perPoint: number; capBaseAtk?: number } };

const withBuffs = (characters as { character: string; buffs?: Buff[] }[]).filter((c) => c.buffs?.length);

describe('passivas e constelações curadas', () => {
  it('cobrem mais de 90 personagens e todos existem nos dados do jogo', () => {
    expect(withBuffs.length).toBeGreaterThan(90);
    const names = new Set((generated as { name: string }[]).map((c) => c.name));
    for (const c of withBuffs) expect(names.has(c.character), c.character).toBe(true);
  });

  it('não repetem id dentro do mesmo personagem e têm valores plausíveis', () => {
    for (const c of withBuffs) {
      const ids = c.buffs!.map((b) => b.id);
      expect(new Set(ids).size, `${c.character}: ids repetidos`).toBe(ids.length);
      for (const b of c.buffs!) {
        for (const [k, v] of Object.entries(b.stats ?? {})) {
          if (typeof v === 'number') expect(Math.abs(v) * (b.level ? Math.max(...b.level.table) : 1), `${c.character} ${b.id} ${k}`).toBeLessThanOrEqual(k === 'em' ? 400 : /Flat$/.test(k) ? 1000 : 2);
        }
        // Com `team.scale` o valor guardado é 1 e a tabela traz os números de verdade.
        const shred = b.resShred && b.resShred.value * (b.team?.scale ? Math.max(...b.team.scale.table) : 1) * (b.level ? Math.max(...b.level.table) : 1);
        if (shred !== undefined) expect(shred, `${c.character} ${b.id}`).toBeLessThanOrEqual(0.55);
      }
    }
  });

  it('efeitos do kit trazem a tabela de 15 níveis do Lunaris', () => {
    const find = (n: string, id: string) => (characters as { character: string; buffs?: Buff[] }[]).find((c) => c.character === n)!.buffs!.find((b) => b.id === id)!;
    const paramita = find('Hu Tao', 'paramita');
    expect(paramita.level!.talent).toBe('skill');
    expect(paramita.level!.table[0]).toBeCloseTo(0.0384, 6);
    expect(paramita.level!.table[9]).toBeCloseTo(0.0626, 6);
    expect(paramita.convert!.capBaseAtk).toBe(4);
    expect(find('Xiao', 'burst').level!.table[14]).toBeGreaterThan(find('Xiao', 'burst').level!.table[0]);
  });

  it('Xiao A1 usa o teto de 25% e Yoimiya A1 usa 10 stacks de 2%', () => {
    const buff = (n: string, id: string) => (characters as { character: string; buffs?: Buff[] }[]).find((c) => c.character === n)!.buffs!.find((b) => b.id === id)!;
    expect(buff('Xiao', 'a1').stats!.dmgPct).toBeCloseTo(0.25, 6);
    expect(buff('Yoimiya', 'a1').stats!.dmgPct).toBeCloseTo(0.2, 6);
  });
});

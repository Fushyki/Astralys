import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { GameData } from '../../src/engine';
import { applyGoodToMembers, enkaToGood, mergeGood, type EnkaResponse } from '../../src/features/enka/enkaImport';
import { buildFromGood } from '../../src/features/good/goodImport';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: Pick<GameData, 'characters' | 'weapons' | 'artifacts'> = {
  characters: json('src/data/generated/characters.json'),
  weapons: json('src/data/generated/weapons.json'),
  artifacts: json('src/data/generated/artifacts.json'),
};
const vitrine = json<EnkaResponse>('tests/fixtures/enka-vitrine.json');

describe('vitrine do Enka (a fonte do akasha.cv) como inventário GOOD', () => {
  const r = enkaToGood(vitrine, game);

  it('traz os personagens, as armas e as 5 peças de cada um', () => {
    expect(r.nickname).toBe('Jogador de teste');
    expect(r.characters).toEqual(['Amber', 'Bennett']);
    expect(r.good.characters).toHaveLength(2);
    expect(r.good.weapons.map((w) => w.key)).toEqual(['Skyward Harp', 'Freedom-Sworn']);
    expect(r.good.artifacts).toHaveLength(10);
    expect(r.notes).toEqual([]);
  });

  it('lê constelação, talentos pela ordem oficial e refinamento', () => {
    const amber = r.good.characters.find((c) => c.key === 'Amber')!;
    expect(amber).toMatchObject({ level: 90, constellation: 6, talent: { auto: 10, skill: 10, burst: 10 } });
    expect(r.good.characters.find((c) => c.key === 'Bennett')!.talent).toEqual({ auto: 6, skill: 8, burst: 10 });
    expect(r.good.weapons.find((w) => w.location === 'Amber')!.refinement).toBe(2);
    expect(r.good.weapons.find((w) => w.location === 'Bennett')!.refinement).toBe(1);
  });

  it('converte main stats e substats para as chaves do GOOD (percentuais em unidades de %)', () => {
    const flower = r.good.artifacts.find((a) => a.location === 'Amber' && a.slotKey === 'flower')!;
    expect(flower).toMatchObject({ setKey: 'Bloodstained Chivalry', rarity: 5, mainStatKey: 'hp', level: 20 });
    expect(flower.substats).toEqual([
      { key: 'def', value: 37 },
      { key: 'atk_', value: 11.1 },
      { key: 'critDMG_', value: 18.7 },
      { key: 'eleMas', value: 19 },
    ]);
    const circlet = r.good.artifacts.find((a) => a.location === 'Amber' && a.slotKey === 'circlet')!;
    expect(circlet.mainStatKey).toBe('critDMG_');
  });

  it('alimenta o fluxo do GOOD: o build sai com arma, sets e rolls reais', () => {
    const b = buildFromGood(r.good, 'Amber', game);
    expect(b.patch.weapon).toBe('Skyward Harp');
    expect(b.patch.refinement).toBe(2);
    expect(b.patch.primarySet).toBe('Bloodstained Chivalry');
    expect(b.patch.artifacts.circlet).toBe('CD');
    expect(b.patch.constellation).toBe(6);
    // a soma de Taxa Crítica das 5 peças vira rolls fracionários positivos
    expect(b.patch.manualRolls.CR).toBeGreaterThan(5);
  });

  it('o Viajante e personagens desconhecidos são avisados e ignorados', () => {
    const out = enkaToGood({ avatarInfoList: [{ avatarId: 10000005, equipList: [] }, { avatarId: 99999999, equipList: [] }] }, game);
    expect(out.characters).toEqual([]);
    expect(out.notes.join(' ')).toMatch(/Viajante/);
    expect(out.notes.join(' ')).toMatch(/99999999/);
  });

  it('vitrine vazia explica como ativar no jogo', () => {
    expect(enkaToGood({ avatarInfoList: [] }, game).notes[0]).toMatch(/vitrine/i);
  });

  it('aplica os builds da vitrine ao time e separa quem não está nela', () => {
    const base = (n: string) => ({ character: n, weapon: 'x', artifacts: { rarity: { flower: 5 as const, plume: 5 as const, sands: 5 as const, goblet: 5 as const, circlet: 5 as const }, sands: 'ATK%', goblet: 'DMG%', circlet: 'CR' }, talents: { normal: 1, skill: 1, burst: 1 } });
    const out = applyGoodToMembers([base('Amber'), base('Citlali')], r.good, game);
    expect(out.applied).toEqual(['Amber']);
    expect(out.missing).toEqual(['Citlali']);
    expect(out.members[0]).toMatchObject({ weapon: 'Skyward Harp', refinement: 2, constellation: 6, primarySet: 'Bloodstained Chivalry' });
    expect(out.members[1]).toEqual(base('Citlali'));
  });

  it('juntar à vitrine troca só os personagens dela e mantém o resto do inventário', () => {
    const base = {
      format: 'GOOD' as const,
      characters: [{ key: 'Amber', level: 1 }, { key: 'Mavuika', level: 90 }],
      weapons: [{ key: 'Old', location: 'Amber' }, { key: 'Keep', location: 'Mavuika' }],
      artifacts: [{ setKey: 'X', slotKey: 'flower' as const, rarity: 5, mainStatKey: 'hp', substats: [], location: 'Amber' }, { setKey: 'Y', slotKey: 'flower' as const, rarity: 5, mainStatKey: 'hp', substats: [], location: 'Mavuika' }],
    };
    const m = mergeGood(base, r.good);
    expect(m.characters.map((c) => c.key).sort()).toEqual(['Amber', 'Bennett', 'Mavuika']);
    expect(m.characters.find((c) => c.key === 'Amber')!.level).toBe(90);
    expect(m.weapons.filter((w) => w.location === 'Amber').map((w) => w.key)).toEqual(['Skyward Harp']);
    expect(m.weapons.some((w) => w.key === 'Keep')).toBe(true);
    expect(m.artifacts.filter((a) => a.location === 'Mavuika')).toHaveLength(1);
    expect(mergeGood(null, r.good)).toBe(r.good);
  });
});

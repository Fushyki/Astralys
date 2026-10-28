import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleTeam, resolveProject, type EffectsData, type GameData } from '../../src/engine';
import { sampleProject } from '../../src/features/rotation/persistence';

const root = path.resolve(__dirname, '../..');
const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const game: GameData = {
  characters: json('src/data/generated/characters.json'),
  moves: json('src/data/generated/moves.json'),
  weapons: json('src/data/generated/weapons.json'),
  artifacts: json('src/data/generated/artifacts.json'),
};
const effects: EffectsData = {
  characters: json('src/effects/characters.json'),
  weapons: json('src/effects/weapons.json'),
  sets: json('src/effects/sets.json'),
  flatDamage: json('src/effects/flatDamage.json'),
};

/** Fora do modo planilha, o que a planilha semeou não pode somar de novo com as passivas curadas (conferido com o GO). */
describe('sem contar duas vezes os números semeados da planilha', () => {
  const team = () => resolveProject({ ...sampleProject(), compat: undefined }, game, effects).team;

  it('RES do inimigo: só os -20% da Citlali (não -40%)', () => {
    const t = team();
    expect(assembleTeam(t, {}).enemyRes.Pyro).toBeCloseTo(t.config.enemyBaseRes - 0.2, 9);
  });
  it('Mavuika: o ATK% e o DMG% semeados saem do bloco estático (os buffs A1 e A4 valem por faixa)', () => {
    const e = team().members[0].characterEffect!;
    expect([e.atkPct, e.dmgPct]).toEqual([0, 0]);
    expect(e.buffs.map((b) => b.id)).toEqual(expect.arrayContaining(['a1', 'a4']));
  });
  it('Bennett: o ATK fixo do Supremo não leva o C1 de novo (139% da planilha menos os 20% do buff C1)', () => {
    expect(team().members[3].characterEffect!.teamFlatAtk!.perBaseAtk).toBeCloseTo(1.19, 9);
  });
  it('modo planilha continua com os números dela', () => {
    const e = resolveProject(sampleProject(), game, effects).team.members[0].characterEffect!;
    expect([e.atkPct, e.dmgPct]).toEqual([0.3, 0.4]);
  });
});

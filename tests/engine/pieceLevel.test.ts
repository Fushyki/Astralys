import { describe, expect, it } from 'vitest';
import { buildFromPieces, mainStatOf, mainStatValue, maxPieceLevel, pieceLevel, pieceVector, DIM, type RealPiece } from '../../src/engine';
import { ARTIFACT_MAIN_STAT } from '../../src/engine/constants/artifactMainStat';

// Valores de referência: tabela do jogo copiada do Genshin Optimizer (libs/gi/stats/Data/Artifacts/artifact_main.json).
describe('main stat por nível e raridade', () => {
  it('5 estrelas: +0, +4, +16 e +20', () => {
    expect(mainStatValue('hp', 5, 0)).toBe(717);
    expect(mainStatValue('hp', 5, 20)).toBe(4780);
    expect(mainStatValue('atk', 5, 0)).toBe(47);
    expect(mainStatValue('atk', 5, 16)).toBe(258);
    expect(mainStatValue('atk', 5, 20)).toBe(311);
    expect(mainStatValue('atk_', 5, 0)).toBe(0.07);
    expect(mainStatValue('atk_', 5, 4)).toBe(0.149);
    expect(mainStatValue('atk_', 5, 20)).toBe(0.466);
    expect(mainStatValue('critRate_', 5, 0)).toBe(0.047);
    expect(mainStatValue('critRate_', 5, 20)).toBe(0.311);
    expect(mainStatValue('critDMG_', 5, 12)).toBe(0.41);
    expect(mainStatValue('critDMG_', 5, 20)).toBe(0.622);
    expect(mainStatValue('eleMas', 5, 0)).toBe(28);
    expect(mainStatValue('eleMas', 5, 20)).toBe(186.5);
    expect(mainStatValue('enerRech_', 5, 20)).toBe(0.518);
    expect(mainStatValue('def_', 5, 20)).toBe(0.583);
    expect(mainStatValue('pyro_dmg_', 5, 20)).toBe(0.466);
    expect(mainStatValue('physical_dmg_', 5, 20)).toBe(0.583);
  });

  it('4 estrelas: +0 e +16 (máximo)', () => {
    expect(mainStatValue('hp', 4, 0)).toBe(645);
    expect(mainStatValue('hp', 4, 16)).toBe(3571);
    expect(mainStatValue('atk', 4, 16)).toBe(232);
    expect(mainStatValue('atk_', 4, 0)).toBe(0.063);
    expect(mainStatValue('atk_', 4, 16)).toBe(0.348);
    expect(mainStatValue('critRate_', 4, 16)).toBe(0.232);
    expect(mainStatValue('eleMas', 4, 16)).toBe(139.3);
  });

  it('3 estrelas: +12 (máximo)', () => {
    expect(mainStatValue('hp', 3, 12)).toBe(1893);
    expect(mainStatValue('atk_', 3, 12)).toBe(0.231);
  });

  it('cada raridade tem 4×raridade+1 níveis e os valores crescem com o nível', () => {
    for (const r of [1, 2, 3, 4, 5] as const) {
      for (const values of Object.values(ARTIFACT_MAIN_STAT[r])) {
        expect(values.length).toBe(maxPieceLevel(r) + 1);
        for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThan(values[i - 1]);
      }
    }
  });

  it('sem nível assume o máximo; nível acima do máximo fica no máximo; chave desconhecida vale 0', () => {
    expect(pieceLevel({ rarity: 5 })).toBe(20);
    expect(pieceLevel({ rarity: 4 })).toBe(16);
    expect(pieceLevel({ rarity: 4, level: 20 })).toBe(16);
    expect(mainStatValue('atk_', 5)).toBe(0.466);
    expect(mainStatValue('atk_', 4, 20)).toBe(0.348);
    expect(mainStatValue('heal_', 5, -3)).toBe(ARTIFACT_MAIN_STAT[5].heal_[0]);
    expect(mainStatValue('nada', 5, 20)).toBe(0);
  });
});

describe('peças reais usam o main stat do nível delas', () => {
  const piece = (slotKey: RealPiece['slotKey'], mainStatKey: string, level?: number, rarity = 5): RealPiece => ({ setKey: 'GladiatorsFinale', slotKey, rarity, level, mainStatKey, substats: [] });

  it('vetor da peça', () => {
    expect(pieceVector(piece('flower', 'hp', 0), 'Pyro')[DIM.hpFlat]).toBe(717);
    expect(pieceVector(piece('plume', 'atk', 8), 'Pyro')[DIM.atkFlat]).toBe(152);
    expect(pieceVector(piece('sands', 'atk_', 4), 'Pyro')[DIM.atkPct]).toBe(0.149);
    expect(pieceVector(piece('goblet', 'pyro_dmg_', 16), 'Pyro')[DIM.dmg]).toBe(0.387);
    expect(pieceVector(piece('goblet', 'hydro_dmg_', 20), 'Pyro')[DIM.dmg]).toBe(0);
    expect(pieceVector(piece('circlet', 'critDMG_', 12, 4), 'Pyro')[DIM.cd]).toBe(ARTIFACT_MAIN_STAT[4].critDMG_[12]);
  });

  it('mainStatOf devolve valor e nível; buildFromPieces soma os mains do nível de cada peça', () => {
    expect(mainStatOf(piece('sands', 'eleMas', 0))).toEqual({ key: 'eleMas', value: 28, level: 0 });
    expect(mainStatOf(piece('flower', 'hp'))).toEqual({ key: 'hp', value: 4780, level: 20 });
    const b = buildFromPieces([piece('flower', 'hp', 0), piece('plume', 'atk', 20), piece('sands', 'atk_', 0), piece('goblet', 'atk_', 20)], 'Pyro', []);
    expect(b.stats.hpFlat).toBe(717);
    expect(b.stats.atkFlat).toBe(311);
    expect(b.stats.atkPct).toBeCloseTo(0.07 + 0.466, 12);
  });
});

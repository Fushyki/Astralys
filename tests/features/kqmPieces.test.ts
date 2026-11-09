import { describe, expect, it } from 'vitest';
import { zeroRolls } from '../../src/engine/artifacts';
import { artifactProcs, maxProcs, type SubKey } from '../../src/features/good/artifactProcs';
import { kqmPieces } from '../../src/features/good/kqmPieces';

const cfg = { rarity: { flower: 5, plume: 5, sands: 5, goblet: 5, circlet: 5 } as const, sands: 'ATK%', goblet: 'DMG%', circlet: 'CR' };

describe('rolls do KQM viram 5 artefatos', () => {
  const rolls = { ...zeroRolls(), CR: 9, CD: 13, 'ATK%': 7, EM: 3, ER: 6, ATK: 2, 'HP%': 1, HP: 1, 'DEF%': 1, DEF: 1 };
  const { pieces, leftover } = kqmPieces(rolls, { ...cfg }, 'GladiatorsFinale', 'Pyro');
  it('mantém os rolls, os limites e os mains', () => {
    expect(leftover).toBe(0);
    expect(pieces.map((p) => p.mainStatKey)).toEqual(['hp', 'atk', 'atk_', 'pyro_dmg_', 'critRate_']);
    for (const p of pieces) {
      const r = artifactProcs(p.substats, 5);
      expect(r.ok).toBe(true);
      expect(r.total).toBeLessThanOrEqual(maxProcs(5, 20));
      expect(new Set(p.substats.map((s) => s.key)).size).toBe(p.substats.length);
      expect(p.substats.length).toBeLessThanOrEqual(4);
      expect(p.substats.some((s) => s.key === p.mainStatKey)).toBe(false);
    }
    const total = (k: SubKey) => pieces.reduce((t, p) => t + (artifactProcs(p.substats.filter((s) => s.key === k), 5).total), 0);
    expect(total('critRate_')).toBe(9);
    expect(total('critDMG_')).toBe(13);
    expect(total('atk_')).toBe(7);
  });
});

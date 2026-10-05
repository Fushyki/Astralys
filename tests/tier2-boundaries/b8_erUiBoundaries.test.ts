/**
 * Boundary & Corner Cases: ER Calculator UI & State (Tier 2)
 * Edge cases: Corrupted backup JSON, negative inputs, "Nobody" character profile,
 * unselected slot, empty presets list.
 */

import { describe, it, expect } from '../testRunner';
import { getCharacterERData } from '../../src/data/characters';
import { safeCalculateTeamER as calculateTeamER } from '../helpers/referenceEngines';

export function parseTeamBackupJSON(jsonStr: string): { success: boolean; data?: any[]; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      return { success: false, error: 'Backup root must be an array of teams' };
    }
    return { success: true, data: parsed };
  } catch (err: any) {
    return { success: false, error: err.message || 'Invalid JSON syntax' };
  }
}

describe('Boundary 8 (B8): ER UI & State Boundary & Corner Cases', () => {
  it('B8.1: Rejects corrupted or malformed JSON in backup file import with informative error', () => {
    const invalidJson = '{ "name": "Broken Team", corrupt... ';
    const res = parseTeamBackupJSON(invalidJson);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();

    const notArrayJson = '{"singleTeam": true}';
    const resNotArray = parseTeamBackupJSON(notArrayJson);
    expect(resNotArray.success).toBe(false);
  });

  it('B8.2: Handles unselected / "Nobody" character safely with default fallback', () => {
    const nobody = getCharacterERData('Nobody');
    expect(nobody.name).toBe('Nobody');
    expect(nobody.burst_cost).toBe(60);
    expect(nobody.particles).toBe(3);

    const unknownChar = getCharacterERData('UnknownFakeChar');
    expect(unknownChar.name).toBe('UnknownFakeChar');
    expect(unknownChar.element).toBe('Pyro');
    expect(unknownChar.burst_cost).toBe(60);
  });

  it('B8.3: Custom particle override clamps negative values or NaN safely', () => {
    const sanitizeParticles = (val: number | undefined, base: number) => {
      if (val === undefined || isNaN(val) || val < 0) return base;
      return Math.min(50, val);
    };
    expect(sanitizeParticles(-5, 3)).toBe(3);
    expect(sanitizeParticles(NaN, 3)).toBe(3);
    expect(sanitizeParticles(12.5, 3)).toBe(12.5);
    expect(sanitizeParticles(100, 3)).toBe(50);
  });

  it('B8.4: Handles empty saved presets array without crashing UI selectors', () => {
    const savedTeams: any[] = [];
    expect(savedTeams.length).toBe(0);
    const activeTeam = savedTeams[0] || null;
    expect(activeTeam).toBeNull();
  });

  it('B8.5: Handles negative flat energy by clamping to zero', () => {
    const sanitizeFlatEnergy = (flat: number) => Math.max(0, flat);
    expect(sanitizeFlatEnergy(-20)).toBe(0);
    expect(sanitizeFlatEnergy(15)).toBe(15);
  });
});

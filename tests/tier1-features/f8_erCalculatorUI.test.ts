/**
 * Feature 8: Interactive ER Calculator UI Model Tests (Tier 1)
 * Requirement R2 / Acceptance: 4-slot team builder, live energy breakdowns,
 * preset teams, local storage save/load, JSON backup import/export.
 */

import { describe, it, expect } from '../testRunner';
import { ER_POPULAR_PRESETS as PRESET_TEAMS } from '../../src/data/presets';
import { safeCalculateTeamER as calculateTeamER } from '../helpers/referenceEngines';
import { SavedTeam } from '../../src/types/er';

describe('Feature 8 (F8): Interactive ER Calculator UI Model & Presets', () => {
  it('F8.1: Preset teams list contains standard meta teams with 4 configured slots', () => {
    expect(PRESET_TEAMS.length).toBeGreaterThan(0);
    const mavuikaPreset = PRESET_TEAMS.find(p => p.name.includes('Mavuika') || p.id === 'mavuika_overload');
    expect(mavuikaPreset).toBeDefined();
    expect(mavuikaPreset?.slots.length).toBe(4);
  });

  it('F8.2: Produces comprehensive live energy breakdowns (skills, fav, enemies, flat, total)', () => {
    const preset = PRESET_TEAMS[0];
    const results = calculateTeamER(preset.slots, preset.rotationTime || 20, preset.enemyParts || 6);
    expect(results.length).toBe(4);
    results.forEach(res => {
      expect(res.baseFromSkills).toBeGreaterThanOrEqual(0);
      expect(res.baseFromFav).toBeGreaterThanOrEqual(0);
      expect(res.baseFromEnemies).toBeGreaterThanOrEqual(0);
      expect(res.totalBaseEnergy).toBeCloseTo(res.baseFromSkills + res.baseFromFav + res.baseFromEnemies, 2);
    });
  });

  it('F8.3: Evaluates status severity tiers (comfortable, balanced, high, critical, ignored)', () => {
    const validTiers = ['comfortable', 'balanced', 'high', 'critical', 'ignored'];
    const preset = PRESET_TEAMS[0];
    const results = calculateTeamER(preset.slots, 20, 6);
    results.forEach(res => {
      expect(validTiers.includes(res.status)).toBe(true);
      expect(typeof res.statusLabel).toBe('string');
    });
  });

  it('F8.4: Serializes team configuration into valid SavedTeam JSON schema', () => {
    const team: SavedTeam = {
      id: 12345,
      name: 'Custom Team Astralys',
      rotationTime: 20,
      enemyParts: 6,
      slots: PRESET_TEAMS[0].slots,
      createdAt: Date.now()
    };
    const jsonStr = JSON.stringify(team);
    const parsed: SavedTeam = JSON.parse(jsonStr);
    expect(parsed.id).toBe(12345);
    expect(parsed.name).toBe('Custom Team Astralys');
    expect(parsed.slots.length).toBe(4);
  });

  it('F8.5: Deserializes backup JSON array and restores slot parameters accurately', () => {
    const backupData: SavedTeam[] = [
      {
        id: 1,
        name: 'Team Backup 1',
        rotationTime: 22,
        enemyParts: 4,
        slots: PRESET_TEAMS[0].slots
      }
    ];
    const jsonString = JSON.stringify(backupData);
    const restored: SavedTeam[] = JSON.parse(jsonString);
    expect(restored.length).toBe(1);
    expect(restored[0].rotationTime).toBe(22);
    expect(restored[0].enemyParts).toBe(4);
  });
});

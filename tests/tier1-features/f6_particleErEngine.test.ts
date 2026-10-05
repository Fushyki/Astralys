/**
 * Feature 6: Particle ER Engine Tests (Tier 1)
 * Requirement R2: 128 characters, elemental absorption multipliers (3.0/1.8 same, 1.0/0.6 diff),
 * white particle absorption (2.0/1.2), ER needed %.
 */

import { describe, it, expect } from '../testRunner';
import { safeCalculateTeamER as calculateTeamER } from '../helpers/referenceEngines';
import { calculateTeamER as rawCalculateTeamER } from '../../src/engines/erEngine';
import { CHARACTERS_DATABASE, getCharacterERData } from '../../src/data/characters';
import { SCENARIO_1_MAVUIKA } from '../fixtures/referenceTeams';

describe('Feature 6 (F6): Particle ER Engine (128 Characters & Physics)', () => {
  it('F6.1: Character database contains at least 128 characters spanning v1.0 to v6.7', () => {
    expect(CHARACTERS_DATABASE.length).toBeGreaterThanOrEqual(128);
    const mavuika = getCharacterERData('Mavuika');
    expect(mavuika.name).toBe('Mavuika');
    expect(mavuika.element).toBe('Pyro');
    expect(mavuika.burst_cost).toBe(0);

    const citlali = getCharacterERData('Citlali');
    expect(citlali.element).toBe('Cryo');
    expect(citlali.burst_cost).toBe(60);
  });

  it('F6.2: Elemental particle absorption applies 3.0 on-field / 1.8 off-field for same element', () => {
    // Single mono-Pyro test: Bennett generating 2.25 particles
    const monoSlots = [
      { id: 1, name: 'Bennett', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.5, use_burst: true },
      { id: 2, name: 'Xiangling', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.1, use_burst: true },
      { id: 3, name: 'Amber', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.1, use_burst: true },
      { id: 4, name: 'Diluc', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.3, use_burst: true }
    ];
    const results = calculateTeamER(monoSlots, 20, 0); // 0 enemy particles to isolate skill particles
    // Bennett on-field gets: 2.25 * 3.0 = 6.75
    expect(results[0].baseFromSkills).toBeCloseTo(6.75, 2);
    // Xiangling off-field gets: 2.25 * 1.8 = 4.05
    expect(results[1].baseFromSkills).toBeCloseTo(4.05, 2);
  });

  it('F6.3: Elemental particle absorption applies 1.0 on-field / 0.6 off-field for different element', () => {
    // Cross-element test: Bennett (Pyro, 2.25 particles) funneled to Xingqiu (Hydro)
    const crossSlots = [
      { id: 1, name: 'Bennett', e_uses: 1, funnel: 'Passar p/ Slot 2' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.2, use_burst: true },
      { id: 2, name: 'Xingqiu', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.4, use_burst: true },
      { id: 3, name: 'Fischl', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.2, use_burst: true },
      { id: 4, name: 'Sucrose', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.2, use_burst: true }
    ];
    const results = calculateTeamER(crossSlots, 20, 0);
    // Xingqiu is different element, on-field: 2.25 * 1.0 = 2.25
    expect(results[1].baseFromSkills).toBeCloseTo(2.25, 2);
    // Fischl is different element, off-field: 2.25 * 0.6 = 1.35
    expect(results[2].baseFromSkills).toBeCloseTo(1.35, 2);
  });

  it('F6.4: Clear/neutral particles scale by on-field fraction with 2.0 on-field / 1.2 off-field', () => {
    const slots = [
      { id: 1, name: 'Bennett', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.50, use_burst: true },
      { id: 2, name: 'Xiangling', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.15, use_burst: true },
      { id: 3, name: 'Xingqiu', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.20, use_burst: true },
      { id: 4, name: 'Kazuha', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.15, use_burst: true }
    ];
    const results = calculateTeamER(slots, 20, 6);
    // Slot 1 (onfield 0.50): 6 * (0.50 * 2.0 + 0.50 * 1.2) = 6 * 1.6 = 9.60
    expect(results[0].baseFromEnemies).toBeCloseTo(9.60, 2);
    // Slot 2 (onfield 0.15): 6 * (0.15 * 2.0 + 0.85 * 1.2) = 6 * (0.3 + 1.02) = 6 * 1.32 = 7.92
    expect(results[1].baseFromEnemies).toBeCloseTo(7.92, 2);
  });

  it('F6.5: Calculates exact ER requirement percentage matching Scenario 1 Citlali (202.2%)', () => {
    const results = calculateTeamER(SCENARIO_1_MAVUIKA.slots, 20, 6);
    const citlali = results[1];
    expect(citlali.neededER).toBeCloseTo(2.022, 2);
    expect(citlali.safeER).toBeCloseTo(2.326, 2);
    expect(citlali.status).toBe('high');
    expect(citlali.statusLabel).toBe('🟡 Alta (175-215%)');
  });

  it('F6.6: Verifies implementation src/engines/erEngine.ts calculateTeamER executes cleanly', () => {
    const rawResults = rawCalculateTeamER(SCENARIO_1_MAVUIKA.slots, 20, 6);
    expect(rawResults.length).toBe(4);
    expect(rawResults[1].neededER).toBeCloseTo(2.022, 2);
    expect(rawResults[1].status).toBe('high');
  });
});

/**
 * Tier 4: Real-World Workload Scenario 2 — Mavuika Natlan Burn/Melt ER Calculation
 * Source: Calculadora_Recarga_Genshin.html / survey_er_calc.md Scenario 1
 * Exercises complete energy accounting with split funneling (50% Slot 3 / 50% Slot 4),
 * zero-cost burst toggle, Flat energy, and boss margin.
 */

import { describe, it, expect } from '../testRunner';
import { safeCalculateTeamER as calculateTeamER } from '../helpers/referenceEngines';
import { SCENARIO_1_MAVUIKA } from '../fixtures/referenceTeams';

describe('Tier 4: Scenario 2 — Mavuika Natlan Burn/Melt Workload', () => {
  it('S2.1: Calculates exact energy recharge requirements for all 4 team members', () => {
    const results = calculateTeamER(SCENARIO_1_MAVUIKA.slots, 20, 6);

    // Slot 1: Mavuika (Pyro, Cost: 0, Particles: 5, Funnel: 50/50 to slots 3 & 4)
    const mavuika = results[0];
    expect(mavuika.neededER).toBe(1.0);
    expect(mavuika.status).toBe('ignored');
    expect(mavuika.statusLabel).toBe('⚪ Não usa Ult (Ignorar ER)');
    expect(mavuika.baseFromSkills).toBeCloseTo(18.45, 2);
    expect(mavuika.baseFromEnemies).toBeCloseTo(9.60, 2);

    // Slot 2: Citlali (Cryo, Cost: 60)
    const citlali = results[1];
    expect(citlali.neededER).toBeCloseTo(2.022, 2);
    expect(citlali.safeER).toBeCloseTo(2.326, 2);
    expect(citlali.status).toBe('high');
    expect(citlali.statusLabel).toBe('🟡 Alta (175-215%)');

    // Slot 3: Iansan (Electro, Cost: 70, Flat: 12)
    const iansan = results[2];
    expect(iansan.neededER).toBeCloseTo(2.052, 2);
    expect(iansan.safeER).toBeCloseTo(2.359, 2);
    expect(iansan.status).toBe('high');

    // Slot 4: Bennett (Pyro, Cost: 60, Particles: 2.25)
    const bennett = results[3];
    expect(bennett.neededER).toBeCloseTo(1.857, 2);
    expect(bennett.safeER).toBeCloseTo(2.136, 2);
    expect(bennett.status).toBe('high');
  });

  it('S2.2: Verifies Boss Margin safety buffer (+15%) provides advisory headroom for single-target', () => {
    const results = calculateTeamER(SCENARIO_1_MAVUIKA.slots, 20, 6);
    results.forEach((res, idx) => {
      if (res.status !== 'ignored') {
        expect(res.safeER).toBeCloseTo(res.neededER * 1.15, 3);
        expect(res.safeER).toBeGreaterThan(res.neededER);
      }
    });
  });
});

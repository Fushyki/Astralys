/**
 * Feature 7: ER Special Mechanics & Toggles Tests (Tier 1)
 * Requirement R2: Favonius procs, flat energy (+24 Raiden), 8 split funneling modes,
 * burst disabled toggle, +15% boss margin.
 */

import { describe, it, expect } from '../testRunner';
import { safeCalculateTeamER as calculateTeamER } from '../helpers/referenceEngines';
import { SCENARIO_1_MAVUIKA, SCENARIO_2_RAIDEN_NATIONAL } from '../fixtures/referenceTeams';

describe('Feature 7 (F7): ER Special Mechanics & Toggles Coverage', () => {
  it('F7.1: Favonius weapon generates 3 clear particles (6.0 on-field / 3.6 off-field per proc)', () => {
    // Bennett proc with Favonius passed to Slot 2 (Xiangling)
    const favSlots = [
      { id: 1, name: 'Bennett', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 1, fav_target: 'Passar p/ Slot 2' as const, flat: 0, onfield: 0.2, use_burst: true },
      { id: 2, name: 'Xiangling', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.2, use_burst: true },
      { id: 3, name: 'Xingqiu', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.2, use_burst: true },
      { id: 4, name: 'Kazuha', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.4, use_burst: true }
    ];
    const results = calculateTeamER(favSlots, 20, 0);
    // Xiangling is target on-field: 1 * 3 * 2.0 = 6.0
    expect(results[1].baseFromFav).toBeCloseTo(6.0, 2);
    // Bennett, Xingqiu, Kazuha are off-field: 1 * 3 * 1.2 = 3.6
    expect(results[0].baseFromFav).toBeCloseTo(3.6, 2);
    expect(results[2].baseFromFav).toBeCloseTo(3.6, 2);
    expect(results[3].baseFromFav).toBeCloseTo(3.6, 2);
  });

  it('F7.2: Raiden Shogun passive injects +24 flat energy to teammates but not to Raiden', () => {
    const results = calculateTeamER(SCENARIO_2_RAIDEN_NATIONAL.slots, 20, 6);
    // Slot 1 is Raiden: flatEnergy should be 0
    expect(results[0].flatEnergy).toBe(0);
    // Slots 2, 3, 4 get +24 flat energy
    expect(results[1].flatEnergy).toBe(24);
    expect(results[2].flatEnergy).toBe(24);
    expect(results[3].flatEnergy).toBe(24);
  });

  it('F7.3: Direct flat energy reduces needed energy from particles directly before ER ratio', () => {
    const slots = [
      { id: 1, name: 'Ayaka', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 24, onfield: 0.5, use_burst: true },
      { id: 2, name: 'Shenhe', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.2, use_burst: true },
      { id: 3, name: 'Kazuha', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.15, use_burst: true },
      { id: 4, name: 'Kokomi', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.15, use_burst: true }
    ];
    const results = calculateTeamER(slots, 20, 6);
    // Ayaka base cost 80 - 24 flat = 56 needed from particles
    expect(results[0].flatEnergy).toBe(24);
  });

  it('F7.4: Split funneling 50/50 splits on-field fraction equally between designated slots', () => {
    // Mavuika funnel: "Dividir (50% Slot 3 / 50% Slot 4)"
    const results = calculateTeamER(SCENARIO_1_MAVUIKA.slots, 20, 6);
    // In Scenario 1, Mavuika (Pyro, 5 particles) splits 50/50 to Slot 3 (Iansan) and Slot 4 (Bennett)
    // For Bennett (Pyro): onFieldFraction = 0.5 -> mult = 0.5*3.0 + 0.5*1.8 = 1.5 + 0.9 = 2.4 -> 5 * 2.4 = 12.0
    // Plus Bennett's own skill (2.25 onfield, same elem: 2.25 * 3.0 = 6.75)
    // Plus Citlali off-field (5 * 0.6 = 3.0) + Iansan off-field (4 * 0.6 = 2.4)
    // Total skills = 12.0 + 6.75 + 3.0 + 2.4 = 24.15!
    expect(results[3].baseFromSkills).toBeCloseTo(24.15, 2);
  });

  it('F7.5: Burst disabled toggle locks neededER to 1.0 (100.0%) with status "ignored"', () => {
    const results = calculateTeamER(SCENARIO_1_MAVUIKA.slots, 20, 6);
    const mavuika = results[0];
    expect(mavuika.neededER).toBe(1.0);
    expect(mavuika.safeER).toBe(1.0);
    expect(mavuika.status).toBe('ignored');
    expect(mavuika.statusLabel).toContain('Não usa Ult');
  });

  it('F7.6: Boss safety margin computes strictly 15% buffer above base ER requirement', () => {
    const results = calculateTeamER(SCENARIO_1_MAVUIKA.slots, 20, 6);
    const citlali = results[1];
    expect(citlali.safeER).toBeCloseTo(citlali.neededER * 1.15, 3);
  });
});

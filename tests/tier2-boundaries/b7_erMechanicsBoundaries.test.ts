/**
 * Boundary & Corner Cases: ER Special Mechanics (Tier 2)
 * Edge cases: Flat energy >= burst cost, 12 total Favonius procs, off-field split funneling,
 * duplicate characters, extreme rotation periods.
 */

import { describe, it, expect } from '../testRunner';
import { safeCalculateTeamER as calculateTeamER } from '../helpers/referenceEngines';

describe('Boundary 7 (B7): ER Special Mechanics Boundary & Corner Cases', () => {
  it('B7.1: Flat energy exceeding burst cost clamps neededFromParticles to 0 and ER to 1.0', () => {
    const slots = [
      { id: 1, name: 'Amber', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 100, onfield: 0.5, use_burst: true }, // burst cost is 40
      { id: 2, name: 'Bennett', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.2, use_burst: true },
      { id: 3, name: 'Kazuha', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.15, use_burst: true },
      { id: 4, name: 'Kokomi', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.15, use_burst: true }
    ];
    const results = calculateTeamER(slots, 20, 6);
    expect(results[0].neededER).toBe(1.0);
    expect(results[0].status).toBe('comfortable');
  });

  it('B7.2: Handles maximum Favonius procs (3 procs each across all 4 characters = 12 procs)', () => {
    const slots = [
      { id: 1, name: 'Bennett', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 3, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.25, use_burst: true },
      { id: 2, name: 'Xiangling', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 3, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.25, use_burst: true },
      { id: 3, name: 'Xingqiu', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 3, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.25, use_burst: true },
      { id: 4, name: 'Kazuha', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 3, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.25, use_burst: true }
    ];
    const results = calculateTeamER(slots, 20, 0);
    // For each character: 1 own proc on-field (3*3*2.0 = 18.0) + 3 teammate procs off-field (3 * 3 * 3 * 1.2 = 32.4) = 50.4 energy
    expect(results[0].baseFromFav).toBeCloseTo(50.4, 1);
    expect(results[1].baseFromFav).toBeCloseTo(50.4, 1);
  });

  it('B7.3: Off-field split funneling ("Fora de campo (Dividido)") gives 0 onfield fraction to all slots', () => {
    const slots = [
      { id: 1, name: 'Furina', e_uses: 1, funnel: 'Fora de campo (Dividido)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.1, use_burst: true },
      { id: 2, name: 'Yelan', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.3, use_burst: true },
      { id: 3, name: 'Hu Tao', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.5, use_burst: true },
      { id: 4, name: 'Zhongli', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.1, use_burst: true }
    ];
    const results = calculateTeamER(slots, 20, 0);
    // Furina (Hydro, 6.5 particles) gives all Hydro units off-field multiplier (1.8): 6.5 * 1.8 = 11.7
    expect(results[0].baseFromSkills).toBeCloseTo(11.7, 1);
    expect(results[1].baseFromSkills).toBeCloseTo(11.7, 1);
    // Non-hydro (Hu Tao, Pyro) gets diff-element off-field (0.6): 6.5 * 0.6 = 3.9
    expect(results[2].baseFromSkills).toBeCloseTo(3.9, 1);
  });

  it('B7.4: Handles duplicate characters (e.g. custom test setup with Bennett + Bennett)', () => {
    const slots = [
      { id: 1, name: 'Bennett', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.5, use_burst: true },
      { id: 2, name: 'Bennett', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.2, use_burst: true },
      { id: 3, name: 'Kazuha', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.15, use_burst: true },
      { id: 4, name: 'Kokomi', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.15, use_burst: true }
    ];
    const results = calculateTeamER(slots, 20, 6);
    expect(results.length).toBe(4);
    expect(Number.isFinite(results[0].neededER)).toBe(true);
    expect(Number.isFinite(results[1].neededER)).toBe(true);
  });

  it('B7.5: Extreme rotation durations (5s vs 60s) maintain calculation stability', () => {
    const slots = [
      { id: 1, name: 'Bennett', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.5, use_burst: true },
      { id: 2, name: 'Xiangling', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.2, use_burst: true },
      { id: 3, name: 'Xingqiu', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.15, use_burst: true },
      { id: 4, name: 'Raiden', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.15, use_burst: true }
    ];
    const resShort = calculateTeamER(slots, 5, 6);
    const resLong = calculateTeamER(slots, 60, 6);
    expect(resShort.length).toBe(4);
    expect(resLong.length).toBe(4);
  });
});

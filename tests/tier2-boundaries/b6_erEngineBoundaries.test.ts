/**
 * Boundary & Corner Cases: Particle ER Engine (Tier 2)
 * Edge cases: 0 enemy drops, 0 skill particles across team, 0-cost bursts (Mavuika, Skirk),
 * extreme energy generation clamping to 100.0% floor.
 */

import { describe, it, expect } from '../testRunner';
import { safeCalculateTeamER as calculateTeamER } from '../helpers/referenceEngines';

describe('Boundary 6 (B6): Particle ER Engine Boundary & Corner Cases', () => {
  it('B6.1: Zero enemy drops (pure single-target boss) increases ER demand', () => {
    const slots = [
      { id: 1, name: 'Ayaka', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.5, use_burst: true },
      { id: 2, name: 'Shenhe', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.2, use_burst: true },
      { id: 3, name: 'Kazuha', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.15, use_burst: true },
      { id: 4, name: 'Kokomi', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.15, use_burst: true }
    ];
    const withEnemies = calculateTeamER(slots, 20, 6);
    const zeroEnemies = calculateTeamER(slots, 20, 0);

    expect(zeroEnemies[0].baseFromEnemies).toBe(0);
    expect(zeroEnemies[0].neededER).toBeGreaterThan(withEnemies[0].neededER);
  });

  it('B6.2: Natural 0-cost bursts (Mavuika, Skirk) are clamped to 1.0 (100.0%) with status "ignored"', () => {
    const slots = [
      { id: 1, name: 'Mavuika', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.5, use_burst: true }, // even if burst is set true
      { id: 2, name: 'Skirk', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.2, use_burst: true },
      { id: 3, name: 'Bennett', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.15, use_burst: true },
      { id: 4, name: 'Kazuha', e_uses: 1, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.15, use_burst: true }
    ];
    const results = calculateTeamER(slots, 20, 6);
    expect(results[0].neededER).toBe(1.0);
    expect(results[0].status).toBe('ignored');
    expect(results[1].neededER).toBe(1.0);
    expect(results[1].status).toBe('ignored');
  });

  it('B6.3: Zero skill particles generated across whole team avoids division by zero and defaults to 1.0', () => {
    const slots = [
      { id: 1, name: 'Lisa', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.5, use_burst: true },
      { id: 2, name: 'Lisa', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.2, use_burst: true },
      { id: 3, name: 'Lisa', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.15, use_burst: true },
      { id: 4, name: 'Lisa', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.15, use_burst: true }
    ];
    const results = calculateTeamER(slots, 20, 0); // 0 enemy particles, 0 fav, 0 skills
    expect(results[0].totalBaseEnergy).toBe(0);
    expect(results[0].neededER).toBe(1.0);
    expect(Number.isFinite(results[0].neededER)).toBe(true);
  });

  it('B6.4: Massive particle battery exceeding burst cost is clamped at 1.0 (100.0% floor)', () => {
    const slots = [
      { id: 1, name: 'Bennett', e_uses: 10, custom_part: 50, funnel: 'Ele mesmo (Em campo)' as const, fav: 3, fav_target: 'Ele mesmo (Em campo)' as const, flat: 50, onfield: 1.0, use_burst: true },
      { id: 2, name: 'Amber', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0, use_burst: true },
      { id: 3, name: 'Xiangling', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0, use_burst: true },
      { id: 4, name: 'Diluc', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0, use_burst: true }
    ];
    const results = calculateTeamER(slots, 20, 30);
    // Needed ER can never drop below baseline 1.0 (100%)
    expect(results[0].neededER).toBe(1.0);
  });

  it('B6.5: Extreme on-field fraction (1.0 vs 0.05) correctly scales clear particle absorption', () => {
    const slots = [
      { id: 1, name: 'Bennett', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 1.0, use_burst: true },
      { id: 2, name: 'Xiangling', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.05, use_burst: true },
      { id: 3, name: 'Xingqiu', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.05, use_burst: true },
      { id: 4, name: 'Kazuha', e_uses: 0, funnel: 'Ele mesmo (Em campo)' as const, fav: 0, fav_target: 'Ele mesmo (Em campo)' as const, flat: 0, onfield: 0.05, use_burst: true }
    ];
    const results = calculateTeamER(slots, 20, 10);
    // Bennett onfield = 1.0: 10 * (1.0 * 2.0 + 0 * 1.2) = 20.0
    expect(results[0].baseFromEnemies).toBeCloseTo(20.0, 2);
    // Xiangling onfield = 0.05: 10 * (0.05 * 2.0 + 0.95 * 1.2) = 10 * (0.10 + 1.14) = 12.4
    expect(results[1].baseFromEnemies).toBeCloseTo(12.4, 2);
  });
});

/**
 * Tier 4: Real-World Workload Scenario 6 — Version 6.7 Tierlist Meta Exploration
 * Exercises full browsing, filtering, and role auditing for Version 6.7 characters and weapons.
 */

import { describe, it, expect } from '../testRunner';
import {
  MOCK_TIERLIST_67_CHARACTERS,
  filterTierlistByElement,
  filterTierlistByWeapon
} from '../tier1-features/f11_tierlistPortal.test.ts';

describe('Tier 4: Scenario 6 — Version 6.7 Tierlist Meta Exploration Workload', () => {
  it('S6.1: Audits SS-Tier top meta picks in Version 6.7', () => {
    const ssUnits = MOCK_TIERLIST_67_CHARACTERS.filter(c => c.tier === 'SS');
    expect(ssUnits.length).toBeGreaterThanOrEqual(4);
    const ssNames = ssUnits.map(u => u.name);
    expect(ssNames).toContain('Mavuika');
    expect(ssNames).toContain('Citlali');
    expect(ssNames).toContain('Xilonen');
    expect(ssNames).toContain('Sandrone');
  });

  it('S6.2: Filters Snezhnaya / Natlan units by weapon category and role', () => {
    const claymores = filterTierlistByWeapon(MOCK_TIERLIST_67_CHARACTERS, 'Claymore');
    const mainDpsClaymores = claymores.filter(c => c.role === 'Main DPS');
    expect(mainDpsClaymores.length).toBe(3); // Mavuika, Kinich, Sandrone
    expect(mainDpsClaymores.some(c => c.name === 'Sandrone')).toBe(true);
  });

  it('S6.3: Validates Cryo support vs carry options in 6.7 meta (Citlali vs Sandrone)', () => {
    const cryoUnits = filterTierlistByElement(MOCK_TIERLIST_67_CHARACTERS, 'Cryo');
    const citlali = cryoUnits.find(u => u.name === 'Citlali');
    const sandrone = cryoUnits.find(u => u.name === 'Sandrone');
    expect(citlali?.role).toBe('Support');
    expect(sandrone?.role).toBe('Main DPS');
  });
});

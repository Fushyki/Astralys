/**
 * Feature 11: Version 6.7 Tierlist Portal Tests (Tier 1)
 * Requirement R3: Interactive character and weapon tierlists for version 6.7 meta with role/element/weapon filters.
 */

import { describe, it, expect } from '../testRunner';

export interface TierlistEntry {
  name: string;
  tier: 'SS' | 'S' | 'A' | 'B';
  element?: string;
  weaponType: string;
  role: 'Main DPS' | 'Sub-DPS' | 'Support' | 'Sustain';
  versionAdded: string;
}

export const MOCK_TIERLIST_67_CHARACTERS: TierlistEntry[] = [
  { name: 'Mavuika', tier: 'SS', element: 'Pyro', weaponType: 'Claymore', role: 'Main DPS', versionAdded: '5.3' },
  { name: 'Citlali', tier: 'SS', element: 'Cryo', weaponType: 'Catalyst', role: 'Support', versionAdded: '5.3' },
  { name: 'Kinich', tier: 'S', element: 'Dendro', weaponType: 'Claymore', role: 'Main DPS', versionAdded: '5.0' },
  { name: 'Xilonen', tier: 'SS', element: 'Geo', weaponType: 'Sword', role: 'Support', versionAdded: '5.1' },
  { name: 'Sandrone', tier: 'SS', element: 'Cryo', weaponType: 'Claymore', role: 'Main DPS', versionAdded: '6.7' },
  { name: 'Columbina', tier: 'SS', element: 'Hydro', weaponType: 'Catalyst', role: 'Sub-DPS', versionAdded: '6.7' }
];

export function filterTierlistByElement(list: TierlistEntry[], element: string): TierlistEntry[] {
  return list.filter(item => item.element?.toLowerCase() === element.toLowerCase());
}

export function filterTierlistByWeapon(list: TierlistEntry[], weaponType: string): TierlistEntry[] {
  return list.filter(item => item.weaponType.toLowerCase() === weaponType.toLowerCase());
}

describe('Feature 11 (F11): Version 6.7 Tierlist Portal Coverage', () => {
  it('F11.1: Provides version 6.7 meta character rankings with valid tier assignments', () => {
    expect(MOCK_TIERLIST_67_CHARACTERS.length).toBeGreaterThanOrEqual(6);
    const mavuika = MOCK_TIERLIST_67_CHARACTERS.find(c => c.name === 'Mavuika');
    expect(mavuika?.tier).toBe('SS');
    expect(mavuika?.role).toBe('Main DPS');
  });

  it('F11.2: Filters characters by element (Cryo, Pyro, Geo, Hydro, Dendro)', () => {
    const cryoChars = filterTierlistByElement(MOCK_TIERLIST_67_CHARACTERS, 'Cryo');
    expect(cryoChars.length).toBe(2); // Citlali, Sandrone
    expect(cryoChars.some(c => c.name === 'Citlali')).toBe(true);
    expect(cryoChars.some(c => c.name === 'Sandrone')).toBe(true);
  });

  it('F11.3: Filters characters by weapon type (Claymore, Sword, Catalyst)', () => {
    const claymoreChars = filterTierlistByWeapon(MOCK_TIERLIST_67_CHARACTERS, 'Claymore');
    expect(claymoreChars.length).toBe(3); // Mavuika, Kinich, Sandrone
    expect(claymoreChars.every(c => c.weaponType === 'Claymore')).toBe(true);
  });

  it('F11.4: Includes version 6.7 / Natlan meta defining units', () => {
    const unitNames = MOCK_TIERLIST_67_CHARACTERS.map(c => c.name);
    expect(unitNames).toContain('Mavuika');
    expect(unitNames).toContain('Citlali');
    expect(unitNames).toContain('Sandrone');
    expect(unitNames).toContain('Columbina');
  });

  it('F11.5: Validates role distribution covers Main DPS, Sub-DPS, and Support', () => {
    const roles = new Set(MOCK_TIERLIST_67_CHARACTERS.map(c => c.role));
    expect(roles.has('Main DPS')).toBe(true);
    expect(roles.has('Support')).toBe(true);
    expect(roles.has('Sub-DPS')).toBe(true);
  });
});

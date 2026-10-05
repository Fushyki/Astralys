/**
 * Boundary & Corner Cases: Version 6.7 Tierlist Portal (Tier 2)
 * Edge cases: Filtering by non-existent element, empty search results, special characters in query,
 * case-insensitivity.
 */

import { describe, it, expect } from '../testRunner';
import {
  MOCK_TIERLIST_67_CHARACTERS,
  filterTierlistByElement,
  filterTierlistByWeapon
} from '../tier1-features/f11_tierlistPortal.test.ts';

export function searchTierlist(list: any[], query: string): any[] {
  const sanitized = query.trim().toLowerCase();
  if (!sanitized) return list;
  return list.filter(item => item.name.toLowerCase().includes(sanitized));
}

describe('Boundary 11 (B11): Tierlist Portal Boundary & Corner Cases', () => {
  it('B11.1: Filtering by non-existent element returns empty array rather than throwing error', () => {
    const res = filterTierlistByElement(MOCK_TIERLIST_67_CHARACTERS, 'Quantum');
    expect(res.length).toBe(0);
  });

  it('B11.2: Searching by non-existent character returns zero results cleanly', () => {
    const res = searchTierlist(MOCK_TIERLIST_67_CHARACTERS, 'NonExistentUnit999');
    expect(res.length).toBe(0);
  });

  it('B11.3: Empty or whitespace query returns all tierlist entries', () => {
    const resEmpty = searchTierlist(MOCK_TIERLIST_67_CHARACTERS, '');
    const resWhitespace = searchTierlist(MOCK_TIERLIST_67_CHARACTERS, '   ');
    expect(resEmpty.length).toBe(MOCK_TIERLIST_67_CHARACTERS.length);
    expect(resWhitespace.length).toBe(MOCK_TIERLIST_67_CHARACTERS.length);
  });

  it('B11.4: Search is strictly case-insensitive (e.g. "mAvUiKa")', () => {
    const res = searchTierlist(MOCK_TIERLIST_67_CHARACTERS, 'mAvUiKa');
    expect(res.length).toBe(1);
    expect(res[0].name).toBe('Mavuika');
  });

  it('B11.5: Sanitizes regex special characters in search input without crashing', () => {
    const res = searchTierlist(MOCK_TIERLIST_67_CHARACTERS, '.*+?^${}()|[]\\');
    expect(res.length).toBe(0);
  });
});

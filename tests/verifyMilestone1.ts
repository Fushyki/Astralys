import { 
  CHARACTERS_DATABASE, 
  getAllCharacters, 
  getCharacterERData, 
  normalizeCharacterName, 
  getCharactersByElement, 
  getCharactersByWeapon, 
  getCharactersByRarity, 
  searchCharacters, 
  getCharacterFallbackBadge, 
  ASTRALYS_ELEMENT_COLORS, 
  CHARACTER_BASE_PROFILES 
} from '../src/data/characters';
import { 
  DEFAULT_WATERMARK, 
  DEFAULT_INVESTMENT_BADGE, 
  createDefaultCardData 
} from '../src/types/infographic';
import { TIER_CONFIGS } from '../src/types/tierlist';

console.log('=== MILESTONE 1 VERIFICATION SCRIPT ===');

// 1. Character count
console.log('1. CHARACTERS_DATABASE count:', CHARACTERS_DATABASE.length);
if (CHARACTERS_DATABASE.length !== 128) {
  throw new Error(`Expected 128 characters, got ${CHARACTERS_DATABASE.length}`);
}
if (getAllCharacters().length !== 128) {
  throw new Error(`Expected 128 from getAllCharacters, got ${getAllCharacters().length}`);
}

// 2. Character Nobody
const nobody = getCharacterERData('Nobody');
console.log('2. Character Nobody:', nobody.name, 'Element:', nobody.element, 'Cost:', nobody.burst_cost, 'Particles:', nobody.particles);
if (nobody.element !== 'None' || nobody.burst_cost !== 60 || nobody.particles !== 3) {
  throw new Error('Character Nobody data mismatch');
}

// 3. Shorthand Normalization
const wrio = normalizeCharacterName('Wrio');
console.log('3. Normalization "Wrio" ->', wrio);
if (wrio !== 'Wriothesley') throw new Error('Wrio normalization failed');

const yae = normalizeCharacterName('Yae');
console.log('   Normalization "Yae" ->', yae);
if (yae !== 'Yae Miko') throw new Error('Yae normalization failed');

const cryoMc = normalizeCharacterName('Cryo MC');
console.log('   Normalization "Cryo MC" ->', cryoMc);
if (cryoMc !== 'Traveler (Cryo)') throw new Error('Cryo MC normalization failed');

// 4. Element Filter
const pyros = getCharactersByElement('Pyro');
console.log('4. Pyro characters count:', pyros.length);
if (pyros.length === 0) throw new Error('No Pyro characters found');

// 5. Weapon Filter
const swords = getCharactersByWeapon('Sword');
console.log('5. Sword characters count:', swords.length);
if (swords.length === 0) throw new Error('No Sword characters found');

// 6. Rarity Filter
const fiveStars = getCharactersByRarity(5);
console.log('6. 5-Star characters count:', fiveStars.length);
if (fiveStars.length === 0) throw new Error('No 5-star characters found');

// 7. Search
const mavuika = searchCharacters('mavuika');
console.log('7. Search "mavuika" count:', mavuika.length);
if (mavuika.length === 0) throw new Error('Search failed for mavuika');

// 8. Fallback Monogram Badge
const badge = getCharacterFallbackBadge('Sandrone');
console.log('8. Monogram badge for Sandrone:', badge.initials, 'Element:', badge.element, 'Upcoming:', badge.isUpcoming);
if (badge.initials !== 'SA' || badge.element !== 'Cryo' || !badge.isUpcoming) {
  throw new Error('Fallback badge for Sandrone mismatch');
}

// 9. Watermark Branding
console.log('9. DEFAULT_WATERMARK:', DEFAULT_WATERMARK);
if (DEFAULT_WATERMARK !== 'ASTRALYS') {
  throw new Error(`Expected DEFAULT_WATERMARK to be "ASTRALYS", got "${DEFAULT_WATERMARK}"`);
}

// 10. Default Card Data Factory
const card = createDefaultCardData();
console.log('10. Default card watermark:', card.watermark, 'Characters:', card.characters.length);
if (card.watermark !== 'ASTRALYS' || card.characters.length !== 4) {
  throw new Error('Default card data mismatch');
}

// 11. Tier configs
console.log('11. Tier categories present:', Object.keys(TIER_CONFIGS).join(', '));
if (!TIER_CONFIGS['SS+'] || !TIER_CONFIGS['SS'] || !TIER_CONFIGS['S']) {
  throw new Error('Tier configs missing tiers');
}

console.log('=== ALL 11 VERIFICATION CHECKS PASSED CLEANLY! ===');

import { 
  CHARACTERS_DATABASE, 
  getAllCharacters, 
  getCharacterERData, 
  normalizeCharacterName, 
  getCharactersByElement, 
  getCharactersByWeapon, 
  getCharactersByRarity, 
  searchCharacters, 
  getCharacterAvatarUrl, 
  getCharacterFallbackBadge, 
  ASTRALYS_ELEMENT_COLORS 
} from '../src/data/characters';
import { ElementType, WeaponType } from '../src/types/er';

interface StressTestResult {
  suite: string;
  name: string;
  passed: boolean;
  expected?: any;
  actual?: any;
  details?: string;
}

const results: StressTestResult[] = [];

function recordTest(suite: string, name: string, passed: boolean, expected?: any, actual?: any, details?: string) {
  results.push({ suite, name, passed, expected, actual, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${suite}] ${name}`);
  if (!passed) {
    console.log(`   Expected: ${JSON.stringify(expected)}`);
    console.log(`   Actual:   ${JSON.stringify(actual)}`);
    if (details) console.log(`   Details:  ${details}`);
  }
}

console.log('================================================================');
console.log('  ADVERSARIAL STRESS TEST SUITE: src/data/characters.ts');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: Database Invariants & Completeness
// -----------------------------------------------------------------------------
console.log('--- SUITE 1: Database Invariants & Completeness ---');

// 1.1 Exact count 128
recordTest(
  'Suite 1: Invariants',
  'Total characters count is exactly 128',
  CHARACTERS_DATABASE.length === 128,
  128,
  CHARACTERS_DATABASE.length
);

// 1.2 Uniqueness of names
const names = CHARACTERS_DATABASE.map(c => c.name);
const uniqueNames = new Set(names);
recordTest(
  'Suite 1: Invariants',
  'All 128 character names are strictly unique',
  uniqueNames.size === 128,
  128,
  uniqueNames.size,
  uniqueNames.size !== 128 ? `Duplicate count: ${128 - uniqueNames.size}` : undefined
);

// 1.3 Nobody specifications
const nobody = CHARACTERS_DATABASE.find(c => c.name === 'Nobody');
const nobodyValid = nobody !== undefined &&
  nobody.element === 'None' &&
  nobody.weapon === 'None' &&
  nobody.burst_cost === 60 &&
  nobody.particles === 3;
recordTest(
  'Suite 1: Invariants',
  'Character "Nobody" exists with Element None, Weapon None, 60 cost, 3 particles',
  nobodyValid,
  { name: 'Nobody', element: 'None', weapon: 'None', burst_cost: 60, particles: 3 },
  nobody ? { name: nobody.name, element: nobody.element, weapon: nobody.weapon, burst_cost: nobody.burst_cost, particles: nobody.particles } : null
);

// 1.4 Valid ElementType for all characters
const VALID_ELEMENTS: ElementType[] = ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo', 'None'];
const invalidElements = CHARACTERS_DATABASE.filter(c => !VALID_ELEMENTS.includes(c.element));
recordTest(
  'Suite 1: Invariants',
  'All 128 characters have valid ElementType',
  invalidElements.length === 0,
  0,
  invalidElements.length,
  invalidElements.map(c => `${c.name}: ${c.element}`).join(', ')
);

// 1.5 Valid WeaponType for all characters
const VALID_WEAPONS: WeaponType[] = ['Sword', 'Claymore', 'Polearm', 'Bow', 'Catalyst', 'None'];
const invalidWeapons = CHARACTERS_DATABASE.filter(c => !c.weapon || !VALID_WEAPONS.includes(c.weapon));
recordTest(
  'Suite 1: Invariants',
  'All 128 characters have valid WeaponType',
  invalidWeapons.length === 0,
  0,
  invalidWeapons.length,
  invalidWeapons.map(c => `${c.name}: ${c.weapon}`).join(', ')
);

// 1.6 Numeric bounds: burst_cost, particles, burst_cd >= 0
const negativeValues = CHARACTERS_DATABASE.filter(c => c.burst_cost < 0 || c.particles < 0 || c.burst_cd < 0);
recordTest(
  'Suite 1: Invariants',
  'All characters have non-negative burst_cost, particles, burst_cd',
  negativeValues.length === 0,
  0,
  negativeValues.length
);

// -----------------------------------------------------------------------------
// SUITE 2: Rarity Partitioning
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 2: Rarity Partitioning ---');

const fourStars = getCharactersByRarity(4);
const fiveStars = getCharactersByRarity(5);
const missingRarity = CHARACTERS_DATABASE.filter(c => c.rarity !== 4 && c.rarity !== 5);

recordTest(
  'Suite 2: Rarity',
  'All characters have rarity defined as 4 or 5',
  missingRarity.length === 0,
  0,
  missingRarity.length,
  missingRarity.map(c => `${c.name}: ${c.rarity}`).join(', ')
);

recordTest(
  'Suite 2: Rarity',
  'Rarity 4★ + 5★ sum equals 128',
  fourStars.length + fiveStars.length === 128,
  128,
  fourStars.length + fiveStars.length,
  `4★: ${fourStars.length}, 5★: ${fiveStars.length}`
);

// -----------------------------------------------------------------------------
// SUITE 3: Name Normalization Stress Testing
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 3: Name Normalization Stress Testing ---');

// 3.1 All 128 canonical names should normalize to themselves!
const canonicalFailures: { name: string; got: string }[] = [];
for (const char of CHARACTERS_DATABASE) {
  const norm = normalizeCharacterName(char.name);
  if (norm !== char.name) {
    canonicalFailures.push({ name: char.name, got: norm });
  }
}
recordTest(
  'Suite 3: Normalization',
  'All 128 canonical names normalize strictly to themselves',
  canonicalFailures.length === 0,
  '0 failures',
  `${canonicalFailures.length} failures`,
  canonicalFailures.map(f => `"${f.name}" -> "${f.got}"`).join('; ')
);

// 3.2 Specific Traveler parenthesized names
const travelers = [
  'Traveler (Anemo)',
  'Traveler (Geo)',
  'Traveler (Electro)',
  'Traveler (Dendro)',
  'Traveler (Hydro)',
  'Traveler (Pyro)',
  'Traveler (Cryo)'
];
for (const trav of travelers) {
  const norm = normalizeCharacterName(trav);
  recordTest(
    'Suite 3: Normalization',
    `Preserve parenthesized canonical name "${trav}"`,
    norm === trav,
    trav,
    norm
  );
}

// 3.3 Required aliases from dispatch mission
const requiredAliases: Record<string, string> = {
  'wrio': 'Wriothesley',
  'yae': 'Yae Miko',
  'cryo mc': 'Traveler (Cryo)',
  'mizuki': 'Yumemizuki Mizuki',
  'father': 'Arlecchino',
  'arle': 'Arlecchino',
  'pyro mc': 'Traveler (Pyro)',
  'anemo mc': 'Traveler (Anemo)',
  'geo mc': 'Traveler (Geo)',
  'electro mc': 'Traveler (Electro)',
  'dendro mc': 'Traveler (Dendro)',
  'hydro mc': 'Traveler (Hydro)',
  'hutao': 'Hu Tao',
  'kuki': 'Kuki Shinobu',
  'neuvi': 'Neuvillette',
  'benny': 'Bennett'
};

for (const [alias, expected] of Object.entries(requiredAliases)) {
  const norm = normalizeCharacterName(alias);
  recordTest(
    'Suite 3: Normalization',
    `Alias "${alias}" normalizes to "${expected}"`,
    norm === expected,
    expected,
    norm
  );
}

// 3.4 Case insensitivity and whitespace trimming
const caseAndTrimTests: [string, string][] = [
  ['  wRiO  ', 'Wriothesley'],
  ['   YAE   ', 'Yae Miko'],
  ['  FATHER  ', 'Arlecchino'],
  ['  mAvUiKa  ', 'Mavuika'],
  ['  nEuViLlEtTe  ', 'Neuvillette'],
  ['  Traveler (Pyro)  ', 'Traveler (Pyro)'],
  ['  traveler (cryo)  ', 'Traveler (Cryo)']
];

for (const [input, expected] of caseAndTrimTests) {
  const norm = normalizeCharacterName(input);
  recordTest(
    'Suite 3: Normalization',
    `Trim and case-insensitive "${input}" -> "${expected}"`,
    norm === expected,
    expected,
    norm
  );
}

// 3.5 Constellation suffix handling in spreadsheet inputs
const constellationInputs: [string, string][] = [
  ['Mavuika C0', 'Mavuika'],
  ['Mavuika C2', 'Mavuika'],
  ['Neuvillette C1', 'Neuvillette'],
  ['Furina C6', 'Furina'],
  ['Mavuika (C0)', 'Mavuika'],
  ['C0 Mavuika', 'Mavuika']
];

for (const [input, expected] of constellationInputs) {
  const norm = normalizeCharacterName(input);
  recordTest(
    'Suite 3: Normalization',
    `Constellation format "${input}" -> "${expected}"`,
    norm === expected,
    expected,
    norm
  );
}

// 3.6 Unknown names and edge cases
recordTest(
  'Suite 3: Normalization',
  'Empty string returns empty string without error',
  normalizeCharacterName('') === '',
  '',
  normalizeCharacterName('')
);

recordTest(
  'Suite 3: Normalization',
  'Unknown name returns trimmed input',
  normalizeCharacterName('   NonExistentChar999   ') === 'NonExistentChar999',
  'NonExistentChar999',
  normalizeCharacterName('   NonExistentChar999   ')
);

// -----------------------------------------------------------------------------
// SUITE 4: getCharacterERData Behavior & Integrity
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 4: getCharacterERData Integrity ---');

// 4.1 Check all Travelers retrieve their actual elemental data and burst stats
for (const trav of travelers) {
  const data = getCharacterERData(trav);
  const dbEntry = CHARACTERS_DATABASE.find(c => c.name === trav);
  const matchesDb = dbEntry !== undefined &&
    data.name === dbEntry.name &&
    data.element === dbEntry.element &&
    data.burst_cost === dbEntry.burst_cost &&
    data.particles === dbEntry.particles;
  recordTest(
    'Suite 4: getCharacterERData',
    `Retrieval for "${trav}" returns actual DB entry (element: ${dbEntry?.element}, cost: ${dbEntry?.burst_cost})`,
    matchesDb,
    { name: trav, element: dbEntry?.element, cost: dbEntry?.burst_cost, particles: dbEntry?.particles },
    { name: data.name, element: data.element, cost: data.burst_cost, particles: data.particles }
  );
}

// 4.2 Nobody retrieval
const nobodyData = getCharacterERData('Nobody');
recordTest(
  'Suite 4: getCharacterERData',
  'Nobody retrieved accurately via getCharacterERData',
  nobodyData.name === 'Nobody' && nobodyData.element === 'None' && nobodyData.burst_cost === 60 && nobodyData.particles === 3,
  { name: 'Nobody', element: 'None', burst_cost: 60, particles: 3 },
  { name: nobodyData.name, element: nobodyData.element, burst_cost: nobodyData.burst_cost, particles: nobodyData.particles }
);

// 4.3 Safe fallback on unknown character
const unknownData = getCharacterERData('completely_unknown_unit');
recordTest(
  'Suite 4: getCharacterERData',
  'Unknown character returns safe default without crashing',
  unknownData.element === 'Pyro' && unknownData.burst_cost === 60 && unknownData.particles === 3,
  'Safe default Pyro/60/3',
  `${unknownData.element}/${unknownData.burst_cost}/${unknownData.particles}`
);

// -----------------------------------------------------------------------------
// SUITE 5: Monogram Fallback Badge Stress Testing
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 5: Monogram Fallback Badge Generation ---');

// 5.1 Single-word names
const sandroneBadge = getCharacterFallbackBadge('Sandrone');
recordTest(
  'Suite 5: Monogram Badge',
  'Single word "Sandrone" produces initials "SA", Cryo, upcoming=true',
  sandroneBadge.initials === 'SA' && sandroneBadge.element === 'Cryo' && sandroneBadge.isUpcoming === true,
  { initials: 'SA', element: 'Cryo', isUpcoming: true },
  { initials: sandroneBadge.initials, element: sandroneBadge.element, isUpcoming: sandroneBadge.isUpcoming }
);

// 5.2 Multi-word names
const huTaoBadge = getCharacterFallbackBadge('Hu Tao');
recordTest(
  'Suite 5: Monogram Badge',
  'Two words "Hu Tao" produces initials "HT", Pyro, upcoming=false',
  huTaoBadge.initials === 'HT' && huTaoBadge.element === 'Pyro' && huTaoBadge.isUpcoming === false,
  { initials: 'HT', element: 'Pyro', isUpcoming: false },
  { initials: huTaoBadge.initials, element: huTaoBadge.element, isUpcoming: huTaoBadge.isUpcoming }
);

const mizukiBadge = getCharacterFallbackBadge('Yumemizuki Mizuki');
recordTest(
  'Suite 5: Monogram Badge',
  'Multi-word "Yumemizuki Mizuki" produces initials "YM", Anemo, upcoming=true',
  mizukiBadge.initials === 'YM' && mizukiBadge.element === 'Anemo' && mizukiBadge.isUpcoming === true,
  { initials: 'YM', element: 'Anemo', isUpcoming: true },
  { initials: mizukiBadge.initials, element: mizukiBadge.element, isUpcoming: mizukiBadge.isUpcoming }
);

// 5.3 Parenthesized names: Traveler (Pyro), Traveler (Cryo), etc.
const travPyroBadge = getCharacterFallbackBadge('Traveler (Pyro)');
recordTest(
  'Suite 5: Monogram Badge',
  'Parenthesized "Traveler (Pyro)" produces initials "TP", element "Pyro"',
  travPyroBadge.initials === 'TP' && travPyroBadge.element === 'Pyro',
  { initials: 'TP', element: 'Pyro' },
  { initials: travPyroBadge.initials, element: travPyroBadge.element }
);

const travCryoBadge = getCharacterFallbackBadge('Traveler (Cryo)');
recordTest(
  'Suite 5: Monogram Badge',
  'Parenthesized "Traveler (Cryo)" produces initials "TC", element "Cryo"',
  travCryoBadge.initials === 'TC' && travCryoBadge.element === 'Cryo',
  { initials: 'TC', element: 'Cryo' },
  { initials: travCryoBadge.initials, element: travCryoBadge.element }
);

const travHydroBadge = getCharacterFallbackBadge('Traveler (Hydro)');
recordTest(
  'Suite 5: Monogram Badge',
  'Parenthesized "Traveler (Hydro)" produces initials "TH", element "Hydro"',
  travHydroBadge.initials === 'TH' && travHydroBadge.element === 'Hydro',
  { initials: 'TH', element: 'Hydro' },
  { initials: travHydroBadge.initials, element: travHydroBadge.element }
);

const travGeoBadge = getCharacterFallbackBadge('Traveler (Geo)');
recordTest(
  'Suite 5: Monogram Badge',
  'Parenthesized "Traveler (Geo)" produces initials "TG", element "Geo"',
  travGeoBadge.initials === 'TG' && travGeoBadge.element === 'Geo',
  { initials: 'TG', element: 'Geo' },
  { initials: travGeoBadge.initials, element: travGeoBadge.element }
);

// -----------------------------------------------------------------------------
// SUMMARY & STATISTICS
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log('  SUMMARY OF RESULTS');
console.log('================================================================');

const total = results.length;
const passedCount = results.filter(r => r.passed).length;
const failedCount = results.filter(r => !r.passed).length;

console.log(`Total Tests Run: ${total}`);
console.log(`Passed:          ${passedCount} (${((passedCount / total) * 100).toFixed(1)}%)`);
console.log(`Failed:          ${failedCount} (${((failedCount / total) * 100).toFixed(1)}%)`);

if (failedCount > 0) {
  console.log('\nFAILED TEST LIST:');
  for (const f of results.filter(r => !r.passed)) {
    console.log(` - [${f.suite}] ${f.name}`);
    if (f.details) console.log(`   Details: ${f.details}`);
  }
}

process.exit(failedCount > 0 ? 1 : 0);

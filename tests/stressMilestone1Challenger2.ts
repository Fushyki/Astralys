/**
 * Adversarial Empirical Stress Test Suite for Milestone 1
 * Challenger 2: Build, Types, and Cross-Component Contracts
 * 
 * Run with: npx tsx tests/stressMilestone1Challenger2.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  DEFAULT_WATERMARK, 
  DEFAULT_INVESTMENT_BADGE, 
  createDefaultCardData, 
  InfographicCardData, 
  ERTransferPayload, 
  ERTransferTarget 
} from '../src/types/infographic';
import { 
  TIER_CONFIGS, 
  TierCategory, 
  TierCategoryConfig 
} from '../src/types/tierlist';
import { 
  CHARACTERS_DATABASE, 
  normalizeCharacterName, 
  getCharacterERData,
  getAllCharacters,
  ASTRALYS_ELEMENT_COLORS
} from '../src/data/characters';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    const errMsg = `FAILED: ${testName}${detail ? ` -> ${detail}` : ''}`;
    failures.push(errMsg);
    console.error(`  [FAIL] ${errMsg}`);
  }
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

console.log('================================================================');
console.log('   CHALLENGER 2: ADVERSARIAL STRESS TEST SUITE (MILESTONE 1)    ');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: InfographicCardData & createDefaultCardData() Contracts
// -----------------------------------------------------------------------------
console.log('--- SUITE 1: InfographicCardData & createDefaultCardData() ---');

const card1 = createDefaultCardData();
const card2 = createDefaultCardData();

assert(card1 !== undefined && card1 !== null, 'createDefaultCardData returns an object');
assert(card1.watermark === 'ASTRALYS', 'Card watermark is strictly "ASTRALYS"');
assert(DEFAULT_WATERMARK === 'ASTRALYS', 'DEFAULT_WATERMARK constant is strictly "ASTRALYS"');
assert(DEFAULT_INVESTMENT_BADGE === 'KQM Investment', 'DEFAULT_INVESTMENT_BADGE is "KQM Investment"');
assert(card1.investmentBadge === 'KQM Investment', 'Card investment badge is "KQM Investment"');
assert(Array.isArray(card1.characters), 'Card characters is an array');
assert(card1.characters.length === 4, 'Card characters array length is exactly 4');

// Independence & immutability stress
card1.characters[0].name = 'MUTATED_CHARACTER';
card1.watermark = 'MUTATED_WATERMARK';
assert(card2.characters[0].name !== 'MUTATED_CHARACTER', 'Subsequent calls to createDefaultCardData return independent instances');
assert(card2.watermark === 'ASTRALYS', 'Subsequent watermark is unmutated');

// Restore fresh card
const card = createDefaultCardData();

let totalDamagePct = 0;
const validElements = ['Pyro', 'Hydro', 'Cryo', 'Electro', 'Anemo', 'Geo', 'Dendro', 'None'];

card.characters.forEach((char, idx) => {
  assert(typeof char.name === 'string' && char.name.length > 0, `Slot ${idx}: character name is non-empty string`);
  assert(typeof char.constellation === 'string' && /^C[0-6]$/.test(char.constellation), `Slot ${idx}: constellation matches C0-C6 pattern ("${char.constellation}")`);
  assert(validElements.includes(char.element), `Slot ${idx}: element "${char.element}" is a valid ElementType`);
  assert(typeof char.damagePercentage === 'number' && char.damagePercentage >= 0, `Slot ${idx}: damagePercentage (${char.damagePercentage}) is non-negative number`);
  totalDamagePct += char.damagePercentage;

  assert(char.weapon !== undefined && typeof char.weapon.name === 'string' && char.weapon.name.length > 0, `Slot ${idx}: weapon has valid name`);
  assert(/^R[1-5]$/.test(char.weapon.refinement), `Slot ${idx}: weapon refinement matches R1-R5 pattern ("${char.weapon.refinement}")`);

  assert(char.artifact !== undefined && typeof char.artifact.setName === 'string' && char.artifact.setName.length > 0, `Slot ${idx}: artifact set has valid name`);
  assert(/\d+\s*ER/.test(char.artifact.erTarget), `Slot ${idx}: artifact erTarget has valid format ("${char.artifact.erTarget}")`);

  assert(typeof char.mainStats === 'string' && char.mainStats.length > 0, `Slot ${idx}: mainStats is non-empty string ("${char.mainStats}")`);
});

assert(totalDamagePct === 100, `Damage contributions sum to exactly 100% (actual: ${totalDamagePct}%)`);
assert(typeof card.metrics.dps === 'string' || typeof card.metrics.dps === 'number', 'Metrics DPS is present and valid string/number');
assert(typeof card.metrics.dpr === 'string' || typeof card.metrics.dpr === 'number', 'Metrics DPR is present and valid string/number');
assert(typeof card.metrics.rotationDurationSeconds === 'number' && card.metrics.rotationDurationSeconds > 0, 'Metrics rotationDurationSeconds is positive number');
assert(typeof card.rotationNotation === 'string' && card.rotationNotation.length > 0, 'Rotation notation is non-empty string');

// -----------------------------------------------------------------------------
// SUITE 2: ERTransferPayload Contract & Lossless Roundtripping
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 2: ERTransferPayload Contract & Lossless Roundtrip ---');

// Standard 4-character team payload
const testPayloadStandard: ERTransferPayload = {
  targets: [
    { slotIndex: 0, characterName: 'Mavuika', erTargetPct: 100.0, erTargetLabel: '100 ER' },
    { slotIndex: 1, characterName: 'Citlali', erTargetPct: 166.8, erTargetLabel: '167 ER' },
    { slotIndex: 2, characterName: 'Iansan', erTargetPct: 195.4, erTargetLabel: '195 ER' },
    { slotIndex: 3, characterName: 'Bennett', erTargetPct: 220.0, erTargetLabel: '220 ER' }
  ],
  source: 'er_calculator',
  timestamp: 1727918400000
};

// Roundtrip through JSON serialization
const serializedStandard = JSON.stringify(testPayloadStandard);
const deserializedStandard: ERTransferPayload = JSON.parse(serializedStandard);
assert(deepEqual(testPayloadStandard, deserializedStandard), 'Standard 4-character payload serializes and roundtrips without loss');

// Stress Payload: Edge Cases & High Precision & Unicode
const stressPayload: ERTransferPayload = {
  targets: [
    { slotIndex: 0, characterName: 'Raiden (雷電将軍)', erTargetPct: 275.456789, erTargetLabel: '275 ER' },
    { slotIndex: 1, characterName: 'Kazuha', erTargetPct: 160.000001, erTargetLabel: '160 ER' },
    { slotIndex: 2, characterName: 'Traveler (Electro) & 特殊文字', erTargetPct: 350.0, erTargetLabel: '350 ER' },
    { slotIndex: 3, characterName: 'Kuki Shinobu - C6 "Master"', erTargetPct: 100.0, erTargetLabel: '100 ER' }
  ],
  source: 'er_calculator',
  timestamp: Date.now()
};

const serializedStress = JSON.stringify(stressPayload);
const deserializedStress: ERTransferPayload = JSON.parse(serializedStress);
assert(deepEqual(stressPayload, deserializedStress), 'Adversarial payload with UTF-8, quotes, high precision, and max ER roundtrips cleanly');
assert(deserializedStress.targets[0].erTargetPct === 275.456789, 'High floating-point precision preserved across serialization');
assert(deserializedStress.targets[0].characterName === 'Raiden (雷電将軍)', 'UTF-8 characters preserved exactly');

// Empty and partial payloads
const emptyPayload: ERTransferPayload = { targets: [] };
const roundtripEmpty: ERTransferPayload = JSON.parse(JSON.stringify(emptyPayload));
assert(deepEqual(emptyPayload, roundtripEmpty), 'Empty targets payload roundtrips without error');

// Simulated cross-component transfer applying payload to InfographicCardData
function applyERTransfer(cardData: InfographicCardData, payload: ERTransferPayload): InfographicCardData {
  const updatedCharacters = cardData.characters.map((char, idx) => {
    const target = payload.targets.find(t => t.slotIndex === idx);
    if (!target) return char;
    return {
      ...char,
      artifact: {
        ...char.artifact,
        erTarget: target.erTargetLabel
      }
    };
  });
  return { ...cardData, characters: updatedCharacters };
}

const baseCard = createDefaultCardData();
const transferredCard = applyERTransfer(baseCard, testPayloadStandard);

assert(transferredCard.characters[0].artifact.erTarget === '100 ER', 'Slot 0 ER target updated to "100 ER"');
assert(transferredCard.characters[1].artifact.erTarget === '167 ER', 'Slot 1 ER target updated to "167 ER"');
assert(transferredCard.characters[2].artifact.erTarget === '195 ER', 'Slot 2 ER target updated to "195 ER"');
assert(transferredCard.characters[3].artifact.erTarget === '220 ER', 'Slot 3 ER target updated to "220 ER"');
// Ensure rest of card intact
assert(transferredCard.watermark === 'ASTRALYS', 'Card watermark remains "ASTRALYS" after ER transfer');
assert(transferredCard.characters[0].weapon.name === baseCard.characters[0].weapon.name, 'Character weapon preserved during ER transfer');

// -----------------------------------------------------------------------------
// SUITE 3: TIER_CONFIGS & Version 6.7 Tierlist Models
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 3: TIER_CONFIGS & Version 6.7 Tierlist Models ---');

const expectedTiers: TierCategory[] = ['SS+', 'SS', 'S', 'A', 'B', 'C'];
const actualTiers = Object.keys(TIER_CONFIGS) as TierCategory[];

assert(deepEqual(actualTiers.sort(), [...expectedTiers].sort()), `TIER_CONFIGS has exactly the 6 required tiers: ${expectedTiers.join(', ')}`);

expectedTiers.forEach((tier) => {
  const cfg = TIER_CONFIGS[tier];
  assert(cfg !== undefined, `Tier config for "${tier}" exists`);
  assert(cfg.tier === tier, `Tier config "${tier}" has matching tier field`);
  assert(typeof cfg.label === 'string' && cfg.label.length > 0, `Tier config "${tier}" has non-empty label ("${cfg.label}")`);
  assert(typeof cfg.badgeColor === 'string' && cfg.badgeColor.includes('bg-'), `Tier config "${tier}" has valid badgeColor Tailwind class ("${cfg.badgeColor}")`);
  assert(typeof cfg.borderColor === 'string' && cfg.borderColor.includes('border-'), `Tier config "${tier}" has valid borderColor Tailwind class ("${cfg.borderColor}")`);
  assert(typeof cfg.description === 'string' && cfg.description.length > 0, `Tier config "${tier}" has non-empty description`);
});

// -----------------------------------------------------------------------------
// SUITE 4: Character Database Completeness & Normalizer Stress
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 4: Character Database & Normalizer Stress ---');

const allChars = getAllCharacters();
assert(allChars.length === 128, `Character database contains exactly 128 characters (actual: ${allChars.length})`);

// Uniqueness check
const names = new Set<string>();
let duplicateCount = 0;
allChars.forEach(c => {
  if (names.has(c.name)) duplicateCount++;
  names.add(c.name);
});
assert(duplicateCount === 0, `All 128 character names are distinct and unique (duplicates: ${duplicateCount})`);

// Nobody special entry
const nobody = getCharacterERData('Nobody');
assert(nobody !== undefined, 'Nobody exists in character database');
assert(nobody.element === 'None', 'Nobody element is "None"');
assert(nobody.burst_cost === 60, 'Nobody burst cost is 60');
assert(nobody.particles === 3, 'Nobody particle generation is 3');

// Normalizer stress cases testing canonical resolution from Calculadora_Recarga_Genshin roster
const normalizerTests: [string, string][] = [
  ['Wrio', 'Wriothesley'],
  ['wrio', 'Wriothesley'],
  ['  Wrio  ', 'Wriothesley'],
  ['duke', 'Wriothesley'],
  ['Yae', 'Yae Miko'],
  ['yae miko', 'Yae Miko'],
  ['guuji yae', 'Yae Miko'],
  ['Cryo MC', 'Traveler (Cryo)'],
  ['cryo traveler', 'Traveler (Cryo)'],
  ['Anemo MC', 'Traveler (Anemo)'],
  ['Geo MC', 'Traveler (Geo)'],
  ['Electro MC', 'Traveler (Electro)'],
  ['Dendro MC', 'Traveler (Dendro)'],
  ['Hydro MC', 'Traveler (Hydro)'],
  ['Pyro MC', 'Traveler (Pyro)'],
  ['Childe', 'Tartaglia'],
  ['ajax', 'Tartaglia'],
  ['kazuha', 'Kazuha'],
  ['kaedehara kazuha', 'Kazuha'],
  ['Ayato', 'Ayato'],
  ['kamisato ayato', 'Ayato'],
  ['Ayaka', 'Ayaka'],
  ['kamisato ayaka', 'Ayaka'],
  ['Raiden', 'Raiden'],
  ['raiden shogun', 'Raiden'],
  ['shogun', 'Raiden'],
  ['ei', 'Raiden'],
  ['Kokomi', 'Kokomi'],
  ['sangonomiya kokomi', 'Kokomi'],
  ['scaramouche', 'Wanderer'],
  ['hat guy', 'Wanderer'],
  ['cloud retainer', 'Xianyun'],
  ['morax', 'Zhongli'],
  ['geo daddy', 'Zhongli'],
  ['focalors', 'Furina'],
  ['kusanali', 'Nahida'],
  ['neuvi', 'Neuvillette'],
  ['iudex', 'Neuvillette'],
  ['marionette', 'Sandrone'],
  ['damselette', 'Columbina'],
  ['empty', 'Nobody'],
  ['Unknown Nonexistent Character', 'Unknown Nonexistent Character']
];

normalizerTests.forEach(([input, expected]) => {
  const normalized = normalizeCharacterName(input);
  assert(normalized === expected, `Normalization: "${input}" -> "${normalized}" (expected: "${expected}")`);
});

// -----------------------------------------------------------------------------
// SUITE 5: Build Artifacts & Branding Integrity
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 5: Build Artifacts & Branding Integrity ---');

const distPath = path.resolve(process.cwd(), 'dist');
const htmlPath = path.join(distPath, 'index.html');
const assetsPath = path.join(distPath, 'assets');

assert(fs.existsSync(htmlPath), 'dist/index.html exists');

if (fs.existsSync(htmlPath)) {
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  const stats = fs.statSync(htmlPath);

  assert(stats.size > 500, `dist/index.html is non-empty (${stats.size} bytes)`);
  assert(htmlContent.includes('<title>Astralys — Unified Genshin Tools</title>'), 'HTML title is strictly "Astralys — Unified Genshin Tools"');
  assert(htmlContent.includes('<div id="root"></div>'), 'HTML contains mounting div#root');
  assert(htmlContent.includes('family=Cinzel'), 'HTML includes Google Font Cinzel');
  assert(htmlContent.includes('family=Plus+Jakarta+Sans'), 'HTML includes Google Font Plus Jakarta Sans');
  
  // Anti-branding checks: Ensure obsolete names are not present
  assert(!htmlContent.includes('Ametist Impact Suite'), 'dist/index.html does not contain legacy "Ametist Impact Suite"');
  assert(!htmlContent.includes('Astralys Suite'), 'dist/index.html does not contain forbidden "Astralys Suite"');
}

assert(fs.existsSync(assetsPath), 'dist/assets directory exists');

if (fs.existsSync(assetsPath)) {
  const assetFiles = fs.readdirSync(assetsPath);
  const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
  const cssFiles = assetFiles.filter(f => f.endsWith('.css'));

  assert(jsFiles.length > 0, `At least one JS bundle exists in dist/assets (found: ${jsFiles.join(', ')})`);
  assert(cssFiles.length > 0, `At least one CSS bundle exists in dist/assets (found: ${cssFiles.join(', ')})`);

  jsFiles.forEach(jsFile => {
    const jsStat = fs.statSync(path.join(assetsPath, jsFile));
    assert(jsStat.size > 50000, `JS bundle "${jsFile}" is substantial (${Math.round(jsStat.size / 1024)} KB)`);
  });

  cssFiles.forEach(cssFile => {
    const cssStat = fs.statSync(path.join(assetsPath, cssFile));
    assert(cssStat.size > 10000, `CSS bundle "${cssFile}" is substantial (${Math.round(cssStat.size / 1024)} KB)`);
  });
}

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('================================================================');

if (failures.length > 0) {
  console.error('\nFailures recorded:');
  failures.forEach(f => console.error('  - ' + f));
  process.exit(1);
} else {
  console.log('\n>>> ALL ADVERSARIAL STRESS TESTS PASSED SUCCESSFULLY! <<<\n');
  process.exit(0);
}

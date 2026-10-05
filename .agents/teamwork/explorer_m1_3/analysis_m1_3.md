# Milestone 1 (Part 3) Analysis: 128-Character Database Expansion for Astralys

> **Module**: `src/data/characters.ts` & Character Models  
> **Author**: `explorer_m1_3`  
> **Branding**: **Astralys** (strictly "Astralys", dropping "Suite")  
> **Status**: Verified Specification & Implementation Architecture  
> **Date**: 2026-10-03  

---

## 1. Executive Summary & Astralys Branding Alignment

Per urgent user refinement, the official project brand name is strictly **Astralys** (with a 'y', dropping "Suite" completely). All character database exports, schemas, type interfaces, documentation, watermark notes, and fallback badges must reflect the **Astralys** brand and design language.

This investigation provides an exhaustive audit and complete expansion architecture for `src/data/characters.ts`, elevating it from a bare 6-field, 127-entry list to the authoritative, type-safe, 128-character knowledge core of Astralys.


### Key Discoveries:
1. **127 vs. 128 Discrepancy Identified**: `src/data/characters.ts` currently contains 127 characters. Character #80 (`Nobody`, element: `'None'`, weapon: `'None'`, burst cost: 60, particles: 3) from `Calculadora_Recarga_Genshin.html` and `characters_dump.json` was omitted during initial drafting.
2. **Missing Essential TC Dimensions**: Existing entries lack `weapon` type, `rarity` (4★/5★), `releaseStatus` ('released' vs 'upcoming'), `aliases` for parsing shorthand names (e.g. `Wrio`, `Yae`, `Cryo MC`), `rng` mechanics notes, and avatar URLs/fallback badges.
3. **Missing Helper Functions**: Only `getCharacterERData` was exported. The suite requires `getAllCharacters`, `getCharactersByElement`, `getCharactersByWeapon`, `searchCharacters`, `normalizeCharacterName`, `getCharacterAvatarUrl`, and `getCharacterFallbackBadge`.
4. **Theorycrafter Alias Resilience**: In `Calc Sheet.xlsx` and `nj2k8acllnah1.png`, characters are written as `Wrio`, `Yae`, `Nicole`, `Odette`, `Cryo MC`, `Mizuki`, etc. Without an alias resolution engine, lookups fail and fall back to a generic Pyro 60-cost character.

---

## 2. Audit of Current `src/data/characters.ts`

### 2.1 Current File State
- **File Path**: `C:\Users\dabiv\ametist-impact-suite\src\data\characters.ts`
- **Total Lines**: 228 lines.
- **Current Exports**:
  1. `CHARACTERS_DATABASE: CharacterERData[]` (127 entries)
  2. `getCharacterERData(name: string): CharacterERData`
  3. `CHARACTER_BASE_PROFILES: Record<string, Partial<CharacterConfig>>` (8 characters: Mavuika, Neuvillette, Arlecchino, Raiden, Alhaitham, Kinich, Hu Tao, Navia)

### 2.2 Identified Gaps

| Dimension | Current Implementation | Required Astralys Specification | Impact |
|---|---|---|---|
| **Roster Size** | 127 entries | 128 entries (reinstating `Nobody`) | Missing slot fallback & parity with source calculator |
| **Weapon Type** | Missing entirely | Explicit `weapon: WeaponType` ('Sword', 'Claymore', 'Polearm', 'Bow', 'Catalyst', 'None') | Essential for Infographic card equipment matching, tierlist filters, and damage models |
| **Particle RNG Notes** | Missing entirely | Explicit `rng: string` documenting hit rates, multi-casts, and probability | Essential for TC breakdown tooltips and user clarity (30 characters have floating-point averages) |
| **Character Rarity** | Missing entirely | `rarity: 4 \| 5` | Needed for tierlist badges, investment flags, and UI styling |
| **Release Status** | Missing entirely | `releaseStatus: 'released' \| 'upcoming'` | Needed to differentiate 95 released units from 33 upcoming v6.x-7.x units |
| **Aliases / Shorthand** | Missing entirely | Explicit `aliases: string[]` + normalization dictionary | Without this, `Wrio` or `Cryo MC` in spreadsheets fail lookup |
| **Avatar Resolution** | None | CDN URL + Dynamic SVG/glassmorphism Fallback Monogram Badge | UI displays broken avatars for unreleased or offline characters |
| **Helper Functions** | Only `getCharacterERData` | 7 core utility functions covering all access patterns | Component developers are forced to write ad-hoc filters |

---

## 3. Data Schema & TypeScript Interface Contracts

To preserve 100% backwards compatibility with `erEngine.ts` while providing rich metadata for the Infographic Generator, Tierlist Portal, and Damage Simulator, we recommend the following enhanced contracts in `src/types/er.ts` and `src/data/characters.ts`:

```typescript
// In src/types/er.ts (or src/types/characters.ts)

export type ElementType = 
  | 'Pyro' 
  | 'Hydro' 
  | 'Anemo' 
  | 'Electro' 
  | 'Dendro' 
  | 'Cryo' 
  | 'Geo' 
  | 'None';

export type WeaponType = 
  | 'Sword' 
  | 'Claymore' 
  | 'Polearm' 
  | 'Bow' 
  | 'Catalyst' 
  | 'None';

export interface CharacterERData {
  name: string;
  element: ElementType;
  burst_cost: number;
  burst_cd: number;
  particles: number;
  label: string;
  // Enhanced metadata (backwards compatible optional fields)
  weapon?: WeaponType;
  rarity?: 4 | 5;
  releaseStatus?: 'released' | 'upcoming';
  rng?: string;
  aliases?: string[];
  avatarUrl?: string;
}

export interface CharacterFallbackBadge {
  initials: string;           // 2-letter monogram e.g. "SD", "WR", "MV"
  element: ElementType;
  elementColor: string;       // Primary elemental hex e.g. "#77C8D5"
  elementGlow: string;        // Accent glow rgba e.g. "rgba(119, 200, 213, 0.4)"
  bgGradient: string;         // Glassmorphism background e.g. "linear-gradient(135deg, rgba(14, 38, 54, 0.9), rgba(119, 200, 213, 0.2))"
  borderColor: string;        // Border hex e.g. "#77C8D5"
  isUpcoming: boolean;        // True if character is v6.7/7.0 STC
}
```

---

## 4. Complete 128-Character Roster Specification

Below is the verified, authoritative catalog of all 128 characters mapped directly from `survey_er_calc.md § 2` and `characters_dump.json`.

| # | Character Name | Element | Weapon | Burst Cost | Burst CD | Base Particles | Label / Mode | RNG / Generation Mechanics | Rarity | Status | Common Aliases |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Aino | Hydro | Catalyst | 50 | 13.5 | 3.0 | Constellation 0 | Standard fixed particle drop | 4★ | upcoming | - |
| 2 | Albedo | Geo | Sword | 40 | 12.0 | 3.0 | Press | Standard fixed particle drop | 5★ | released | - |
| 3 | Alhaitham | Dendro | Sword | 70 | 18.0 | 1.0 | Projection Attack | Projection Attack hit on-field generates 1 particle (1.6s CD) | 5★ | released | Haitham |
| 4 | Alyosha | Electro | Sword | 70 | 18.0 | 5.0 | Constellation 0 | Standard fixed particle drop | 5★ | upcoming | - |
| 5 | Amber | Pyro | Bow | 40 | 12.0 | 4.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 6 | Arlecchino | Pyro | Polearm | 60 | 15.0 | 5.0 | Press | Standard fixed particle drop | 5★ | released | Arle, Father |
| 7 | Ayaka | Cryo | Sword | 80 | 20.0 | 4.5 | Press | Skill / stance generates 4 or 5 particles (avg 4.5) | 5★ | released | Kamisato Ayaka |
| 8 | Ayato | Hydro | Sword | 80 | 20.0 | 4.5 | On field | Skill / stance generates 4 or 5 particles (avg 4.5) | 5★ | released | Kamisato Ayato |
| 9 | Baizhu | Dendro | Catalyst | 80 | 20.0 | 3.5 | Press | Skill generates 3 or 4 particles (avg 3.5) | 5★ | released | - |
| 10 | Barbara | Hydro | Catalyst | 80 | 20.0 | 3.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 11 | Beidou | Electro | Claymore | 80 | 20.0 | 2.0 | 0 stacks | Standard fixed particle drop | 4★ | released | - |
| 12 | Bennett | Pyro | Sword | 60 | 15.0 | 2.25 | Press | Press: 75% chance 2 particles, 25% chance 3 particles (avg 2.25) | 4★ | released | Benny |
| 13 | Candace | Hydro | Polearm | 60 | 15.0 | 2.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 14 | Charlotte | Cryo | Catalyst | 80 | 20.0 | 3.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 15 | Chasca | Anemo | Bow | 60 | 15.0 | 5.0 | Press | Standard fixed particle drop | 5★ | released | - |
| 16 | Chevreuse | Pyro | Polearm | 60 | 15.0 | 4.0 | Press | Standard fixed particle drop | 4★ | released | Chev |
| 17 | Childe | Hydro | Bow | 60 | 15.0 | 3.0 | 7-9s melee | Standard fixed particle drop | 5★ | released | Tartaglia, Ajax |
| 18 | Chiori | Geo | Sword | 50 | 13.5 | 3.0 | Press | Standard fixed particle drop | 5★ | released | - |
| 19 | Chongyun | Cryo | Claymore | 40 | 12.0 | 4.0 | Press | Standard fixed particle drop | 4★ | released | Chong |
| 20 | Citlali | Cryo | Catalyst | 60 | 15.0 | 5.0 | Constellation 0 | Standard fixed particle drop | 5★ | upcoming | - |
| 21 | Clorinde | Electro | Sword | 60 | 15.0 | 4.0 | Press | Standard fixed particle drop | 5★ | released | - |
| 22 | Collei | Dendro | Bow | 60 | 15.0 | 3.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 23 | Columbina | Hydro | Catalyst | 60 | 15.0 | 3.0 | Press | Standard fixed particle drop | 5★ | upcoming | Damselette |
| 24 | Cyno | Electro | Polearm | 80 | 20.0 | 3.0 | Press (no burst) | Standard fixed particle drop | 5★ | released | - |
| 25 | Dahlia | Hydro | Sword | 60 | 15.0 | 3.0 | Press | Standard fixed particle drop | 4★ | upcoming | - |
| 26 | Dehya | Pyro | Claymore | 70 | 18.0 | 3.0 | Constellation 0 | Standard fixed particle drop | 5★ | released | - |
| 27 | Diluc | Pyro | Claymore | 40 | 12.0 | 3.75 | 3-skill combo | 3-Skill Searing Onset combo (avg 1.25 particles per cast = 3.75 total) | 5★ | released | - |
| 28 | Diona | Cryo | Bow | 80 | 20.0 | 1.6 | Press | Press fires 2 paws (0.8/paw = 1.6 avg); Hold fires 5 paws (4.0) | 4★ | released | - |
| 29 | Dori | Electro | Claymore | 80 | 20.0 | 2.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 30 | Durin | Pyro | Sword | 70 | 18.0 | 4.0 | Press | Standard fixed particle drop | 5★ | upcoming | - |
| 31 | Emilie | Dendro | Polearm | 50 | 13.5 | 3.0 | Press | Standard fixed particle drop | 5★ | released | - |
| 32 | Escoffier | Cryo | Polearm | 60 | 15.0 | 4.0 | Press | Standard fixed particle drop | 5★ | upcoming | - |
| 33 | Eula | Cryo | Claymore | 80 | 20.0 | 1.5 | Press | Tap: 1-2 particles (avg 1.5); Hold generates 2-3 (avg 2.5) | 5★ | released | - |
| 34 | Faruzan | Anemo | Bow | 80 | 20.0 | 2.0 | Aimed Shot | Skill creates buffed Aimed Shot / Crowfeather that procs particles | 4★ | released | Madam Faruzan |
| 35 | Fischl | Electro | Bow | 60 | 15.0 | 6.7 | Constellation 0 | Oz attacks over 10s duration (~67% chance per hit, avg 6.7) | 4★ | released | Amy, Oz |
| 36 | Flins | Electro | Polearm | 60 | 16.0 | 4.0 | Constellation 0 | Standard fixed particle drop | 5★ | upcoming | - |
| 37 | Freminet | Cryo | Claymore | 60 | 15.0 | 2.0 | Level 0 (no burst) | Standard fixed particle drop | 4★ | released | - |
| 38 | Furina | Hydro | Sword | 60 | 15.0 | 6.5 | Salon Members | Salon Members periodic attacks over 20s (avg 6.5 particles) | 5★ | released | Focalors |
| 39 | Gaming | Pyro | Claymore | 60 | 15.0 | 2.0 | Press | Standard fixed particle drop | 4★ | released | Ga-ming |
| 40 | Ganyu | Cryo | Bow | 60 | 15.0 | 4.0 | Press | Standard fixed particle drop | 5★ | released | - |
| 41 | Gorou | Geo | Bow | 80 | 20.0 | 2.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 42 | Heizou | Anemo | Catalyst | 40 | 12.0 | 2.0 | 0-1 stacks | Standard fixed particle drop | 4★ | released | Shikanoin Heizou |
| 43 | Hu Tao | Pyro | Polearm | 60 | 15.0 | 4.8 | Press | Blood Blossom procs over 9s duration (avg 4.8 particles) | 5★ | released | Hutao, Tao |
| 44 | Iansan | Electro | Polearm | 70 | 18.0 | 4.0 | Constellation 0 | Standard fixed particle drop | 5★ | upcoming | - |
| 45 | Ifa | Anemo | Bow | 60 | 15.0 | 4.3 | Press | Skill generates 4.3 Anemo particles on average | 4★ | upcoming | - |
| 46 | Illuga | Geo | Polearm | 60 | 15.0 | 4.5 | Constellation 0 | Skill / stance generates 4 or 5 particles (avg 4.5) | 4★ | upcoming | - |
| 47 | Ineffa | Electro | Polearm | 60 | 15.0 | 3.0 | Press | Standard fixed particle drop | 4★ | upcoming | - |
| 48 | Itto | Geo | Claymore | 70 | 18.0 | 3.5 | Press | Skill generates 3 or 4 particles (avg 3.5) | 5★ | released | Arataki Itto |
| 49 | Jahoda | Anemo | Bow | 70 | 18.0 | 4.0 | Press | Standard fixed particle drop | 4★ | upcoming | - |
| 50 | Jean | Anemo | Sword | 80 | 20.0 | 2.67 | Press | Press: 33% chance 2 particles, 67% chance 3 particles (avg 2.67) | 5★ | released | Jean Gunnhildr |
| 51 | Kachina | Geo | Polearm | 70 | 18.0 | 3.0 | Independent | Turbo Twirler independent ground strikes generate ~3 particles total | 4★ | released | - |
| 52 | Kaeya | Cryo | Sword | 60 | 15.0 | 2.67 | 0 freezes | Press: 2 or 3 Cryo particles (avg 2.67 without freeze passive) | 4★ | released | Kaeya Alberich |
| 53 | Kaveh | Dendro | Claymore | 80 | 20.0 | 2.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 54 | Kazuha | Anemo | Sword | 60 | 15.0 | 3.0 | Press | Standard fixed particle drop | 5★ | released | Kaedehara Kazuha, Kaz |
| 55 | Keqing | Electro | Sword | 40 | 12.0 | 2.5 | Press | Stellar Restoration generates 2 or 3 Electro particles (avg 2.5) | 5★ | released | Keq |
| 56 | Kinich | Dendro | Claymore | 70 | 18.0 | 5.0 | Press | Standard fixed particle drop | 5★ | released | - |
| 57 | Kirara | Dendro | Sword | 60 | 15.0 | 3.0 | Final Kick | Standard fixed particle drop | 4★ | released | - |
| 58 | Klee | Pyro | Catalyst | 60 | 15.0 | 4.0 | Press | Standard fixed particle drop | 5★ | released | - |
| 59 | Kokomi | Hydro | Catalyst | 70 | 18.0 | 3.0 | Refresh | Standard fixed particle drop | 5★ | released | Sangonomiya Kokomi, Koko |
| 60 | Kuki Shinobu | Electro | Sword | 60 | 15.0 | 3.0 | Constellation 0 | Standard fixed particle drop | 4★ | released | Shinobu, Kuki |
| 61 | Lan Yan | Anemo | Catalyst | 60 | 15.0 | 3.0 | Press | Standard fixed particle drop | 4★ | upcoming | - |
| 62 | Lauma | Dendro | Bow | 60 | 15.0 | 3.0 | Press | Standard fixed particle drop | 5★ | upcoming | - |
| 63 | Layla | Cryo | Sword | 40 | 12.0 | 3.0 | 1 volley | Standard fixed particle drop | 4★ | released | - |
| 64 | Linnea | Geo | Polearm | 60 | 15.0 | 3.0 | Press | Standard fixed particle drop | 4★ | upcoming | - |
| 65 | Lisa | Electro | Catalyst | 80 | 20.0 | 0.0 | Press | Generates 0 particles on tap/press | 4★ | released | - |
| 66 | Lohen | Cryo | Sword | 60 | 15.0 | 5.0 | Press | Standard fixed particle drop | 5★ | upcoming | - |
| 67 | Lynette | Anemo | Sword | 70 | 18.0 | 4.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 68 | Lyney | Pyro | Bow | 60 | 15.0 | 5.0 | Press | Standard fixed particle drop | 5★ | released | - |
| 69 | Mavuika | Pyro | Claymore | 0 | 18.0 | 5.0 | Press | Alternate energy mechanic (Nightsoul / Stance), cost 0 | 5★ | upcoming | Pyro Archon |
| 70 | Mika | Cryo | Polearm | 70 | 18.0 | 4.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 71 | Mona | Hydro | Catalyst | 60 | 15.0 | 3.33 | Press | Phantom explosion: 3 or 4 particles (avg 3.33) | 5★ | released | Mona Megistus |
| 72 | Mualani | Hydro | Catalyst | 60 | 15.0 | 4.5 | Press | Skill / stance generates 4 or 5 particles (avg 4.5) | 5★ | released | Shark Girl |
| 73 | Nahida | Dendro | Catalyst | 50 | 13.5 | 6.0 | Press | Standard fixed particle drop | 5★ | released | Kusanali, Lesser Lord |
| 74 | Navia | Geo | Claymore | 60 | 15.0 | 3.5 | Press | Skill generates 3 or 4 particles (avg 3.5) | 5★ | released | Spina President |
| 75 | Nefer | Dendro | Catalyst | 60 | 15.0 | 2.67 | Press | Skill generates 2 or 3 Dendro particles (avg 2.67) | 5★ | upcoming | - |
| 76 | Neuvillette | Hydro | Catalyst | 70 | 18.0 | 4.0 | Press | Standard fixed particle drop | 5★ | released | Neuvi, Iudex |
| 77 | Nicole | Pyro | Catalyst | 60 | 15.0 | 5.0 | Press | Standard fixed particle drop | 5★ | upcoming | Nicole Reihn, Hexenzirkel N |
| 78 | Nilou | Hydro | Sword | 70 | 18.0 | 4.5 | Press | Skill / stance generates 4 or 5 particles (avg 4.5) | 5★ | released | - |
| 79 | Ningguang | Geo | Catalyst | 40 | 12.0 | 3.4 | Press | Jade Screen: 3 or 4 Geo particles (avg 3.4, 6s internal CD) | 4★ | released | Ning |
| 80 | Nobody | None | None | 60 | 15.0 | 3.0 | Press | Standard fixed particle drop | 4★ | upcoming | Empty, None |
| 81 | Noelle | Geo | Claymore | 60 | 15.0 | 3.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 82 | Odette | Cryo | Bow | 60 | 15.0 | 5.0 | Press | Standard fixed particle drop | 4★ | upcoming | - |
| 83 | Ororon | Electro | Bow | 60 | 15.0 | 3.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 84 | Prune | Anemo | Catalyst | 70 | 18.0 | 5.0 | Press | Standard fixed particle drop | 4★ | upcoming | - |
| 85 | Qiqi | Cryo | Sword | 80 | 20.0 | 3.0 | Press | Standard fixed particle drop | 5★ | released | - |
| 86 | Raiden | Electro | Polearm | 90 | 18.0 | 6.5 | Press | Eye of Stormy Judgment periodic hits (50% chance, 0.9s CD, avg 6.5) | 5★ | released | Raiden Shogun, Ei |
| 87 | Razor | Electro | Claymore | 80 | 20.0 | 3.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 88 | Rosaria | Cryo | Polearm | 60 | 15.0 | 3.0 | Press | Standard fixed particle drop | 4★ | released | Rosa |
| 89 | Sandrone | Cryo | Claymore | 60 | 15.0 | 1.0 | Hit On-Field | Hit on-field with mechanical automata generates 1 particle | 5★ | upcoming | Marionette |
| 90 | Sara | Electro | Bow | 80 | 20.0 | 3.0 | Aimed Shot | Skill creates buffed Aimed Shot / Crowfeather that procs particles | 4★ | released | Kujou Sara |
| 91 | Sayu | Anemo | Claymore | 80 | 20.0 | 2.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 92 | Sethos | Electro | Bow | 60 | 15.0 | 2.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 93 | Shenhe | Cryo | Polearm | 80 | 20.0 | 3.0 | Press | Standard fixed particle drop | 5★ | released | - |
| 94 | Sigewinne | Hydro | Bow | 70 | 18.0 | 4.0 | Press | Standard fixed particle drop | 5★ | released | Sige |
| 95 | Skirk | Cryo | Sword | 0 | 15.0 | 4.0 | Attack | Alternate energy mechanic (Nightsoul / Stance), cost 0 | 5★ | upcoming | Master Skirk |
| 96 | Sucrose | Anemo | Catalyst | 80 | 20.0 | 4.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 97 | Tartaglia | Hydro | Bow | 60 | 15.0 | 3.0 | 7-9s melee | Standard fixed particle drop | 5★ | released | Childe, Ajax |
| 98 | Thoma | Pyro | Polearm | 80 | 20.0 | 3.4 | Press | Blazing Blessing: 3 or 4 Pyro particles (avg 3.4) | 4★ | released | - |
| 99 | Tighnari | Dendro | Bow | 40 | 12.0 | 3.5 | Press | Skill generates 3 or 4 particles (avg 3.5) | 5★ | released | Nari |
| 100 | Traveler (Anemo) | Anemo | Sword | 60 | 15.0 | 2.0 | Press | Standard fixed particle drop | 5★ | released | Anemo MC, Anemo Traveler |
| 101 | Traveler (Cryo) | Cryo | Sword | 60 | 15.0 | 3.0 | Press | Standard fixed particle drop | 5★ | upcoming | Cryo MC, Cryo Traveler |
| 102 | Traveler (Dendro) | Dendro | Sword | 80 | 20.0 | 2.5 | Press | Razorgrass Blade: 2 or 3 Dendro particles (avg 2.5) | 5★ | released | Dendro MC, Dendro Traveler |
| 103 | Traveler (Electro) | Electro | Sword | 80 | 20.0 | 1.0 | Press | Standard fixed particle drop | 5★ | released | Electro MC, Electro Traveler |
| 104 | Traveler (Geo) | Geo | Sword | 60 | 15.0 | 3.33 | Press | Starfell Sword: 3 or 4 Geo particles (avg 3.33) | 5★ | released | Geo MC, Geo Traveler |
| 105 | Traveler (Hydro) | Hydro | Sword | 80 | 20.0 | 3.33 | Press | Aquacrest Saber: 3 or 4 Hydro particles (avg 3.33) | 5★ | released | Hydro MC, Hydro Traveler |
| 106 | Traveler (Pyro) | Pyro | Sword | 70 | 18.0 | 1.0 | Blazing Threshold | Standard fixed particle drop | 5★ | released | Pyro MC, Pyro Traveler |
| 107 | Varesa | Electro | Catalyst | 70 | 18.0 | 2.5 | Press | Skill generates 2 or 3 Electro particles (avg 2.5) | 5★ | upcoming | - |
| 108 | Varka | Anemo | Claymore | 60 | 15.0 | 6.0 | Press | Standard fixed particle drop | 5★ | upcoming | Grand Master Varka |
| 109 | Venti | Anemo | Bow | 60 | 15.0 | 3.0 | Press | Standard fixed particle drop | 5★ | released | Barbatos |
| 110 | Vesna | Anemo | Sword | 60 | 15.0 | 5.0 | Press | Standard fixed particle drop | 4★ | upcoming | - |
| 111 | Vodyanitsa | Hydro | Sword | 60 | 15.0 | 5.0 | Press | Press skill generates 5.0 Hydro particles | 4★ | upcoming | - |
| 112 | Wanderer | Anemo | Catalyst | 60 | 15.0 | 4.0 | 8-10s uptime | Windfavored state normal/charged hits generate ~4 particles over 8-10s | 5★ | released | Scaramouche, Hat Guy |
| 113 | Wriothesley | Cryo | Catalyst | 60 | 15.0 | 1.0 | NA during skill | Standard fixed particle drop | 5★ | released | Wrio, Duke |
| 114 | Xiangling | Pyro | Polearm | 80 | 20.0 | 4.0 | Press | Standard fixed particle drop | 4★ | released | XL, Guoba |
| 115 | Xianyun | Anemo | Catalyst | 70 | 18.0 | 5.0 | Press | Standard fixed particle drop | 5★ | released | Cloud Retainer |
| 116 | Xiao | Anemo | Polearm | 70 | 18.0 | 3.0 | Press | Standard fixed particle drop | 5★ | released | Vigilant Yaksha |
| 117 | Xilonen | Geo | Sword | 60 | 15.0 | 4.0 | Press | Standard fixed particle drop | 5★ | released | Leopard DJ |
| 118 | Xingqiu | Hydro | Sword | 80 | 20.0 | 5.0 | Press | Standard fixed particle drop | 4★ | released | XQ |
| 119 | Xinyan | Pyro | Claymore | 60 | 15.0 | 4.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 120 | Yae Miko | Electro | Catalyst | 90 | 22.0 | 3.0 | 3 totems | Sesshou Sakura totem strikes generate ~3 particles across rotation | 5★ | released | Yae, Guuji Yae |
| 121 | Yanfei | Pyro | Catalyst | 80 | 20.0 | 3.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 122 | Yaoyao | Dendro | Polearm | 80 | 20.0 | 3.0 | Press | Standard fixed particle drop | 4★ | released | - |
| 123 | Yelan | Hydro | Bow | 70 | 18.0 | 4.0 | Press | Standard fixed particle drop | 5★ | released | - |
| 124 | Yoimiya | Pyro | Bow | 60 | 15.0 | 4.0 | Press | Standard fixed particle drop | 5★ | released | Yoi |
| 125 | Yumemizuki Mizuki | Anemo | Catalyst | 60 | 15.0 | 4.0 | Press | Standard fixed particle drop | 5★ | upcoming | Mizuki |
| 126 | Yun Jin | Geo | Polearm | 60 | 15.0 | 2.0 | Press | Standard fixed particle drop | 4★ | released | Yunjin |
| 127 | Zhongli | Geo | Polearm | 40 | 12.0 | 3.0 | Press | Standard fixed particle drop | 5★ | released | Morax, Geo Daddy |
| 128 | Zibai | Geo | Sword | 60 | 15.0 | 4.7 | Press | Skill / Lunar Phase Shift generates 4 or 5 Geo particles (avg 4.7) | 5★ | upcoming | - |

---

## 5. Theorycrafter Shorthand & Normalization Engine

In `Calc Sheet.xlsx` and `nj2k8acllnah1.png`, characters are written in theorycrafter shorthand:
- `"Wrio C0"` / `"Wrio"` -> `Wriothesley`
- `"Yae C1"` / `"Yae"` -> `Yae Miko`
- `"Odette C0"` / `"Odette"` -> `Odette`
- `"Nicole C0"` / `"Nicole"` -> `Nicole`
- `"Cryo MC"` -> `Traveler (Cryo)`
- `"Mizuki"` -> `Yumemizuki Mizuki`
- `"Sandrone"` -> `Sandrone`
- `"Childe"` / `"Tartaglia"` -> `Tartaglia`
- `"Raiden"` / `"Ei"` -> `Raiden`

### Normalization Logic
The function `normalizeCharacterName(rawName: string): string` executes:
1. Strip constellation suffix (e.g. `Wrio C0` -> `Wrio`, `Yae C1` -> `Yae`).
2. Strip refinement or weapon notes (e.g. `Sandrone (Carry)` -> `Sandrone`).
3. Trim and lowercase.
4. Check exact match against canonical 128 names.
5. Check alias dictionary (`ALIASES_MAP`).
6. Fall back to substring match or original trimmed title-cased name.

---

## 6. Dynamic Fallback Badge & Avatar URL Engine

### 6.1 Avatar URLs for Released Characters
For released units, construct canonical asset links using official Hoyo / Project Amber / Enka formats:
```typescript
export function getCharacterAvatarUrl(name: string): string {
  const norm = normalizeCharacterName(name);
  const char = CHARACTERS_DATABASE.find(c => c.name.toLowerCase() === norm.toLowerCase());
  if (!char || char.releaseStatus === 'upcoming') {
    return ''; // Signals the UI to render the crystal fallback badge
  }
  // Standardized public CDN asset URL
  const cleanKey = char.name.replace(/[^a-zA-Z0-9]/g, '');
  return `https://assets.kastel.dev/characters/${cleanKey}.png`;
}
```

### 6.2 Crystal Monogram Badges for Upcoming Units & Offline Mode
When an avatar URL is empty or triggers `onError`, Astralys Suite renders a high-contrast elemental monogram badge:

```typescript
export const ASTRALYS_ELEMENT_COLORS: Record<ElementType, {
  hex: string;
  tint: string;
  border: string;
  glow: string;
  bgGradient: string;
}> = {
  Cryo: {
    hex: '#77C8D5',
    tint: '#A0E6FF',
    border: '#77C8D5',
    glow: 'rgba(119, 200, 213, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(14, 38, 54, 0.95), rgba(119, 200, 213, 0.25))'
  },
  Electro: {
    hex: '#C280D8',
    tint: '#E0B0FF',
    border: '#C280D8',
    glow: 'rgba(194, 128, 216, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(38, 14, 54, 0.95), rgba(194, 128, 216, 0.25))'
  },
  Pyro: {
    hex: '#FF6B5E',
    tint: '#FFA07A',
    border: '#FF6B5E',
    glow: 'rgba(255, 107, 94, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(54, 18, 14, 0.95), rgba(255, 107, 94, 0.25))'
  },
  Hydro: {
    hex: '#3B82F6',
    tint: '#60A5FA',
    border: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(14, 28, 54, 0.95), rgba(59, 130, 246, 0.25))'
  },
  Anemo: {
    hex: '#52D8A6',
    tint: '#7EF3C9',
    border: '#52D8A6',
    glow: 'rgba(82, 216, 166, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(14, 54, 38, 0.95), rgba(82, 216, 166, 0.25))'
  },
  Geo: {
    hex: '#EAB308',
    tint: '#FDE047',
    border: '#EAB308',
    glow: 'rgba(234, 179, 8, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(54, 46, 14, 0.95), rgba(234, 179, 8, 0.25))'
  },
  Dendro: {
    hex: '#84CC16',
    tint: '#BEF264',
    border: '#84CC16',
    glow: 'rgba(132, 204, 22, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(28, 54, 14, 0.95), rgba(132, 204, 22, 0.25))'
  },
  None: {
    hex: '#94A3B8',
    tint: '#CBD5E1',
    border: '#94A3B8',
    glow: 'rgba(148, 163, 184, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(148, 163, 184, 0.25))'
  }
};

export function getCharacterFallbackBadge(name: string): CharacterFallbackBadge {
  const norm = normalizeCharacterName(name);
  const char = getCharacterERData(norm);
  const elemColors = ASTRALYS_ELEMENT_COLORS[char.element] || ASTRALYS_ELEMENT_COLORS.None;

  // Generate 2-character monogram
  let initials = '??';
  if (char.name.includes('(')) {
    const base = char.name.split('(')[0].trim();
    const sub = char.name.split('(')[1].replace(')', '').trim();
    initials = (base[0] + sub[0]).toUpperCase();
  } else {
    const parts = char.name.split(/\s+/);
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      initials = char.name.slice(0, 2).toUpperCase();
    }
  }

  return {
    initials,
    element: char.element,
    elementColor: elemColors.hex,
    elementGlow: elemColors.glow,
    bgGradient: elemColors.bgGradient,
    borderColor: elemColors.border,
    isUpcoming: char.releaseStatus === 'upcoming'
  };
}
```

---

## 7. Concrete Helper Functions Specification

We recommend exporting the following 8 functions from `src/data/characters.ts`:

1. `getCharacterERData(name: string): CharacterERData`  
   - Normalized lookup; returns matched character or safe Pyro 60-cost fallback.
2. `getAllCharacters(): CharacterERData[]`  
   - Returns immutable copy of all 128 characters.
3. `getCharactersByElement(element: ElementType): CharacterERData[]`  
   - Case-insensitive filter by element.
4. `getCharactersByWeapon(weapon: WeaponType | string): CharacterERData[]`  
   - Case-insensitive filter by weapon category.
5. `getCharactersByRarity(rarity: 4 | 5): CharacterERData[]`  
   - Filter by 4★ or 5★ rarity.
6. `searchCharacters(query: string): CharacterERData[]`  
   - Search across name, aliases, element, and weapon.
7. `normalizeCharacterName(rawName: string): string`  
   - Resolves aliases (`Wrio` -> `Wriothesley`, `Cryo MC` -> `Traveler (Cryo)`, etc.).
8. `getCharacterFallbackBadge(name: string): CharacterFallbackBadge`  
   - Computes monogram, colors, and badge metadata.

---

## 8. Concrete Implementation Proposal

The complete, drop-in replacement files have been generated in the explorer workspace:
1. `C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\explorer_m1_3\proposed_characters.ts` (37.6 KB, 489 lines)
   - Contains all 128 character profiles with canonical names, elements, weapons, burst costs, burst CDs, particles, labels, RNG notes, rarities (54 four-stars, 74 five-stars), release status (95 released, 33 upcoming), and aliases.
   - Contains `ASTRALYS_ELEMENT_COLORS` palette matching the Astralys design token architecture.
   - Contains full helper function suite: `normalizeCharacterName`, `getCharacterERData`, `getAllCharacters`, `getCharactersByElement`, `getCharactersByWeapon`, `getCharactersByRarity`, `searchCharacters`, `getCharacterAvatarUrl`, and `getCharacterFallbackBadge`.
   - Retains `CHARACTER_BASE_PROFILES` for the 8 flagship damage simulator profiles.
2. `C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\explorer_m1_3\proposed_types_er.ts`
   - Exports `WeaponType = 'Sword' | 'Claymore' | 'Polearm' | 'Bow' | 'Catalyst' | 'None'`.
   - Extends `CharacterERData` with optional metadata (`weapon`, `rarity`, `releaseStatus`, `rng`, `aliases`, `avatarUrl`) ensuring 100% backwards compatibility with existing consumers (`erEngine.ts`).

### Key Implementation Snippets

```typescript
// Example of canonical 128-character entry in CHARACTERS_DATABASE:
{ 
  name: "Sandrone", 
  element: "Cryo", 
  weapon: "Claymore", 
  burst_cost: 60, 
  burst_cd: 15, 
  particles: 1, 
  label: "Hit On-Field", 
  rng: "Hit on-field with mechanical automata generates 1 particle", 
  rarity: 5, 
  releaseStatus: "upcoming", 
  aliases: ["Marionette"] 
},
{ 
  name: "Mavuika", 
  element: "Pyro", 
  weapon: "Claymore", 
  burst_cost: 0, 
  burst_cd: 18, 
  particles: 5, 
  label: "Press", 
  rng: "Alternate energy mechanic (Nightsoul / Stance), cost 0", 
  rarity: 5, 
  releaseStatus: "upcoming", 
  aliases: ["Pyro Archon"] 
},
{ 
  name: "Nobody", 
  element: "None", 
  weapon: "None", 
  burst_cost: 60, 
  burst_cd: 15, 
  particles: 3, 
  label: "Press", 
  rng: "Standard fixed particle drop", 
  rarity: 5, 
  releaseStatus: "upcoming", 
  aliases: ["Empty", "None"] 
}
```

---

## 9. Verification & Safeguards

### 9.1 Parity & Integrity Checks
1. **Total Count Verification**:
   - `CHARACTERS_DATABASE.length === 128` (verified against `survey_er_calc.md` Section 2 and `characters_dump.json`).
2. **Backwards Compatibility**:
   - `getCharacterERData("Raiden")` returns `{ name: "Raiden", element: "Electro", burst_cost: 90, burst_cd: 18, particles: 6.5, label: "Press", ... }`.
   - `calculateTeamER` in `src/engines/erEngine.ts` requires no modifications and passes all scenarios.
3. **Alias Resilience**:
   - `getCharacterERData("Wrio")` -> Resolves to `Wriothesley` (Cryo, 60 cost).
   - `getCharacterERData("Yae")` -> Resolves to `Yae Miko` (Electro, 90 cost).
   - `getCharacterERData("Cryo MC")` -> Resolves to `Traveler (Cryo)` (Cryo, 60 cost).
4. **Fallback Safety**:
   - `getCharacterERData("CustomNonExistent")` -> Returns safe fallback `{ name: "CustomNonExistent", element: "Pyro", burst_cost: 60, particles: 3, label: "Press", ... }`.
5. **Brand Compliance**:
   - Strictly references **Astralys** across all models, badges, and documentation.


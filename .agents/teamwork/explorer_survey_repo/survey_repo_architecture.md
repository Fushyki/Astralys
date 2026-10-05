# Ametist Impact Suite — Codebase & Architecture Survey Report

**Author**: `explorer_survey_repo`  
**Date**: 2026-10-02  
**Target Repository**: `C:\Users\dabiv\ametist-impact-suite`  
**Integrity Mode**: Development / Read-Only Architectural Survey  

---

## 1. Executive Summary & Repository Status

Ametist Impact Suite is envisioned as a unified, high-aesthetic web application for Genshin Impact theorycrafting, rotation visualization, and energy recharge optimization. The application combines three major pillars:
1. **R1: Infographic Card Generator & Spreadsheet Parser** — Translating `.xlsx` theorycrafting workbooks (e.g. `Calc Sheet.xlsx`) and raw rotation tables (e.g. `nj2k8acllnah1.png`) into publication-grade rotation infographic cards mirroring the format of `images.jfif`.
2. **R2: Energy Recharge (ER) Calculator Integration** — A complete particle-based ER engine ported from `Calculadora_Recarga_Genshin.html` supporting 110+ characters, Favonius weapons, split funneling, and boss safety margins (+15%), with seamless one-click ER data transmission to the Infographic Card.
3. **R3: Clean Hub & Tierlist Portal** — An "Ametist Clean" dashboard with instant tool switching, version 6.7 weapon/character tierlists, and theorycrafting presets.

### Key Baseline Findings
- **Application Skeleton**: The repository contains Vite + React 18 + TypeScript + Tailwind CSS configuration files, along with core calculation engines (`erEngine.ts`, `damageEngine.ts`), data databases (`characters.ts` with 110+ characters, `presets.ts`), and types (`er.ts`, `damage.ts`).
- **Critical Missing Entrypoints**: Neither `src/main.tsx` nor `src/App.tsx` currently exists. While `index.html` references `/src/main.tsx`, the file was not yet authored. Consequently, the project cannot build (`npm run build`) or run (`npm run dev`) until `main.tsx` and `App.tsx` are created.
- **Node Modules Status**: `node_modules` is not yet installed. Internet and npm registry connectivity (`https://registry.npmjs.org/`) are fully verified and functional.
- **Missing NPM Dependencies**:
  - `xlsx` (SheetJS) is missing from `package.json` (required for parsing `.xlsx` workbooks).
  - `html-to-image` is missing from `package.json` (required for client-side high-DPI PNG generation and clipboard copy).

---

## 2. Codebase & Configuration Audit

### 2.1 Configuration Files

| File | Status | Assessment |
|---|---|---|
| `package.json` | Present | Declares React 18.3.1, `lucide-react` 0.453.0, `clsx` 2.1.1, `tailwind-merge` 2.5.4. Lacks `xlsx` and `html-to-image`. Scripts defined: `dev`, `build` (`tsc && vite build`), `preview`. |
| `tsconfig.json` | Present | Target `ES2020`, Module `ESNext`, `moduleResolution: "bundler"`, `strict: true`, `jsx: "react-jsx"`, `include: ["src"]`. Well configured for modern Vite + React. |
| `vite.config.ts` | Present | Standard `@vitejs/plugin-react`, port `3000`, open `true`. Clean. |
| `tailwind.config.js` | Present | Highly customized with an expansive amethyst color scale (`ametist-50` through `ametist-950`), elemental tokens (`elem-pyro`, `hydro`, `anemo`, `electro`, `dendro`, `cryo`, `geo`, `neutral`), fonts (`"Plus Jakarta Sans"`, `"Cinzel"`), custom shadows (`ametist-sm`, `ametist-md`, `ametist-glow`, `crystal`), and gradient backgrounds. |
| `postcss.config.js` | Present | Standard `tailwindcss` and `autoprefixer` plugins. |
| `index.html` | Present | Loads Google Fonts (`Cinzel`, `Plus Jakarta Sans`), sets `html class="dark"`, background styling, and targets `/src/main.tsx`. |

### 2.2 Existing `src/` Directory Structure

```
src/
├── components/
│   ├── Header.tsx         # Sticky header with tabs (landing, er, damage, tierlist), abyss toggle
│   └── LandingPage.tsx    # Dashboard hero, tool cards, theorycrafting compliance badges
├── data/
│   ├── characters.ts      # 110+ characters with particle counts, burst costs, elemental types, base stats
│   └── presets.ts         # Pre-configured ER teams (Mavuika Melt, Flins Quicken, Raiden National, etc.)
├── engines/
│   ├── damageEngine.ts    # Complete damage calculation engine (ATK/HP/DEF/EM scaling, DEF/RES shred, reactions)
│   └── erEngine.ts        # Particle-based ER calculation engine with funneling & boss margins
├── index.css              # Glassmorphism utilities (.crystal-panel, custom scrollbar, glow effects)
└── types/
    ├── damage.ts          # Comprehensive damage simulation data structures
    └── er.ts              # CharacterERData, ERSlotConfig, ERCalculationResult, SavedTeam
```

---

## 3. Dependency Gap Analysis

### 3.1 Excel Spreadsheet Parsing (.xlsx)
- **Requirement**: Client-side parsing of uploaded `.xlsx` files (specifically `Calc Sheet.xlsx` tabs like `Sandrone`, `Mavuika`, `Flins`, `Kinich`, `Navia`).
- **Missing Dependency**: `xlsx` (SheetJS).
- **Recommendation**: Add `xlsx: "^0.18.5"` to `dependencies`.
  - Enables `XLSX.read(arrayBuffer, { type: 'array' })`, `workbook.SheetNames`, and `XLSX.utils.sheet_to_json(sheet, { header: 1 })`.
  - Works natively in Vite without browser polyfill issues.

### 3.2 Infographic Card Export (PNG Export & Clipboard Copy)
- **Requirement**: Render DOM node of the Infographic Card directly to high-resolution PNG (2x/3x retina DPI) and allow copying image blob directly to user clipboard without server interaction or CSS distortion.
- **Missing Dependency**: `html-to-image`.
- **Recommendation**: Add `html-to-image: "^1.11.11"` to `dependencies`.
  - API: `toPng(nodeRef, { pixelRatio: 2, cacheBust: true })` and `toBlob(nodeRef, { pixelRatio: 2 })`.
  - Allows `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])` with graceful fallback download.

### 3.3 Icons & UI Styling
- **Status**: `lucide-react` (^0.453.0), `clsx` (^2.1.1), `tailwind-merge` (^2.5.4) are already in `package.json`.
- `lucide-react` provides all needed iconography:
  - Header & Hub: `Sparkles`, `Calculator`, `Zap`, `ListOrdered`, `Shield`, `Moon`, `ExternalLink`
  - Infographic & Export: `Upload`, `Download`, `Copy`, `Check`, `Image`, `FileSpreadsheet`, `Edit3`, `RefreshCw`
  - ER & Controls: `Users`, `Save`, `FolderOpen`, `Plus`, `Trash2`, `HelpCircle`, `Send`

---

## 4. Analysis of Reference Materials & Domain Logic

### 4.1 Reference Infographic Card (`images.jfif`)
Direct inspection of `images.jfif` reveals a high-contrast dark-themed card containing 4 distinct functional quadrants:

```
+---------------------------------------------------------------------------------+
|                                  SANDRONE                                       |
|                               KQM Investment                                    |
+-----------------------------------------------------+---------------------------+
| DAMAGE SHARE                                        | EQUIPMENT BUILDS          |
|                                                     |                           |
| [Cryo] [Avatar] C0 Sandrone                         | [R5 Tidal]    [102 ER]    |
| [=========================== 52% =================] |               [Disenchant]|
|                                                     | ATK / ATK / CD            |
|                                                     |                           |
| [Cryo] [Avatar] C0 Qiqi                             | [R5 Fav]      [100 ER]    |
| [= 1% =]                                            |               [Tenacity]  |
|                                                     | ATK / CR                  |
|                                                     |                           |
| [Electro] [Avatar] C1 Yae                           | [R5 Craft]    [100 ER]    |
| [================= 31% ===============]             |               [Disenchant]|
|                                                     | ATK / ATK / CD            |
|                                                     |                           |
| [Cryo] [Avatar] C0 Odette                           | [R1 Sig]      [100 ER]    |
| [======== 16% ========]                             |               [Stella Sup]|
|                                                     | ATK / ATK / CR            |
+-----------------------------------------------------+---------------------------+
|                             [AMETIST IMPACT SUITE]                              |
|                          DPS: 189.1k  |  DPR: 3.88M                             |
| (20.5s) Odette EE Yae EEE Qiqi E Sandrone CA E CA EQ CA E                       |
+---------------------------------------------------------------------------------+
```

#### Visual & Structural Specifics:
1. **Top Header**:
   - Team / Carry name in uppercase Cinzel typography (e.g. `SANDRONE`, `WRIOTHESLEY`, `CYNO`, `CRYO MC`, `MIZUKI`).
   - Investment tier badge: `KQM Investment` in warm gold accent text (`#f59e0b`).
2. **Left Column (Damage Share)**:
   - Section heading: `Damage Share`.
   - Character row: Elemental badge + character avatar thumbnail + constellation & name (e.g. `C0 Sandrone`).
   - Dynamic elemental progress bar: Width proportional to damage contribution, tinted with element color (Cryo `#7dd3fc`, Electro `#c084fc`, Pyro `#f87171`, Hydro `#38bdf8`, Dendro `#4ade80`, Geo `#fbbf24`, Anemo `#2dd4bf`). Text percentage displayed alongside or inside the bar.
3. **Right Column (Equipment Builds)**:
   - Synchronized row-by-row with each character.
   - Weapon Card: Square rounded badge with refinement indicator in top-left corner (`R1`–`R5`), weapon name label below.
   - Artifact Card: Square rounded badge with calculated Energy Recharge requirement badge in top-right corner (e.g. `102 ER`), artifact set name label below (e.g. `Disenchant`, `Tenacity`, `Obsidian`).
   - Main Stat Line: 3-stat breakdown (e.g. `ATK / ATK / CD`, `EM / ATK / CR`, `HP / Hydro / Crit`).
4. **Watermark & Footer Metrics**:
   - Centered watermark badge (`AMETIST IMPACT SUITE`).
   - Highlighted KPI row: `DPS: [val] | DPR: [val]` in high-contrast yellow/gold typography.
   - Rotation sequence line: Duration prefix in parentheses `(20.5s)`, followed by color-coded character names and exact skill notations (`EE`, `EEE`, `Q`, `E`, `N1`, `N5C`, `CA`).

---

### 4.2 Reference Raw Calculation Table (`nj2k8acllnah1.png`)
Inspection of `nj2k8acllnah1.png` demonstrates the unstructured or tabular raw inputs theorycrafters frequently share:
- Columns: `[Team / Carry Name]`, `[DMG contrib%]`, `[Artifacts]`, `[Weapon]`, `[Combo notes]`.
- Row entries: `Wrio C0` (1,308,604.60 | 45.83%), `Yae C1` (1,048,791.93 | 36.73%), `Odette C0` (487,931.25 | 17.09%), `Nicole C0` (10,239.79 | 0.36%).
- Summary metrics: `DPR: 2,855,567.58`, `DPS: 167,974.56`, `Rotation(17s): Nicole E > Yae EEE > Odette Q/E E > Wrio Combo`.
- The parser must support pasting plain text containing tab-delimited, pipe-delimited, or CSV data, as well as line-by-line formatted blocks, auto-detecting character names, damage values, artifact names, weapons, and rotation strings.

---

### 4.3 Theorycrafting Workbook Architecture (`Calc Sheet.xlsx`)
Inspection of `Calc Sheet.xlsx` reveals 12 workbook tabs:
`['Inicio', 'Plan Base', 'Nefer', 'Zibai', 'Mavuika', 'Flins', 'Sandrone', 'Mualani', 'Varka', 'Kinich', 'Navia', 'Planilha1']`

#### Common Structural Pattern in Character Tabs:
1. **Team Slots (Columns B, C, D, E)**:
   - 4 consecutive columns represent the 4 team members.
   - Variant 2 (alternative loadouts) often appears in columns O, P, Q, R.
2. **Metadata Rows**:
   - Character Names: Found in Row 1 or Row 5 (e.g. `Sandrone`, `Yae`, `Qiqi`, `Nicole`).
   - Weapons: Found in Row 2 or Row 4 (e.g. `Mailed Flower`, `The Widsith`, `Fav`, `Oathsworn Eye`).
   - Artifact Sets: Found in Row 1 or Row 3 (e.g. `Disenchant`, `Milelith`, `F. Purity`, `Obsidian`, `Cinder City`).
3. **Calculation & Summary Rows**:
   - `Damage` / `DMG` row (Row 31 or 32): Individual character damage figures.
   - `DMGTotal` row (Row 32 or 33): Total team rotation damage (DPR).
   - `DPS` row (Row 33 or 34): Rotation DPS value.
   - Damage contribution % is either explicitly provided or calculated as:  
     $$\text{Damage Share } \% = \frac{\text{Character Damage}}{\text{Total Team Damage}} \times 100$$
4. **Rotation Notation**:
   - Explicit rotation sequence cells (e.g. `(20.5s) Odette EE Yae EEE Qiqi E Sandrone CA E CA EQ CA E` or `Mualani N1 -> Mavuika QE -> Mona Q 2N -> Sucrose E N1 Mualani E3 Q E3`).
   - Rotation duration in seconds (e.g. `DPS(18)`, `DPS(20)`).

---

### 4.4 Original ER Calculator Script (`Calculadora_Recarga_Genshin.html`)
The script contains a proven, authoritative particle energy model:
1. **Skill Particle Generation**:
   - Character-specific base particle count per skill use (`custom_part` override supported).
   - Multiplication factor based on elemental affinity and on-field status:
     - Same Element On-field: $3.0 \times \text{particles}$
     - Same Element Off-field: $1.8 \times \text{particles}$
     - Different Element On-field: $1.0 \times \text{particles}$
     - Different Element Off-field: $0.6 \times \text{particles}$
2. **Funneling Rules**:
   - `Ele mesmo (Em campo)`: 100% on-field energy to generating slot.
   - `Passar p/ Slot X`: 100% on-field energy funneled to target slot.
   - `Dividir (50% Slot X / 50% Slot Y)`: 50% on-field energy split between target slots.
   - `Fora de campo (Dividido)`: 0% on-field energy.
3. **Favonius Weapons**:
   - Generates 3 Clear (Neutral) particles per proc.
   - On-field receiver: $3 \times 2.0 = 6.0$ base energy.
   - Off-field receiver: $3 \times 1.2 = 3.6$ base energy.
4. **Enemy Clear Particles**:
   - Standard assumption: 6 clear particles per rotation from enemy HP thresholds.
   - Receiver energy: $\text{enemyParts} \times (onfieldPct \times 2.0 + (1 - onfieldPct) \times 1.2)$.
5. **Flat Energy Passives**:
   - Added directly to energy pool without ER scaling.
   - Automatic Raiden Shogun bonus: $+24$ flat energy to all non-Raiden teammates.
6. **ER Requirement & Margins**:
   - Total base energy: $E_{\text{base}} = E_{\text{skills}} + E_{\text{fav}} + E_{\text{enemy}}$.
   - Remaining cost: $E_{\text{needed}} = \max(0, \text{Burst Cost} - \text{Flat Energy})$.
   - Required ER: $\text{ER}_{\text{req}} = \max(1.0, E_{\text{needed}} / E_{\text{base}})$.
   - Single-target boss margin: $\text{ER}_{\text{safe}} = \text{ER}_{\text{req}} \times 1.15$ (+15% margin).
7. **Burst Disabled Toggle**:
   - For characters that do not burst every rotation (e.g. Mavuika in specific teams, Zhongli, Childe ranged burst skip). Required ER is displayed as `100.0%` with notice `Não usa Ult (Ignorar ER)`.
8. **Team Persistence & Backup**:
   - Local storage persistence for custom teams and active session.
   - Export/Import JSON backup format.

---

## 5. Requirements for R3 (Clean Hub & Tierlist Portal)

### 5.1 "Ametist Clean" Theme Specification
- **Background Aesthetics**: Ultra-deep obsidian purple (`#07030e`, `#080311`) with subtle fixed radial gradients (`rgba(109, 40, 217, 0.22)` at top center).
- **Glassmorphism Panels**: `.crystal-panel` utility with `backdrop-filter: blur(16px)`, `rgba(168, 85, 247, 0.22)` border, and dual box-shadow for depth.
- **Typography Standards**:
  - Headings, hero banners, watermarks: `Cinzel` serif, font weights 600, 700, 800.
  - Data displays, metrics, body text: `Plus Jakarta Sans`, clean geometric sans-serif.
- **Elemental Token Matrix**:
  - Pyro: `#f87171`
  - Hydro: `#38bdf8`
  - Anemo: `#2dd4bf`
  - Electro: `#c084fc`
  - Dendro: `#4ade80`
  - Cryo: `#7dd3fc`
  - Geo: `#fbbf24`
- **UI Interaction Standards**:
  - Active navigation buttons: Amethyst gradient (`from-ametist-600 to-ametist-500`) with white text and subtle glow.
  - Interactive cards: Hover translate-y (`-translate-y-0.5`), border glow highlight.
  - Badges: Pill shapes with semi-transparent tinted backgrounds and coordinating borders.

### 5.2 Version 6.7 Meta Tierlist Specifications
A dedicated tierlist portal covering characters and weapons reflecting the Natlan / Snezhnaya meta:
- **Tiers**: `S+` (Apex / Meta-Defining), `S` (Top-Tier / Premier), `A+` (High Value Specialists), `A` (Solid Performers), `B` (Niche / Situational).
- **Character Meta (Version 6.7)**:
  - `S+`: Mavuika, Neuvillette, Furina, Xilonen, Citlali, Kazuha, Sandrone, Flins.
  - `S`: Arlecchino, Alhaitham, Raiden, Yelan, Nahida, Kinich, Bennett, Xiangling, Xingqiu, Nicole, Odette.
  - `A+`: Navia, Wriothesley, Lyney, Emilie, Chasca, Chiori, Clorinde, Baizhu, Zhongli, Sucrose, Iansan, Ineffa.
  - `A`: Hu Tao, Ayaka, Cyno, Tighnari, Nilou, Kokomi, Keqing, Gaming, Sethos, Ororon, Fischl, Jahoda.
  - `B`: Dehya, Eula, Diluc, Klee, Yoimiya, Razor, Chongyun.
- **Weapon Meta (Version 6.7)**:
  - `S+`: A Thousand Blazing Suns (Mavuika sig), Tome of the Eternal Flow, Splendor of Tranquil Waters, Peak Patrol Song (Xilonen sig), Aqua Simulacra, Mistsplitter Reforged.
  - `S`: Staff of Homa, Favonius Series (Universal Battery Kings), Engulfing Lightning, Redhorn Stonethresher, Kagura's Verity, The Widsith (R5).
  - `A+`: Mailed Flower, Tidal Shadow (R5), Flowing Purity, Craftable 7.0 series, Sacrificial Series, The Catch (R5).
- **Portal Features**:
  - Filter toggle between Characters and Weapons.
  - Category filters by Element (Pyro, Hydro, Cryo, etc.) and Weapon Type (Sword, Claymore, Polearm, Bow, Catalyst).
  - Role filters (Main DPS, Sub-DPS, Buffer/Support, Sustain).
  - Search input for instant lookup.
  - Modal or card tooltip detailing why the character/weapon sits in that tier and their optimal team synergies.

### 5.3 Unified Hub Navigation
The user needs seamless switching between suite tools:
- **Header Navigation Tabs**:
  - `hub` (or `landing`): Hub dashboard, quick-launch cards, theorycrafting highlights, recent work.
  - `infographic`: Infographic generator, spreadsheet uploader, live card preview, PNG exporter.
  - `er`: Particle ER calculator, team preset loader, backup manager, ER-to-Infographic bridge.
  - `tierlist`: Meta 6.7 character and weapon tierlist portal.
  - `damage`: Damage and DPS engine.

---

## 6. Inter-Module Data Pipeline

### 6.1 ER Calculator → Infographic Card Bridge
A core requirement is the direct transfer of calculated ER targets into the Infographic Card:
1. In `ERCalculator.tsx`, a prominent action button: `"Transferir ER para o Infográfico"` / `"Export to Infographic Card"`.
2. Upon click:
   - Extracts character names from slots 1–4.
   - Extracts each character's calculated `neededER` or `safeER` formatted as integer percentage (e.g. `145 ER`).
   - Updates global application state or passes data to the Infographic state.
   - Automatically switches active tab to `'infographic'`, with a confirmation toast notification: *"4 alvos de ER transferidos com sucesso para o card!"*.

### 6.2 Spreadsheet / Raw Table → Infographic Card Bridge
1. User uploads `Calc Sheet.xlsx` or pastes text.
2. The parser extracts:
   - Carry name / Team title
   - 4 characters with constellations
   - Weapons with refinement tags
   - Artifact sets
   - Damage contribution percentages (or individual damages to compute share)
   - DPR, DPS, rotation duration, and rotation notation string
3. Infographic state is instantly populated, updating the live preview card in real time.

---

## 7. Recommended Modular Architecture & Directory Layout

To fulfill all requirements while keeping the codebase modular and maintainable, the following architecture is recommended:

```
src/
├── main.tsx                           # Application entry point (render App into #root)
├── App.tsx                            # Master suite container, activeTab routing, shared state
├── index.css                          # Tailwind directives, crystal glassmorphism, animations
│
├── components/
│   ├── Header.tsx                     # Top navigation, active tab badges, suite status
│   ├── LandingPage.tsx                # Clean Hub Dashboard with quick links to all 4 modules
│   │
│   ├── Infographic/
│   │   ├── InfographicGenerator.tsx   # Master workspace: uploader, manual editor, live card
│   │   ├── InfographicCard.tsx        # The exportable 4-quadrant visual card (mirroring images.jfif)
│   │   ├── SpreadsheetUploader.tsx    # Drag-and-drop .xlsx file input & sheet picker
│   │   ├── RawTableModal.tsx          # Raw table copy-paste text modal (nj2k8acllnah1.png)
│   │   ├── CardEditorControls.tsx     # Inline tweaking panel for stats, weapons, rotations
│   │   └── ExportToolbar.tsx          # High-res PNG export (2x/3x) & Clipboard copy actions
│   │
│   ├── ER/
│   │   ├── ERCalculator.tsx           # Master ER component ported from Calculadora_Recarga_Genshin.html
│   │   ├── ERSlotCard.tsx             # Interactive slot card (particles, funneling, fav, flat)
│   │   ├── ERTeamBar.tsx              # Save/load custom teams, load presets, JSON backup export/import
│   │   └── ERTransferBanner.tsx       # Action banner to push calculated ER values to Infographic Card
│   │
│   ├── Tierlist/
│   │   ├── TierlistPortal.tsx         # Version 6.7 Character & Weapon Tierlist portal
│   │   ├── CharacterTierRow.tsx       # Tier category row (S+, S, A+, etc.) for characters
│   │   ├── WeaponTierRow.tsx          # Tier category row for weapons
│   │   └── TierFilterBar.tsx          # Element, weapon type, role filter buttons and search bar
│   │
│   └── Damage/
│       └── DamageSimulator.tsx        # UI for existing damageEngine.ts
│
├── parsers/
│   ├── spreadsheetParser.ts           # XLSX workbook parser for Calc Sheet.xlsx tabs
│   └── rawTableParser.ts              # Regex/tab-delimited parser for text tables (nj2k8acllnah1.png)
│
├── data/
│   ├── characters.ts                  # 110+ characters with particle counts, burst costs, elemental types
│   ├── presets.ts                     # Pre-configured ER teams
│   ├── tierlistData.ts                # Version 6.7 character and weapon rankings, roles, and notes
│   ├── infographicPresets.ts          # Default presets matching reference cards (Sandrone, Wrio, Cyno, etc.)
│   └── assetUrls.ts                   # Elemental icons, artifact icons, fallback avatar URLs
│
├── engines/
│   ├── erEngine.ts                    # Particle calculation logic with Favonius & funneling
│   └── damageEngine.ts                # Stat mitigation, amplifying reactions & talent motion values
│
└── types/
    ├── infographic.ts                 # InfographicCharacter, InfographicCardData, ExportOptions
    ├── tierlist.ts                    # TierlistCharacter, TierlistWeapon, TierGrade, CharacterRole
    ├── er.ts                          # ERSlotConfig, ERCalculationResult, SavedTeam
    └── damage.ts                      # CharacterConfig, WeaponConfig, DamageCalculationOutput
```

---

## 8. Shared Types Specification

### 8.1 `src/types/infographic.ts`
```typescript
import { ElementType } from './er';

export interface InfographicCharacter {
  id: string;
  name: string;
  element: ElementType;
  constellation: string; // e.g. "C0", "C1", "C6"
  damageShare: number;   // e.g. 52 (for 52%)
  avatarUrl?: string;
  weapon: {
    name: string;
    refinement: string;  // e.g. "R5", "R1"
    iconUrl?: string;
  };
  artifact: {
    name: string;
    erRequirement?: string; // e.g. "102 ER", "100 ER"
    iconUrl?: string;
  };
  mainStats: [string, string, string] | string; // e.g. ["ATK", "ATK", "CD"]
}

export interface InfographicCardData {
  teamName: string;            // e.g. "SANDRONE", "WRIOTHESLEY"
  investmentLevel: string;     // e.g. "KQM Investment"
  characters: InfographicCharacter[]; // 4 team members
  dps: number | string;        // e.g. "189.1k" or 189100
  dpr: number | string;        // e.g. "3.88M" or 3880000
  rotationDuration: number;    // e.g. 20.5
  rotationSequence: string;    // e.g. "Odette EE Yae EEE Qiqi E Sandrone CA E CA EQ CA E"
  watermark: string;           // "AMETIST IMPACT SUITE"
}
```

### 8.2 `src/types/tierlist.ts`
```typescript
import { ElementType } from './er';
import { WeaponType } from './damage';

export type TierGrade = 'S+' | 'S' | 'A+' | 'A' | 'B';
export type CharacterRole = 'Main DPS' | 'Sub DPS' | 'Support / Buffer' | 'Sustain / Shielder';

export interface TierlistCharacter {
  id: string;
  name: string;
  element: ElementType;
  weaponType: WeaponType;
  role: CharacterRole;
  tier: TierGrade;
  iconUrl?: string;
  notes: string;
  versionHighlight?: string; // e.g. "6.7 Apex"
}

export interface TierlistWeapon {
  id: string;
  name: string;
  type: WeaponType;
  rarity: 4 | 5;
  tier: TierGrade;
  iconUrl?: string;
  bestUsers: string[];
  refinementPriority: string;
  notes: string;
}
```

---

## 9. Implementation Roadmap & Milestones

For downstream implementer agents, the work should proceed in the following structured sequence:

1. **Step 1: Install Dependencies & Setup Entry Points**
   - Run `npm install` and install missing packages: `xlsx` and `html-to-image`.
   - Create `src/main.tsx` and `src/App.tsx`.
   - Verify baseline dev server start (`npm run dev`) and clean TypeScript build (`npm run build`).

2. **Step 2: Implement Infographic Card & Export Engine (R1)**
   - Create `src/parsers/spreadsheetParser.ts` for `.xlsx` tab extraction.
   - Create `src/parsers/rawTableParser.ts` for raw table text/tab-delimited parsing.
   - Create `src/components/Infographic/InfographicCard.tsx` strictly replicating `images.jfif`.
   - Create `src/components/Infographic/InfographicGenerator.tsx` with live edit controls, preset selector, and high-res PNG export (`html-to-image`) with clipboard copy.

3. **Step 3: Port and Integrate the Particle ER Calculator (R2)**
   - Create `src/components/ER/ERCalculator.tsx` with all 4 interactive slots, Favonius procs, split funneling, boss margin +15%, and team save/backup management.
   - Implement the `"Transfer to Infographic Card"` bridge button pushing calculated ER targets into the Infographic Card.

4. **Step 4: Build the Version 6.7 Tierlist Portal & Refine Hub (R3)**
   - Create `src/data/tierlistData.ts` with comprehensive 6.7 characters and weapons data.
   - Create `src/components/Tierlist/TierlistPortal.tsx` with interactive tier rows and multi-factor filters (Element, Role, Weapon Type).
   - Update `Header.tsx` and `LandingPage.tsx` to provide smooth, high-legibility "Ametist Clean" navigation across all tools.

5. **Step 5: Verification & End-to-End Build Test**
   - Validate `npm run build` with zero errors.
   - Test spreadsheet parsing on `Sandrone`, `Mavuika`, `Flins` tabs of `Calc Sheet.xlsx`.
   - Test high-res PNG export and clipboard copy without layout shifts or cutoffs.
   - Test ER calculation equivalence against `Calculadora_Recarga_Genshin.html`.

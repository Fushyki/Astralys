# Project: Astralys

## Architecture
- **Framework**: React 18, TypeScript (ES2020/bundler), Vite 5, Tailwind CSS 3
- **Theme**: "Ametist Clean" (Deep amethyst `#080311`, crystal glow `#a855f7`, glassmorphism panels, Cinzel / Plus Jakarta Sans fonts)
- **Data Flow**:
  - `Calc Sheet.xlsx` / raw table -> `spreadsheetParser` / `rawTableParser` -> `InfographicData` model -> `InfographicCard` view
  - `Calculadora_Recarga_Genshin.html` ported logic -> `erEngine.ts` -> `ERCalculator` component -> "Transfer ER" button -> updates `InfographicData.equipment[].erTarget`
  - Version 6.7 tierlist database -> `TierlistPortal` component
  - Global `App.tsx` state connects navigation across Hub, Generator, ER Calculator, and Tierlists

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Spreadsheet (.xlsx) Parser | Client-side .xlsx upload parsing Calc Sheet.xlsx tabs (Sandrone, Mavuika, Flins, etc.) across 4 layout archetypes | M3 | R1, survey |
| F2 | Raw Rotation Table Parser | Ingests pasted table text matching nj2k8acllnah1.png with comma decimals, damage contributions, weapons, artifacts | M3 | R1, survey |
| F3 | 4-Section Infographic Card | Strictly mirrors images.jfif (Carry Header, Left Damage Share bars, Right Equipment builds, Bottom DPS/DPR/Rotation/Watermark) | M4 | R1, survey |
| F4 | Inline Card Editing | Real-time interactive text and number tweaking on the card without re-parsing | M4 | R1, survey |
| F5 | High-Res PNG & Clipboard Export | Client-side PNG export via html-to-image (pixelRatio: 2+) and clipboard copy | M4 | R1, survey |
| F6 | Particle ER Engine (128 chars) | 128 characters, elemental absorption multipliers (3.0/1.8 same, 1.0/0.6 diff), white particle absorption (2.0/1.2), ER needed % | M2 | R2, survey |
| F7 | ER Special Mechanics & Toggles | Favonius procs & recipient, flat energy (Raiden +24 bonus), 8 split funneling modes, burst disabled toggle, +15% boss margin | M2 | R2, survey |
| F8 | Interactive ER Calculator UI | 4-slot team builder, live energy breakdowns, preset teams, local storage save/load, JSON backup import/export | M2 | R2, survey |
| F9 | One-Click ER Target Transfer | Direct button on ER Calculator to send calculated ER targets into Infographic Card character equipment slots | M2, M4 | R2, survey |
| F10 | Premium Hero Page & Hub Dashboard | Stunning Hero showcase (floating infographic card mockup, crystal accents, quick action CTA buttons, punchy overview of Generator, ER Calc, Lunaris sync, Tierlists) + sticky header | M5 | R3, user update |
| F11 | Version 6.7 Tierlist Portal | Interactive character and weapon tierlists for version 6.7 meta with role/element/weapon filters | M5 | R3, survey |
| F12 | App Shell & Clean Build Verification | main.tsx, App.tsx, npm dependencies installed, clean npm run build and npm run dev | M1, M5 | Acceptance, survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Infrastructure Baseline & Core Models | Package dependencies (xlsx, html-to-image), main.tsx, App shell, types/infographic.ts, types/tierlist.ts, characters.ts expansion | none | IN_PROGRESS |
| 2 | Particle ER Engine & UI Component | erEngine.ts verification, ERCalculator.tsx, Favonius, split funneling, flat energy, burst disabled, boss margin, 1-click transfer payload | M1 | PLANNED |
| 3 | Spreadsheet & Raw Table Parser Engine | spreadsheetParser.ts (12 tabs, layouts A-D), rawTableParser.ts (nj2k8acllnah1.png format), unit test validation | M1 | PLANNED |
| 4 | Infographic Card Component & PNG Export | InfographicCard.tsx (4 sections matching images.jfif), inline editing, html-to-image high-res export, clipboard copy | M1, M2, M3 | PLANNED |
| 5 | Premium Hero Hub, 6.7 Tierlists & E2E Pass | Visually stunning Hero Page (floating card mockup, glowing accents, CTAs, punchy capability texts), TierlistPortal.tsx, full app integration, E2E suite pass, clean build & dev | M1, M2, M3, M4 | PLANNED |

## Code Layout
- `src/main.tsx` — Application DOM mount entry point
- `src/App.tsx` — Main application component with tab routing and cross-component state
- `src/types/er.ts` — ER calculation and team configuration types
- `src/types/damage.ts` — Damage calculation and character combat configuration types
- `src/types/infographic.ts` — Infographic card model, equipment, character build, and parser output types
- `src/types/tierlist.ts` — Version 6.7 character and weapon tierlist types
- `src/data/characters.ts` — Complete 128-character database with elements, weapon types, burst costs, particles
- `src/data/presets.ts` — Preset teams for ER calculator and Infographic generator
- `src/data/tierlists67.ts` — Version 6.7 character and weapon rankings, tiers, and notes
- `src/engines/erEngine.ts` — Particle absorption, Favonius, funneling, and ER target calculation engine
- `src/engines/spreadsheetParser.ts` — Heuristic parser for Calc Sheet.xlsx tabs
- `src/engines/rawTableParser.ts` — Regex parser for raw calculation table text
- `src/components/Header.tsx` — Navigation bar with Ametist Clean styling
- `src/components/LandingPage.tsx` — Hub dashboard with quick access cards
- `src/components/ERCalculator.tsx` — Interactive 4-slot particle energy recharge calculator
- `src/components/InfographicCard.tsx` — 4-section infographic rotation card matching images.jfif
- `src/components/InfographicGenerator.tsx` — Generator view with file upload, raw paste, inline editor, and export buttons
- `src/components/TierlistPortal.tsx` — Version 6.7 weapon and character tierlist browser

## Interface Contracts
### `InfographicData` Model Contract
```typescript
export interface InfographicCharacter {
  name: string;
  constellation: string; // e.g. "C0", "C1", "C6"
  element: ElementType; // 'Pyro' | 'Hydro' | 'Cryo' | 'Electro' | 'Anemo' | 'Geo' | 'Dendro'
  damagePercentage: number; // e.g. 52.0 (52%)
  damageRaw?: number; // e.g. 1670225
  weapon: {
    name: string;
    refinement: string; // "R1" - "R5"
  };
  artifact: {
    setName: string;
    erTarget: string; // e.g. "102 ER" or "100 ER"
  };
  mainStats: string; // e.g. "ATK / ATK / CD" or "EM / ATK / CR"
}

export interface InfographicCardData {
  teamName: string; // e.g. "SANDRONE V1" or "Stellar Fortress"
  carryArchetype: string; // e.g. "SANDRONE"
  investmentBadge: string; // e.g. "KQM Investment"
  characters: InfographicCharacter[]; // exactly 4 characters
  metrics: {
    dps: number | string; // e.g. 189100 or "189.1k"
    dpr: number | string; // e.g. 3880000 or "3.88M"
    rotationDurationSeconds?: number; // e.g. 20.5
  };
  rotationNotation: string; // e.g. "(20.5s) Odette EE Yae EEE Qiqi E Sandrone CA E CA EQ CA E"
  watermark: string; // "ASTRALYS"
}
```

### `ERCalculator` -> `InfographicCard` Transfer Contract
```typescript
export interface ERTransferPayload {
  targets: {
    slotIndex: number; // 0 to 3
    characterName: string;
    erTargetPct: number; // e.g. 166.8
    erTargetLabel: string; // e.g. "167 ER"
  }[];
}
```

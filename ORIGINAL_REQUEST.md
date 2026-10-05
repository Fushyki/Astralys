# Original User Request

## Initial Request — 2026-10-02T23:27:18Z

Build "Ametist Impact Suite", a clean, modern, and responsive web application that transforms Genshin Impact theorycrafting spreadsheets (`.xlsx`) and calculation tables into visual infographic rotation cards (matching the layout and structure of `images.jfif`), integrates a particle-based Energy Recharge (ER) calculator ported from `Calculadora_Recarga_Genshin.html`, and provides quick access to version 6.7 tierlists.

Working directory: `C:\Users\dabiv\ametist-impact-suite`
Integrity mode: development

## Reference Resources
- Reference Infographic Card: `C:\Users\dabiv\Downloads\images.jfif`
- Reference Raw Calculation Table: `C:\Users\dabiv\Downloads\nj2k8acllnah1.png`
- Source Theorycrafting Spreadsheet: `C:\Users\dabiv\Downloads\Calc Sheet.xlsx`
- Original ER Calculator Script: `C:\Users\dabiv\Downloads\Calculadora_Recarga_Genshin.html`

## Requirements

### R1. Infographic Card Generator & Spreadsheet Parser
Create an interactive visual tool that allows users to upload an Excel spreadsheet (`.xlsx`, e.g. `Calc Sheet.xlsx`) or enter/paste raw rotation table data (matching `nj2k8acllnah1.png`). The parser must extract character names, damage contribution percentages, weapons (with refinement), artifact sets (with ER targets), main stat lines, DPS, DPR, and rotation sequence text. Render this information into a high-contrast, clean-styled infographic card reproducing the visual structure of `images.jfif` (Carry Header, Left-column Damage Share progress bars, Right-column Equipment builds, and Footer DPS/DPR/Rotation). Include one-click export to high-resolution PNG and copy-to-clipboard functionality.

### R2. Energy Recharge (ER) Calculator Integration
Port and adapt the complete particle-based ER calculator logic from `Calculadora_Recarga_Genshin.html` into a modern component. Support the full roster of 110+ characters, skill particle generation rates, same vs. different element absorption multipliers, Favonius procs, flat energy passives, split funneling (e.g. 50/50), burst disabled toggle, and boss margin (+15%). Provide a direct button to send the calculated ER requirements straight into the Infographic Card.

### R3. Clean Hub & Tierlist Portal
Deliver a lightweight, modern, and aesthetically clean dashboard interface ("Ametist Clean" theme with crisp typography, airy spacing, and high legibility). Include quick-access cards for the Infographic Generator, the ER Calculator, and direct viewing links for version 6.7 weapon/character tierlists.

## Acceptance Criteria

### Visual Fidelity & Export
- [ ] The generated Infographic Card strictly mirrors the 4 sections of `images.jfif`:
  - 1. Top header with character/team name and investment badge
  - 2. Left column with elemental color-coded damage share percentage bars, avatars, and constellations
  - 3. Right column with weapons (R1-R5), artifact sets with ER target tags, and 3-stat main lines
  - 4. Bottom panel with highlighted DPS, DPR, rotation notation string, and suite watermark
- [ ] The card can be edited inline (instant text/number tweaking) and exported to PNG via client-side rendering without cutoffs or CSS distortion.

### Data Extraction Accuracy
- [ ] Parsing `Calc Sheet.xlsx` (tabs such as `Sandrone`, `Mavuika`, or `Flins`) accurately extracts the 4 team members, their respective damage share percentages, weapons, artifacts, and rotation metrics.

### ER Calculation Equivalence
- [ ] Energy recharge requirements calculated in the ER module produce results identical to `Calculadora_Recarga_Genshin.html` for given particle, Favonius, and funneling inputs.
- [ ] One-click action transfers the calculated ER targets into the corresponding character slots on the Infographic Card.

### Code Quality & Build Verification
- [ ] The project builds successfully with `npm run build` without TypeScript or bundle errors.
- [ ] Starts cleanly in development mode with `npm run dev`.


## Follow-up — 2026-10-03T00:32:45Z

Official Project Name Selected by User: "Astralis Suite" (or "Astralis").
Please update all branding, headers, UI components, index.html title, and metadata to use "Astralis Suite" / "Astralis" instead of "Ametist Impact Suite".


## Follow-up — 2026-10-03T00:36:18Z

Final user decision on project branding: "Astralys" (or "Astralys Suite") with a 'y'. Please use "Astralys" across all code, branding, titles, and headers.


## Follow-up — 2026-10-03T00:38:58Z

User Requirement Update for Landing Page:
The user explicitly wants a visually stunning, premium Hero Section ("Hero Page") on the landing dashboard that serves as a beautiful primary showcase:
- High-aesthetic visual presentation (sleek floating mockups of the infographic card, clean typography, glowing crystal accents).
- Objective, punchy texts giving an immediate, clear overview of everything Astralys can do (Spreadsheet to Infographic Generator, Particle-based ER Calculator, Lunaris.moe API sync, and Tierlists).
- Eye-catching showcase with quick action buttons. Ensure this is prioritized in Milestone 4 (Landing Page & Hub).


## Follow-up — 2026-10-03T01:24:25Z

Important branding adjustment from user: The project brand name is strictly "Astralys" (drop "Suite" completely).
Please ensure all headers, watermarks, page titles, cards, and metadata use only "Astralys".

# Handoff Report: Infographic Card Layout, Raw Calculation Table, and Spreadsheet Schema

**Agent**: `spec_miner_survey_card`  
**Date**: 2026-10-02T23:40:00Z  
**Parent Orchestrator**: `e880d348-bc7a-4e2d-87f2-a1595124886f`  
**Type**: Hard (Task Complete)

---

## 1. Observation

Direct observations obtained through visual inspection and automated script execution:

1. **Visual Infographic Card Reference (`C:\Users\dabiv\Downloads\images.jfif`)**:
   - File format: JPEG, dimensions `512 x 599` px (composite 5-card collage).
   - Card 1 Header: `SANDRONE` (bold uppercase serif white text), Subtitle: `KQM Investment` in golden amber (`#FACC15`).
   - Card 1 Left Column (Damage Share): `C0 Sandrone: 52%` (ice-cyan Cryo progress bar), `C0 Qiqi: 1%` (ice-cyan Cryo bar), `C1 Yae: 31%` (lavender Electro bar), `C0 Odette: 16%` (ice-cyan Cryo bar). Sum of percentages = `100%`.
   - Card 1 Right Column (Equipment):
     - Sandrone: `R5 Tidal` | `102 ER Disenchant` | `ATK/ATK/CD`
     - Qiqi: `R5 Favonius` | `100 ER Tenacity` | `ATK/CR`
     - Yae: `R5 Craftable` | `100 ER Disenchant` | `ATK/ATK/CD`
     - Odette: `R1 Traveler Sig` | `100 ER Stella Supp` | `ATK/ATK/CD`
   - Card 1 Bottom Panel:
     - Branding Watermark: `THE GENSHIN SCIENTIST` centered logo.
     - Key Metrics: `DPS: 189.1k | DPR: 3.88M` in bright golden yellow display font.
     - Rotation Sequence: `(20.5s) Odette EE Yae EEE Qiqi E Sandrone CA E CA EQ CA E`.
   - Card 2 (`WRIOTHESLEY`): `C1 Wriothesley: 53%`, `C0 Nicole: 1%`, `C1 Yae: 30%`, `C0 Odette: 16%`. Bottom: `DPS: 181.8k | DPR: 3.73M`, `(20.5s) Odette EE Nicole E Yae EEE Wriothesley E N5C N5C N5 N2/N3C N5C`.
   - Card 3 (`CYNO`): `C1 Cyno: 57%`, `C0 Nicole: 0%`, `C1 Yae: 29%`, `C0 Odette: 14%`. Bottom: `DPS: 162.4k | DPR: 4.17M`, `(25.7s) Odette EE Yae EEE Nicole E Cyno QE N4C N4E (N4C N2E)*3 N1`.
   - Card 4 (`CRYO MC`): `C2 Traveler: 40%`, `C0 Qiqi: 1%`, `C1 Yae: 37%`, `C0 Odette: 22%`. Bottom: `DPS: 156k | DPR: 2.34M`, `(15s) Qiqi E Odette EE Yae EEE Traveler E 2N2C N2 Q N2C`.
   - Card 5 (`MIZUKI`): `C1 Mizuki: 47%`, `C2 Traveler: 29%`, `C1 Sucrose: 1%`, `C0 Odette: 23%`. Bottom: `DPS: 141.6k | DPR: 2.62M`, `(18.5s) Traveler E Odette EE Sucrose Ed Mizuki (Q) E (10s) Sucrose Ed Traveler CA Q`.

2. **Raw Rotation Calculation Table Reference (`C:\Users\dabiv\Downloads\nj2k8acllnah1.png`)**:
   - File format: PNG, dimensions `1856 x 1164` px.
   - Header Row: `Stellar Fortress` | `Total Damage` | `DMG contrib%` | `Artifacts` | `Weapon` | `Wrio combo:`.
   - Rows:
     - `Wrio C0` | `1308604,60` | `45,83%` | `4p Shadow` | `Widsith R5` | `1st rot: N1E 3N5C`
     - `Yae C1` | `1048791,93` | `36,73%` | `4p Shadow` | `7.0 Craftable R5` | `All rots onwards: 3N5C N2`
     - `Odette C0` | `487931,25` | `17,09%` | `4p 7.0 Supp` | `HoD R5`
     - `Nicole C0` | `10239,79` | `0,36%` | `2p2p Atk` | `Flowing Purity R5`
   - Merged Row: `Rotation(17s)` | sequence `Nicole E > Yae EEE > Odette Q/E E > > Wrio Combo`.
   - Metric Rows: `DPR` -> `2855567,58`, `DPS` -> `167974,56`.
   - Footer note: `Assumes 5 field stacks avg`.
   - Banner below table: `WRIOTHESLEY YAE NICOLE ODETTE` | `STC (V1 OF BETA)` | `168K DPS` with 4 chibi character avatars.

3. **Source Theorycrafting Spreadsheet (`C:\Users\dabiv\Downloads\Calc Sheet.xlsx`)**:
   - Sheet Census: `['Inicio', 'Plan Base', 'Nefer', 'Zibai', 'Mavuika', 'Flins', 'Sandrone', 'Mualani', 'Varka', 'Kinich', 'Navia', 'Planilha1']`.
   - Sheet `Sandrone` (Layout A):
     - `B3:E3`: Artifacts (`Disenchant`, `Disenchant`, `Milelith`, `F. Purity`).
     - `B4:E4`: Weapons (`Mailed Flower`, `The Widsith`, `Fav`, `Oathsworn Eye`).
     - `B5:E5`: Characters (`Sandrone`, `Yae`, `Qiqi`, `Nicole`).
     - `B31:E31`: Character damages (`1670225.64`, `701876.41`, `6298.87`, `0`).
     - `B32`: `DMGTotal = 2378400.91`. Formula `=SUM(B31:E31)`.
     - `B33`: `DPS = 108109.13`. Formula `=B32/22`.
     - `B35:L49`: KQM standard 40-roll substat distribution table with Portuguese headers (`Taxa Crítica (CR)`, `Dano Crítico (CD)`, `Recarga (ER)`, etc.).
     - Stat formulas reveal 3-stat lines: `B9: AtkT = B8*(1+E37+24%+18%+46.6%*2+20%)+...` (two 46.6% ATK main stats), `B16: Cd = C37+62.2%+50%` (62.2% Crit DMG Circlet) -> Deduces `ATK/ATK/CD`.
   - Sheet `Flins` (Layout B):
     - `B1:E1`: Artifacts (`Night of the Sky`, `Serenade`, `M Star`, `VV`).
     - `B2:E2`: Weapons (`Bloodsoaked Ruins`, `Nocturnes CC`, `Fractured Halo`, `TTDS`).
     - `B3:E3`: Characters (`Flins`, `Columbina`, `Ineffa`, `Sucrose`).
     - Rows 51-67: Dedicated summary block:
       - `B51: Character | C51: Damage | D51: Weapon (% share) | E51: Weapon (Name) | F51: Artefact Set`.
       - `B52: Flins | C52: =B26 | D52: =((C52+C56)/C58)*100 | E52: =[1]Flins3!B2 | F52: =[1]Flins3!B1`.
       - `B56: Lunar | C56: =B27+B28` (Reaction damage).
       - `B58: DPR | C58: =SUM(C52:C56)` -> `2466028.49`.
       - `B59: ="DPS(" & C67 & ")" | C59: =C58/C67` -> `137001.58`.
       - Rows 61-67: `Character | Time esped`: Columbina: 3s, Ineffa: 3s, Sucrose: 2s, Flins: 10s, Sum = 18s.
   - Sheet `Mavuika` (Layout C):
     - `B1:E1`: Characters (`Mavuika`, `Citlali`, `Iansan`, `Bennett`).
     - `B2:E2`: Weapons (`Blazing Suns`, `TTDS`, `Engulfin`, `Falcão`).
     - `B3:E3`: Artifacts (`Obsidian`, `Instrutor`, `Cinder City`, `Nobless`).
     - Row 55: Summary block `Character | Damage | Percentage | Weapon | Artefact Set`.
     - `B62: DPR` -> `4320744.64`, `B63: DPS(18)` -> `240041.37`.
     - `B54`: Combo string `Q CdcF cdF cdF cdF Combo`.
   - Sheet `Inicio` (Layout D Master Index):
     - Multi-team comparisons containing full team rosters, damage distributions, DPR, DPS, and complete rotation notation strings (`Nefer->Columbina->Lauma->Sucrose->Nefer`, `Durin QE -> Nicole EQ -> Prune EEQ -> Varka E C 4N E 4N E C`, `Kinich Q-> Iansan EQ -> Durin QEE -> Nicole E -> Kinich E 5[E] Combo`).

---

## 2. Logic Chain

1. From Observation 1, the infographic layout consists strictly of 4 distinct sections. The left column conveys relative character damage contribution through elemental color-coded bars, while the right column specifies build parameters (Weapon, Refinement, Artifact Set, ER target, Main stats). This directly dictates the required UI component hierarchy for R1.
2. From Observation 2, theorycrafters record raw data in tabular formats with decimal comma separators, merged rotation duration headers, and combo notation. Supporting both paste-ingestion of this format and instant interactive card rendering fulfills Requirement R1.
3. From Observation 3, across the 12 workbook tabs, row assignments for characters, weapons, and artifacts vary by author preference (e.g., Layout A: Artifacts row 3, Weapons row 4, Characters row 5; Layout B: Artifacts row 1, Weapons row 2, Characters row 3; Layout C: Characters row 1, Weapons row 2, Artifacts row 3). Therefore, a naive parser with hardcoded row numbers will fail. Instead, a heuristic role-detection algorithm matching known character names and weapon names is necessary and sufficient to parse any tab accurately.
4. From Observation 3, stat baseline formulas explicitly include main stat constant values (`46.6%`, `62.2%`, `187`, `58.3%`), allowing the parser to mathematically deduce the 3-stat line (`Sands / Goblet / Circlet`) even when not explicitly labeled in the sheet.
5. From Observation 3, environmental or reaction damage (such as `Lunar`) appears in a separate row and is folded into the carry's percentage contribution formula. The parser must recognize and handle this to avoid missing damage share percentages.

---

## 3. Caveats

1. The reference images include upcoming, beta, or custom characters (e.g., Sandrone, Mavuika, Columbina, Ineffa, Zibai, Nefer, Varka, Durin, Nicole, Odette, Mizuki). The frontend asset resolver must support fallback elemental badges with initials when official character/weapon splash icons are absent.
2. In `Calc Sheet.xlsx`, some cells contain formula errors (`#REF!`, `#DIV/0!`, `#VALUE!`). The parser must sanitize these without throwing runtime exceptions.
3. No other caveats.

---

## 4. Conclusion

The visual and mathematical specifications for the Infographic Card Generator & Spreadsheet Parser are completely mapped and documented in `survey_card_and_sheet.md`.
- **Card UI**: Strictly mirrors `images.jfif` (4 sections, elemental palette, glassmorphism, 2x PNG export, clipboard support, inline editing).
- **Raw Ingestion**: Accurately parses clipboard data matching `nj2k8acllnah1.png` with comma/dot tolerance and regex extraction of constellations/refinements.
- **Spreadsheet Parser**: Employs a robust 2-pass heuristic engine supporting Layouts A, B, C, and D, multi-team column variants (B-E, O-R, AB-AE, AO-AR), and Portuguese/English tc vocabulary.
- **ER Integration**: Seamlessly accepts incoming ER target payloads from the ER calculator (R2) to update the ER badge on the Infographic Card.

---

## 5. Verification Method

1. Inspect `survey_card_and_sheet.md` for full detailed data models, hex codes, typography sizes, and cell mapping tables:
   - File path: `C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\spec_miner_survey_card\survey_card_and_sheet.md`
2. Run test probe script to verify cell addresses and sheet structures:
   - Command: `python .agents\teamwork\spec_miner_survey_card\deep_scan_sheets.py`
3. Invalidation conditions:
   - Any spreadsheet layout failing to extract 4 team members, weapons, artifacts, or DPS/DPR.
   - Any visual element deviating from the 4-section anatomy of `images.jfif`.

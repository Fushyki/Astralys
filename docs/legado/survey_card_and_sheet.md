# Comprehensive Specification Survey: Infographic Rotation Card, Raw Calculation Table, and Theorycrafting Spreadsheet Schema

**Author**: `spec_miner_survey_card`  
**Date**: 2026-10-02T23:35:00Z  
**Target Repository**: `C:\Users\dabiv\ametist-impact-suite`  
**Reference Files Probed**:
1. `C:\Users\dabiv\Downloads\images.jfif` (Visual Infographic Reference)
2. `C:\Users\dabiv\Downloads\nj2k8acllnah1.png` (Raw Calculation Table Reference)
3. `C:\Users\dabiv\Downloads\Calc Sheet.xlsx` (Source Theorycrafting Spreadsheet Reference)
4. `C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\ORIGINAL_REQUEST.md` (System Requirements)

---

## 1. Executive Summary

This survey provides a complete, authoritative specification for the **Infographic Card Generator & Spreadsheet Parser (R1)** of the **Ametist Impact Suite**. The findings are derived from a deep empirical dissection of the reference visual cards (`images.jfif`), the theorycrafter raw calculation table (`nj2k8acllnah1.png`), and the 12-sheet Excel theorycrafting model (`Calc Sheet.xlsx`).

Key conclusions:
1. **Visual Card Anatomy (`images.jfif`)**: Comprises 4 distinct, highly structured sections: (1) Header with Carry title & Investment badge; (2) Left Column with elemental color-coded damage share progress bars and character constellations; (3) Right Column with equipment builds (Weapons R1-R5, Artifact sets, ER target tags, and 3-stat main lines `Sands / Goblet / Circlet`); and (4) Bottom Panel with highlighted DPS/DPR numbers, standardized rotation notation strings, and suite branding.
2. **Raw Table Format (`nj2k8acllnah1.png`)**: Provides the exact schema used by theorycrafters to summarize team damage distributions, rotation timings, weapons, artifact sets, and assumptions before graphic rendering. Uses European/Brazilian comma decimal formatting (`45,83%`), merged rotation rows, and combo syntax.
3. **Theorycrafting Spreadsheet Schema (`Calc Sheet.xlsx`)**: Contains 12 sheets exhibiting 4 structural layout patterns across multiple team columns (Team 1 cols B-E, Team 2 cols O-R, Team 3 cols AB-AE, Team 4 cols AO-AR). It features KQM standard substat roll matrices (40-45 rolls), talent damage formulas, dedicated summary blocks (`Character | Damage | Percentage | Weapon | Artefact Set`), and a master index sheet (`Inicio`) with full rotation strings and multi-team comparisons.

---

## 2. Visual Infographic Card Specification (`images.jfif`)

### 2.1 Visual Anatomy & Section-by-Section Breakdown

The reference file `images.jfif` (512x599 collage containing 5 cards: Sandrone, Wriothesley, Cyno, Cryo MC, Mizuki) defines the standard presentation format. Each individual card is divided into 4 vertically stacked sections:

```
+---------------------------------------------------------------+
|                      SECTION 1: HEADER                        |
|                     [CARRY CHARACTER / TEAM]                  |
|                      [KQM Investment Badge]                   |
+-------------------------------+-------------------------------+
|      SECTION 2: LEFT COL      |      SECTION 3: RIGHT COL     |
|         DAMAGE SHARE          |       EQUIPMENT & BUILDS      |
| [Elem Icon][Avatar][C# Name]  | [Wpn Icon R#] [Art Icon ER#]  |
| [==== Progress Bar ====] %    |      [Sands / Goblet / Circ]  |
| (Repeated for 4 characters)   |   (Repeated for 4 characters) |
+-------------------------------+-------------------------------+
|                  SECTION 4: FOOTER / BOTTOM PANEL             |
|                       [Suite Branding Logo]                   |
|                   DPS: XXX.Xk  |  DPR: X.XXM                  |
|    (Duration) [Char] [Actions] > [Char] [Actions] ...         |
+---------------------------------------------------------------+
```

#### Section 1: Header (Carry & Investment)
- **Carry Character / Team Title**:
  - Centered bold uppercase serif or high-contrast display typography (e.g. `SANDRONE`, `WRIOTHESLEY`, `CYNO`, `CRYO MC`, `MIZUKI`).
  - Text color: `#FFFFFF` (Pure White) with subtle elemental drop shadow.
  - Font size: `24px` - `28px` (responsive rem equivalent `1.5rem` - `1.75rem`), letter-spacing `0.05em`.
- **Investment Tier / Archetype Badge**:
  - Positioned directly beneath the title.
  - Text: e.g. `KQM Investment`, `High Investment`, `C0 5★ / C6 4★`, or custom tier.
  - Text color: `#FACC15` / `#F59E0B` (Vibrant Gold/Amber).
  - Font size: `12px` - `13px` (`0.8rem`), font-weight 600, letter-spacing `0.08em`.
- **Background Aura**:
  - Soft radial gradient glow matching the carry character's primary element centered at the top header.

#### Section 2: Left Column (Damage Share Breakdown)
- **Column Header**:
  - Title: `Damage Share` in muted slate `#94A3B8` / `#A5F3FC`, uppercase/small-caps, font-size `13px`, font-weight 600.
- **4 Character Rows**:
  - Vertically stacked with `12px` - `16px` vertical gaps, aligned row-by-row with the right equipment column.
  - Each character row includes:
    1. **Elemental Glyph**: Small circular icon representing the element (Cryo, Electro, Pyro, Hydro, Anemo, Geo, Dendro) placed adjacent to the portrait.
    2. **Character Avatar / Portrait**:
       - Circular or squircle frame (`36px` to `44px` diameter).
       - Thin border matching the element color or soft white border (`rgba(255,255,255,0.2)`).
       - Displays official Genshin character avatar or chibi art.
    3. **Constellation Tag & Character Name**:
       - e.g., `C0 Sandrone`, `C0 Qiqi`, `C1 Yae`, `C0 Odette`, `C1 Wriothesley`, `C0 Nicole`, `C2 Traveler`, `C1 Sucrose`, `C1 Mizuki`.
       - Constellation prefix (`C0` - `C6`): Bold high-contrast white `#FFFFFF`, font-size `13px` - `14px`.
       - Character Name: High contrast white or pale elemental tint `#F8FAFC`, font-weight 600.
    4. **Damage Share Horizontal Progress Bar**:
       - Height: `18px` to `22px`.
       - Background track: Translucent dark slate `rgba(15, 23, 42, 0.7)` with `4px` border radius.
       - Fill bar: Vibrant solid/soft-gradient colored by character's element (see color tokens in Section 2.2).
       - Percentage text: Bold numeric text (e.g. `52%`, `1%`, `31%`, `16%`, `53%`, `57%`, `40%`, `47%`) positioned to the right of the bar or inside the bar with high contrast.
       - Total sum of all 4 percentages equals `100%`.

#### Section 3: Right Column (Equipment & Builds)
For each of the 4 characters, exactly aligned horizontally with the corresponding damage share row:
1. **Weapon Card**:
   - Square container (`36px` x `36px` to `42px` x `42px`), rounded corners (`6px`).
   - Weapon icon image.
   - **Refinement Badge**: Dark pill badge in top-left or bottom-left corner with white text: `R1`, `R2`, `R3`, `R4`, `R5` (font-size `10px`, bold).
   - **Weapon Name**: Displayed compactly underneath or beside the icon (e.g. `Tidal`, `Favonius`, `Craftable`, `Traveler Sig`, `Widsith`, `Purity`, `Kagura`, `HoD`, `Atlas`, `Serpent Spine`).
2. **Artifact Set Card**:
   - Square container (`36px` x `36px` to `42px` x `42px`), artifact set icon with golden/amber background frame.
   - **ER Target Badge / Tag**:
     - High-contrast pill badge positioned in the top-right corner of the artifact card.
     - Text: e.g. `102 ER`, `100 ER`, `120 ER`, `140 ER`, `180 ER`.
     - Styling: Dark background `rgba(0,0,0,0.7)` or elemental accent border, font-size `10px`, font-weight 700, text `#FFFFFF` or `#FDE047`.
   - **Artifact Set Name**: Displayed compactly underneath (e.g. `Disenchant`, `Tenacity`, `Stella Supp`, `Purity`, `Shadow`, `VV`, `Instrutor`, `Cinder City`, `Nobless`, `Deep Wood`).
3. **Main Stat Line (`Sands / Goblet / Circlet`)**:
   - Positioned directly beneath the weapon and artifact icons.
   - Compact 3-stat abbreviation line:
     - Examples from reference:
       - `ATK/ATK/CD` (ATK% Sands / ATK% Goblet / Crit DMG Circlet)
       - `ATK/CR` (ATK% Sands / Crit Rate Circlet)
       - `EM/ATK/CR` (EM Sands / ATK% Goblet / Crit Rate Circlet)
       - `ATK/ATK/CR` (ATK% Sands / ATK% Goblet / Crit Rate Circlet)
       - `EM/EM/EM` (Full EM Sucrose)
       - `ER/ATK/CR` (Favonius support)
   - Styling: Crisp condensed typography, font-size `10px` - `11px`, font-weight 600, color `#CBD5E1` (slate-300).

#### Section 4: Footer / Bottom Panel (Metrics & Rotation)
1. **Branding Watermark**:
   - Centered above or below the metric lines.
   - Reference image displays `THE GENSHIN SCIENTIST` logo in white/silver.
   - In Ametist Impact Suite: Suite watermark `AMETIST IMPACT SUITE | THEORYCRAFTING` with customizable user tag/handle.
2. **Key Metric Highlight Line**:
   - Centered or high-visibility split line:
     - `DPS: [Value] | DPR: [Value]`
     - Examples from reference:
       - `DPS: 189.1k | DPR: 3.88M` (Sandrone)
       - `DPS: 181.8k | DPR: 3.73M` (Wriothesley)
       - `DPS: 162.4k | DPR: 4.17M` (Cyno)
       - `DPS: 156k | DPR: 2.34M` (Cryo MC)
       - `DPS: 141.6k | DPR: 2.62M` (Mizuki)
     - Styling: Bold display font, font-size `18px` - `22px` (`1.2rem` - `1.4rem`), color `#FDE047` / `#FACC15` (Bright Golden Yellow), separator in muted white/gray `|`.
3. **Rotation Notation Sequence String**:
   - Multi-character action timeline in standard Genshin TC notation:
   - Structure: `(Duration) [Character1 Actions] > [Character2 Actions] > ...`
   - Examples from reference:
     - `(20.5s) Odette EE Yae EEE Qiqi E Sandrone CA E CA EQ CA E`
     - `(20.5s) Odette EE Nicole E Yae EEE Wriothesley E N5C N5C N5 N2/N3C N5C`
     - `(25.7s) Odette EE Yae EEE Nicole E Cyno QE N4C N4E (N4C N2E)*3 N1`
     - `(15s) Qiqi E Odette EE Yae EEE Traveler E 2N2C N2 Q N2C`
     - `(18.5s) Traveler E Odette EE Sucrose Ed Mizuki (Q) E (10s) Sucrose Ed Traveler CA Q`
   - Styling: High contrast `#F1F5F9`, font-size `11px` - `13px`, font-family `ui-monospace, SFMono-Regular, Menlo, monospace`, line-height `1.4`. Character names can be subtly accented with elemental hues.

---

### 2.2 Styling Parameters & Color Palette

#### Elemental Color Tokens (Reference Matched)
| Element | Hex Primary | Hex Secondary / Tint | Progress Bar Fill | Accent Glow |
|---------|-------------|----------------------|-------------------|-------------|
| **Cryo** | `#77C8D5` | `#A0E6FF` | `#86E2F7` | `rgba(119, 200, 213, 0.4)` |
| **Electro** | `#C280D8` | `#E0B0FF` | `#BA7FD8` | `rgba(194, 128, 216, 0.4)` |
| **Pyro** | `#FF6B5E` | `#FFA07A` | `#FF6F61` | `rgba(255, 107, 94, 0.4)` |
| **Hydro** | `#3B82F6` | `#60A5FA` | `#48A8FF` | `rgba(59, 130, 246, 0.4)` |
| **Anemo** | `#52D8A6` | `#7EF3C9` | `#52E3B1` | `rgba(82, 216, 166, 0.4)` |
| **Geo** | `#EAB308` | `#FDE047` | `#F59E0B` | `rgba(234, 179, 8, 0.4)` |
| **Dendro** | `#84CC16` | `#BEF264` | `#84CC16` | `rgba(132, 204, 22, 0.4)` |

#### Background & Glassmorphism Theme
- **Main Canvas**: Dark oceanic slate: `linear-gradient(180deg, #0b1320 0%, #080c14 100%)`.
- **Card Panel Container**: `background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.6)`.
- **Inner Slots / Tracks**: `background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 6px`.

#### Typography Hierarchy
- **Header Title**: Serif or Semi-Serif Display (`Cinzel`, `Playfair`, `Georgia`, or Bold `Inter`), `700`, `24px`, tracking `0.05em`.
- **Badges**: Sans-serif (`Inter`, `system-ui`), `700`, `11px` - `12px`, tracking `0.08em`, uppercase.
- **Section Headers**: Sans-serif, `600`, `13px`, text-transform `uppercase`, tracking `0.04em`.
- **Character / Constellation**: Sans-serif, `600`, `13px`.
- **Percentages & Numbers**: Tabular numbers (`font-variant-numeric: tabular-nums`), `700`, `13px`.
- **Metrics (DPS/DPR)**: Bold sans-serif or display, `800`, `20px`.
- **Rotation Text**: Monospace or clean Sans-serif, `500`, `12px`, tracking `0.02em`.

#### Card Dimensions & Export Specifications
- **Single Card Aspect Ratio**: Approximately `3:4` or `4:5` (recommended responsive base: `640px` wide x `880px` tall).
- **Collage Grid**: 2 columns on desktop (or 3 columns for multi-variant comparisons), responsive 1 column on mobile.
- **Export Resolution**: Client-side canvas export at `2x` device pixel ratio (`1280px` x `1760px`) and optional `3x` ultra-res (`1920px` x `2640px`) to guarantee pin-sharp text, crisp avatars, and no distortion.
- **Export Format**: PNG 24-bit with alpha channel, plus instant `Copy Image to Clipboard` (via `navigator.clipboard.write([new ClipboardItem({'image/png': blob})])`).

---

## 3. Raw Calculation Table Specification (`nj2k8acllnah1.png`)

### 3.1 Structure of Raw Rotation Calculation Table

`nj2k8acllnah1.png` (1856x1164) is an exact capture of a spreadsheet-rendered rotation calculation table.

```
+-------------------+-----------------+---------------+---------------+---------------------+--------------------+
| Stellar Fortress  |  Total Damage   | DMG contrib%  |   Artifacts   |       Weapon        |     Wrio combo:    |
+-------------------+-----------------+---------------+---------------+---------------------+--------------------+
| Wrio C0           |   1308604,60    |    45,83%     | 4p Shadow     | Widsith R5          | 1st rot: N1E 3N5C  |
| Yae C1            |   1048791,93    |    36,73%     | 4p Shadow     | 7.0 Craftable R5    | All rots onwards:  |
| Odette C0         |    487931,25    |    17,09%     | 4p 7.0 Supp   | HoD R5              | 3N5C N2            |
| Nicole C0         |     10239,79    |     0,36%     | 2p2p Atk      | Flowing Purity R5   |                    |
+-------------------+-----------------+---------------+---------------+---------------------+--------------------+
|                   |                 |               Rotation(17s)                                              |
+-------------------+-----------------+--------------------------------------------------------------------------+
| DPR               |   2855567,58    | Nicole E > Yae EEE > Odette Q/E E > > Wrio Combo                         |
| DPS               |    167974,56    |                                                                          |
+-------------------+-----------------+--------------------------------------------------------------------------+
| Assumes 5 field stacks avg          |                                                                          |
+-------------------------------------+--------------------------------------------------------------------------+
```

Beneath the table:
- **Title Banner**: `WRIOTHESLEY YAE NICOLE ODETTE` (Color coded characters: Wriothesley=Cryo Blue, Yae=Electro Pink, Nicole=Pyro Peach, Odette=Hydro Blue).
- **Status Tag**: `STC (V1 OF BETA)` (Subject to change / version banner).
- **Highlight Metric**: `168K DPS` (Large bold font).
- **Character Artwork Row**: Horizontal line of 4 Chibi character avatars.

### 3.2 Field & Column Specifications

1. **Header Row**:
   - `Column 1`: Team Archetype / Variation Name (`Stellar Fortress`) or `Character`.
   - `Column 2`: Total Damage Output (Numeric with 2 decimals).
   - `Column 3`: `DMG contrib%` (Damage Contribution Percentage).
   - `Column 4`: `Artifacts` (Artifact set specification, e.g. `4p Shadow`, `4p 7.0 Supp`, `2p2p Atk`).
   - `Column 5`: `Weapon` (Weapon name with refinement, e.g. `Widsith R5`, `7.0 Craftable R5`, `HoD R5`, `Flowing Purity R5`).
   - `Column 6`: Action Combo / Notes (`Wrio combo:`).
2. **Character Data Rows (4 rows)**:
   - Row 1: `Wrio C0` | `1308604,60` | `45,83%` | `4p Shadow` | `Widsith R5` | `1st rot: N1E 3N5C`
   - Row 2: `Yae C1` | `1048791,93` | `36,73%` | `4p Shadow` | `7.0 Craftable R5` | `All rots onwards: 3N5C N2`
   - Row 3: `Odette C0` | `487931,25` | `17,09%` | `4p 7.0 Supp` | `HoD R5`
   - Row 4: `Nicole C0` | `10239,79` | `0,36%` | `2p2p Atk` | `Flowing Purity R5`
3. **Summary & Metric Rows**:
   - Merged Header: `Rotation(17s)` -> Duration = `17s`.
   - DPR Row: Key `DPR` | Value `2855567,58` | Sequence `Nicole E > Yae EEE > Odette Q/E E > > Wrio Combo`.
   - DPS Row: Key `DPS` | Value `167974,56` (= `2855567,58 / 17`).
   - Assumptions Row: `Assumes 5 field stacks avg`.

### 3.3 Raw Table Ingestion & Text Paste Requirements

Users frequently copy-paste this table directly from Excel, Discord, Google Sheets, or web forums. The parser must support:
1. **Delimiters**: Tab (`\t`), comma (`,`), semicolon (`;`), and multiple whitespace/pipes (`|`).
2. **Number Formats**:
   - European/Brazilian format: Comma decimals (`1308604,60`, `45,83%`).
   - US/Standard format: Dot decimals (`1308604.60`, `45.83%`).
   - Thousands separators: dots or commas (`1.308.604,60` or `1,308,604.60`).
3. **Constellation Extraction**:
   - Regex: `/\b([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(C[0-6])\b/i` or `/\b(C[0-6])\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b/i`.
   - Extracts character name and constellation level (defaults to `C0` if omitted).
4. **Weapon & Refinement Extraction**:
   - Regex: `/(.*?)\s+(R[1-5])\b/i` or `/\b(R[1-5])\s+(.*)/i` or `/(.*?)\s*\((R[1-5])\)/i`.
   - Extracts weapon name and refinement level (defaults to `R1` or `R5` if omitted).
5. **Rotation & Duration Extraction**:
   - Regex: `/(?:Rotation|Rot)\s*(?:\(?\s*(\d+(?:\.\d+)?)\s*s?\s*\)?)?/i`.
   - Extracts rotation time (e.g. `17s` -> `17`) and rotation sequence string.

---

## 4. Theorycrafting Spreadsheet Schema & Parser (`Calc Sheet.xlsx`)

### 4.1 Workbook Architecture & Sheet Census

The reference workbook `Calc Sheet.xlsx` contains 12 sheets:

| Sheet Name | Dimensions (Rows x Cols) | Category / Archetype | Primary Carry / Focus | Structure Layout Type |
|------------|--------------------------|----------------------|-----------------------|-----------------------|
| `Inicio` | 120 x 27 | Master Summary / Index | Multi-Team Comparisons | Layout D (Master Index) |
| `Plan Base` | 68 x 12 | Template / Scratch | Blank Formula Model | Scratch / Template |
| `Nefer` | 140 x 25 | Character TC Sheet | Nefer (Dendro/Lunar) | Layout B (Summary Block) |
| `Zibai` | 225 x 31 | Character TC Sheet | Zibai (Geo/Lunar) | Layout B (Summary Block) |
| `Mavuika` | 221 x 38 | Character TC Sheet | Mavuika (Pyro Carry) | Layout C (Summary Block) |
| `Flins` | 137 x 38 | Character TC Sheet | Flins (Electro/Lunar) | Layout B (Summary Block) |
| `Sandrone` | 152 x 47 | Character TC Sheet | Sandrone (Cryo Carry) | Layout A (Direct Calc) |
| `Mualani` | 125 x 25 | Character TC Sheet | Mualani (Hydro Vaporize) | Layout B (Summary Block) |
| `Varka` | 135 x 39 | Character TC Sheet | Varka (Anemo/Pyro) | Layout B (Summary Block) |
| `Kinich` | 66 x 51 | Character TC Sheet | Kinich (Dendro Burning) | Layout C (Summary Block) |
| `Navia` | 52 x 12 | Character TC Sheet | Navia (Geo Crystallize) | Layout B (Direct Calc) |
| `Planilha1` | 32 x 25 | Stat Test Sheet | Skirk Stat Rolls | Substat Scratchpad |

---

### 4.2 Structural Layout Patterns Across Sheets

Through comprehensive script inspection of rows, columns, and formulas, 4 layout archetypes have been identified:

#### Layout A: Direct Calculation Model (e.g. `Sandrone`)
- **Row 3**: Artifact Sets across columns:
  - Team 1 (Cols B-E): `B3: Disenchant`, `C3: Disenchant`, `D3: Milelith`, `E3: F. Purity`
  - Team 2 (Cols O-R): `O3: Disenchant`, `P3: Disenchant`, `Q3: Milelith`, `R3: F. Purity`
- **Row 4**: Weapons:
  - Team 1: `B4: Mailed Flower`, `C4: The Widsith`, `D4: Fav`, `E4: Oathsworn Eye`
  - Team 2: `O4: Tidal Shadow`, `P4: Kagura`, `Q4: Fav`, `R4: Oathsworn Eye`
- **Row 5**: Character Names:
  - Team 1: `B5: Sandrone`, `C5: Yae`, `D5: Qiqi`, `E5: Nicole`
  - Team 2: `O5: Sandrone`, `P5: Yae`, `Q5: Qiqi`, `R5: Nicole`
- **Rows 6 - 20**: Stat Calculations (Hp, HpT, Atk, AtkT, Em, Def, Cr, Cd, Cm, Bdmg).
- **Rows 22 - 29**: Hit-by-hit talent formulas (e.g. `PewPew`, `Cryo Beam`, `Stellar Beam`, `ECryo`, `EStellar`, `Qbombard`, `QCryo`, `QStellar`).
- **Row 31**: Character Damage row:
  - Team 1: `B31: 1670225.64` (Sandrone), `C31: 701876.41` (Yae), `D31: 6298.87` (Qiqi), `E31: 0` (Nicole).
  - Formula: `=SUM(B22:B29)`.
- **Row 32**: Total DPR row:
  - Team 1: `A32: DMGTotal`, `B32: 2378400.91`. Formula: `=SUM(B31:E31)`.
- **Row 33**: DPS row:
  - Team 1: `A33: DPS`, `B33: 108109.13`. Formula: `=B32/22` (Rotation = 22s).
- **Rows 35 - 49**: KQM 40-roll substat table:
  - Headers: `Taxa Crítica (CR)`, `Dano Crítico (CD)`, `Proficiência (EM)`, `ATK`, `HP`, `DEF`, `Recarga (ER)`, `ATK (flat)`, `HP (flat)`, `DEF (Flat)`, `total`.
  - Row 36: Sandrone rolls: CR: 10, CD: 10, EM: 5, ATK: 5, HP: 0, DEF: 2, ER: 2... Total = 40.
  - Row 37: Substat values: ER = `0.11` (11% bonus -> 111% ER).
  - Row 44: Qiqi rolls: ER = 6 -> `0.33` (33% bonus -> 133% ER).
  - Row 48: Nicole rolls: ER = 8 -> `0.44` (44% bonus -> 144% ER).
- **Subsequent Variations**:
  - Rows 51-90: SANDRONE V2 (cols B-E, O-R, AB-AE).
  - Rows 101-140: SANDRONE V3 (cols B-E, O-R, AB-AE).

#### Layout B: Standard Summary Block Model (e.g. `Flins`, `Nefer`, `Zibai`, `Varka`, `Mualani`)
- **Row 1**: Artifact Sets (e.g. `Flins`: `B1: Night of the Sky`, `C1: Serenade`, `D1: M Star`, `E1: VV`).
- **Row 2**: Weapons (e.g. `Flins`: `B2: Bloodsoaked Ruins`, `C2: Nocturnes CC`, `D2: Fractured Halo`, `E2: TTDS`).
- **Row 3**: Character Names (e.g. `Flins`: `B3: Flins`, `C3: Columbina`, `D3: Ineffa`, `E3: Sucrose`).
- **Rows 4 - 30**: Formulas for stats, multipliers, talent hits.
- **Dedicated Summary Block** (Rows ~50 - 65):
  - **Header Row**: `Character | Damage | Percentage (or Weapon) | Weapon | Artefact Set`
    - In `Flins` row 51: `B51: Character | C51: Damage | D51: Weapon (% share) | E51: Weapon (Name) | F51: Artefact Set`
    - In `Mualani` row 46: `B46: Character | C46: Damage | D46: Percentage | E46: Weapon | F46: Artefact Set`
    - In `Varka` row 52: `B52: Character | C52: Damage | D52: Percentage | E52: Weapon | F52: Artefact Set`
    - In `Nefer` row 53: `B53: Character | C53: Damage | D53: Percentage | E53: Weapon | F53: Artefact Set`
    - In `Zibai` row 55: `B55: Zibai Premium`, Row 58: Summary Table.
  - **4 Character Rows**:
    - Character 1: Name, Total Damage, Damage % Share (`=(C_row / DPR_row) * 100`), Weapon, Artifact.
    - Character 2: Name, Total Damage, Damage % Share, Weapon, Artifact.
    - Character 3: Name, Total Damage, Damage % Share, Weapon, Artifact.
    - Character 4: Name, Total Damage, Damage % Share, Weapon, Artifact.
  - **Environmental / Reaction Row** (Optional):
    - `Lunar`: Reaction damage pool (e.g. `Flins B56: Lunar | C56: 678517.42`). In the damage % formula, this is folded into the carry's contribution: `Flins D52 = ((C52 + C56) / C58) * 100`.
  - **DPR Row**:
    - `DPR | [Sum of Character Damages]` (e.g. `Flins C58: 2466028.49`, `Varka C58: 3909363.64`).
  - **DPS Row**:
    - `DPS([Duration]) | [DPS value]` (e.g. `Flins B59: DPS(18) | C59: 137001.58`).
  - **Time Spent Table (`Time esped`)**:
    - Character-by-character active field duration:
      - e.g. `Columbina: 3s`, `Ineffa: 3s`, `Sucrose: 2s`, `Flins: 10s` -> Sum = `18s`.

#### Layout C: Inverted Header Summary Model (e.g. `Mavuika`, `Kinich`)
- **Row 1**: Character Names:
  - `Mavuika`: `B1: Mavuika`, `C1: Citlali`, `D1: Iansan`, `E1: Bennett`.
  - `Kinich`: `B1: Kinich`, `C1: Iansan`, `D1: Durin`, `E1: Nicole`.
- **Row 2**: Weapons:
  - `Mavuika`: `B2: Blazing Suns`, `C2: TTDS`, `D2: Engulfin`, `E2: Falcão`.
  - `Kinich`: `B2: Fang of the MKing`, `C2: Engulfin`, `D2: Arthemis`, `E2: TTDS`.
- **Row 3**: Artifact Sets:
  - `Mavuika`: `B3: Obsidian`, `C3: Instrutor`, `D3: Cinder City`, `E3: Nobless`.
  - `Kinich`: `B3: Obsidian`, `C3: Scroll`, `D3: Deep Wood`, `E3: Celestial Gift`.
- **Summary Block**:
  - `Mavuika` Row 55: `B55: Character | C55: Damage | D55: Percentage | E55: Weapon | F55: Artefact Set`.
  - `Kinich` Row 51: `B51: Character | C51: Damage | D51: Percentage | E51: Weapon | F51: Artefact Set`.
  - DPR Row: `Mavuika B62: DPR | C62: 4320744.64`, `Kinich B57: DPR | C57: 3942174.13`.
  - DPS Row: `Mavuika B63: DPS(18) | C63: 240041.37`, `Kinich B58: DPS(20) | C58: 197108.71`.
  - Combo cell: `Mavuika B54: Q CdcF cdF cdF cdF Combo`.

#### Layout D: Master Summary Index (`Inicio`)
- Dedicated sheet compiling team variants across 4 columns each:
  - `C8 - G16`: Zibai Premium (Columbina, Lynnea, Illuga) -> `DPR: 4.25M`, `DPS(18): 236k`.
  - `C18 - G28`: Mavuika Iansan -> Rotation `Q CccF cdF cdF cdF Combo 6xMelt` -> `DPR: 4.40M`, `DPS(18): 244.5k`.
  - `C30 - G41`: Flins Premium -> `DPR: 3.84M`, `DPS(18): 213k`.
  - `C43 - G53`: Nefer Sucrose -> Rotation `Nefer->Columbina->Lauma->Sucrose->Nefer` -> `DPR: 4.05M`, `DPS(18): 225k`.
  - `C55 - G65`: Mualani Hex -> Rotation `Mualani N1 -> Mavuika QE -> Mona Q 2N -> Sucrose E N1 Mualani E3 Q E3` -> `DPR: 3.34M`, `DPS(16): 208.9k`.
  - `C67 - G77`: Varka Premium -> Rotation `Durin QE -> Nicole EQ -> Prune EEQ -> Varka E C 4N E 4N E C` -> `DPR: 3.91M`, `DPS(20): 195.5k`.
  - `C79 - G89`: Kinich Hex Iansan -> Rotation `Kinich Q-> Iansan EQ -> Durin QEE -> Nicole E -> Kinich E 5[E] Combo` -> `DPR: 3.94M`, `DPS(20): 197.1k`.

---

### 4.3 Multi-Team Column Groups

Every character sheet provides 2 to 4 side-by-side team configurations:
- **Team Variant 1**: Columns `B, C, D, E` (Col indices 2, 3, 4, 5).
- **Team Variant 2**: Columns `O, P, Q, R` (Col indices 15, 16, 17, 18).
- **Team Variant 3**: Columns `AB, AC, AD, AE` (Col indices 28, 29, 30, 31).
- **Team Variant 4**: Columns `AO, AP, AQ, AR` (Col indices 41, 42, 43, 44).

Between team column groups, columns F-N, S-AA, AF-AN contain:
- Row labels for stat properties (`Hp`, `Atk`, `AtkT`, `Em`, `Cr`, `Cd`, `Cm`, `Bdmg`).
- Talent damage formula breakdowns.
- Substat roll quota allocations.

---

### 4.4 Exact Cell Mapping & Address Reference Table

| Character Sheet | Team Slot | Characters Cell Range | Weapons Cell Range | Artifacts Cell Range | Damage Share % Range | DPR Cell | DPS Cell | Rotation String Cell |
|-----------------|-----------|-----------------------|--------------------|----------------------|----------------------|----------|----------|----------------------|
| **Sandrone** | Team 1 | `B5:E5` | `B4:E4` | `B3:E3` | Calc: `B31:E31 / B32` | `B32` (`2.38M`) | `B33` (`108.1k`) | `(20.5s) Odette EE Yae EEE Qiqi E Sandrone CA E CA EQ CA E` (Card) |
| **Sandrone** | Team 2 | `O5:R5` | `O4:R4` | `O3:R3` | Calc: `O31:R31 / O32` | `O32` (`2.59M`) | `O33` (`117.6k`) | `(20.5s) Odette EE Yae EEE Qiqi E Sandrone CA E CA EQ CA E` |
| **Mavuika** | Team 1 | `B1:E1` | `B2:E2` | `B3:E3` | `D56:D59` | `C62` (`4.32M`) | `C63` (`240.0k`) | `B54` (`Q CdcF cdF cdF cdF Combo`) |
| **Mavuika** | Team 2 | `O1:R1` | `O2:R2` | `O3:R3` | `Q56:Q59` | `P62` (`3.80M`) | `P63` (`211.1k`) | `O54` (`Q CdcF cdF cdF cdF Combo`) |
| **Flins** | Team 1 | `B3:E3` | `B2:E2` | `B1:E1` | `D52:D55` | `C58` (`2.47M`) | `C59` (`137.0k`) | `Inicio C32` (`E (big)Q5N EQ 5N EQ`) |
| **Flins** | Team 2 | `O3:R3` | `O2:R2` | `O1:R1` | `Q52:Q55` | `P58` (`4.43M`) | `P59` (`221.7k`) | `C67` Duration = `18s` |
| **Zibai** | Team 1 | `B3:E3` | `B2:E2` | `B1:E1` | `D59:D62` | `C65` (`4.25M`) | `C66` (`236.0k`) | `A22` / `Inicio C7` |
| **Zibai** | Team 2 | `R3:U3` | `R2:U2` | `R1:U1` | `T59:T62` | `S65` (`4.10M`) | `S66` (`227.9k`) | `Q22` |
| **Nefer** | Team 1 | `B3:E3` | `B2:E2` | `B1:E1` | `D54:D57` | `C60` (`4.05M`) | `C61` (`225.0k`) | `Inicio C45` (`Nefer->Columbina->Lauma->Sucrose->Nefer`) |
| **Varka** | Team 1 | `B3:E3` | `B2:E2` | `B1:E1` | `D53:D56` | `C58` (`3.91M`) | `C59` (`195.5k`) | `B51` (`Durin QE -> Nicole EQ -> Prune EEQ -> Varka E C 4N E 4N E C`) |
| **Kinich** | Team 1 | `B1:E1` | `B2:E2` | `B3:E3` | `D52:D55` | `C57` (`3.94M`) | `C58` (`197.1k`) | `Inicio C81` (`Kinich Q-> Iansan EQ -> Durin QEE -> Nicole E -> Kinich E 5[E] Combo`) |
| **Mualani** | Team 1 | `B3:E3` | `B2:E2` | `B1:E1` | `D47:D50` | `C53` (`3.05M`) | `C54` (`190.9k`) | `B45` (`Mualani N1 -> Mavuika QE -> Mona Q 2N -> Sucrose E N1 Mualan`) |

---

### 4.5 Derivation of Main Stats & ER Targets from Sheet Formulas

#### 1. Main Stats Formula Fingerprinting (`Sands / Goblet / Circlet`):
Theorycrafters do not write "ATK Sands" explicitly in a separate cell; rather, the main stat values are embedded into character stat baseline formulas:
- **ATK% Sands / Goblet**: Formula in `AtkT` contains `+46.6%` (e.g. `Sandrone B9` has `46.6%*2` = ATK Sands + ATK Goblet).
- **HP% Sands / Goblet**: Formula in `HpT` contains `+46.6%`.
- **DEF% Sands / Goblet**: Formula in `DefT` contains `+58.3%`.
- **EM Sands**: Formula in `Em` contains `+187` (e.g. `Mavuika B8 = D38 + 187 + 120`).
- **Elemental DMG Goblet**: Formula in `Bdmg` contains `+46.6%` (e.g. `Mavuika B16 = 1 + (... + 46.6%)`, `Varka B10 = 1 + (46.6% + ...)`).
- **Crit Rate Circlet**: Formula in `Cr` contains `+31.1%`.
- **Crit DMG Circlet**: Formula in `Cd` contains `+62.2%` (e.g. `Sandrone B16 = C37 + 62.2% + 50%`, `Mavuika B14 = C38 + 62.2% + ...`).
- **Healing Bonus Circlet**: Contains `+35.9%`.

**Deduction Logic for Parser**:
```typescript
function deduceMainStats(statFormulas: { atk?: string, hp?: string, em?: string, def?: string, cd?: string, cr?: string, bdmg?: string }): [string, string, string] {
  let sands = 'ATK';
  let goblet = 'DMG';
  let circlet = 'CR';

  // Check Sands
  if (statFormulas.em?.includes('187')) sands = 'EM';
  else if (statFormulas.hp?.includes('46.6%')) sands = 'HP';
  else if (statFormulas.def?.includes('58.3%')) sands = 'DEF';
  else if (statFormulas.atk?.includes('46.6%*2')) { sands = 'ATK'; goblet = 'ATK'; }

  // Check Goblet
  if (statFormulas.bdmg?.includes('46.6%')) goblet = 'DMG';
  else if (statFormulas.atk?.includes('46.6%*2')) goblet = 'ATK';
  else if (statFormulas.em?.includes('187*2')) goblet = 'EM';

  // Check Circlet
  if (statFormulas.cd?.includes('62.2%')) circlet = 'CD';
  else if (statFormulas.cr?.includes('31.1%')) circlet = 'CR';

  return [sands, goblet, circlet];
}
```

#### 2. ER Target Extraction:
- In the KQM substat matrix (e.g. `Sandrone rows 35-49`, `Mavuika rows 35-49`):
  - Row header: `Recarga (ER)`.
  - Number of ER rolls: each roll contributes `5.5%` (`0.055`).
  - Total ER Bonus: e.g. 2 rolls = `11%` (`0.11`) -> Base 100% + 11% = `111 ER` (or rounded `110 ER` / `102 ER` base).
  - Nicole with 8 rolls = `44%` (`0.44`) -> `144 ER`.
- When the user ports results from the ER Calculator (R2), the calculated ER target overwrites or sets the badge tag directly.

---

### 4.6 Comprehensive Parsing Strategy for `.xlsx` Ingestion

To build an infallible, crash-proof parser that effortlessly extracts team data from any sheet in `Calc Sheet.xlsx`:

1. **Two-Pass Sheet Inspection**:
   - **Pass 1: Master Index Check (`Inicio`)**:
     - Check if sheet `Inicio` exists.
     - If present, parse all defined team cards (Zibai, Mavuika, Flins, Nefer, Mualani, Varka, Kinich). This provides immediate, pristine team rosters, weapons, artifacts, rotation strings, DPR, and DPS!
   - **Pass 2: Tab-by-Tab Inspection**:
     - Allow the user to select any tab (e.g. `Sandrone`, `Mavuika`, `Flins`).
     - Scan column blocks: Group 1 (B..E), Group 2 (O..R), Group 3 (AB..AE), Group 4 (AO..AR).
2. **Heuristic Row Role Detection (Header Rows 1-5)**:
   - For a given 4-column group:
     - Check if row contains known character names (via character roster dictionary): that row is the **Character Row**.
     - Check if row contains known weapons or "Weapon" keywords: that row is the **Weapon Row**.
     - Check if row contains known artifact sets or "Artifact" keywords: that row is the **Artifact Row**.
     - This automatically handles Layout A (Artifacts row 3, Weapons row 4, Characters row 5), Layout B (Artifacts row 1, Weapons row 2, Characters row 3), and Layout C (Characters row 1, Weapons row 2, Artifacts row 3)!
3. **Summary Table Hunter**:
   - Scan for cell containing `"Character"` or `"DMG contrib"` in column 2, 15, 28, or 41.
   - If found:
     - Read the 4 rows below: extract Character, Damage number, Percentage share, Weapon, Artifact set.
     - Look for `"DPR"` or `"DMGTotal"` in the next 10 rows: extract DPR.
     - Look for `"DPS"`: extract DPS and regex-extract rotation seconds from `"DPS(18)"`.
     - Look for `"Time esped"` or `"Time spent"`: extract individual character rotation seconds.
   - If no summary block is found (Layout A / `Sandrone`):
     - Scan column A for `"Damage"`: extract 4 character damages from columns B..E.
     - Scan column A for `"DMGTotal"`: extract DPR.
     - Scan column A for `"DPS"`: extract DPS.
     - Compute damage shares dynamically: `charDamage / dpr * 100`.
4. **Rotation Sequence Recovery**:
   - Check adjacent cells in the summary table or `Inicio` for strings containing action sequences (`->`, `>`, `Combo`, `EE`, `Q`, `N5C`).
5. **Error & Locale Shielding**:
   - Parse numbers using robust locale coercion: convert comma decimals (`45,83` -> `45.83`), strip `%`, currency, and thousand separators.
   - Handle Excel error literals gracefully: `#REF!`, `#DIV/0!`, `#VALUE!`, `#N/A` are converted to `0` or `null` without throwing errors.

---

## 5. Formal Discovery Tables

### 5.1 Features Discovered
| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Card Header | Carry Title & Archetype | Main carry name / team archetype in bold uppercase serif display font | Team name string (e.g. `SANDRONE`, `WRIOTHESLEY`) | Rendered styled title text | Defaults to `TEAM ROTATION` if empty | `images.jfif` Section 1 |
| 2 | Card Header | Investment Badge | Investment tier badge (e.g. `KQM Investment`) in gold/amber | Badge text (e.g. `KQM Investment`, `C0R1`, `Budget`) | Styled badge pill | Hides badge if empty | `images.jfif` Section 1 |
| 3 | Damage Share | Elemental Progress Bar | Horizontal percentage bar styled with character's element hue | Damage contribution % (0-100), character element | Color-coded progress bar with % label | Clamps 0-100; falls back to neutral gray if element unknown | `images.jfif` Section 2 |
| 4 | Damage Share | Constellation Indicator | Character constellation level badge | Integer 0-6 or string `C0`-`C6` | Formatted `C# CharacterName` | Defaults to `C0` if omitted | `images.jfif` & `nj2k8acllnah1.png` |
| 5 | Damage Share | Character Avatar | Square/circular character portrait with elemental border | Character name / portrait URL | Rendered avatar image | Fallback element glyph / initial badge if image missing | `images.jfif` & `nj2k8acllnah1.png` |
| 6 | Equipment | Weapon & Refinement | Weapon icon, name, and refinement badge (R1-R5) | Weapon name, Refinement (1-5) | Weapon slot with `R#` badge | Defaults to `R1` or `R5` if omitted | `images.jfif` Section 3 |
| 7 | Equipment | Artifact Set & ER Target | Artifact set icon, name, and energy recharge target tag | Artifact set name, ER target value (e.g. `100 ER`, `102 ER`) | Artifact card with ER badge tag | Defaults to `100% ER` if unspecified | `images.jfif` Section 3 |
| 8 | Equipment | 3-Stat Main Line | Compact `Sands / Goblet / Circlet` abbreviation | 3 stat strings (e.g. `ATK/ATK/CD`, `EM/ATK/CR`) | Monospace formatted stat line | Displays `-/-/-` if stats empty | `images.jfif` Section 3 |
| 9 | Bottom Panel | Highlighted DPS & DPR | Big bold display of rotation DPS and DPR | Numeric DPS and DPR values | Formatted `DPS: 189.1k \| DPR: 3.88M` | Formats 0 cleanly if uncalculated | `images.jfif` Section 4 |
| 10 | Bottom Panel | Rotation Notation String | Complete multi-step combo sequence with duration | Rotation text (e.g. `(20.5s) Odette EE Yae EEE ...`) | High-contrast monospace action timeline | Shows empty placeholder if blank | `images.jfif` Section 4 |
| 11 | Bottom Panel | Suite Branding & Watermark | Ametist suite watermark / author handle | Watermark string / logo toggle | Centered branding element | Allows custom author handle | `images.jfif` Section 4 |
| 12 | Raw Table Ingestion | TSV / Text Paste Parser | Parses raw clipboard rotation tables matching reference | Raw text / TSV / CSV string | Populated 4-character team object | Displays informative syntax warning if unparseable | `nj2k8acllnah1.png` |
| 13 | Raw Table Ingestion | STC & Assumptions Tagging | Captures Beta version status (`STC (V1 OF BETA)`) and rotation assumptions | Assumption text (e.g. `Assumes 5 field stacks avg`) | Sub-footer notes and badges | Omitted if none provided | `nj2k8acllnah1.png` |
| 14 | Spreadsheet Parser | Multi-Layout Detection | Automatically detects Layout A (Sandrone), B (Flins), C (Mavuika), or D (Inicio) | Uploaded `.xlsx` file buffer | Normalized team model with all 4 characters | Alerts user if workbook format unrecognized | `Calc Sheet.xlsx` inspection |
| 15 | Spreadsheet Parser | Multi-Team Tab Extraction | Discovers and lets user select from multiple team variants (Cols B-E, O-R, AB-AE, AO-AR) | Selected workbook sheet | Array of available team variant configurations | Fallback to Team 1 if others empty | `Calc Sheet.xlsx` inspection |
| 16 | Spreadsheet Parser | Substat ER & Stat Deduction | Extracts ER roll targets and deduces Sands/Goblet/Circlet main stats from formulas | Formula cells & KQM substat matrices | ER% target badges & `Sands/Goblet/Circlet` strings | Defaults to standard recommendations if formulas ambiguous | `Calc Sheet.xlsx` inspection |
| 17 | Export Engine | High-Res PNG & Clipboard | Client-side 2x/3x canvas rasterization and clipboard copy | DOM card element reference | Downloaded `.png` file & clipboard image item | Fallback download button if clipboard permission blocked | R1 Acceptance Criteria |
| 18 | ER Integration | Direct ER Target Sync | One-click button to push calculated ER values from ER Calculator into Infographic Card | Character ER values from calculator module | Updated ER tags on Infographic Card | Validates character name matching before syncing | R2 & ORIGINAL_REQUEST.md |

---

### 5.2 Edge Cases Discovered
| # | Feature | Input / Condition | Observed Behavior | Handling / Recovery Strategy |
|---|---------|-------------------|-------------------|------------------------------|
| 1 | Raw Table Parser | European/Brazilian comma decimals (`45,83%`, `1308604,60`) | Standard `parseFloat` returns `45` or `NaN` | Pre-normalize string: replace `,` with `.` when preceded/followed by digits |
| 2 | Spreadsheet Parser | Excel error tokens (`#REF!`, `#DIV/0!`, `#VALUE!`, `#N/A`) in cells (e.g. `Mavuika B12`, `Navia B34`) | Formula evaluation throws error or returns NaN | Catch and coerce all Excel error strings to `0` or null; continue parsing remaining cells |
| 3 | Damage Share | Environmental/Reaction damage row (`Lunar` reaction damage in `Flins`, `Zibai`, `Nefer`) | 5 rows in summary table instead of 4; sum of character damages != DPR | Attribute reaction damage to the trigger character (as done in `Flins D52 = ((C52+C56)/C58)*100`) or display separate reaction badge |
| 4 | Character Roster | Upcoming / Unreleased / Beta characters (Sandrone, Mavuika, Columbina, Ineffa, Zibai, Nefer, Varka, Durin, Nicole, Odette, Mizuki) | Character portrait image missing in standard asset pack | Render high-aesthetic fallback avatar with character initial and elemental background gradient |
| 5 | Row Variations | Inverted row order across sheets (Sandrone: Art/Wpn/Char; Flins: Art/Wpn/Char; Mavuika: Char/Wpn/Art) | Fixed row index lookup extracts weapon as character name | Use heuristic dictionary-based row identification instead of hardcoded row indices |
| 6 | Substat Matrix | Non-English / Portuguese column headers (`Taxa Crítica`, `Recarga (ER)`, `Time esped`) | English-only regex misses substat blocks | Include multilingual dictionary matching English, Portuguese, and common TC abbreviations (`CR`, `CD`, `EM`, `ER`, `ATK`) |
| 7 | Rotation String | Multiple combo variants within rotation (e.g. `1st rot: N1E 3N5C`, `All rots onwards: 3N5C N2`) | Single-line rotation input overflow | Display primary rotation string and provide toggle/note for subsequent rotations |
| 8 | Card Export | Text cutoffs or distorted fonts during PNG export via HTML canvas | Exported PNG has displaced text or missing custom web fonts | Ensure fonts are loaded before rasterization (`document.fonts.ready`), use explicit pixel dimensions, and apply 2x scale transform |

---

## 6. Integration Contract with ER Calculator (R2) & Hub (R3)

1. **Data Transfer Contract (R2 -> R1)**:
   - When the user calculates ER in the ER Calculator (ported from `Calculadora_Recarga_Genshin.html`), a prominent button `"Send to Infographic Card"` sends the resulting ER array:
     ```typescript
     interface CharacterERSyncPayload {
       team: Array<{
         characterName: string;
         element: string;
         calculatedER: number; // e.g. 135 (meaning 135%)
         favoniusProcs: number;
         funnelingRatio: string;
       }>;
     }
     ```
   - On the Infographic Card, the corresponding character's ER tag is automatically updated: e.g. `135 ER`.
2. **Inline Card Editing**:
   - Every text field, percentage, weapon refinement, artifact name, ER tag, and rotation text on the rendered Infographic Card must be inline-editable (instant click-to-edit) so theorycrafters can make immediate tweaks before exporting without touching spreadsheet files.
3. **Hub & Tierlist Integration (R3)**:
   - The Hub provides instant access to the Infographic Card Generator, ER Calculator, and version 6.7 tierlist portals with seamless tab/route navigation.

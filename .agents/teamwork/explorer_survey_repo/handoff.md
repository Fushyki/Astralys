# Handoff Report — Codebase & Architecture Survey

**Agent**: `explorer_survey_repo`  
**Working Directory**: `C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\explorer_survey_repo`  
**Handoff Type**: Hard (Task Complete)  
**Timestamp**: 2026-10-02T23:55:00Z  

---

## 1. Observation

1. **Repository Files & Configurations**:
   - `C:\Users\dabiv\ametist-impact-suite\package.json` contains:
     ```json
     "dependencies": {
       "react": "^18.3.1",
       "react-dom": "^18.3.1",
       "lucide-react": "^0.453.0",
       "clsx": "^2.1.1",
       "tailwind-merge": "^2.5.4"
     }
     ```
     Neither `xlsx` nor `html-to-image` is present in `dependencies` or `devDependencies`.
   - `C:\Users\dabiv\ametist-impact-suite\index.html` line 14:
     ```html
     <script type="module" src="/src/main.tsx"></script>
     ```
   - Running `Test-Path "src/main.tsx"` and `Test-Path "src/App.tsx"` returned `False`. Neither `main.tsx` nor `App.tsx` exists in `src/`.
   - Running `Test-Path "node_modules"` returned `False`. Dependencies are not yet installed.
   - Network connectivity test (`npm ping`) succeeded: `npm notice PONG 2554ms`.

2. **Existing Engines & Data in `src/`**:
   - `src/engines/erEngine.ts` implements `calculateTeamER(slots: ERSlotConfig[], rotationTime = 20, enemyParts = 6)`:
     - Line 38: `const sameElem = (genChar.element === targetChar.element); const multOn = sameElem ? 3.0 : 1.0; const multOff = sameElem ? 1.8 : 0.6;`
     - Line 56: `const mult = isOnField ? 2.0 : 1.2; baseFromFav += (procs * 3 * mult);`
     - Line 95: `const safeER = erNeeded * 1.15; // 15% safety threshold for single-target abyss boss`
   - `src/data/characters.ts`:
     - Contains `CHARACTERS_DATABASE` with 110+ characters including Natlan and future characters (`Aino`, `Citlali`, `Flins`, `Mavuika`, `Nicole`, `Odette`, `Sandrone`, `Skirk`, `Varka`, etc.) with their elemental typing, burst energy cost, cooldown, and skill particle generation rates.
   - `src/data/presets.ts`:
     - Contains 5 preset teams: `Mavuika Natlan Burn/Melt`, `Flins Lunar Quicken`, `Raiden National`, `Neuvillette Hypercarry`, `Kinich Emilie Burning`.
   - `src/engines/damageEngine.ts`:
     - Implements stat aggregations, DEF mitigation formula, RES shred formula, amplifying reaction formulas (`1 + 2.78 * EM / (EM + 1400)`), and Catalyze flat additions.

3. **External Reference Resources**:
   - `C:\Users\dabiv\Downloads\Calc Sheet.xlsx`:
     - Contains 12 sheets: `['Inicio', 'Plan Base', 'Nefer', 'Zibai', 'Mavuika', 'Flins', 'Sandrone', 'Mualani', 'Varka', 'Kinich', 'Navia', 'Planilha1']`.
     - Inspection of `Sandrone`: Row 3 contains artifacts (`Disenchant`, `Disenchant`, `Milelith`, `F. Purity`), Row 4 contains weapons (`Mailed Flower`, `The Widsith`, `Fav`, `Oathsworn Eye`), Row 5 contains characters (`Sandrone`, `Yae`, `Qiqi`, `Nicole`), Row 31 contains individual character damage numbers, Row 32 contains `DMGTotal: 2378400.91`, Row 33 contains `DPS: 108109.13`.
     - Inspection of `Mavuika`: Row 1 contains characters (`Mavuika`, `Citlali`, `Iansan`, `Bennett`), Row 2 contains weapons (`Blazing Suns`, `TTDS`, `Engulfin`, `Falcão`), Row 3 contains artifacts (`Obsidian`, `Instrutor`, `Cinder City`, `Nobless`), Row 32 contains damages, Row 33 contains `DMGTotal: 4320744.64`, Row 34 contains `DPS: 240041.37`.
     - Rotation notations found in `xl/sharedStrings.xml`: e.g. `(20.5s) Odette EE Yae EEE Qiqi E Sandrone CA E CA EQ CA E`, `Mualani N1 -> Mavuika QE -> Mona Q 2N -> Sucrose E N1 Mualani E3 Q E3`, `Kinich Q-> Iansan EQ -> Durin QEE -> Nicole E -> Kinich E 5[E] Combo`.
   - `C:\Users\dabiv\Downloads\images.jfif`:
     - Visual inspection confirms 4 primary sections per card:
       1. Top Header: Large uppercase carry title + `KQM Investment` gold badge.
       2. Left Column: `Damage Share` with element icons, character portraits, constellation (e.g. `C0 Sandrone`), and elemental-colored progress bars with percentages.
       3. Right Column: Equipment builds with refinement badges (`R5`, `R1`), weapon icon + name, artifact set icon + name, Energy Recharge requirement badge (`102 ER`), and 3-stat main lines (e.g. `ATK / ATK / CD`).
       4. Footer: Watermark (`THE GENSHIN SCIENTIST` / `AMETIST IMPACT SUITE`), bold highlighted metrics `DPS: [val] | DPR: [val]`, and full rotation sequence with elemental text highlighting.
   - `C:\Users\dabiv\Downloads\nj2k8acllnah1.png`:
     - Raw calculation table format: `Stellar Fortress`, 4 characters (`Wrio C0`, `Yae C1`, `Odette C0`, `Nicole C0`), damage contributions (`45.83%`, `36.73%`, `17.09%`, `0.36%`), artifacts (`4p Shadow`, `4p Shadow`, `4p 7.0 Supp`, `2p2p Atk`), weapons (`Widsith R5`, `7.0 Craftable R5`, `HoD R5`, `Flowing Purity R5`), DPR (`2855567.58`), DPS (`167974.56`), and rotation sequence `Rotation(17s): Nicole E > Yae EEE > Odette Q/E E > > Wrio Combo`.
   - `C:\Users\dabiv\Downloads\Calculadora_Recarga_Genshin.html`:
     - Lines 935–1045 contain identical calculation logic to `src/engines/erEngine.ts`.
     - Lines 650–765 contain custom team save/load logic using `localStorage` (`genshin_er_saved_teams`) and JSON backup export/import.

---

## 2. Logic Chain

1. **Build Blocker**:
   - `index.html` references `/src/main.tsx` (Observation 1).
   - `src/main.tsx` and `src/App.tsx` do not exist (Observation 1).
   - Therefore, the project in its current state cannot be built or previewed until `main.tsx` and `App.tsx` are created.

2. **Spreadsheet Parsing Dependency**:
   - R1 requires parsing `.xlsx` workbooks client-side (Observation 3).
   - `package.json` lacks an Excel parsing library (Observation 1).
   - Installing `xlsx` (SheetJS) enables reading `Calc Sheet.xlsx` buffer directly in the browser and extracting worksheet matrices.

3. **Infographic Card Export Dependency**:
   - R1 requires exporting the infographic card to high-resolution PNG and copying to clipboard without CSS distortion (Observation 1 & 3).
   - Pure DOM copying does not produce PNG image binaries, and standard canvas rendering struggles with complex CSS gradients and flex layouts.
   - Installing `html-to-image` provides `toPng` (with `pixelRatio: 2`) and `toBlob` which directly interface with the browser's `ClipboardItem` API.

4. **ER Integration Pipeline**:
   - `src/engines/erEngine.ts` already contains particle calculation logic equivalent to `Calculadora_Recarga_Genshin.html` (Observation 2 & 3).
   - An interactive UI component (`ERCalculator.tsx`) is needed to present this engine, provide team slot controls, and feature a direct `"Transfer ER to Infographic"` button to populate the `InfographicCard` equipment ER badges.

5. **Hub & Tierlist Portal (R3)**:
   - Tailwind config already possesses "Ametist Clean" tokens (amethyst scale, elemental colors, glassmorphism shadows).
   - Building a `TierlistPortal.tsx` with a version 6.7 database (`tierlistData.ts`) will satisfy R3 and provide a coherent navigation experience between Hub, Infographic, ER Calculator, and Tierlist Portal.

---

## 3. Caveats

- **No Code Was Modified**: Under the read-only investigation constraint, no packages were installed and no files inside `src/` were edited.
- **Node Modules Not Populated**: Because `node_modules` is not yet installed, `npm run build` and `npm run dev` cannot be executed until an implementation agent runs `npm install`.
- **Character Avatar Assets**: In `images.jfif`, chibi character portraits and element icons are displayed. In the web app, high quality fallback avatar images (via Enka/Genshin CDN or stylized elemental initials badges) should be provided to prevent broken image placeholders when offline.

---

## 4. Conclusion

1. The project foundation is architecturally sound with well-crafted TypeScript types, styling configurations, and mathematical engines (`erEngine.ts`, `damageEngine.ts`).
2. Immediate technical prerequisites for the implementation team are:
   - Run `npm install` and add `xlsx` and `html-to-image`.
   - Create `src/main.tsx` and `src/App.tsx` to restore application viability.
3. The domain structures of `Calc Sheet.xlsx` (12 tabs), `images.jfif` (4 card sections), `nj2k8acllnah1.png` (raw table paste), and `Calculadora_Recarga_Genshin.html` (ER logic & team storage) are thoroughly mapped, documented, and ready for immediate implementation.

---

## 5. Verification Method

To verify these observations independently:

1. **Verify missing entrypoint files**:
   ```powershell
   Test-Path "C:\Users\dabiv\ametist-impact-suite\src\main.tsx"
   Test-Path "C:\Users\dabiv\ametist-impact-suite\src\App.tsx"
   ```
   *Expected output: `False`.*

2. **Verify missing dependencies in package.json**:
   ```powershell
   Get-Content "C:\Users\dabiv\ametist-impact-suite\package.json" | Select-String "xlsx", "html-to-image"
   ```
   *Expected output: No matches.*

3. **Verify reference materials existence & sheet names**:
   ```powershell
   python -c "import zipfile, xml.etree.ElementTree as ET; z = zipfile.ZipFile(r'C:\Users\dabiv\Downloads\Calc Sheet.xlsx'); wb = ET.fromstring(z.read('xl/workbook.xml')); print([s.attrib['name'] for s in wb.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheets')])"
   ```
   *Expected output: `['Inicio', 'Plan Base', 'Nefer', 'Zibai', 'Mavuika', 'Flins', 'Sandrone', 'Mualani', 'Varka', 'Kinich', 'Navia', 'Planilha1']`.*

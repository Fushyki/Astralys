# Handoff Report — Energy Recharge Calculator Specification Survey

**Author**: `spec_miner_survey_er` (Specification Miner)  
**Date**: 2026-10-02T23:55:00Z  
**Target Milestone**: ER Calculator Specification Survey (Requirement R2)  

---

## 1. Observation

1. **Source Implementation Path**: `C:\Users\dabiv\Downloads\Calculadora_Recarga_Genshin.html` (52,554 bytes, 1,073 lines).
2. **Character Data Structure**: In `Calculadora_Recarga_Genshin.html`, line 623:
   ```javascript
   const CHARACTERS = [
     {"name": "Aino", "element": "Hydro", "burst_cost": 50, "burst_cd": 13.5, "particles": 3, "label": "Constellation 0"},
     ...
     {"name": "Zibai", "element": "Geo", "burst_cost": 60, "burst_cd": 15, "particles": 4.7, "label": "Press"}
   ];
   ```
   Verified count: exactly 128 characters spanning elements `Hydro`, `Geo`, `Dendro`, `Electro`, `Pyro`, `Cryo`, `Anemo`, and placeholder `None` (`Nobody`).
3. **Core Absorption Multipliers**: In `Calculadora_Recarga_Genshin.html`, lines 962-965:
   ```javascript
   const sameElem = (genChar.element === targetChar.element);
   const multOn = sameElem ? 3.0 : 1.0;
   const multOff = sameElem ? 1.8 : 0.6;
   const mult = (onFieldFraction * multOn) + ((1 - onFieldFraction) * multOff);
   ```
4. **Clear / White Particles & Favonius**: In `Calculadora_Recarga_Genshin.html`, lines 980 and 987:
   - Favonius: `const mult = isOnField ? 2.0 : 1.2; baseFromFav += (procs * 3 * mult);`
   - Enemy HP threshold drops: `const baseFromEnemies = enemyParts * (onfieldPct * 2.0 + (1 - onfieldPct) * 1.2);`
5. **Raiden Flat Energy Passive**: In `Calculadora_Recarga_Genshin.html`, lines 991-994:
   ```javascript
   let flatEnergy = targetSlot.flat || 0;
   const raidenInTeam = slots.some(s => s.name === "Raiden");
   if (raidenInTeam && targetSlot.name !== "Raiden") {
     flatEnergy += 24;
   }
   ```
6. **Burst Disabled & Zero Burst Cost Short-Circuit**: In `Calculadora_Recarga_Genshin.html`, lines 1006-1018:
   ```javascript
   if (targetSlot.use_burst === false || targetChar.burst_cost === 0) {
     erValEl.innerText = "100.0%";
     erStatusEl.className = "er-status status-ignored";
     erStatusEl.innerText = "⚪ Não usa Ult (Ignorar ER)";
     erSafeEl.innerText = "Foque 100% em atributos ofensivos (Crit / Dano)";
     ...
     return;
   }
   ```
7. **ER Ratio Formula & Safety Margin**: In `Calculadora_Recarga_Genshin.html`, lines 1024-1037:
   ```javascript
   const neededFromParticles = Math.max(0, targetChar.burst_cost - flatEnergy);
   let erNeeded = 1.0;
   if (totalBaseParticles > 0.05 && neededFromParticles > 0) {
     erNeeded = neededFromParticles / totalBaseParticles;
   }
   if (erNeeded < 1.0) erNeeded = 1.0;
   const erPct = (erNeeded * 100).toFixed(1) + "%";
   const erSafePct = (erNeeded * 1.15 * 100).toFixed(1) + "%";
   ```
8. **Status Thresholds**: Lines 1039-1051:
   - `< 1.35`: `status-confortavel` ("🟢 Confortável (<135%)")
   - `1.35 <= er < 1.75`: `status-equilibrada` ("🔵 Equilibrada (135-175%)")
   - `1.75 <= er < 2.15`: `status-alta` ("🟡 Alta (175-215%)")
   - `>= 2.15`: `status-critica` ("🔴 Crítica (>215%)")
9. **Reference Execution Verification**: Re-executing the math against the default reference team (Mavuika, Citlali, Iansan, Bennett) produced:
   - Mavuika: 100.0% (`status-ignored`)
   - Citlali: 202.2% (Boss: 232.6%, `status-alta`)
   - Iansan: 205.2% (Boss: 235.9%, `status-alta`)
   - Bennett: 185.7% (Boss: 213.6%, `status-alta`)

---

## 2. Logic Chain

1. **Roster Completeness**: Observation 2 establishes that `Calculadora_Recarga_Genshin.html` possesses 128 character profiles. This exceeds the minimum requirement of 110+ characters and includes version 5.x, 6.x, and 7.0 pre-release characters (Mavuika, Citlali, Iansan, Sandrone, Columbina, Varka, Skirk, etc.).
2. **Particle Generation Mechanics**: Observation 3 and 4 prove that the engine models both elemental energy (mult 3.0 / 1.8 / 1.0 / 0.6) and neutral clear energy (mult 2.0 / 1.2), reflecting canonical Genshin Impact energy mechanics where off-field energy is always 60% of on-field energy.
3. **Funneling Algebra**: Observation 3 shows how `onFieldFraction` operates:
   - `1.0` delivers 100% on-field energy to the recipient.
   - `0.5` delivers a split 50/50 weighted combination (`0.5 * multOn + 0.5 * multOff`).
   - `0.0` delivers 100% off-field energy.
4. **Passive & Burst State Decoupling**: Observation 5 and 6 demonstrate that characters who do not burst (`use_burst = false` or `burst_cost = 0`) still execute their skill casts and generate particles to battery their teammates, while their own ER demand is clamped to 100.0%.
5. **Boss Margin Formulation**: Observation 7 shows that the single-target boss margin is calculated as a direct 1.15x multiplier on the required ER ratio (`erNeeded * 1.15`), providing an exact buffer for reduced enemy particle drops.

---

## 3. Caveats

1. **Weapon Types in Reference HTML**: The source array `CHARACTERS` in `Calculadora_Recarga_Genshin.html` does not include explicit weapon type strings (e.g. `'Sword'`, `'Polearm'`). These were mapped authoritatively in `survey_er_calc.md` based on canonical character attributes and theorycrafting data in `Calc Sheet.xlsx` to support R1/R2 infographic requirements.
2. **Raiden Flat Energy Constant**: The reference HTML hardcodes Raiden's flat energy grant to +24.0 for non-Raiden teammates. In live gameplay, Raiden's burst energy restore scales slightly with her own ER (from ~20 to ~27.5 flat energy). The 24.0 constant is the established reference value in the tool and should be preserved as the standard default.
3. **Banner Reference to D: Drive**: The HTML footer notes `D:\Calculadora_Recarga_Genshin_Impact.xlsx`. Inspection confirmed this path does not exist on the current user drive; the authoritative logic resides entirely within `Calculadora_Recarga_Genshin.html`.

---

## 4. Conclusion

The specification survey for the Energy Recharge (ER) Calculator is complete, verified, and documented in detail in `survey_er_calc.md`. The reference math, 128-character roster, particle absorption tables, Favonius mechanics, flat energy calculations, and 5 verified test fixtures are ready to be directly consumed by the development team for implementing Requirement R2 of the Ametist Impact Suite.

---

## 5. Verification Method

To independently verify the survey and its mathematical outputs:
1. Run the test script in PowerShell/Node:
   ```powershell
   node -e "
     const fs = require('fs');
     const html = fs.readFileSync('C:/Users/dabiv/Downloads/Calculadora_Recarga_Genshin.html', 'utf-8');
     const CHARACTERS = JSON.parse(html.match(/const CHARACTERS = (\[.*?\]);/s)[1]);
     console.log('Character count:', CHARACTERS.length);
   "
   ```
   **Expected result**: `Character count: 128`.
2. Inspect the survey report at:
   `C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\spec_miner_survey_er\survey_er_calc.md`
   Verify Section 2 (Roster Table), Section 3 (Formulas), Section 4 (Special Mechanics), and Section 5 (Test Scenarios).
3. Validate Scenario 1 fixture values against `Calculadora_Recarga_Genshin.html` by opening the HTML in a browser:
   - Slot 1 Mavuika: `100.0%`
   - Slot 2 Citlali: `202.2%` (Boss: `232.6%`)
   - Slot 3 Iansan: `205.2%` (Boss: `235.9%`)
   - Slot 4 Bennett: `185.7%` (Boss: `213.6%`)

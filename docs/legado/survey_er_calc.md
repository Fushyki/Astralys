# Energy Recharge (ER) Calculator — Comprehensive Specification Survey

> **Target Source Implementation**: `C:\Users\dabiv\Downloads\Calculadora_Recarga_Genshin.html`  
> **Survey Role**: `spec_miner_survey_er` (Specification Miner)  
> **Status**: Verified & Authoritative  
> **Date**: October 2026 (v6.7 / v7.0 Ecosystem)  

---

## 1. Executive Summary & Provenance

This document establishes the exhaustive specification survey of the Energy Recharge (ER) Calculator implemented in `Calculadora_Recarga_Genshin.html`. The calculator simulates rotation-based particle generation and calculates exact ER% requirements across a 4-character team under customizable combat conditions (rotation duration, enemy HP threshold drops, skill casts, Favonius activations, flat energy passives, and split funneling).

### Key Architectural Characteristics
- **Complete Roster**: 128 character profiles spanning version 1.0 through 6.7 / 7.0 leaks (including Snezhnaya and Natlan units like Mavuika, Citlali, Iansan, Sandrone, Columbina, Varka, Skirk, etc.).
- **Dual Energy Typing**: Elemental Particles (Pyro, Hydro, Electro, Cryo, Anemo, Geo, Dendro) and Neutral/Clear Particles (Favonius, Enemy HP drops).
- **Asymmetric Absorption**: 4 distinct elemental absorption rates based on elemental resonance (`same` vs `different`) and position (`on-field` vs `off-field`).
- **Flexible Funneling Engine**: 8 funneling directives including split funneling (50% to slot A, 50% to slot B) and dedicated battery passing.
- **Dynamic Ultimate State**: Explicit support for burstless carries and supports (`use_burst = false` or `burst_cost = 0`) where ER% is clamped to 100% while skill particle battery generation is fully preserved for teammates.
- **Safety Margin Evaluation**: Automatic computation of standard ER and Boss Margin (+15% ER requirement) reflecting pure single-target boss fights with reduced energy drops.

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Roster Engine | 128-Character Database | Hardcoded array of 128 characters with element, burst energy cost, burst cooldown, base skill particles, and execution label. | Character Name selection | Element, Burst Cost, CD, Base Particles, Label | Fallback to default Pyro 60-cost character if not found | `Calculadora_Recarga_Genshin.html:623-641` |
| 2 | Particle Math | Elemental Particle Absorption | Elemental particle absorption scaling based on generator element vs receiver element and field status. | Generator Element, Receiver Element, Onfield Fraction | Energy delivered to character | Non-negative numeric result | `Calculadora_Recarga_Genshin.html:962-968` |
| 3 | Particle Math | Clear / White Particle Absorption | Neutral particle absorption for Favonius weapons and enemy HP drops. | Onfield status / field percentage | 2.0 energy on-field, 1.2 energy off-field | Minimum 0 | `Calculadora_Recarga_Genshin.html:980, 987` |
| 4 | Funneling | Directed Funneling | Funneling particles from skill to self (on-field) or directed to a specific slot (1 to 4). | Selection: `Ele mesmo (Em campo)`, `Passar p/ Slot 1-4` | Receiver gets on-field multiplier (1.0 fraction), others 0 | Defaults to off-field if slot mismatch | `Calculadora_Recarga_Genshin.html:948-951` |
| 5 | Funneling | Split Funneling (50/50) | Particles divided equally between two designated slots (e.g. Slot 3 & 4 or Slot 1 & 2). | Selection: `Dividir (50% Slot 3 / 50% Slot 4)`, etc. | Receiver gets weighted average: `0.5 * multOn + 0.5 * multOff` | Other slots receive 0 onfield fraction (`multOff`) | `Calculadora_Recarga_Genshin.html:952-960` |
| 6 | Funneling | Off-Field Split | All party members receive particles while off-field. | Selection: `Fora de campo (Dividido)` | All slots get 0 onfield fraction (`multOff`) | Safe uniform distribution | `Calculadora_Recarga_Genshin.html:859, 946` |
| 7 | Special Weapon | Favonius Weapon Battery | Weapons from Favonius series generate 3 clear particles per critical hit proc. | Procs count (0-3), Favonius receiver target | 6.0 energy on-field, 3.6 energy off-field per proc across team | Procs multiplied by 3 * mult | `Calculadora_Recarga_Genshin.html:971-983` |
| 8 | Flat Energy | Flat Energy Refund Input | Direct energy injection that bypasses ER% multiplier (e.g. Amenoma, Prototype Amber, passives). | Number input (0-60) | Flat energy deducted directly from burst cost | Subtracted before dividing by base particles | `Calculadora_Recarga_Genshin.html:880, 990, 1024` |
| 9 | Flat Energy | Auto Raiden Shogun Passive | Hardcoded passive giving +24 flat energy to all non-Raiden teammates if Raiden is present in the team. | Presence of character `Raiden` in slots | +24 flat energy added to slots 2-4 | Does not apply flat +24 to Raiden herself | `Calculadora_Recarga_Genshin.html:991-994` |
| 10 | Burst Toggle | Burst Disabled (`use_burst = false`) | Toggle indicating character does not burst every rotation (e.g. normal attack carries, pure skill bots). | Dropdown (`true` / `false`) | ER% displayed as 100.0%, Status: `status-ignored` | Particles generated from E-skill still battery teammates | `Calculadora_Recarga_Genshin.html:833, 1006-1018` |
| 11 | Burst Toggle | Zero Burst Cost (`burst_cost = 0`) | Characters whose bursts do not consume standard energy (e.g. Mavuika, Skirk). | Hardcoded `burst_cost: 0` | Auto-sets `use_burst = false`, ER% forced to 100.0% | Skill particles still generated normally | `Calculadora_Recarga_Genshin.html:906, 1006` |
| 12 | Enemy Drops | Monster HP Threshold Drops | Clear particles dropped by defeating or damaging enemies in Abyss/Domain. | Enemy particles count (default 6, range 0-30) | Scaled by receiver's on-field time percentage | `enemyParts * (pct * 2.0 + (1-pct) * 1.2)` | `Calculadora_Recarga_Genshin.html:578, 986-988` |
| 13 | Safety Margin | Boss Margin (+15%) | Buffer for single-target boss encounters with lower energy drops. | Internal formula: `erNeeded * 1.15` | Displays `Margem de segurança (+15% Boss): XX.X%` | Purely advisory tag; base ER remains uninflated | `Calculadora_Recarga_Genshin.html:1034, 1037` |
| 14 | UI / UX | Status Severity Color Bands | Color-coded status badge classifying ER requirement severity. | Calculated `erNeeded` | `Confortável`, `Equilibrada`, `Alta`, `Crítica` | Distinct CSS styles & labels | `Calculadora_Recarga_Genshin.html:1039-1055` |
| 15 | UI / UX | Real-time Breakdown Accordion | Itemized breakdown of energy sources per character. | Recalculate execution | Breakdown of Skills, Favonius, Enemies, Flat, and Total | Real-time DOM update | `Calculadora_Recarga_Genshin.html:1056-1062` |
| 16 | Persistence | LocalStorage Session Auto-save | Persists current team setup and global settings across browser reloads. | Current slot state, rotation time, enemy drops | Restores on page load | Silent try/catch fallback | `Calculadora_Recarga_Genshin.html:765-788` |
| 17 | Persistence | Named Team Management | Save, load, and delete custom named team presets in LocalStorage. | Team name string, slot array | Saved team chips in UI | Fallback auto-generated team name | `Calculadora_Recarga_Genshin.html:646-724` |
| 18 | Persistence | Backup Export / Import | JSON file import/export for team presets (`meus_times_genshin_er.json`). | File input `.json` / Download anchor | Downloaded file or loaded array | Alert on invalid JSON format | `Calculadora_Recarga_Genshin.html:725-763` |
| 19 | Customization | Particle Override per Slot | Override standard character skill particle generation for specific weapon/constellation situations. | Input `Partículas geradas pelo E` (0-25, step 0.5) | `custom_part` overrides `cData.particles` | Reverts to base if undefined | `Calculadora_Recarga_Genshin.html:846, 943` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | ER Calculation Floor | Calculated `erNeeded < 1.0` (team produces more energy than burst cost) | `if (erNeeded < 1.0) erNeeded = 1.0;` Output is clamped at `100.0%`. A character can never require less than baseline 100% ER. |
| 2 | Division by Zero Protection | Zero particles generated across team (`totalBaseParticles <= 0.05`) | Guard clause `if (totalBaseParticles > 0.05 && neededFromParticles > 0)`. Avoids `Infinity` or `NaN`; defaults to `erNeeded = 1.0` (100.0%). |
| 3 | Flat Energy Exceeds Burst Cost | `flatEnergy >= burst_cost` (e.g. Burst cost 40, flat energy 50) | `neededFromParticles = Math.max(0, targetChar.burst_cost - flatEnergy) = 0`. Guard clause keeps `erNeeded = 1.0` (100.0%). |
| 4 | Burst Disabled Toggle | `use_burst === false` with standard 80-cost character | ER output is forced to `100.0%`, status changes to `⚪ Não usa Ult (Ignorar ER)`. Breakdown shows particles generated for team and total energy. |
| 5 | Natural 0-Cost Burst | Character `Mavuika` or `Skirk` selected | Switching to character triggers `if (cData.burst_cost === 0) slots[idx].use_burst = false;`. ER is 100.0%, status `⚪ Não usa Ult`. |
| 6 | Pure Single Target (0 Enemy Drops) | `enemy-particles = 0` | `baseFromEnemies = 0`. Entire energy requirement must be satisfied by skills, Favonius, and flat energy. ER requirement increases sharply. |
| 7 | Extreme Onfield Distribution | `onfield = 100%` on one character | That character receives `enemyParts * 2.0` from monsters; other characters with e.g. 5% get `enemyParts * (0.05 * 2.0 + 0.95 * 1.2) = 1.24 * enemyParts`. |
| 8 | Lisa Skill Particle Generation | `Lisa` selected with 0 particles (Press label) | Lisa's `particles = 0`. Lisa generates 0 particles from E. If team has no other battery, ER for electro teammates rises substantially. |
| 9 | Duplicate Characters | Same character in multiple slots (e.g. Bennett + Bennett via custom JSON) | Calculator processes each slot independently; elemental matching correctly evaluates `genChar.element === targetChar.element`. |
| 10 | Non-integer Skill Casts / Particles | `particles = 2.25` (Bennett) and `e_uses = 2` | `totalParticles = 4.5`. Particle algebra handles floating-point values without truncating. |

---

## 2. Character Database Specification (All 128 Characters)

Below is the exhaustive roster of all 128 characters cataloged in `Calculadora_Recarga_Genshin.html`. Weapon assignments are mapped from canonical theorycrafting data matching the suite requirements.

| # | Character | Element | Weapon | Burst Cost | Burst CD (s) | Skill Particles | Label / Mode | Generation Mechanics / RNG Details |
|---|---|---|---|---|---|---|---|---|
| 1 | Aino | Hydro | Catalyst | 50 | 13.5 | 3 | Constellation 0 | Standard fixed particle drop |
| 2 | Albedo | Geo | Sword | 40 | 12 | 3 | Press | Standard fixed particle drop |
| 3 | Alhaitham | Dendro | Sword | 70 | 18 | 1 | Projection Attack | Projection Attack hit on-field generates 1 particle (1.6s CD) |
| 4 | Alyosha | Electro | Sword | 70 | 18 | 5 | Constellation 0 | Standard fixed particle drop |
| 5 | Amber | Pyro | Bow | 40 | 12 | 4 | Press | Standard fixed particle drop |
| 6 | Arlecchino | Pyro | Polearm | 60 | 15 | 5 | Press | Standard fixed particle drop |
| 7 | Ayaka | Cryo | Sword | 80 | 20 | 4.5 | Press | Skill / stance generates 4 or 5 particles (avg 4.5) |
| 8 | Ayato | Hydro | Sword | 80 | 20 | 4.5 | On field | Skill / stance generates 4 or 5 particles (avg 4.5) |
| 9 | Baizhu | Dendro | Catalyst | 80 | 20 | 3.5 | Press | Skill generates 3 or 4 particles (avg 3.5) |
| 10 | Barbara | Hydro | Catalyst | 80 | 20 | 3 | Press | Standard fixed particle drop |
| 11 | Beidou | Electro | Claymore | 80 | 20 | 2 | 0 stacks | Standard fixed particle drop |
| 12 | Bennett | Pyro | Sword | 60 | 15 | 2.25 | Press | Press: 75% chance 2 particles, 25% chance 3 particles (avg 2.25) |
| 13 | Candace | Hydro | Polearm | 60 | 15 | 2 | Press | Standard fixed particle drop |
| 14 | Charlotte | Cryo | Catalyst | 80 | 20 | 3 | Press | Standard fixed particle drop |
| 15 | Chasca | Anemo | Bow | 60 | 15 | 5 | Press | Standard fixed particle drop |
| 16 | Chevreuse | Pyro | Polearm | 60 | 15 | 4 | Press | Standard fixed particle drop |
| 17 | Childe | Hydro | Bow | 60 | 15 | 3 | 7-9s melee | Standard fixed particle drop |
| 18 | Chiori | Geo | Sword | 50 | 13.5 | 3 | Press | Standard fixed particle drop |
| 19 | Chongyun | Cryo | Claymore | 40 | 12 | 4 | Press | Standard fixed particle drop |
| 20 | Citlali | Cryo | Catalyst | 60 | 15 | 5 | Constellation 0 | Standard fixed particle drop |
| 21 | Clorinde | Electro | Sword | 60 | 15 | 4 | Press | Standard fixed particle drop |
| 22 | Collei | Dendro | Bow | 60 | 15 | 3 | Press | Standard fixed particle drop |
| 23 | Columbina | Hydro | Catalyst | 60 | 15 | 3 | Press | Standard fixed particle drop |
| 24 | Cyno | Electro | Polearm | 80 | 20 | 3 | Press (no burst) | Standard fixed particle drop |
| 25 | Dahlia | Hydro | Sword | 60 | 15 | 3 | Press | Standard fixed particle drop |
| 26 | Dehya | Pyro | Claymore | 70 | 18 | 3 | Constellation 0 | Standard fixed particle drop |
| 27 | Diluc | Pyro | Claymore | 40 | 12 | 3.75 | 3-skill combo | 3-Skill Searing Onset combo (avg 1.25 particles per cast = 3.75 total) |
| 28 | Diona | Cryo | Bow | 80 | 20 | 1.6 | Press | Press fires 2 paws (0.8/paw = 1.6 avg); Hold fires 5 paws (4.0) |
| 29 | Dori | Electro | Claymore | 80 | 20 | 2 | Press | Standard fixed particle drop |
| 30 | Durin | Pyro | Sword | 70 | 18 | 4 | Press | Standard fixed particle drop |
| 31 | Emilie | Dendro | Polearm | 50 | 13.5 | 3 | Press | Standard fixed particle drop |
| 32 | Escoffier | Cryo | Polearm | 60 | 15 | 4 | Press | Standard fixed particle drop |
| 33 | Eula | Cryo | Claymore | 80 | 20 | 1.5 | Press | Tap: 1-2 particles (avg 1.5); Hold generates 2-3 (avg 2.5) |
| 34 | Faruzan | Anemo | Bow | 80 | 20 | 2 | Aimed Shot | Skill creates buffed Aimed Shot / Crowfeather that procs particles |
| 35 | Fischl | Electro | Bow | 60 | 15 | 6.7 | Constellation 0 | Oz attacks over 10s duration (~67% chance per hit, avg 6.7) |
| 36 | Flins | Electro | Polearm | 60 | 16 | 4 | Constellation 0 | Standard fixed particle drop |
| 37 | Freminet | Cryo | Claymore | 60 | 15 | 2 | Level 0 (no burst) | Standard fixed particle drop |
| 38 | Furina | Hydro | Sword | 60 | 15 | 6.5 | Salon Members | Salon Members periodic attacks over 20s (avg 6.5 particles) |
| 39 | Gaming | Pyro | Claymore | 60 | 15 | 2 | Press | Standard fixed particle drop |
| 40 | Ganyu | Cryo | Bow | 60 | 15 | 4 | Press | Standard fixed particle drop |
| 41 | Gorou | Geo | Bow | 80 | 20 | 2 | Press | Standard fixed particle drop |
| 42 | Heizou | Anemo | Catalyst | 40 | 12 | 2 | 0-1 stacks | Standard fixed particle drop |
| 43 | Hu Tao | Pyro | Polearm | 60 | 15 | 4.8 | Press | Blood Blossom procs over 9s duration (avg 4.8 particles) |
| 44 | Iansan | Electro | Polearm | 70 | 18 | 4 | Constellation 0 | Standard fixed particle drop |
| 45 | Ifa | Anemo | Bow | 60 | 15 | 4.3 | Press | Skill generates 4.3 Anemo particles on average |
| 46 | Illuga | Geo | Polearm | 60 | 15 | 4.5 | Constellation 0 | Skill / stance generates 4 or 5 particles (avg 4.5) |
| 47 | Ineffa | Electro | Polearm | 60 | 15 | 3 | Press | Standard fixed particle drop |
| 48 | Itto | Geo | Claymore | 70 | 18 | 3.5 | Press | Skill generates 3 or 4 particles (avg 3.5) |
| 49 | Jahoda | Anemo | Bow | 70 | 18 | 4 | Press | Standard fixed particle drop |
| 50 | Jean | Anemo | Sword | 80 | 20 | 2.67 | Press | Press: 33% chance 2 particles, 67% chance 3 particles (avg 2.67) |
| 51 | Kachina | Geo | Polearm | 70 | 18 | 3 | Independent | Turbo Twirler independent ground strikes generate ~3 particles total |
| 52 | Kaeya | Cryo | Sword | 60 | 15 | 2.67 | 0 freezes | Press: 2 or 3 Cryo particles (avg 2.67 without freeze passive) |
| 53 | Kaveh | Dendro | Claymore | 80 | 20 | 2 | Press | Standard fixed particle drop |
| 54 | Kazuha | Anemo | Sword | 60 | 15 | 3 | Press | Standard fixed particle drop |
| 55 | Keqing | Electro | Sword | 40 | 12 | 2.5 | Press | Stellar Restoration generates 2 or 3 Electro particles (avg 2.5) |
| 56 | Kinich | Dendro | Claymore | 70 | 18 | 5 | Press | Standard fixed particle drop |
| 57 | Kirara | Dendro | Sword | 60 | 15 | 3 | Final Kick | Standard fixed particle drop |
| 58 | Klee | Pyro | Catalyst | 60 | 15 | 4 | Press | Standard fixed particle drop |
| 59 | Kokomi | Hydro | Catalyst | 70 | 18 | 3 | Refresh | Standard fixed particle drop |
| 60 | Kuki Shinobu | Electro | Sword | 60 | 15 | 3 | Constellation 0 | Standard fixed particle drop |
| 61 | Lan Yan | Anemo | Catalyst | 60 | 15 | 3 | Press | Standard fixed particle drop |
| 62 | Lauma | Dendro | Bow | 60 | 15 | 3 | Press | Standard fixed particle drop |
| 63 | Layla | Cryo | Sword | 40 | 12 | 3 | 1 volley | Standard fixed particle drop |
| 64 | Linnea | Geo | Polearm | 60 | 15 | 3 | Press | Standard fixed particle drop |
| 65 | Lisa | Electro | Catalyst | 80 | 20 | 0 | Press | Generates 0 particles on tap/press |
| 66 | Lohen | Cryo | Sword | 60 | 15 | 5 | Press | Standard fixed particle drop |
| 67 | Lynette | Anemo | Sword | 70 | 18 | 4 | Press | Standard fixed particle drop |
| 68 | Lyney | Pyro | Bow | 60 | 15 | 5 | Press | Standard fixed particle drop |
| 69 | Mavuika | Pyro | Claymore | 0 | 18 | 5 | Press | Alternate energy mechanic (Nightsoul / Stance), cost 0 |
| 70 | Mika | Cryo | Polearm | 70 | 18 | 4 | Press | Standard fixed particle drop |
| 71 | Mona | Hydro | Catalyst | 60 | 15 | 3.33 | Press | Phantom explosion: 3 or 4 particles (avg 3.33) |
| 72 | Mualani | Hydro | Catalyst | 60 | 15 | 4.5 | Press | Skill / stance generates 4 or 5 particles (avg 4.5) |
| 73 | Nahida | Dendro | Catalyst | 50 | 13.5 | 6 | Press | Standard fixed particle drop |
| 74 | Navia | Geo | Claymore | 60 | 15 | 3.5 | Press | Skill generates 3 or 4 particles (avg 3.5) |
| 75 | Nefer | Dendro | Catalyst | 60 | 15 | 2.67 | Press | Skill generates 2 or 3 Dendro particles (avg 2.67) |
| 76 | Neuvillette | Hydro | Catalyst | 70 | 18 | 4 | Press | Standard fixed particle drop |
| 77 | Nicole | Pyro | Catalyst | 60 | 15 | 5 | Press | Standard fixed particle drop |
| 78 | Nilou | Hydro | Sword | 70 | 18 | 4.5 | Press | Skill / stance generates 4 or 5 particles (avg 4.5) |
| 79 | Ningguang | Geo | Catalyst | 40 | 12 | 3.4 | Press | Jade Screen: 3 or 4 Geo particles (avg 3.4, 6s internal CD) |
| 80 | Nobody | None | None | 60 | 15 | 3 | Press | Standard fixed particle drop |
| 81 | Noelle | Geo | Claymore | 60 | 15 | 3 | Press | Standard fixed particle drop |
| 82 | Odette | Cryo | Bow | 60 | 15 | 5 | Press | Standard fixed particle drop |
| 83 | Ororon | Electro | Bow | 60 | 15 | 3 | Press | Standard fixed particle drop |
| 84 | Prune | Anemo | Catalyst | 70 | 18 | 5 | Press | Standard fixed particle drop |
| 85 | Qiqi | Cryo | Sword | 80 | 20 | 3 | Press | Standard fixed particle drop |
| 86 | Raiden | Electro | Polearm | 90 | 18 | 6.5 | Press | Eye of Stormy Judgment periodic hits (50% chance, 0.9s CD, avg 6.5) |
| 87 | Razor | Electro | Claymore | 80 | 20 | 3 | Press | Standard fixed particle drop |
| 88 | Rosaria | Cryo | Polearm | 60 | 15 | 3 | Press | Standard fixed particle drop |
| 89 | Sandrone | Cryo | Claymore | 60 | 15 | 1 | Hit On-Field | Hit on-field with mechanical automata generates 1 particle |
| 90 | Sara | Electro | Bow | 80 | 20 | 3 | Aimed Shot | Skill creates buffed Aimed Shot / Crowfeather that procs particles |
| 91 | Sayu | Anemo | Claymore | 80 | 20 | 2 | Press | Standard fixed particle drop |
| 92 | Sethos | Electro | Bow | 60 | 15 | 2 | Press | Standard fixed particle drop |
| 93 | Shenhe | Cryo | Polearm | 80 | 20 | 3 | Press | Standard fixed particle drop |
| 94 | Sigewinne | Hydro | Bow | 70 | 18 | 4 | Press | Standard fixed particle drop |
| 95 | Skirk | Cryo | Sword | 0 | 15 | 4 | Attack | Alternate energy mechanic (Nightsoul / Stance), cost 0 |
| 96 | Sucrose | Anemo | Catalyst | 80 | 20 | 4 | Press | Standard fixed particle drop |
| 97 | Tartaglia | Hydro | Bow | 60 | 15 | 3 | 7-9s melee | Standard fixed particle drop |
| 98 | Thoma | Pyro | Polearm | 80 | 20 | 3.4 | Press | Blazing Blessing: 3 or 4 Pyro particles (avg 3.4) |
| 99 | Tighnari | Dendro | Bow | 40 | 12 | 3.5 | Press | Skill generates 3 or 4 particles (avg 3.5) |
| 100 | Traveler (Anemo) | Anemo | Sword | 60 | 15 | 2 | Press | Standard fixed particle drop |
| 101 | Traveler (Cryo) | Cryo | Sword | 60 | 15 | 3 | Press | Standard fixed particle drop |
| 102 | Traveler (Dendro) | Dendro | Sword | 80 | 20 | 2.5 | Press | Razorgrass Blade: 2 or 3 Dendro particles (avg 2.5) |
| 103 | Traveler (Electro) | Electro | Sword | 80 | 20 | 1 | Press | Standard fixed particle drop |
| 104 | Traveler (Geo) | Geo | Sword | 60 | 15 | 3.33 | Press | Starfell Sword: 3 or 4 Geo particles (avg 3.33) |
| 105 | Traveler (Hydro) | Hydro | Sword | 80 | 20 | 3.33 | Press | Aquacrest Saber: 3 or 4 Hydro particles (avg 3.33) |
| 106 | Traveler (Pyro) | Pyro | Sword | 70 | 18 | 1 | Blazing Threshold | Standard fixed particle drop |
| 107 | Varesa | Electro | Catalyst | 70 | 18 | 2.5 | Press | Skill generates 2 or 3 Electro particles (avg 2.5) |
| 108 | Varka | Anemo | Claymore | 60 | 15 | 6 | Press | Standard fixed particle drop |
| 109 | Venti | Anemo | Bow | 60 | 15 | 3 | Press | Standard fixed particle drop |
| 110 | Vesna | Anemo | Sword | 60 | 15 | 5 | Press | Standard fixed particle drop |
| 111 | Vodyanitsa | Hydro | Sword | 60 | 15 | 5 | Press | Press skill generates 5.0 Hydro particles |
| 112 | Wanderer | Anemo | Catalyst | 60 | 15 | 4 | 8-10s uptime | Windfavored state normal/charged hits generate ~4 particles over 8-10s |
| 113 | Wriothesley | Cryo | Catalyst | 60 | 15 | 1 | NA during skill | Standard fixed particle drop |
| 114 | Xiangling | Pyro | Polearm | 80 | 20 | 4 | Press | Standard fixed particle drop |
| 115 | Xianyun | Anemo | Catalyst | 70 | 18 | 5 | Press | Standard fixed particle drop |
| 116 | Xiao | Anemo | Polearm | 70 | 18 | 3 | Press | Standard fixed particle drop |
| 117 | Xilonen | Geo | Sword | 60 | 15 | 4 | Press | Standard fixed particle drop |
| 118 | Xingqiu | Hydro | Sword | 80 | 20 | 5 | Press | Standard fixed particle drop |
| 119 | Xinyan | Pyro | Claymore | 60 | 15 | 4 | Press | Standard fixed particle drop |
| 120 | Yae Miko | Electro | Catalyst | 90 | 22 | 3 | 3 totems | Sesshou Sakura totem strikes generate ~3 particles across rotation |
| 121 | Yanfei | Pyro | Catalyst | 80 | 20 | 3 | Press | Standard fixed particle drop |
| 122 | Yaoyao | Dendro | Polearm | 80 | 20 | 3 | Press | Standard fixed particle drop |
| 123 | Yelan | Hydro | Bow | 70 | 18 | 4 | Press | Standard fixed particle drop |
| 124 | Yoimiya | Pyro | Bow | 60 | 15 | 4 | Press | Standard fixed particle drop |
| 125 | Yumemizuki Mizuki | Anemo | Catalyst | 60 | 15 | 4 | Press | Standard fixed particle drop |
| 126 | Yun Jin | Geo | Polearm | 60 | 15 | 2 | Press | Standard fixed particle drop |
| 127 | Zhongli | Geo | Polearm | 40 | 12 | 3 | Press | Standard fixed particle drop |
| 128 | Zibai | Geo | Sword | 60 | 15 | 4.7 | Press | Skill / Lunar Phase Shift generates 4 or 5 Geo particles (avg 4.7) |


---

## 3. Energy Particle Mechanics & Mathematical Formulas

Energy regeneration in Genshin Impact follows a rigorous mathematical model based on particle type, elemental affinity, on-field status, and party size (4 members).

### 3.1 Absorption Multiplier Matrix

Every particle collected by the party confers energy to **every living party member**. The amount of energy received depends on whether the particle is **Elemental** or **Clear (Neutral)**, and whether the receiving character is **On-Field** or **Off-Field**:

| Particle Category | Receiver Element Match | On-Field Multiplier (`multOn`) | Off-Field Multiplier (`multOff`) |
|-------------------|------------------------|-------------------------------|----------------------------------|
| **Elemental** | **Same Element** | **3.0** | **1.8** |
| **Elemental** | **Different Element** | **1.0** | **0.6** |
| **Clear / Neutral** | Any Element | **2.0** | **1.2** |

> **Mathematical Ratio Observation**:  
> In a 4-player team, the off-field absorption rate is exactly **60%** of the on-field absorption rate:  
> - Same element: `1.8 / 3.0 = 0.60`  
> - Different element: `0.6 / 1.0 = 0.60`  
> - Clear/Neutral: `1.2 / 2.0 = 0.60`

---

### 3.2 Skill Particle Generation & Absorption Formula

For each generator slot j (j in {0, 1, 2, 3}) and receiver target slot i (i in {0, 1, 2, 3}):

1. **Total Particles Generated by Slot j**:
   totalParticles_j = e_uses_j * particlesPerUse_j
   (where particlesPerUse_j defaults to character base particles unless customized).

2. **On-Field Distribution Fraction (f_{j -> i})**:
   - If funnel is "Ele mesmo (Em campo)":
     f_{j -> i} = 1.0 if j == i else 0.0
   - If funnel is "Passar p/ Slot K" (where K in {1, 2, 3, 4}):
     f_{j -> i} = 1.0 if i == (K - 1) else 0.0
   - If funnel is "Dividir (50% Slot 3 / 50% Slot 4)":
     f_{j -> i} = 0.5 if i in {2, 3} else 0.0
   - If funnel is "Dividir (50% Slot 1 / 50% Slot 2)":
     f_{j -> i} = 0.5 if i in {0, 1} else 0.0
   - If funnel is "Fora de campo (Dividido)":
     f_{j -> i} = 0.0 for all i

3. **Effective Multiplier (M_{j -> i})**:
   Let sameElem = (element_j == element_i).
   multOn = 3.0 if sameElem else 1.0
   multOff = 1.8 if sameElem else 0.6
   M_{j -> i} = (f_{j -> i} * multOn) + ((1 - f_{j -> i}) * multOff)

4. **Total Base Energy from Team Skills**:
   E_skills(i) = sum over j of (totalParticles_j * M_{j -> i})

---

### 3.3 Favonius Weapon Particle Generation Formula

Favonius weapons generate **3 clear/neutral particles** upon critical hits:
- On-field receiver: 3 * 2.0 = 6.0 energy per proc.
- Off-field receiver: 3 * 1.2 = 3.6 energy per proc.

For each Favonius holder slot j:
- isOnField_{j -> i} is true if:
  (fav_target_j == "Ele mesmo (Em campo)" and j == i) OR
  (fav_target_j == "Passar p/ Slot (i+1)")
- Otherwise isOnField_{j -> i} is false.

mult_{fav}(j -> i) = 2.0 if isOnField else 1.2

E_fav(i) = sum over j of (fav_procs_j * 3 * mult_{fav}(j -> i))

---

### 3.4 Enemy HP Threshold Particles (Monster Drops) Formula

Enemies drop clear/neutral particles at HP thresholds (e.g. 75%, 50%, 25%, death). The standard Abyss Floor 12 baseline is **6 neutral particles** (P_enemy = 6).

The energy received by character i is weighted by their on-field time fraction (T_on(i) in [0.05, 1.0]):
E_enemy(i) = P_enemy * (T_on(i) * 2.0 + (1 - T_on(i)) * 1.2)

*Example*: For P_enemy = 6 and T_on = 0.15:
E_enemy = 6 * (0.15 * 2.0 + 0.85 * 1.2) = 6 * (0.30 + 1.02) = 6 * 1.32 = 7.92 energy

---

### 3.5 Flat Energy & Raiden Passive

Flat energy is direct numerical energy added directly to the energy pool without scaling by ER%:
E_flat(i) = flat_input_i + (24.0 if (Raiden in team and character is NOT Raiden) else 0.0)

---

### 3.6 Net Energy & ER% Requirement Calculation

1. **Total Base Particles Collected**:
   E_base(i) = E_skills(i) + E_fav(i) + E_enemy(i)

2. **Energy Needed from Particles**:
   delta_E(i) = max(0, burst_cost(i) - E_flat(i))

3. **Burst Disabled or 0-Cost Short-Circuit**:
   If use_burst(i) == false or burst_cost(i) == 0:
   ER%(i) = 100.0%, Status = "⚪ Não usa Ult (Ignorar ER)"

4. **ER% Requirement**:
   If E_base(i) > 0.05 and delta_E(i) > 0:
     erRatio(i) = max(1.0, delta_E(i) / E_base(i))
   Else:
     erRatio(i) = 1.0

   ER%(i) = (erRatio(i) * 100).toFixed(1) + "%"

5. **Boss Margin (+15% Buffer)**:
   ER%_safe(i) = (erRatio(i) * 1.15 * 100).toFixed(1) + "%"

---

### 3.7 Classification Thresholds

| Ratio Range | Display String | Color Theme | Practical Rotation Meaning |
|---|---|---|---|
| ER < 1.35 | `🟢 Confortável (<135%)` | Green (`#4ade80`) | Easily achieved with substats alone; no ER sands required. |
| 1.35 <= ER < 1.75 | `🔵 Equilibrada (135-175%)` | Blue (`#60a5fa`) | Balanced; requires 2-4 ER substats or an ER weapon / set bonus. |
| 1.75 <= ER < 2.15 | `🟡 Alta (175-215%)` | Yellow (`#fbbf24`) | High demand; typically mandates ER Sands or high-refinement Favonius. |
| ER >= 2.15 | `🔴 Crítica (>215%)` | Red (`#f87171`) | Severe energy hunger; requires ER sands + ER weapon + dedicated battery. |
| Burst Inactive | `⚪ Não usa Ult (Ignorar ER)` | Slate (`#94a3b8`) | Burst is omitted from rotation; 100% investment into offensive stats. |

---

## 4. Special Mechanics

### 4.1 Favonius Weapons Specification
- **Mechanics**: Upon landing a critical hit, the weapon spawns 3 Clear Particles.
- **Internal Cooldowns and Trigger Rates by Refinement**:
  - R1: 60% chance, 12.0s cooldown
  - R2: 70% chance, 10.5s cooldown
  - R3: 80% chance, 9.0s cooldown
  - R4: 90% chance, 7.5s cooldown
  - R5: 100% chance, 6.0s cooldown
- **Rotation Limits**: In standard 20s rotations, a character can trigger Favonius 1 to 2 times (at R1-R3) or up to 3 times (at R5 on characters with prolonged on-field uptime).
- **Party Distribution**:
  - The proc holder on-field gains 6.0 energy.
  - Teammates off-field each gain 3.6 energy.
  - If funneled to another teammate (holder switches immediately to target), the receiving teammate gains the 6.0 on-field energy.

### 4.2 Flat Energy Refunds
Flat energy bypasses ER multiplication and applies directly to the burst cost:
1. **Raiden Shogun (Musou Isshin)**:
   - In reference implementation: provides hardcoded **24.0 flat energy** to all three teammates.
   - Real-game scaling: 1.6 to 2.5 flat energy per hit * 5 hits + 0.4% per 1% ER above 100% (typically 22-27.5 flat energy at 250-300% ER). The hardcoded value of 24.0 represents the industry-standard theorycrafting constant.
2. **Amenoma Kageuchi (Inazuma Craftable Sword)**:
   - Grants 6/7.5/9/10.5/12 flat energy per Succession Seed consumed upon burst cast (up to 3 seeds = 18/22.5/27/31.5/36 flat energy).
3. **Prototype Amber (Craftable Catalyst)**:
   - Regenerates 4/4.5/5/5.5/6 flat energy every 2s for 6s after using burst (total 12/13.5/15/16.5/18 flat energy for all party members).
4. **Kitain Cross Spear / Rightful Reward**:
   - Kitain: consumes 3 energy, regenerates 9/10.5/12/13.5/15 energy over 6s (net 6 to 12 flat energy).
   - Rightful Reward: restores 8 to 16 flat energy upon being healed.
5. **Character Passives**:
   - **Venti A4 (Stormeye)**: Regenerates 15 flat energy to Venti and all characters whose element was absorbed by Wind's Grand Ode.
   - **Ayaka C1 / Amenoma combos**: Ayaka frequently runs Amenoma with 24-36 flat energy refund.
   - **Traveler (Electro)**: Abundance Amulets regenerate 3.5 to 4 flat energy each.

### 4.3 Split Funneling Engine
Standard calculators assume all particles from a character are absorbed either 100% on-field by themselves or 100% by one designated teammate. However, in modern dual-carry or quickswap rotations (e.g. Mavuika battery setups), a character casts skill, batteries one teammate, and later in the rotation catches particles for another:
- Option `Dividir (50% Slot 3 / 50% Slot 4)`: Slot 3 and Slot 4 both receive an on-field fraction of 0.5 (50% on-field, 50% off-field). Slots 1 and 2 receive 0.0 on-field fraction (100% off-field).
- Option `Dividir (50% Slot 1 / 50% Slot 2)`: Slot 1 and Slot 2 receive 0.5 on-field fraction; Slots 3 and 4 receive 0.0.
- Option `Fora de campo (Dividido)`: All 4 party members receive 0.0 on-field fraction (simulating delayed off-field skill ticks like Furina, Fischl, or Albedo when characters are swapping continuously).

---

## 5. Concrete Test Calculation Scenarios (Test Fixtures)

These test scenarios serve as verified fixtures for automated regression testing and validation of the ported TypeScript ER engine.

### Scenario 1: Default Reference Team (Mavuika Melt / Overload)
- **Global Settings**: Rotation Time = 20s, Monster HP Particles = 6
- **Slot 1**: Mavuika (Pyro, Cost: 0, Particles: 5, Uses: 1, Funnel: `Dividir (50% Slot 3 / 50% Slot 4)`, Fav: 0, Flat: 0, Onfield: 50%, Burst: Disabled)
- **Slot 2**: Citlali (Cryo, Cost: 60, Particles: 5, Uses: 1, Funnel: `Ele mesmo (Em campo)`, Fav: 0, Flat: 0, Onfield: 15%, Burst: Enabled)
- **Slot 3**: Iansan (Electro, Cost: 70, Particles: 4, Uses: 1, Funnel: `Ele mesmo (Em campo)`, Fav: 0, Flat: 12, Onfield: 15%, Burst: Enabled)
- **Slot 4**: Bennett (Pyro, Cost: 60, Particles: 2.25, Uses: 1, Funnel: `Ele mesmo (Em campo)`, Fav: 0, Flat: 0, Onfield: 20%, Burst: Enabled)

#### Detailed Energy Accounting:
| Slot | Character | Skills Energy | Fav Energy | Monster Energy | Flat Energy | Total Base Energy | Needed from Particles | Calculated ER% | Boss Margin (+15%) | Status Text |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Mavuika | 18.45 | 0.00 | 9.60 | 0.0 | 28.05 | 0.00 | **100.0%** | Foque 100% em atributos | `⚪ Não usa Ult (Ignorar ER)` |
| 2 | Citlali | 21.75 | 0.00 | 7.92 | 0.0 | 29.67 | 60.00 | **202.2%** | **232.6%** | `🟡 Alta (175-215%)` |
| 3 | Iansan | 20.35 | 0.00 | 7.92 | 12.0 | 28.27 | 58.00 | **205.2%** | **235.9%** | `🟡 Alta (175-215%)` |
| 4 | Bennett | 24.15 | 0.00 | 8.16 | 0.0 | 32.31 | 60.00 | **185.7%** | **213.6%** | `🟡 Alta (175-215%)` |

---

### Scenario 2: Raiden National (Rational)
- **Global Settings**: Rotation Time = 20s, Monster HP Particles = 6
- **Slot 1**: Raiden (Electro, Cost: 90, Particles: 6.5, Uses: 1, Funnel: `Ele mesmo (Em campo)`, Fav: 0, Flat: 0, Onfield: 50%, Burst: Enabled)
- **Slot 2**: Xiangling (Pyro, Cost: 80, Particles: 4.0, Uses: 1, Funnel: `Ele mesmo (Em campo)`, Fav: 0, Flat: 0, Onfield: 10%, Burst: Enabled)
- **Slot 3**: Xingqiu (Hydro, Cost: 80, Particles: 5.0, Uses: 2, Funnel: `Ele mesmo (Em campo)`, Fav: 1, Fav Target: `Ele mesmo (Em campo)`, Flat: 0, Onfield: 15%, Burst: Enabled)
- **Slot 4**: Bennett (Pyro, Cost: 60, Particles: 2.25, Uses: 2, Funnel: `Passar p/ Slot 2`, Fav: 1, Fav Target: `Passar p/ Slot 2`, Flat: 0, Onfield: 25%, Burst: Enabled)
- *Note*: Raiden passive injects +24 flat energy into Xiangling, Xingqiu, and Bennett. Bennett funnels both his skill particles (4.5 particles) and his Favonius proc (3 white particles) directly to Xiangling.

#### Detailed Energy Accounting:
| Slot | Character | Skills Energy | Fav Energy | Monster Energy | Flat Energy | Total Base Energy | Needed from Particles | Calculated ER% | Boss Margin (+15%) | Status Text |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Raiden | 30.60 | 7.20 | 9.60 | 0.0 | 47.40 | 90.00 | **189.9%** | **218.4%** | `🟡 Alta (175-215%)` |
| 2 | Xiangling | 35.40 | 9.60 | 7.68 | 24.0 | 52.68 | 56.00 | **106.3%** | **122.2%** | `🟢 Confortável (<135%)` |
| 3 | Xingqiu | 39.00 | 9.60 | 7.92 | 24.0 | 56.52 | 56.00 | **100.0%** | **115.0%** | `🟢 Confortável (<135%)` |
| 4 | Bennett | 25.20 | 7.20 | 8.40 | 24.0 | 40.80 | 36.00 | **100.0%** | **115.0%** | `🟢 Confortável (<135%)` |

---

### Scenario 3: Ayaka Premium Freeze
- **Global Settings**: Rotation Time = 20s, Monster HP Particles = 6
- **Slot 1**: Ayaka (Cryo, Cost: 80, Particles: 4.5, Uses: 1, Funnel: `Ele mesmo (Em campo)`, Fav: 0, Flat: 0, Onfield: 45%, Burst: Enabled)
- **Slot 2**: Shenhe (Cryo, Cost: 80, Particles: 3.0, Uses: 1, Funnel: `Passar p/ Slot 1`, Fav: 1, Fav Target: `Passar p/ Slot 1`, Flat: 0, Onfield: 15%, Burst: Enabled)
- **Slot 3**: Kazuha (Anemo, Cost: 60, Particles: 3.0, Uses: 1, Funnel: `Ele mesmo (Em campo)`, Fav: 1, Fav Target: `Ele mesmo (Em campo)`, Flat: 0, Onfield: 20%, Burst: Enabled)
- **Slot 4**: Kokomi (Hydro, Cost: 70, Particles: 3.0, Uses: 1, Funnel: `Ele mesmo (Em campo)`, Fav: 0, Flat: 0, Onfield: 20%, Burst: Enabled)

#### Detailed Energy Accounting:
| Slot | Character | Skills Energy | Fav Energy | Monster Energy | Flat Energy | Total Base Energy | Needed from Particles | Calculated ER% | Boss Margin (+15%) | Status Text |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Ayaka | 26.10 | 9.60 | 9.36 | 0.0 | 45.06 | 80.00 | **177.5%** | **204.2%** | `🟡 Alta (175-215%)` |
| 2 | Shenhe | 17.10 | 7.20 | 7.92 | 0.0 | 32.22 | 80.00 | **248.3%** | **285.5%** | `🔴 Crítica (>215%)` |
| 3 | Kazuha | 15.30 | 9.60 | 8.16 | 0.0 | 33.06 | 60.00 | **181.5%** | **208.7%** | `🟡 Alta (175-215%)` |
| 4 | Kokomi | 15.30 | 7.20 | 8.16 | 0.0 | 30.66 | 70.00 | **228.3%** | **262.6%** | `🔴 Crítica (>215%)` |

---

### Scenario 4: Hu Tao Double Hydro (Zhongli Burst Disabled)
- **Global Settings**: Rotation Time = 20s, Monster HP Particles = 6
- **Slot 1**: Hu Tao (Pyro, Cost: 60, Particles: 4.8, Uses: 1, Funnel: `Ele mesmo (Em campo)`, Fav: 0, Flat: 0, Onfield: 50%, Burst: Enabled)
- **Slot 2**: Xingqiu (Hydro, Cost: 80, Particles: 5.0, Uses: 1, Funnel: `Ele mesmo (Em campo)`, Fav: 0, Flat: 0, Onfield: 15%, Burst: Enabled)
- **Slot 3**: Yelan (Hydro, Cost: 70, Particles: 4.0, Uses: 1, Funnel: `Ele mesmo (Em campo)`, Fav: 1, Fav Target: `Ele mesmo (Em campo)`, Flat: 0, Onfield: 15%, Burst: Enabled)
- **Slot 4**: Zhongli (Geo, Cost: 40, Particles: 3.0, Uses: 1, Funnel: `Ele mesmo (Em campo)`, Fav: 1, Fav Target: `Passar p/ Slot 3`, Flat: 0, Onfield: 20%, Burst: Disabled)

#### Detailed Energy Accounting:
| Slot | Character | Skills Energy | Fav Energy | Monster Energy | Flat Energy | Total Base Energy | Needed from Particles | Calculated ER% | Boss Margin (+15%) | Status Text |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Hu Tao | 21.60 | 7.20 | 9.60 | 0.0 | 38.40 | 60.00 | **156.3%** | **179.7%** | `🔵 Equilibrada (135-175%)` |
| 2 | Xingqiu | 26.88 | 7.20 | 7.92 | 0.0 | 42.00 | 80.00 | **190.5%** | **219.0%** | `🟡 Alta (175-215%)` |
| 3 | Yelan | 25.68 | 12.00 | 7.92 | 0.0 | 45.60 | 70.00 | **153.5%** | **176.5%** | `🔵 Equilibrada (135-175%)` |
| 4 | Zhongli | 17.28 | 7.20 | 8.16 | 0.0 | 32.64 | 0.00 | **100.0%** | Foque 100% em atributos | `⚪ Não usa Ult (Ignorar ER)` |

---

### Scenario 5: Alhaitham Quickbloom (Kuki Shinobu Burst Disabled)
- **Global Settings**: Rotation Time = 20s, Monster HP Particles = 6
- **Slot 1**: Alhaitham (Dendro, Cost: 70, Particles: 1.0, Uses: 1, Funnel: `Ele mesmo (Em campo)`, Fav: 0, Flat: 0, Onfield: 50%, Burst: Enabled)
- **Slot 2**: Nahida (Dendro, Cost: 50, Particles: 6.0, Uses: 1, Funnel: `Ele mesmo (Em campo)`, Fav: 0, Flat: 0, Onfield: 15%, Burst: Enabled)
- **Slot 3**: Xingqiu (Hydro, Cost: 80, Particles: 5.0, Uses: 1, Funnel: `Ele mesmo (Em campo)`, Fav: 1, Fav Target: `Ele mesmo (Em campo)`, Flat: 0, Onfield: 20%, Burst: Enabled)
- **Slot 4**: Kuki Shinobu (Electro, Cost: 60, Particles: 3.0, Uses: 1, Funnel: `Ele mesmo (Em campo)`, Fav: 0, Flat: 0, Onfield: 15%, Burst: Disabled)

#### Detailed Energy Accounting:
| Slot | Character | Skills Energy | Fav Energy | Monster Energy | Flat Energy | Total Base Energy | Needed from Particles | Calculated ER% | Boss Margin (+15%) | Status Text |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Alhaitham | 18.60 | 3.60 | 9.60 | 0.0 | 31.80 | 70.00 | **220.1%** | **253.1%** | `🔴 Crítica (>215%)` |
| 2 | Nahida | 24.60 | 3.60 | 7.92 | 0.0 | 36.12 | 50.00 | **138.4%** | **159.2%** | `🔵 Equilibrada (135-175%)` |
| 3 | Xingqiu | 21.00 | 6.00 | 8.16 | 0.0 | 35.16 | 80.00 | **227.5%** | **261.7%** | `🔴 Crítica (>215%)` |
| 4 | Kuki Shinobu | 16.20 | 3.60 | 7.92 | 0.0 | 27.72 | 0.00 | **100.0%** | Foque 100% em atributos | `⚪ Não usa Ult (Ignorar ER)` |

---

## 6. Architecture & Integration Plan for Ametist Impact Suite

### 6.1 TypeScript Interface Contract

To integrate cleanly with the Infographic Card and React state, the ported module should adhere to the following contracts:

```typescript
export type ElementType = 'Pyro' | 'Hydro' | 'Anemo' | 'Electro' | 'Dendro' | 'Cryo' | 'Geo' | 'None';
export type WeaponType = 'Sword' | 'Claymore' | 'Polearm' | 'Bow' | 'Catalyst' | 'None';

export type FunnelTarget =
  | 'Ele mesmo (Em campo)'
  | 'Passar p/ Slot 1'
  | 'Passar p/ Slot 2'
  | 'Passar p/ Slot 3'
  | 'Passar p/ Slot 4'
  | 'Dividir (50% Slot 3 / 50% Slot 4)'
  | 'Dividir (50% Slot 1 / 50% Slot 2)'
  | 'Fora de campo (Dividido)';

export type FavTarget =
  | 'Ele mesmo (Em campo)'
  | 'Passar p/ Slot 1'
  | 'Passar p/ Slot 2'
  | 'Passar p/ Slot 3'
  | 'Passar p/ Slot 4';

export interface CharacterDef {
  name: string;
  element: ElementType;
  weapon: WeaponType;
  burst_cost: number;
  burst_cd: number;
  particles: number;
  label: string;
}

export interface SlotConfig {
  id: number;
  name: string;
  e_uses: number;
  custom_part?: number;
  funnel: FunnelTarget;
  fav: number;
  fav_target: FavTarget;
  flat: number;
  onfield: number; // 0.05 to 1.00
  use_burst: boolean;
}

export interface ERCalculationBreakdown {
  slotId: number;
  characterName: string;
  element: ElementType;
  burstCost: number;
  useBurst: boolean;
  baseFromSkills: number;
  baseFromFav: number;
  baseFromEnemies: number;
  flatEnergy: number;
  totalBaseParticles: number;
  erPercent: string;        // e.g. "202.2%"
  erSafePercent: string;    // e.g. "232.6%" or guidance string
  rawErRatio: number;       // e.g. 2.022
  rawErSafeRatio: number;   // e.g. 2.326
  statusClass: 'status-confortavel' | 'status-equilibrada' | 'status-alta' | 'status-critica' | 'status-ignored';
  statusLabel: string;
}
```

### 6.2 Infographic Card ER Injection Contract
In accordance with **Requirement R2** of `ORIGINAL_REQUEST.md`:
> *"Provide a direct button to send the calculated ER requirements straight into the Infographic Card."*

When clicked, the calculator emits:
```typescript
interface ERToCardTransferPayload {
  slots: Array<{
    slotIndex: number;
    characterName: string;
    erRequirementString: string; // e.g. "202%" or "100%" or "233% (Boss)"
    erNumeric: number;
  }>;
}
```
This payload updates the right-column artifact equipment block on the Infographic Card (`images.jfif`), tagging the respective character's artifact badge with their ER target (e.g. `185% ER` on Bennett, `100% ER` on Mavuika).

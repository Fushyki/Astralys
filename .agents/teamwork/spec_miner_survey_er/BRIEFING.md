# BRIEFING — 2026-10-02T23:55:00Z

## Mission
Perform a comprehensive specification survey of the Energy Recharge (ER) Calculator reference implementation in `Calculadora_Recarga_Genshin.html`.

## 🔒 My Identity
- Archetype: specification_miner
- Roles: spec_miner_survey_er
- Working directory: C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\spec_miner_survey_er
- Original parent: e880d348-bc7a-4e2d-87f2-a1595124886f
- Milestone: ER Calculator Specification Survey

## 🔒 Key Constraints
- Authoritative source: C:\Users\dabiv\Downloads\Calculadora_Recarga_Genshin.html
- Read-only: Do NOT implement anything. Discover and document features.
- Output report: C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\spec_miner_survey_er\survey_er_calc.md
- Produce handoff report: C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\spec_miner_survey_er\handoff.md
- Maintain progress.md with timestamp
- Communicate to caller via send_message

## Current Parent
- Conversation ID: e880d348-bc7a-4e2d-87f2-a1595124886f
- Updated: 2026-10-02T23:30:05Z

## Task Summary
- **What to build**: Full survey report of the Energy Recharge calculator in `Calculadora_Recarga_Genshin.html` (all 128 characters, formulas, particle mechanics, special passives/weapons, funneling, test fixtures).
- **Success criteria**: Comprehensive `survey_er_calc.md` covering roster, formulas, special mechanics, edge cases, test calculation scenarios, and self-contained `handoff.md`.
- **Interface contracts**: ORIGINAL_REQUEST.md R2 (Energy Recharge Calculator Integration)
- **Code layout**: .agents/teamwork/spec_miner_survey_er/

## Key Decisions Made
- Surveyed `Calculadora_Recarga_Genshin.html` directly (52,554 bytes, 1,073 lines).
- Extracted and verified full 128-character roster with elements, weapon types, burst costs, cooldowns, particle rates, and RNG mechanics.
- Documented complete particle matrix: Elemental (Same: 3.0 on / 1.8 off; Diff: 1.0 on / 0.6 off) and Clear/Neutral (2.0 on / 1.2 off).
- Documented special mechanics: Favonius (3 white particles per proc), Flat Energy + Raiden (+24 to teammates), 8 funneling options including split funneling (50/50), Burst Disabled toggle, Boss margin (+15%).
- Formatted 5 concrete test fixtures with verified numerical energy accounting for automated testing.
- Created `survey_er_calc.md` (41.8KB) and 5-component `handoff.md`.

## Artifact Index
- `survey_er_calc.md` — Complete specification survey of ER calculator
- `handoff.md` — 5-component handoff report for the implementation team
- `progress.md` — Liveness heartbeat and progress log
- `characters_dump.json` — Dumped JSON of 128 characters from reference source
- `char_table.md` — Full markdown table of all 128 characters

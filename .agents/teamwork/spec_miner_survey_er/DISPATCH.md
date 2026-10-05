## 2026-10-02T23:30:05Z
You are spec_miner_survey_er.
Your working directory is: C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\spec_miner_survey_er

Your mission is to perform a comprehensive specification survey of the Energy Recharge (ER) Calculator reference implementation located at:
C:\Users\dabiv\Downloads\Calculadora_Recarga_Genshin.html

Read ORIGINAL_REQUEST.md at:
C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\ORIGINAL_REQUEST.md

Inspect the entire Calculadora_Recarga_Genshin.html file (scripts, data arrays, logic, formulas, math, UI toggles).
Document thoroughly in your output report at C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\spec_miner_survey_er\survey_er_calc.md:
1. Roster and Character Data:
   - Full list of characters (all 110+ characters, their elements, weapon types, burst energy costs, base skill particles, tap vs hold, RNG particle expectations).
2. Energy Particle Mechanics & Mathematical Formulas:
   - Elemental particles vs clear/white particles.
   - Absorption multipliers: same element on-field, same element off-field, different element on-field, different element off-field.
   - Formula for ER% requirement calculation.
3. Special Mechanics:
   - Favonius weapons (particles per proc, CD, R1-R5 proc rates/CD, team distribution).
   - Flat energy refund passives & weapons (e.g. Amenoma Kageuchi, Prototype Amber, Inazuma craftable polearm/spear, Raiden Shogun burst, character passives like Venti, Ayaka, etc.).
   - Split funneling (e.g. 50/50 particle share options).
   - Burst disabled toggle (how it modifies calculations for characters that do not burst).
   - Boss particle margin / enemy HP threshold particle drops (+15% or fixed drops).
4. Concrete test calculation scenarios with input parameters and expected calculated ER output numbers to serve as test fixtures.

Write your complete findings to survey_er_calc.md and write your handoff.md before notifying. Maintain progress.md with timestamp.

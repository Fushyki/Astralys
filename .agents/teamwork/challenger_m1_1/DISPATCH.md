## 2026-10-03T01:45:14Z
You are challenger_m1_1, Challenger 1 for Milestone 1: Infrastructure Baseline & Core Models.
Your working directory is: C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\challenger_m1_1

MANDATORY: Read ORIGINAL_REQUEST.md at:
C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\ORIGINAL_REQUEST.md

Read PROJECT.md at:
C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\PROJECT.md

Read the Worker's implementation handoff at:
C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\worker_m1\handoff.md

Mission:
Adversarially challenge and stress-test the character database and helper functions in `src/data/characters.ts`:
1. Write and run stress scripts to verify:
   - Exactly 128 unique characters in `CHARACTERS_DATABASE`.
   - Character `Nobody` exists with element `'None'`, weapon `'None'`, 60 burst cost, 3 particles.
   - All 128 characters have valid elements from `ElementType` and valid weapons from `WeaponType`.
   - Name normalization stress tests (case sensitivity, trim, unknown aliases, `wrio`, `yae`, `cryo mc`, `mizuki`, `father`, `arle`, etc.).
   - Rarity filters (4★ and 5★ sum equals 128, excluding Nobody or including as designated).
   - Monogram fallback badge generation handles special names, parentheses (`Traveler (Pyro)`), and spaces.
2. Document all empirical tests and results in `handoff.md`.
3. State your explicit verdict (APPROVE or REJECT).
Maintain `progress.md` with timestamps. Report back via send_message.

## 2026-10-03T01:29:17Z
You are worker_m1, the implementation worker for Milestone 1: Infrastructure Baseline & Core Models.
Your working directory is: C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\worker_m1

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY: Read ORIGINAL_REQUEST.md at:
C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\ORIGINAL_REQUEST.md

Read the project specification at:
C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\PROJECT.md

Read the detailed findings and verified code solutions from the 3 Explorers:
- Explorer 1 (Dependencies, main.tsx, App.tsx, Header sync):
  C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\explorer_m1_1\handoff.md
  C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\explorer_m1_1\analysis_m1_1.md
- Explorer 2 (Types & Interface Contracts: infographic.ts, tierlist.ts):
  C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\explorer_m1_2\handoff.md
  C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\explorer_m1_2\analysis_m1_2.md
- Explorer 3 (128-Character Database Expansion, er.ts, characters.ts):
  C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\explorer_m1_3\handoff.md
  C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\explorer_m1_3\analysis_m1_3.md
  C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\explorer_m1_3\proposed_characters.ts
  C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\explorer_m1_3\proposed_types_er.ts

EXCLUSIVE FILE OWNERSHIP (Only you may modify these files):
- C:\Users\dabiv\ametist-impact-suite\package.json
- C:\Users\dabiv\ametist-impact-suite\index.html
- C:\Users\dabiv\ametist-impact-suite\src\main.tsx
- C:\Users\dabiv\ametist-impact-suite\src\App.tsx
- C:\Users\dabiv\ametist-impact-suite\src\types\infographic.ts
- C:\Users\dabiv\ametist-impact-suite\src\types\tierlist.ts
- C:\Users\dabiv\ametist-impact-suite\src\types\er.ts
- C:\Users\dabiv\ametist-impact-suite\src\data\characters.ts
- C:\Users\dabiv\ametist-impact-suite\src\components\Header.tsx

BRANDING REQUIREMENT (Strict Priority):
The project brand name is strictly "Astralys" (drop "Suite" completely).
- index.html title: "Astralys — Unified Genshin Tools"
- Header logo/name: "Astralys"
- Infographic default watermark: "ASTRALYS"
- All component titles/labels: "Astralys"

EXECUTION TASKS:
1. Update `package.json` to include `"xlsx": "^0.18.5"`, `"html-to-image": "^1.11.11"`, `"@types/node": "^22.7.5"`, `"tsx": "^4.19.1"`. Run `npm install` in C:\Users\dabiv\ametist-impact-suite.
2. Update `index.html` title to `<title>Astralys — Unified Genshin Tools</title>`.
3. Create `src/main.tsx` mounting into `#root` with `React.StrictMode` and `./index.css`.
4. Create `src/App.tsx` with unified `ActiveTab` state ('landing' | 'generator' | 'er' | 'tierlist' | 'damage'), cross-component state, `handleTransferER(payload: ERTransferPayload)`, crystal panel placeholder shells for generator, er calculator, and tierlists.
5. Create `src/types/infographic.ts` with complete types and `DEFAULT_WATERMARK = 'ASTRALYS'`.
6. Create `src/types/tierlist.ts` with complete version 6.7 tierlist types.
7. Update `src/types/er.ts` to include `WeaponType` and optional metadata properties per `proposed_types_er.ts`.
8. Update `src/data/characters.ts` with the complete 128-character catalog, `ASTRALYS_ELEMENT_COLORS`, 8 helper functions, and `CHARACTER_BASE_PROFILES` from `proposed_characters.ts`.
9. Update `src/components/Header.tsx` to align branding to "Astralys" and include the `'generator'` tab navigation button.

VERIFICATION REQUIREMENTS:
You MUST execute and document in your handoff report:
1. `npm install` (dependencies present in node_modules)
2. `npx tsc --noEmit` (zero errors)
3. `npm run build` (clean exit code 0, dist/index.html created)
4. Programmatic confirmation that `CHARACTERS_DATABASE` has exactly 128 entries.

Deliver your results in `handoff.md` and report back via send_message. Maintain `progress.md` with timestamps.

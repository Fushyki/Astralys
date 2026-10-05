# E2E Test Infra: Ametist Impact Suite

## Test Philosophy
- **Opaque-box & Requirement-driven**: All tests derive directly from `ORIGINAL_REQUEST.md` and user specifications, not internal implementation details.
- **Methodology**: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.
- **Progressive Testability**: Verification does not rely on features more complex than what is being tested.

## Feature Inventory & Test Mapping
| # | Feature | Source (Requirement) | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Scenario) |
|---|---------|----------------------|:-----------------:|:-----------------:|:----------------------:|:-----------------:|
| F1 | Spreadsheet (.xlsx) Parser | R1, Calc Sheet.xlsx | ≥5 | ≥5 | ✓ | ✓ |
| F2 | Raw Rotation Table Parser | R1, nj2k8acllnah1.png | ≥5 | ≥5 | ✓ | ✓ |
| F3 | 4-Section Infographic Card | R1, images.jfif | ≥5 | ≥5 | ✓ | ✓ |
| F4 | Interactive Inline Card Editing | R1, Acceptance | ≥5 | ≥5 | ✓ | ✓ |
| F5 | High-Res PNG & Clipboard Export | R1, Acceptance | ≥5 | ≥5 | ✓ | ✓ |
| F6 | Particle ER Engine (128 chars) | R2, Reference HTML | ≥5 | ≥5 | ✓ | ✓ |
| F7 | ER Special Mechanics & Toggles | R2, Reference HTML | ≥5 | ≥5 | ✓ | ✓ |
| F8 | Interactive ER Calculator UI | R2, Acceptance | ≥5 | ≥5 | ✓ | ✓ |
| F9 | One-Click ER Target Transfer | R2, Acceptance | ≥5 | ≥5 | ✓ | ✓ |
| F10 | Clean Hub Dashboard & Navigation | R3, Theme | ≥5 | ≥5 | ✓ | ✓ |
| F11 | Version 6.7 Tierlist Portal | R3, Meta 6.7 | ≥5 | ≥5 | ✓ | ✓ |
| F12 | Clean Build & Runtime | Acceptance | ≥5 | ≥5 | ✓ | ✓ |

## Test Architecture
- **Test Runner**: Node.js / TypeScript test scripts or Vitest test runner executing against compiled modules and DOM fixtures.
- **Location**: `tests/` or `src/tests/`
- **Invocation**: `npm test` or `npx tsx tests/runAllTests.ts`
- **Pass/Fail Semantics**: Process exits with code 0 on complete pass; non-zero on failure.
- **Directory Layout**:
  - `tests/tier1-features/` — Feature coverage tests in isolation
  - `tests/tier2-boundaries/` — Boundary conditions, zero particles, extreme ER%, empty inputs, formula errors
  - `tests/tier3-cross-feature/` — Integration tests (e.g., Spreadsheet parse -> Card render; ER Calculator -> Transfer to Card)
  - `tests/tier4-scenarios/` — Full end-to-end user workflows (e.g., Upload Calc Sheet.xlsx -> Transfer ER -> Export PNG)

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Sandrone Team Ingestion | F1, F3, F4, F5 | High |
| 2 | Mavuika Natlan Burn/Melt ER Calculation | F6, F7, F8, F9 | High |
| 3 | Raw Rotation Table Paste (`nj2k8acllnah1.png`) | F2, F3, F4, F5 | High |
| 4 | End-to-End Pipeline: ER Target Calculation -> Card Transfer -> PNG Export | F6, F7, F8, F9, F3, F5 | Very High |
| 5 | Multi-Team Tab Parsing & Column Switching (`Calc Sheet.xlsx`) | F1, F3, F4 | High |
| 6 | Version 6.7 Tierlist Exploration & Navigation | F10, F11 | Medium |

## Coverage Thresholds
- Tier 1: ≥60 test cases (≥5 per feature)
- Tier 2: ≥60 test cases (boundary and corner values)
- Tier 3: ≥12 pairwise integration test cases
- Tier 4: ≥6 comprehensive real-world workload scenarios
- **Total minimum**: ≥138 automated test cases

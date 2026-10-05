# Orchestrator Plan: Ametist Impact Suite

## Objective
Build and deliver "Ametist Impact Suite", a clean, modern, and responsive web application matching all requirements in ORIGINAL_REQUEST.md:
- R1: Infographic Card Generator & Spreadsheet Parser (Calc Sheet.xlsx + nj2k8acllnah1.png + images.jfif layout + export)
- R2: Energy Recharge Calculator (complete port of Calculadora_Recarga_Genshin.html, 110+ characters, identical math, 1-click transfer)
- R3: Clean Hub & Tierlist Portal (Ametist Clean theme, version 6.7 tierlists, quick navigation)
- Acceptance: npm run build passes cleanly, npm run dev starts cleanly, 100% verified.

## Phases
1. **Phase 0: Survey & Specification Mining**
   - Survey ER Calculator logic & roster from `Calculadora_Recarga_Genshin.html`.
   - Survey Infographic Card visual layout (`images.jfif`), raw table format (`nj2k8acllnah1.png`), and spreadsheet schema (`Calc Sheet.xlsx`).
   - Survey project structure, existing tooling, and dependencies in `ametist-impact-suite`.
   - Synthesize findings into `PROJECT.md` (Feature Inventory, Architecture, Code Layout, Interfaces) and `TEST_INFRA.md`.

2. **Phase 1: Milestone Decomposition & Track Setup**
   - Implementation Track:
     - M1: Core Data, Types, Assets & Calc Sheet / Raw Table Parser Engine
     - M2: Energy Recharge Calculator Engine & UI Component
     - M3: Infographic Card Generator Component, Inline Editing & High-Res PNG Export
     - M4: Clean Hub Dashboard, Version 6.7 Tierlists & Global Theme
     - M5: End-to-End Integration, Dual-Track E2E Test Suite Pass & Adversarial Hardening
   - E2E Testing Track:
     - E2E Test Suite (Tiers 1-4) covering all features, boundary cases, pairwise interactions, and real-world workloads.
     - Publishes `TEST_READY.md`.

3. **Phase 2: Execution via Direct Iteration Loops**
   - Explorer (3) -> Worker (1) -> Reviewer (2) -> Challenger (2) -> Auditor (1) -> Gate.
   - Strict audit and regression enforcement.

4. **Phase 3: Final Acceptance & Sentinel Reporting**
   - Verify `npm run build` and `npm run dev`.
   - Final review and completion report to Sentinel.

/**
 * Master E2E Test Runner for Astralys Suite
 * Executes Tiers 1-4 Automated Opaque-Box Test Suite (>=138 tests)
 * 
 * Usage: npx tsx tests/runAllTests.ts
 */

import { runRegisteredSuites, OverallSummary } from './testRunner';

// Import Tier 1: Feature Coverage (F1 to F12)
import './tier1-features/f1_spreadsheetParser.test';
import './tier1-features/f2_rawTableParser.test';
import './tier1-features/f3_infographicCard.test';
import './tier1-features/f4_inlineEditing.test';
import './tier1-features/f5_exportService.test';
import './tier1-features/f6_particleErEngine.test';
import './tier1-features/f7_erSpecialMechanics.test';
import './tier1-features/f8_erCalculatorUI.test';
import './tier1-features/f9_erTransfer.test';
import './tier1-features/f10_hubDashboard.test';
import './tier1-features/f11_tierlistPortal.test';
import './tier1-features/f12_appShellBuild.test';
import './tier1-features/f13_warroomAndVault.test';

// Import Tier 2: Boundary & Corner Cases (B1 to B12)
import './tier2-boundaries/b1_spreadsheetBoundaries.test';
import './tier2-boundaries/b2_rawTableBoundaries.test';
import './tier2-boundaries/b3_cardBoundaries.test';
import './tier2-boundaries/b4_inlineEditBoundaries.test';
import './tier2-boundaries/b5_exportBoundaries.test';
import './tier2-boundaries/b6_erEngineBoundaries.test';
import './tier2-boundaries/b7_erMechanicsBoundaries.test';
import './tier2-boundaries/b8_erUiBoundaries.test';
import './tier2-boundaries/b9_transferBoundaries.test';
import './tier2-boundaries/b10_hubBoundaries.test';
import './tier2-boundaries/b11_tierlistBoundaries.test';
import './tier2-boundaries/b12_appShellBoundaries.test';

// Import Tier 3: Cross-Feature Interactions (C1 to C4)
import './tier3-cross-feature/c1_spreadsheetToCard.test';
import './tier3-cross-feature/c2_rawTableToCard.test';
import './tier3-cross-feature/c3_erToCardTransfer.test';
import './tier3-cross-feature/c4_hubNavigationAndExport.test';

// Import Tier 4: Real-World Application Scenarios (S1 to S6)
import './tier4-scenarios/s1_sandroneWorkload.test';
import './tier4-scenarios/s2_mavuikaMeltWorkload.test';
import './tier4-scenarios/s3_flinsWorkload.test';
import './tier4-scenarios/s4_rawTableWorkload.test';
import './tier4-scenarios/s5_fullPipelineWorkload.test';
import './tier4-scenarios/s6_tierlistMetaWorkload.test';

async function main() {
  console.log('================================================================');
  console.log('       ASTRALYS SUITE — AUTOMATED E2E TEST SUITE (TIERS 1-4)    ');
  console.log('================================================================\n');

  const summary: OverallSummary = await runRegisteredSuites(true);

  // Categorize suites by Tier
  let t1Tests = 0, t1Pass = 0, t1Fail = 0;
  let t2Tests = 0, t2Pass = 0, t2Fail = 0;
  let t3Tests = 0, t3Pass = 0, t3Fail = 0;
  let t4Tests = 0, t4Pass = 0, t4Fail = 0;

  for (const s of summary.suites) {
    if (s.suiteName.includes('Tier 3') || s.suiteName.includes('Cross-Feature') || s.suiteName.includes('(C')) {
      t3Tests += s.total; t3Pass += s.passed; t3Fail += s.failed;
    } else if (s.suiteName.includes('Tier 4') || s.suiteName.includes('Scenario') || s.suiteName.includes('(S')) {
      t4Tests += s.total; t4Pass += s.passed; t4Fail += s.failed;
    } else if (s.suiteName.includes('(B') || s.suiteName.includes('Boundary')) {
      t2Tests += s.total; t2Pass += s.passed; t2Fail += s.failed;
    } else if (s.suiteName.includes('(F') || s.suiteName.includes('Feature')) {
      t1Tests += s.total; t1Pass += s.passed; t1Fail += s.failed;
    }
  }

  console.log('\n================================================================');
  console.log('                      TEST EXECUTION SUMMARY                    ');
  console.log('================================================================');
  console.log(`Tier 1 (Feature Coverage):       ${t1Pass} / ${t1Tests} passed ${t1Fail > 0 ? `(${t1Fail} FAILED)` : '✓'}`);
  console.log(`Tier 2 (Boundary & Corner Cases):${t2Pass} / ${t2Tests} passed ${t2Fail > 0 ? `(${t2Fail} FAILED)` : '✓'}`);
  console.log(`Tier 3 (Cross-Feature Flows):    ${t3Pass} / ${t3Tests} passed ${t3Fail > 0 ? `(${t3Fail} FAILED)` : '✓'}`);
  console.log(`Tier 4 (Real-World Workloads):   ${t4Pass} / ${t4Tests} passed ${t4Fail > 0 ? `(${t4Fail} FAILED)` : '✓'}`);
  console.log('----------------------------------------------------------------');
  console.log(`Total Test Cases Executed:       ${summary.totalTests} (Threshold: >= 138)`);
  console.log(`Total Passed:                    ${summary.passed}`);
  console.log(`Total Failed:                    ${summary.failed}`);
  console.log(`Total Duration:                  ${summary.durationMs}ms`);
  console.log('================================================================\n');

  if (summary.totalTests < 138) {
    console.error(`❌ FAILED: Total test count (${summary.totalTests}) is below required minimum of 138 test cases!`);
    process.exit(1);
  }

  if (summary.failed > 0) {
    console.log('\n❌ DETAILED FAILURES:');
    for (const s of summary.suites) {
      for (const t of s.tests) {
        if (!t.passed) {
          console.log(`- [${s.suiteName}] ${t.testName}: ${t.error?.message || t.error}`);
        }
      }
    }
    console.error(`\n❌ FAILED: ${summary.failed} test(s) failed during execution.`);
    process.exit(1);
  }

  console.log('✨ ALL TESTS PASSED! TEST_READY condition satisfied.');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

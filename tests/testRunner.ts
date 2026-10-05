/**
 * Lightweight, robust test runner and assertion framework for Astralys Suite test suites.
 * Compatible with Node.js 24+ and tsx.
 */

export interface TestResult {
  suiteName: string;
  testName: string;
  passed: boolean;
  error?: Error | string;
  durationMs: number;
}

export interface SuiteSummary {
  suiteName: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  tests: TestResult[];
}

export interface OverallSummary {
  totalSuites: number;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  suites: SuiteSummary[];
}

type TestFn = () => void | Promise<void>;
type SuiteFn = () => void | Promise<void>;

interface RegisteredSuite {
  name: string;
  fn: SuiteFn;
}

const registeredSuites: RegisteredSuite[] = [];
let currentSuiteName = 'Default Suite';
let currentSuiteTests: { name: string; fn: TestFn }[] = [];

export function describe(name: string, fn: SuiteFn): void {
  registeredSuites.push({ name, fn });
}

export function it(name: string, fn: TestFn): void {
  currentSuiteTests.push({ name, fn });
}

export const test = it;

class Expectation {
  constructor(private actual: any, private isNot: boolean = false) {}

  get not(): Expectation {
    return new Expectation(this.actual, !this.isNot);
  }

  toBe(expected: any): void {
    const pass = Object.is(this.actual, expected);
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion failed: expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be' : 'to be'} ${JSON.stringify(expected)}`
      );
    }
  }

  toEqual(expected: any): void {
    const actualStr = JSON.stringify(this.actual);
    const expectedStr = JSON.stringify(expected);
    const pass = deepEqual(this.actual, expected);
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion failed: expected ${actualStr} ${this.isNot ? 'NOT to equal' : 'to equal'} ${expectedStr}`
      );
    }
  }

  toBeCloseTo(expected: number, numDigits: number = 1): void {
    const diff = Math.abs(this.actual - expected);
    const tolerance = Math.pow(10, -numDigits) / 2;
    const pass = diff <= tolerance;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion failed: expected ${this.actual} ${this.isNot ? 'NOT to be close to' : 'to be close to'} ${expected} within ${tolerance} (diff: ${diff.toFixed(4)})`
      );
    }
  }

  toContain(expected: any): void {
    let pass = false;
    if (typeof this.actual === 'string') {
      pass = this.actual.includes(expected);
    } else if (Array.isArray(this.actual)) {
      pass = this.actual.some(item => deepEqual(item, expected));
    } else if (this.actual && typeof this.actual === 'object') {
      pass = expected in this.actual;
    }
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion failed: expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to contain' : 'to contain'} ${JSON.stringify(expected)}`
      );
    }
  }

  toBeGreaterThan(expected: number): void {
    const pass = this.actual > expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion failed: expected ${this.actual} ${this.isNot ? 'NOT to be greater than' : 'to be greater than'} ${expected}`
      );
    }
  }

  toBeGreaterThanOrEqual(expected: number): void {
    const pass = this.actual >= expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion failed: expected ${this.actual} ${this.isNot ? 'NOT to be >= ' : 'to be >= '} ${expected}`
      );
    }
  }

  toBeLessThan(expected: number): void {
    const pass = this.actual < expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion failed: expected ${this.actual} ${this.isNot ? 'NOT to be less than' : 'to be less than'} ${expected}`
      );
    }
  }

  toBeLessThanOrEqual(expected: number): void {
    const pass = this.actual <= expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion failed: expected ${this.actual} ${this.isNot ? 'NOT to be <= ' : 'to be <= '} ${expected}`
      );
    }
  }

  toMatch(pattern: RegExp | string): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const pass = regex.test(String(this.actual));
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion failed: expected "${this.actual}" ${this.isNot ? 'NOT to match' : 'to match'} ${regex}`
      );
    }
  }

  toBeDefined(): void {
    const pass = this.actual !== undefined;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion failed: expected value ${this.isNot ? 'to be undefined' : 'to be defined'}`
      );
    }
  }

  toBeUndefined(): void {
    const pass = this.actual === undefined;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion failed: expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be undefined' : 'to be undefined'}`
      );
    }
  }

  toBeNull(): void {
    const pass = this.actual === null;
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion failed: expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be null' : 'to be null'}`
      );
    }
  }

  toBeTruthy(): void {
    const pass = Boolean(this.actual);
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion failed: expected ${JSON.stringify(this.actual)} ${this.isNot ? 'to be falsy' : 'to be truthy'}`
      );
    }
  }

  toBeFalsy(): void {
    const pass = !Boolean(this.actual);
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion failed: expected ${JSON.stringify(this.actual)} ${this.isNot ? 'to be truthy' : 'to be falsy'}`
      );
    }
  }

  toThrow(expectedError?: string | RegExp): void {
    if (typeof this.actual !== 'function') {
      throw new Error('Assertion failed: expect target must be a function to test toThrow()');
    }
    let threw = false;
    let caughtError: any = null;
    try {
      this.actual();
    } catch (err) {
      threw = true;
      caughtError = err;
    }

    if (this.isNot) {
      if (threw) {
        throw new Error(`Assertion failed: expected function NOT to throw, but it threw: ${caughtError}`);
      }
    } else {
      if (!threw) {
        throw new Error('Assertion failed: expected function to throw an error, but it did not throw');
      }
      if (expectedError) {
        const msg = caughtError?.message || String(caughtError);
        if (typeof expectedError === 'string') {
          if (!msg.includes(expectedError)) {
            throw new Error(`Assertion failed: expected error to contain "${expectedError}", but got "${msg}"`);
          }
        } else if (expectedError instanceof RegExp) {
          if (!expectedError.test(msg)) {
            throw new Error(`Assertion failed: expected error to match ${expectedError}, but got "${msg}"`);
          }
        }
      }
    }
  }
}

export function expect(actual: any): Expectation {
  return new Expectation(actual);
}

function deepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!deepEqual(a[k], b[k])) return false;
  }
  return true;
}

export async function runRegisteredSuites(verbose: boolean = true): Promise<OverallSummary> {
  const overallStart = Date.now();
  const suiteSummaries: SuiteSummary[] = [];

  for (const suite of registeredSuites) {
    currentSuiteName = suite.name;
    currentSuiteTests = [];
    const suiteStart = Date.now();

    try {
      await suite.fn();
    } catch (err: any) {
      if (verbose) {
        console.error(`  [ERROR in suite setup: ${suite.name}]`, err);
      }
    }

    const testResults: TestResult[] = [];
    let passed = 0;
    let failed = 0;

    if (verbose) {
      console.log(`\n=== SUITE: ${suite.name} ===`);
    }

    for (const testCase of currentSuiteTests) {
      const tStart = Date.now();
      try {
        await testCase.fn();
        const durationMs = Date.now() - tStart;
        testResults.push({
          suiteName: suite.name,
          testName: testCase.name,
          passed: true,
          durationMs
        });
        passed++;
        if (verbose) {
          console.log(`  ✓ PASS: ${testCase.name} (${durationMs}ms)`);
        }
      } catch (err: any) {
        const durationMs = Date.now() - tStart;
        testResults.push({
          suiteName: suite.name,
          testName: testCase.name,
          passed: false,
          error: err,
          durationMs
        });
        failed++;
        if (verbose) {
          console.log(`  ✗ FAIL: ${testCase.name} (${durationMs}ms)`);
          console.log(`    Message: ${err?.message || err}`);
        }
      }
    }

    suiteSummaries.push({
      suiteName: suite.name,
      total: testResults.length,
      passed,
      failed,
      skipped: 0,
      durationMs: Date.now() - suiteStart,
      tests: testResults
    });
  }

  const totalDuration = Date.now() - overallStart;
  const totalTests = suiteSummaries.reduce((acc, s) => acc + s.total, 0);
  const totalPassed = suiteSummaries.reduce((acc, s) => acc + s.passed, 0);
  const totalFailed = suiteSummaries.reduce((acc, s) => acc + s.failed, 0);

  return {
    totalSuites: suiteSummaries.length,
    totalTests,
    passed: totalPassed,
    failed: totalFailed,
    skipped: 0,
    durationMs: totalDuration,
    suites: suiteSummaries
  };
}

export function clearRegistry(): void {
  registeredSuites.length = 0;
  currentSuiteTests = [];
}

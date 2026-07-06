/**
 * Compensation Engine Tests - PPh21 & BPJS Calculations (2026)
 *
 * Tests against DJP (Direktorat Jenderal Pajak) official examples
 * and BPJS regulations for 2026.
 *
 * Run: node tests/compensation-engine.test.js
 */

import CompensationEngine from '../src/shared/services/compensation-engine.js';

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  test(description, fn) {
    this.tests.push({ description, fn });
  }

  assertEqual(actual, expected, message = '') {
    const tolerance = 1; // Allow Rp 1 difference due to rounding
    const diff = Math.abs(actual - expected);

    if (diff <= tolerance) {
      this.passed++;
      console.log(`  ${colors.green}✓${colors.reset} ${message || 'Assertion passed'}`);
      console.log(`    Expected: ${this.formatCurrency(expected)}, Got: ${this.formatCurrency(actual)}`);
      return true;
    } else {
      this.failed++;
      console.log(`  ${colors.red}✗${colors.reset} ${message || 'Assertion failed'}`);
      console.log(`    Expected: ${this.formatCurrency(expected)}, Got: ${this.formatCurrency(actual)}, Diff: ${this.formatCurrency(diff)}`);
      return false;
    }
  }

  assertTrue(condition, message = '') {
    if (condition) {
      this.passed++;
      console.log(`  ${colors.green}✓${colors.reset} ${message || 'Assertion passed'}`);
      return true;
    } else {
      this.failed++;
      console.log(`  ${colors.red}✗${colors.reset} ${message || 'Assertion failed'}`);
      return false;
    }
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  async run() {
    console.log(`\n${colors.bold}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}  COMPENSATION ENGINE TESTS - 2026 DJP & BPJS${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

    for (const { description, fn } of this.tests) {
      console.log(`${colors.bold}${description}${colors.reset}`);
      try {
        await fn.call(this);
      } catch (err) {
        this.failed++;
        console.log(`  ${colors.red}✗ Test threw error:${colors.reset} ${err.message}`);
      }
      console.log('');
    }

    // Summary
    console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
    const total = this.passed + this.failed;
    const passRate = total > 0 ? ((this.passed / total) * 100).toFixed(1) : 0;

    if (this.failed === 0) {
      console.log(`${colors.bold}${colors.green}✓ ALL TESTS PASSED${colors.reset} (${this.passed}/${total})`);
    } else {
      console.log(`${colors.bold}RESULTS:${colors.reset} ${colors.green}${this.passed} passed${colors.reset}, ${colors.red}${this.failed} failed${colors.reset} (${passRate}% pass rate)`);
    }
    console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

    // Exit code
    process.exit(this.failed > 0 ? 1 : 0);
  }
}

// ════════════════════════════════════════════════════════
// TEST CASES
// ════════════════════════════════════════════════════════

const runner = new TestRunner();

// ────────────────────────────────────────────────────────
// TEST GROUP 1: PPh21 Layer 1 (0-60M @ 5%)
// ────────────────────────────────────────────────────────

runner.test('PPh21 Layer 1: Rp 5M/month (Rp 60M/year) - PTKP exemption only', function() {
  // Gross: 5M/month × 12 = 60M/year
  // Taxable: 60M - 54M (PTKP) = 6M
  // Tax: 6M × 5% = 300K/year = 25K/month
  const result = CompensationEngine.calculate({
    base_salary: 5_000_000,
    allowances: {},
    bonus_structure: {}
  });

  this.assertEqual(result.pph21, 25_000, 'PPh21 monthly = 25K');
  this.assertEqual(result.metadata.breakdown.pph21_annual, 300_000, 'PPh21 annual = 300K');
});

runner.test('PPh21 Layer 1→2: Rp 10M/month (Rp 120M/year)', function() {
  // Gross: 10M/month × 12 = 120M/year
  // Taxable: 120M - 54M = 66M
  // Layer 1: 60M × 5% = 3M
  // Layer 2: 6M × 15% = 900K (NOT 5% - bracket changes at 60M!)
  // Total: 3M + 900K = 3.9M/year = 325K/month
  const result = CompensationEngine.calculate({
    base_salary: 10_000_000,
    allowances: {},
    bonus_structure: {}
  });

  this.assertEqual(result.pph21, 325_000, 'PPh21 monthly = 325K');
  this.assertEqual(result.metadata.breakdown.pph21_annual, 3_900_000, 'PPh21 annual = 3.9M');
});

// ────────────────────────────────────────────────────────
// TEST GROUP 2: PPh21 Layer 2 (60M-250M @ 15%)
// ────────────────────────────────────────────────────────

runner.test('PPh21 Layer 2: Rp 15M/month (Rp 180M/year)', function() {
  // Gross: 15M × 12 = 180M/year
  // Taxable: 180M - 54M = 126M
  // Layer 1: 60M × 5% = 3M
  // Layer 2: 66M × 15% = 9.9M
  // Total tax: 3M + 9.9M = 12.9M/year = 1,075,000/month
  const result = CompensationEngine.calculate({
    base_salary: 15_000_000,
    allowances: {},
    bonus_structure: {}
  });

  this.assertEqual(result.pph21, 1_075_000, 'PPh21 monthly = 1.075M');
  this.assertEqual(result.metadata.breakdown.pph21_annual, 12_900_000, 'PPh21 annual = 12.9M');
});

runner.test('PPh21 Layer 2: Rp 20M/month (Rp 240M/year)', function() {
  // Gross: 20M × 12 = 240M/year
  // Taxable: 240M - 54M = 186M
  // Layer 1: 60M × 5% = 3M
  // Layer 2: 126M × 15% = 18.9M
  // Total tax: 3M + 18.9M = 21.9M/year = 1,825,000/month
  const result = CompensationEngine.calculate({
    base_salary: 20_000_000,
    allowances: {},
    bonus_structure: {}
  });

  this.assertEqual(result.pph21, 1_825_000, 'PPh21 monthly = 1.825M');
  this.assertEqual(result.metadata.breakdown.pph21_annual, 21_900_000, 'PPh21 annual = 21.9M');
});

// ────────────────────────────────────────────────────────
// TEST GROUP 3: PPh21 Layer 3 (250M-500M @ 25%)
// ────────────────────────────────────────────────────────

runner.test('PPh21 Layer 3: Rp 30M/month (Rp 360M/year)', function() {
  // Gross: 30M × 12 = 360M/year
  // Taxable: 360M - 54M = 306M
  // Layer 1: 60M × 5% = 3M
  // Layer 2: 190M × 15% = 28.5M
  // Layer 3: 56M × 25% = 14M
  // Total tax: 3M + 28.5M + 14M = 45.5M/year = 3,791,667/month
  const result = CompensationEngine.calculate({
    base_salary: 30_000_000,
    allowances: {},
    bonus_structure: {}
  });

  this.assertEqual(result.pph21, 3_791_667, 'PPh21 monthly = 3.79M');
  this.assertEqual(result.metadata.breakdown.pph21_annual, 45_500_000, 'PPh21 annual = 45.5M');
});

// ────────────────────────────────────────────────────────
// TEST GROUP 4: BPJS Kesehatan (1% capped at 12M)
// ────────────────────────────────────────────────────────

runner.test('BPJS Kesehatan: Rp 5M/month (below cap)', function() {
  // 5M × 1% = 50K
  const result = CompensationEngine.calculate({
    base_salary: 5_000_000,
    allowances: {},
    bonus_structure: {}
  });

  this.assertEqual(result.bpjs_kesehatan, 50_000, 'BPJS Kesehatan = 50K');
});

runner.test('BPJS Kesehatan: Rp 15M/month (above cap)', function() {
  // Capped at 12M → 12M × 1% = 120K (not 15M × 1% = 150K)
  const result = CompensationEngine.calculate({
    base_salary: 15_000_000,
    allowances: {},
    bonus_structure: {}
  });

  this.assertEqual(result.bpjs_kesehatan, 120_000, 'BPJS Kesehatan capped at 120K');
});

runner.test('BPJS Kesehatan: Rp 20M/month (well above cap)', function() {
  // Still capped at 12M → 120K
  const result = CompensationEngine.calculate({
    base_salary: 20_000_000,
    allowances: {},
    bonus_structure: {}
  });

  this.assertEqual(result.bpjs_kesehatan, 120_000, 'BPJS Kesehatan capped at 120K');
});

// ────────────────────────────────────────────────────────
// TEST GROUP 5: BPJS Ketenagakerjaan (JHT 2% + JP 1%)
// ────────────────────────────────────────────────────────

runner.test('BPJS Ketenagakerjaan: Rp 5M/month (below cap)', function() {
  // JHT: 5M × 2% = 100K
  // JP: 5M × 1% = 50K
  // Total: 150K
  const result = CompensationEngine.calculate({
    base_salary: 5_000_000,
    allowances: {},
    bonus_structure: {}
  });

  this.assertEqual(result.bpjs_ketenagakerjaan, 150_000, 'BPJS Ketenagakerjaan = 150K');
});

runner.test('BPJS Ketenagakerjaan: Rp 15M/month (above cap)', function() {
  // Capped at 10,143,200
  // JHT: 10,143,200 × 2% = 202,864
  // JP: 10,143,200 × 1% = 101,432
  // Total: 304,296
  const result = CompensationEngine.calculate({
    base_salary: 15_000_000,
    allowances: {},
    bonus_structure: {}
  });

  this.assertEqual(result.bpjs_ketenagakerjaan, 304_296, 'BPJS Ketenagakerjaan capped at 304,296');
});

// ────────────────────────────────────────────────────────
// TEST GROUP 6: Full Compensation Breakdown (Real-world)
// ────────────────────────────────────────────────────────

runner.test('Full calculation: Rp 15M base + Rp 2M allowances', function() {
  const result = CompensationEngine.calculate({
    base_salary: 15_000_000,
    allowances: {
      transport: 1_000_000,
      meal: 500_000,
      communication: 500_000
    },
    bonus_structure: {}
  });

  // Gross: 15M + 2M = 17M
  this.assertEqual(result.gross_salary, 17_000_000, 'Gross = 17M');

  // PPh21: (17M × 12 - 54M) = 150M taxable
  // Layer 1: 60M × 5% = 3M
  // Layer 2: 90M × 15% = 13.5M
  // Total: 16.5M/year = 1,375,000/month
  this.assertEqual(result.pph21, 1_375_000, 'PPh21 = 1.375M');

  // BPJS Kesehatan: 12M cap × 1% = 120K (gross 17M exceeds cap)
  this.assertEqual(result.bpjs_kesehatan, 120_000, 'BPJS Kesehatan = 120K');

  // BPJS Ketenagakerjaan: 10,143,200 cap × 3% = 304,296
  this.assertEqual(result.bpjs_ketenagakerjaan, 304_296, 'BPJS Ketenagakerjaan = 304,296');

  // Net: 17M - 1,375,000 - 120,000 - 304,296 = 15,200,704
  this.assertEqual(result.net_salary, 15_200_704, 'Net salary = 15.2M');
});

runner.test('Full calculation: Rp 20M base + Rp 24M annual bonus', function() {
  const result = CompensationEngine.calculate({
    base_salary: 20_000_000,
    allowances: {},
    bonus_structure: {
      annual_bonus: 24_000_000 // 1 month salary as bonus
    }
  });

  // Gross monthly: 20M
  // Gross annual: 20M × 12 + 24M = 264M
  this.assertEqual(result.gross_salary, 20_000_000, 'Gross monthly = 20M');
  this.assertEqual(result.metadata.breakdown.gross_salary_annual, 264_000_000, 'Gross annual = 264M');

  // PPh21: (264M - 54M) = 210M taxable
  // Layer 1: 60M × 5% = 3M
  // Layer 2: 150M × 15% = 22.5M
  // Total: 25.5M/year = 2,125,000/month
  this.assertEqual(result.pph21, 2_125_000, 'PPh21 = 2.125M (includes bonus tax)');

  // Net: 20M - 2,125,000 - 120,000 - 304,296 = 17,450,704
  this.assertEqual(result.net_salary, 17_450_704, 'Net salary = 17.45M');
});

// ────────────────────────────────────────────────────────
// TEST GROUP 7: Edge Cases
// ────────────────────────────────────────────────────────

runner.test('Edge case: Below PTKP threshold (no tax)', function() {
  // 4M × 12 = 48M < 54M PTKP → no tax
  const result = CompensationEngine.calculate({
    base_salary: 4_000_000,
    allowances: {},
    bonus_structure: {}
  });

  this.assertEqual(result.pph21, 0, 'PPh21 = 0 (below PTKP)');
  this.assertTrue(result.net_salary > 0, 'Net salary is positive');
});

runner.test('Edge case: Exactly at PTKP threshold', function() {
  // 4.5M × 12 = 54M = PTKP → no tax
  const result = CompensationEngine.calculate({
    base_salary: 4_500_000,
    allowances: {},
    bonus_structure: {}
  });

  this.assertEqual(result.pph21, 0, 'PPh21 = 0 (exactly PTKP)');
});

runner.test('Edge case: Rp 1 above PTKP (monthly)', function() {
  // 4,500,001 × 12 = 54,000,012 annual
  // Taxable: 54,000,012 - 54,000,000 = 12
  // Tax: 12 × 5% = 0.6 annual = 0.05/month → rounds to 0
  // Note: Monthly rounding makes this effectively 0
  const result = CompensationEngine.calculate({
    base_salary: 4_500_001,
    allowances: {},
    bonus_structure: {}
  });

  // Annual tax should be minimal (0.6 rupiah)
  this.assertTrue(result.metadata.breakdown.pph21_annual >= 0, 'PPh21 annual ≥ 0');
  this.assertTrue(result.metadata.breakdown.pph21_annual < 10, 'PPh21 annual < 10 (minimal)');

  // Monthly rounds to 0
  this.assertEqual(result.pph21, 0, 'PPh21 monthly = 0 (rounds down from 0.05)');
});

runner.test('Edge case: Very high salary (Layer 4+)', function() {
  // 100M/month × 12 = 1.2B/year
  // Layer 1: 60M × 5% = 3M
  // Layer 2: 190M × 15% = 28.5M
  // Layer 3: 250M × 25% = 62.5M
  // Layer 4: 646M × 30% = 193.8M (1.2B - 54M PTKP - 500M brackets)
  // Total: 287.8M/year = 23,983,333/month
  const result = CompensationEngine.calculate({
    base_salary: 100_000_000,
    allowances: {},
    bonus_structure: {}
  });

  this.assertTrue(result.pph21 > 20_000_000, 'PPh21 > 20M (high bracket)');
  this.assertEqual(result.bpjs_kesehatan, 120_000, 'BPJS Kesehatan still capped');
  this.assertEqual(result.bpjs_ketenagakerjaan, 304_296, 'BPJS Ketenagakerjaan still capped');
});

// ────────────────────────────────────────────────────────
// TEST GROUP 8: Reverse Calculation
// ────────────────────────────────────────────────────────

runner.test('Reverse calculation: Find gross for net 10M', function() {
  const result = CompensationEngine.reverseCalculate(10_000_000);

  this.assertTrue(result.net_salary >= 9_999_000 && result.net_salary <= 10_001_000,
    `Net salary ~10M (got ${this.formatCurrency(result.net_salary)})`);
  this.assertTrue(result.gross_salary > 10_000_000, 'Gross > Net (deductions exist)');
});

runner.test('Reverse calculation: Find gross for net 15M', function() {
  const result = CompensationEngine.reverseCalculate(15_000_000);

  this.assertTrue(result.net_salary >= 14_999_000 && result.net_salary <= 15_001_000,
    `Net salary ~15M (got ${this.formatCurrency(result.net_salary)})`);
});

// ────────────────────────────────────────────────────────
// RUN ALL TESTS
// ────────────────────────────────────────────────────────

runner.run();

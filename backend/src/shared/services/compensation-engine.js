/**
 * Compensation Engine - Indonesian Tax & BPJS Calculator (2026)
 *
 * Calculates:
 * - Gross salary (base + allowances)
 * - PPh21 (Indonesian income tax) using 2026 DJP rates
 * - BPJS Kesehatan (health insurance - employee portion)
 * - BPJS Ketenagakerjaan (employment insurance)
 * - Net salary (take-home pay)
 *
 * References:
 * - PPh21 2026: Layer 1: 5% (0-60M), Layer 2: 15% (60-250M), Layer 3: 25% (250-500M), etc.
 * - BPJS Kesehatan 2026: 1% of gross (max cap: Rp 12,000,000)
 * - BPJS Ketenagakerjaan 2026: JHT 2% + JP 1% (max cap varies)
 */

class CompensationEngine {
  // PPh21 2026 Tax Brackets (annual)
  static PPH21_BRACKETS = [
    { limit: 60_000_000, rate: 0.05 },   // Layer 1: 0-60M @ 5%
    { limit: 250_000_000, rate: 0.15 },  // Layer 2: 60-250M @ 15%
    { limit: 500_000_000, rate: 0.25 },  // Layer 3: 250-500M @ 25%
    { limit: 5_000_000_000, rate: 0.30 }, // Layer 4: 500M-5B @ 30%
    { limit: Infinity, rate: 0.35 }      // Layer 5: >5B @ 35%
  ];

  // BPJS Kesehatan 2026 rates (employee portion)
  static BPJS_KESEHATAN_RATE = 0.01; // 1% of gross
  static BPJS_KESEHATAN_MAX_SALARY = 12_000_000; // max salary cap for calculation

  // BPJS Ketenagakerjaan 2026 rates (employee portion)
  static BPJS_JHT_RATE = 0.02; // Jaminan Hari Tua (Old Age Security) 2%
  static BPJS_JP_RATE = 0.01;  // Jaminan Pensiun (Pension) 1%
  static BPJS_KETENAGAKERJAAN_MAX_SALARY = 10_143_200; // 2026 max wage cap

  // PTKP 2026 (Tax-Free Income Threshold)
  static PTKP_TK0 = 54_000_000; // Single, no dependents (annual)

  /**
   * Main calculation method
   * @param {Object} params
   * @param {number} params.base_salary - Monthly base salary
   * @param {Object} params.allowances - { transport: 500000, meal: 300000, etc }
   * @param {Object} params.bonus_structure - { annual_bonus: 12000000, etc }
   * @returns {Object} Compensation breakdown
   */
  static calculate({ base_salary, allowances = {}, bonus_structure = {} }) {
    // 1. Calculate gross salary (monthly)
    const total_allowances = Object.values(allowances).reduce((sum, val) => sum + (val || 0), 0);
    const gross_salary_monthly = base_salary + total_allowances;

    // 2. Calculate annual gross for tax purposes
    const annual_bonus = Object.values(bonus_structure).reduce((sum, val) => sum + (val || 0), 0);
    const gross_salary_annual = (gross_salary_monthly * 12) + annual_bonus;

    // 3. Calculate PPh21 (annual, then divide by 12)
    const pph21_annual = this.calculatePPh21(gross_salary_annual);
    const pph21_monthly = pph21_annual / 12;

    // 4. Calculate BPJS Kesehatan (monthly)
    const bpjs_kesehatan = this.calculateBPJSKesehatan(gross_salary_monthly);

    // 5. Calculate BPJS Ketenagakerjaan (monthly)
    const bpjs_ketenagakerjaan = this.calculateBPJSKetenagakerjaan(gross_salary_monthly);

    // 6. Calculate net salary (take-home)
    const total_deductions = pph21_monthly + bpjs_kesehatan + bpjs_ketenagakerjaan;
    const net_salary = gross_salary_monthly - total_deductions;

    return {
      gross_salary: Math.round(gross_salary_monthly),
      pph21: Math.round(pph21_monthly),
      bpjs_kesehatan: Math.round(bpjs_kesehatan),
      bpjs_ketenagakerjaan: Math.round(bpjs_ketenagakerjaan),
      net_salary: Math.round(net_salary),
      metadata: {
        calculation_date: new Date().toISOString(),
        engine_version: '1.0.0',
        tax_year: 2026,
        breakdown: {
          base_salary,
          total_allowances,
          gross_salary_monthly: Math.round(gross_salary_monthly),
          gross_salary_annual: Math.round(gross_salary_annual),
          annual_bonus,
          pph21_annual: Math.round(pph21_annual),
          pph21_monthly: Math.round(pph21_monthly),
          bpjs_kesehatan: Math.round(bpjs_kesehatan),
          bpjs_jht: Math.round(gross_salary_monthly * this.BPJS_JHT_RATE),
          bpjs_jp: Math.round(gross_salary_monthly * this.BPJS_JP_RATE),
          total_deductions: Math.round(total_deductions),
          net_salary: Math.round(net_salary)
        }
      }
    };
  }

  /**
   * Calculate PPh21 (Indonesian Income Tax) - Annual amount
   * Uses progressive tax brackets
   */
  static calculatePPh21(annual_gross) {
    // Taxable income = gross - PTKP
    const taxable_income = Math.max(0, annual_gross - this.PTKP_TK0);

    if (taxable_income === 0) {
      return 0;
    }

    let tax = 0;
    let remaining = taxable_income;
    let previous_limit = 0;

    for (const bracket of this.PPH21_BRACKETS) {
      const bracket_range = bracket.limit - previous_limit;
      const taxable_in_bracket = Math.min(remaining, bracket_range);

      if (taxable_in_bracket > 0) {
        tax += taxable_in_bracket * bracket.rate;
        remaining -= taxable_in_bracket;
      }

      if (remaining <= 0) break;
      previous_limit = bracket.limit;
    }

    return tax;
  }

  /**
   * Calculate BPJS Kesehatan (Health Insurance) - Employee portion
   */
  static calculateBPJSKesehatan(gross_monthly) {
    const capped_salary = Math.min(gross_monthly, this.BPJS_KESEHATAN_MAX_SALARY);
    return capped_salary * this.BPJS_KESEHATAN_RATE;
  }

  /**
   * Calculate BPJS Ketenagakerjaan (Employment Insurance)
   * Includes JHT (Old Age) + JP (Pension)
   */
  static calculateBPJSKetenagakerjaan(gross_monthly) {
    const capped_salary = Math.min(gross_monthly, this.BPJS_KETENAGAKERJAAN_MAX_SALARY);
    const jht = capped_salary * this.BPJS_JHT_RATE;
    const jp = capped_salary * this.BPJS_JP_RATE;
    return jht + jp;
  }

  /**
   * Calculate employer costs (for internal budgeting)
   * Not deducted from employee salary
   */
  static calculateEmployerCosts(gross_monthly) {
    const capped_kesehatan = Math.min(gross_monthly, this.BPJS_KESEHATAN_MAX_SALARY);
    const capped_ketenagakerjaan = Math.min(gross_monthly, this.BPJS_KETENAGAKERJAAN_MAX_SALARY);

    return {
      bpjs_kesehatan_employer: capped_kesehatan * 0.04, // 4% employer portion
      bpjs_jht_employer: capped_ketenagakerjaan * 0.037, // 3.7%
      bpjs_jkk: capped_ketenagakerjaan * 0.0024, // 0.24% (work accident insurance)
      bpjs_jkm: capped_ketenagakerjaan * 0.003, // 0.30% (death insurance)
      total_employer_cost: function() {
        return this.bpjs_kesehatan_employer + this.bpjs_jht_employer + this.bpjs_jkk + this.bpjs_jkm;
      }
    };
  }

  /**
   * Reverse calculation - given desired net salary, calculate required gross
   * (Iterative approximation method)
   */
  static reverseCalculate(desired_net_salary, allowances = {}, bonus_structure = {}) {
    let low = desired_net_salary;
    let high = desired_net_salary * 1.5; // assume max 50% deductions
    let iterations = 0;
    const max_iterations = 20;
    const tolerance = 1000; // Rp 1,000

    while (iterations < max_iterations) {
      const mid = (low + high) / 2;
      const result = this.calculate({ base_salary: mid, allowances, bonus_structure });

      if (Math.abs(result.net_salary - desired_net_salary) < tolerance) {
        return result;
      }

      if (result.net_salary < desired_net_salary) {
        low = mid;
      } else {
        high = mid;
      }

      iterations++;
    }

    // Return closest approximation
    return this.calculate({ base_salary: (low + high) / 2, allowances, bonus_structure });
  }
}

export default CompensationEngine;

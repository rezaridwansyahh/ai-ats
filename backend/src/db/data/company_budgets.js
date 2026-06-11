// Company Budget Seed Data
// Task 6.12: AI cost cap + 80% alert
// Default budgets for all companies

/**
 * Get first day of current month in YYYY-MM-DD format
 * @returns {string} e.g., '2026-06-01'
 */
function getCurrentMonthStart() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

/**
 * Default AI budget configuration
 *
 * Rationale for $100/month default:
 * - Normal usage (20 jobs, 500 candidates/3mo): ~$2.55/month
 * - Provides 40× safety margin
 * - High-volume testing (100 psych assessments × 4 batteries): ~$48
 * - Allows ~2 full test runs before cap
 *
 * Adjust per pilot contract:
 * - Small pilots (10-20 candidates): $50/month
 * - Standard pilots (50-100 candidates): $100/month
 * - Enterprise pilots (200+ candidates): $200/month
 */
const DEFAULT_BUDGET_USD = 100.00;

/**
 * Company budget seed data
 * Creates budgets for current month for all existing companies
 */
const companyBudgetsData = [
  // Company #1: Myralix (internal testing)
  {
    company_id: 1,
    month_year: getCurrentMonthStart(),
    budget_usd: 200.00,  // Higher limit for internal testing
    alert_80_sent: false,
  },

  // Company #2: Acme Recruiting (pilot company)
  {
    company_id: 2,
    month_year: getCurrentMonthStart(),
    budget_usd: DEFAULT_BUDGET_USD,
    alert_80_sent: false,
  },
];

/**
 * Generate budget for a specific company
 * Used by seeder to create budgets for companies not in seed data above
 *
 * @param {number} companyId - Company ID
 * @param {number} budgetUsd - Budget amount (defaults to $100)
 * @returns {object} Budget record
 */
export function createCompanyBudget(companyId, budgetUsd = DEFAULT_BUDGET_USD) {
  return {
    company_id: companyId,
    month_year: getCurrentMonthStart(),
    budget_usd: budgetUsd,
    alert_80_sent: false,
  };
}

export { DEFAULT_BUDGET_USD, getCurrentMonthStart };
export default companyBudgetsData;

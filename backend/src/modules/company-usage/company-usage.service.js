import CompanyUsageModel from './company-usage.model.js';
import logger from '../../shared/utils/logger.js';
import getDb from '../../config/postgres.js';

// Per-million pricing for the OpenAI models we use.
// Source: https://openai.com/api/pricing (gpt-4o-mini, as of 2026).
const PRICING_USD_PER_M = {
  'gpt-4o-mini':       { input: 0.15,  output: 0.60 },
  'gpt-4o':            { input: 2.50,  output: 10.00 },
  'gpt-4.1-mini':      { input: 0.40,  output: 1.60 },
};

export function estimateCostUsd(model, prompt_tokens = 0, completion_tokens = 0) {
  const p = PRICING_USD_PER_M[model];
  if (!p) return null;
  const cost = (prompt_tokens * p.input + completion_tokens * p.output) / 1_000_000;
  return Number(cost.toFixed(6));
}

/**
 * Get first day of current month as ISO date string
 * @returns {string} e.g., '2026-06-01'
 */
function getCurrentMonthStart() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

class CompanyUsageService {
  // Fire-and-forget: never bubble logging errors into the caller.
  async log({ context = {}, model, operation, usage = {}, request_id = null, metadata = null }) {
    try {
      const prompt_tokens     = Number(usage.prompt_tokens)     || 0;
      const completion_tokens = Number(usage.completion_tokens) || 0;
      const total_tokens      = Number(usage.total_tokens)      || (prompt_tokens + completion_tokens);
      const estimated_cost_usd = estimateCostUsd(model, prompt_tokens, completion_tokens);

      return await CompanyUsageModel.insert({
        company_id: context.company_id ?? null,
        user_id:    context.user_id    ?? null,
        service:    'openai',
        model,
        operation,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        estimated_cost_usd,
        request_id,
        metadata: metadata || context.metadata || null,
      });
    } catch (err) {
      logger.error?.(`company_usage log failed: ${err.message}`);
    }
  }

  async list(company_id, opts) {
    return await CompanyUsageModel.listByCompany(Number(company_id), opts);
  }

  async summary(company_id, opts) {
    return await CompanyUsageModel.summaryByCompany(Number(company_id), opts);
  }

  /**
   * Get or create budget for current month
   * @param {number} company_id - Company ID
   * @returns {Promise<object>} Budget record { id, company_id, month_year, budget_usd, alert_80_sent }
   */
  async getCurrentBudget(company_id) {
    const monthStart = getCurrentMonthStart();

    const result = await getDb().query(
      `SELECT * FROM company_budgets
       WHERE company_id = $1 AND month_year = $2`,
      [company_id, monthStart]
    );

    if (result.rows.length === 0) {
      // Create default budget if none exists (Task 6.12: default $100/month)
      const insert = await getDb().query(
        `INSERT INTO company_budgets (company_id, month_year, budget_usd)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [company_id, monthStart, 100.00]
      );
      return insert.rows[0];
    }

    return result.rows[0];
  }

  /**
   * Get month-to-date AI spend for a company
   * @param {number} company_id - Company ID
   * @returns {Promise<number>} Total USD spent this month
   */
  async getMonthToDateSpend(company_id) {
    const monthStart = new Date(getCurrentMonthStart());

    const result = await getDb().query(
      `SELECT COALESCE(SUM(estimated_cost_usd), 0) as total_usd
       FROM company_usage
       WHERE company_id = $1
         AND created_at >= $2`,
      [company_id, monthStart.toISOString()]
    );

    return Number(result.rows[0].total_usd);
  }

  /**
   * Check if company is within budget, throw 402 if exceeded
   * Called BEFORE every AI operation (Task 6.12: AI cost cap)
   *
   * @param {number} company_id - Company ID
   * @throws {Error} 402 if budget exceeded
   * @returns {Promise<object>} { budget, spent, remaining }
   */
  async checkBudgetOrThrow(company_id) {
    if (!company_id) {
      throw new Error('company_id required for budget check');
    }

    const budget = await this.getCurrentBudget(company_id);
    const spent = await this.getMonthToDateSpend(company_id);
    const remaining = budget.budget_usd - spent;

    // Budget exceeded → throw 402
    if (remaining <= 0) {
      const err = new Error('AI budget exceeded for this month');
      err.status = 402;  // Payment Required
      err.budget = Number(budget.budget_usd);
      err.spent = Number(spent);
      throw err;
    }

    // Check 80% threshold for alert (Task 6.12: 80% alert)
    const percentUsed = (spent / budget.budget_usd) * 100;
    if (percentUsed >= 80 && !budget.alert_80_sent) {
      // Fire async alert (non-blocking)
      this._sendBudgetAlert(company_id, budget, spent).catch(err => {
        logger.error('Budget alert failed:', err);
      });

      // Mark alert as sent (idempotent, once per month)
      await getDb().query(
        `UPDATE company_budgets
         SET alert_80_sent = true, updated_at = NOW()
         WHERE id = $1`,
        [budget.id]
      );
    }

    return { budget: Number(budget.budget_usd), spent: Number(spent), remaining: Number(remaining) };
  }

  /**
   * Update budget for current month
   * @param {number} company_id - Company ID
   * @param {number} budget_usd - New budget amount
   * @returns {Promise<object>} Updated budget record
   */
  async updateCurrentBudget(company_id, budget_usd) {
    const monthStart = getCurrentMonthStart();

    const result = await getDb().query(
      `UPDATE company_budgets
       SET budget_usd = $1, updated_at = NOW()
       WHERE company_id = $2 AND month_year = $3
       RETURNING *`,
      [budget_usd, company_id, monthStart]
    );

    if (result.rows.length === 0) {
      // Create if doesn't exist
      const insert = await getDb().query(
        `INSERT INTO company_budgets (company_id, month_year, budget_usd)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [company_id, monthStart, budget_usd]
      );
      return insert.rows[0];
    }

    return result.rows[0];
  }

  /**
   * Send Slack alert when company hits 80% of budget
   * Fire-and-forget, never throws
   *
   * @param {number} company_id - Company ID
   * @param {object} budget - Budget record
   * @param {number} spent - Amount spent so far
   * @private
   */
  async _sendBudgetAlert(company_id, budget, spent) {
    try {
      const percentUsed = Math.round((spent / budget.budget_usd) * 100);

      // Get company name
      const companyResult = await getDb().query(
        'SELECT name FROM core_company WHERE id = $1',
        [company_id]
      );
      const companyName = companyResult.rows[0]?.name || `Company #${company_id}`;

      const slackWebhook = process.env.SLACK_BUDGET_ALERT_WEBHOOK;
      if (!slackWebhook) {
        logger.warn('SLACK_BUDGET_ALERT_WEBHOOK not configured — skipping budget alert');
        return;
      }

      const message = {
        text: `🚨 AI Budget Alert: ${companyName}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*🚨 AI Budget Alert*\n*Company:* ${companyName}\n*Used:* $${spent.toFixed(2)} / $${budget.budget_usd.toFixed(2)} (${percentUsed}%)\n*Month:* ${budget.month_year}\n\n_Budget will be enforced at 100%. Increase limit in \`company_budgets\` table if needed._`
            }
          }
        ]
      };

      // Use fetch to send webhook
      const response = await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status}`);
      }

      logger.info(`Budget alert sent for company ${company_id} (${percentUsed}% used)`);
    } catch (err) {
      logger.error('_sendBudgetAlert error:', err);
      // Don't throw — this is fire-and-forget
    }
  }
}

export default new CompanyUsageService();

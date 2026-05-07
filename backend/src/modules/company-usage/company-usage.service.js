import CompanyUsageModel from './company-usage.model.js';
import logger from '../../shared/utils/logger.js';

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
}

export default new CompanyUsageService();

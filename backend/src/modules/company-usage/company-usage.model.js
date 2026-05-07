import getDb from '../../config/postgres.js';

class CompanyUsageModel {
  async insert({
    company_id = null,
    user_id = null,
    service = 'openai',
    model,
    operation,
    prompt_tokens = 0,
    completion_tokens = 0,
    total_tokens = 0,
    estimated_cost_usd = null,
    request_id = null,
    metadata = null,
  }) {
    const result = await getDb().query(
      `INSERT INTO company_usage (
         company_id, user_id, service, model, operation,
         prompt_tokens, completion_tokens, total_tokens,
         estimated_cost_usd, request_id, metadata
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        company_id,
        user_id,
        service,
        model,
        operation,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        estimated_cost_usd,
        request_id,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
    return result.rows[0];
  }

  async listByCompany(company_id, { limit = 100, since = null } = {}) {
    const params = [company_id];
    let where = `WHERE company_id = $1`;
    if (since) {
      params.push(since);
      where += ` AND created_at >= $${params.length}`;
    }
    params.push(limit);
    const result = await getDb().query(
      `SELECT * FROM company_usage ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params
    );
    return result.rows;
  }

  async summaryByCompany(company_id, { since = null } = {}) {
    const params = [company_id];
    let where = `WHERE company_id = $1`;
    if (since) {
      params.push(since);
      where += ` AND created_at >= $${params.length}`;
    }
    const result = await getDb().query(
      `SELECT
         operation,
         model,
         COUNT(*)                       AS calls,
         SUM(prompt_tokens)             AS prompt_tokens,
         SUM(completion_tokens)         AS completion_tokens,
         SUM(total_tokens)              AS total_tokens,
         SUM(estimated_cost_usd)        AS estimated_cost_usd
       FROM company_usage
       ${where}
       GROUP BY operation, model
       ORDER BY total_tokens DESC NULLS LAST`,
      params
    );
    return result.rows;
  }
}

export default new CompanyUsageModel();

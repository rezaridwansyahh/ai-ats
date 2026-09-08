import getDb from '../../../config/postgres.js';

class SourceModel {
  async create({ company_id, file, uploaded_by }) {
    const query = `
      INSERT INTO onboarding_source (company_id, file, uploaded_by, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `;
    const result = await getDb().query(query, [company_id, file, uploaded_by]);
    return result.rows[0];
  }

  async updateStatus(id, { status, chunk_count, weaviate_source_key, error_message }) {
    const query = `
      UPDATE onboarding_source
      SET status = $1,
          chunk_count = COALESCE($2, chunk_count),
          weaviate_source_key = COALESCE($3, weaviate_source_key),
          error_message = $4,
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;
    const values = [status, chunk_count ?? null, weaviate_source_key ?? null, error_message ?? null, id];
    const result = await getDb().query(query, values);
    return result.rows[0];
  }

  async getById(id) {
    const result = await getDb().query('SELECT * FROM onboarding_source WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async listByCompany(company_id) {
    const result = await getDb().query(
      'SELECT * FROM onboarding_source WHERE company_id = $1 ORDER BY created_at DESC',
      [company_id]
    );
    return result.rows;
  }

  async delete(id) {
    await getDb().query('DELETE FROM onboarding_source WHERE id = $1', [id]);
    return true;
  }
}

export default new SourceModel();
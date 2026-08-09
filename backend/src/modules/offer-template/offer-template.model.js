import getDb from '../../config/postgres.js';

class OfferTemplateModel {
  async getByCompanyId(company_id) {
    const result = await getDb().query(`
      SELECT cot.*, mu.username AS uploaded_by_name
      FROM company_offer_letter cot
      LEFT JOIN master_users mu ON mu.id = cot.uploaded_by
      WHERE cot.company_id = $1
    `, [company_id]);
    return result.rows[0] || null;
  }

  async upsert(data) {
    const result = await getDb().query(`
      INSERT INTO company_offer_letter (company_id, file, fields, uploaded_by, uploaded_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (company_id) DO UPDATE
      SET file = EXCLUDED.file,
          fields = EXCLUDED.fields,
          uploaded_by = EXCLUDED.uploaded_by,
          uploaded_at = NOW(),
          updated_at = NOW()
      RETURNING *
    `, [
      data.company_id,
      data.file,
      JSON.stringify(data.fields || []),
      data.uploaded_by || null,
    ]);
    return result.rows[0];
  }
}

export default new OfferTemplateModel();
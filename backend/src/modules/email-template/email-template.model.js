import getDb from '../../config/postgres.js';

class EmailTemplateModel {
  async getByCompany(company_id) {
    const result = await getDb().query(
      `SELECT * FROM company_email_template WHERE company_id = $1`,
      [company_id]
    );
    return result.rows;
  }

  async getOne(company_id, module_key, template_key) {
    const result = await getDb().query(
      `SELECT * FROM company_email_template WHERE company_id = $1 AND module_key = $2 AND template_key = $3`,
      [company_id, module_key, template_key]
    );
    return result.rows[0] || null;
  }

  async upsert(company_id, module_key, template_key, subject, body, updated_by) {
    const result = await getDb().query(`
      INSERT INTO company_email_template (company_id, module_key, template_key, subject, body, updated_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (company_id, module_key, template_key) DO UPDATE
      SET subject = EXCLUDED.subject, body = EXCLUDED.body,
          updated_by = EXCLUDED.updated_by, updated_at = NOW()
      RETURNING *
    `, [company_id, module_key, template_key, subject, body, updated_by]);
    return result.rows[0];
  }
}

export default new EmailTemplateModel();
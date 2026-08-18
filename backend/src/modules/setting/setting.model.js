import getDb from "../../config/postgres.js";

class SettingModel {
  async get(company_id, key) {
    const result = await getDb().query(
      `SELECT key, value, updated_at FROM company_setting WHERE company_id = $1 AND key = $2`,
      [company_id, key]
    );
    return result.rows[0] || null;
  }

  async upsert(company_id, key, value) {
    const result = await getDb().query(
      `INSERT INTO company_setting (company_id, key, value)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (company_id, key) DO UPDATE
         SET value      = EXCLUDED.value,
             updated_at = NOW()
       RETURNING key, value, updated_at`,
      [company_id, key, JSON.stringify(value ?? {})]
    );
    return result.rows[0];
  }
}

export default new SettingModel();

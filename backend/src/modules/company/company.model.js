import getDb from '../../config/postgres.js';

class CompanyModel {
  async getAll() {
    const result = await getDb().query(`SELECT * FROM core_company ORDER BY id ASC`);
    return result.rows;
  }

  async getById(id) {
    const result = await getDb().query(`SELECT * FROM core_company WHERE id = $1`, [id]);
    return result.rows[0];
  }

  async create({ name, description, email, website, logo_url }) {
    const result = await getDb().query(
      `INSERT INTO core_company (name, description, email, website, logo_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description ?? null, email ?? null, website ?? null, logo_url ?? null]
    );
    return result.rows[0];
  }

  async update(id, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return await this.getById(id);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const result = await getDb().query(
      `UPDATE core_company SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
      [...Object.values(fields), id]
    );
    return result.rows[0];
  }

  async delete(id) {
    const result = await getDb().query(`DELETE FROM core_company WHERE id = $1 RETURNING *`, [id]);
    return result.rows[0];
  }
}

export default new CompanyModel();

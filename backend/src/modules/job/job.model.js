import getDb from "../../config/postgres.js"

class JobModel {
  async getAll() {
    const result = await getDb().query(`
      SELECT * FROM core_job ORDER BY created_at DESC
    `);
    return result.rows;
  }

  async getById(id) {
    const result = await getDb().query(`
      SELECT * FROM core_job WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  async getByStatus(status) {
    const result = await getDb().query(`
      SELECT * FROM core_job WHERE status = $1 ORDER BY created_at DESC
    `, [status]);
    return result.rows;
  }

  async getWithCandidates(id) {
    const result = await getDb().query(`
      SELECT
        cj.*,
        json_agg(
          json_build_object(
            'id', mc.id,
            'name', mc.name,
            'last_position', mc.last_position,
            'address', mc.address,
            'education', mc.education,
            'information', mc.information,
            'date', mc.date,
            'attachment', mc.attachment
          )
        ) FILTER (WHERE mc.id IS NOT NULL) AS candidates
      FROM core_job cj
      LEFT JOIN master_candidate mc ON cj.id = mc.job_id
      WHERE cj.id = $1
      GROUP BY cj.id
    `, [id]);
    return result.rows[0];
  }

  async create(fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(k => `"${k}"`).join(', ');

    const result = await getDb().query(`
      INSERT INTO core_job (${columns})
      VALUES (${placeholders})
      RETURNING *
    `, values);
    return result.rows[0];
  }

  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    if (keys.length === 0) throw new Error('No fields provided for update');

    const setClause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ');

    const result = await getDb().query(`
      UPDATE core_job
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return result.rows[0];
  }

  async updateStatus(id, status) {
    const result = await getDb().query(`
      UPDATE core_job
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, id]);
    return result.rows[0];
  }

  async delete(id) {
    const result = await getDb().query(`
      DELETE FROM core_job WHERE id = $1 RETURNING *
    `, [id]);
    return result.rows[0];
  }
}

export default new JobModel();

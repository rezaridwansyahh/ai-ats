import getDb from "../../config/postgres.js"

class JobPostModel {
  async getAll() {
    const result = await getDb().query(`
      SELECT *
      FROM job_post
      ORDER BY id ASC
    `);

    return result.rows;
  }

  async getById(id) {
    const result = await getDb().query(`
      SELECT *
      FROM job_post
      WHERE id = $1
    `, [id]);

    return result.rows[0];
  }

  async getByJobId(job_id) {
    const result = await getDb().query(`
      SELECT *
      FROM job_post
      WHERE job_id = $1
      ORDER BY created_at DESC
    `, [job_id]);

    return result.rows[0];
  }

  async getByJobIdAndType(job_id, type) {
    const result = await getDb().query(`
      SELECT *
      FROM job_post
      WHERE job_id = $1 AND type = $2
      ORDER BY created_at DESC
    `, [job_id, type]);

    return result.rows;
  }

  async create(job_id, type) {
    const result = await getDb().query(`
      INSERT INTO job_post
        (job_id, type)
      VALUES ($1, $2)
      RETURNING *
    `, [job_id, type]);

    return result.rows[0];
  }

  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    if (keys.length === 0) {
      throw new Error('No fields provided for update');
    }

    const setClause = keys
      .map((key, index) => `"${key}" = $${index + 1}`)
      .join(', ');

    const result = await getDb().query(`
      UPDATE job_post
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);

    return result.rows[0];
  }

  async delete(id) {
    const result = await getDb().query(`
      DELETE FROM job_post
      WHERE id = $1
      RETURNING *
    `, [id]);

    return result.rows[0];
  }
}

export default new JobPostModel();

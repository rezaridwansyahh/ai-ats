import db from '../../../config/postgres.js';

class JobPostLinkedinModel {
  async getByJobSourcingId(job_sourcing_id) {
    const result = await db.query(`
      SELECT mjsl.*, cpl.project_id
      FROM mapping_job_sourcing_linkedin mjsl
      LEFT JOIN core_project_linkedin cpl ON cpl.id = mjsl.project_id
      WHERE mjsl.job_sourcing_id = $1
    `, [job_sourcing_id]);
    return result.rows[0];
  }

  async getLinkedinByUserId(user_id) {
    const result = await db.query(`
      SELECT
        cj.*,
        cjs.id AS job_sourcing_id,
        cjs.account_id,
        cjs.platform,
        cjs.last_sync,
        mja.portal_name,
        mja.email,
        mjsl.linkedin_id,
        mjsl.project_id
      FROM core_job_sourcing cjs
      JOIN core_job cj ON cjs.job_id = cj.id
      JOIN master_job_account mja ON cjs.account_id = mja.id
      LEFT JOIN mapping_job_sourcing_linkedin mjsl ON cjs.id = mjsl.job_sourcing_id
      WHERE mja.user_id = $1 AND cjs.platform = 'linkedin'
      ORDER BY cjs.created_at DESC
    `, [user_id]);
    return result.rows;
  }

  async create(job_sourcing_id, linkedin_id, project_id) {
    const result = await db.query(`
      INSERT INTO mapping_job_sourcing_linkedin
        (job_sourcing_id, linkedin_id, project_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [job_sourcing_id, linkedin_id || null, project_id || null]);
    return result.rows[0];
  }

  async update(job_sourcing_id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    if (keys.length === 0) throw new Error('No fields provided for update');

    const setClause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ');

    const result = await db.query(`
      UPDATE mapping_job_sourcing_linkedin
      SET ${setClause}, updated_at = NOW()
      WHERE job_sourcing_id = $${keys.length + 1}
      RETURNING *
    `, [...values, job_sourcing_id]);
    return result.rows[0];
  }

  async delete(job_sourcing_id) {
    const result = await db.query(`
      DELETE FROM mapping_job_sourcing_linkedin
      WHERE job_sourcing_id = $1
      RETURNING *
    `, [job_sourcing_id]);
    return result.rows[0];
  }
}

export default new JobPostLinkedinModel();

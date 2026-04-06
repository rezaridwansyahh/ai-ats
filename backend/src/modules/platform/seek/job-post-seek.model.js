import getDb from "../../../config/postgres.js"

class JobPostSeekModel {
  async getAll() {
    const result = await getDb().query(`
      SELECT * FROM mapping_job_sourcing_seek ORDER BY id ASC
    `);
    return result.rows;
  }

  async getById(id) {
    const result = await getDb().query(`
      SELECT * FROM mapping_job_sourcing_seek WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  async getByJobSourcingId(job_sourcing_id) {
    const result = await getDb().query(`
      SELECT * FROM mapping_job_sourcing_seek WHERE job_sourcing_id = $1
    `, [job_sourcing_id]);
    return result.rows[0];
  }

  async getBySeekId(seek_id) {
    const result = await getDb().query(`
      SELECT cj.job_title, cjs.account_id, mjss.*
      FROM mapping_job_sourcing_seek mjss
      JOIN core_job_sourcing cjs ON mjss.job_sourcing_id = cjs.id
      LEFT JOIN core_job cj ON cjs.job_id = cj.id
      WHERE mjss.seek_id = $1
    `, [seek_id]);
    return result.rows[0];
  }

  async getDetailsByJobSourcingId(job_sourcing_id) {
    const result = await getDb().query(`
      SELECT
        cj.id AS job_id,
        cj.job_title,
        cj.job_desc,
        cj.job_location,
        cj.work_option,
        cj.work_type,
        cj.pay_type,
        cj.currency,
        cj.pay_min,
        cj.pay_max,
        cj.pay_display,
        cj.status,
        cjs.id AS job_sourcing_id,
        cjs.account_id,
        cjs.platform,
        cjs.platform_job_id,
        cjs.last_sync,
        cjs.created_at,
        cjs.updated_at,
        mjss.id AS seek_mapping_id,
        mjss.seek_id,
        mjss.candidate_count,
        mjss.created_date_seek,
        mjss.created_by
      FROM mapping_job_sourcing_seek mjss
      JOIN core_job_sourcing cjs ON mjss.job_sourcing_id = cjs.id
      LEFT JOIN core_job cj ON cjs.job_id = cj.id
      WHERE mjss.job_sourcing_id = $1
    `, [job_sourcing_id]);
    return result.rows[0];
  }

  async getSeekByUserId(user_id) {
    const result = await getDb().query(`
      SELECT
        cj.*,
        cjs.id AS job_sourcing_id,
        cjs.account_id,
        cjs.platform,
        cjs.last_sync,
        mja.portal_name,
        mja.email,
        mjss.seek_id,
        mjss.candidate_count,
        mjss.created_date_seek,
        mjss.created_by
      FROM core_job_sourcing cjs
      LEFT JOIN core_job cj ON cjs.job_id = cj.id
      JOIN master_job_account mja ON cjs.account_id = mja.id
      LEFT JOIN mapping_job_sourcing_seek mjss ON cjs.id = mjss.job_sourcing_id
      WHERE mja.user_id = $1 AND cjs.platform = 'seek'
      ORDER BY cjs.created_at DESC
    `, [user_id]);
    return result.rows;
  }

  async create(job_sourcing_id, { seek_id = null, candidate_count = 0, created_date_seek = null, created_by = null, currency = null, pay_type = null, pay_min = null, pay_max = null, pay_display = null } = {}) {
    const result = await getDb().query(`
      INSERT INTO mapping_job_sourcing_seek
        (job_sourcing_id, seek_id, candidate_count, created_date_seek, created_by, currency, pay_type, pay_min, pay_max, pay_display)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [job_sourcing_id, seek_id, candidate_count, created_date_seek, created_by, currency, pay_type, pay_min, pay_max, pay_display]);
    return result.rows[0];
  }

  async update(job_sourcing_id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    if (keys.length === 0) throw new Error('No fields provided for update');

    const setClause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ');

    const result = await getDb().query(`
      UPDATE mapping_job_sourcing_seek
      SET ${setClause}, updated_at = NOW()
      WHERE job_sourcing_id = $${keys.length + 1}
      RETURNING *
    `, [...values, job_sourcing_id]);
    return result.rows[0];
  }

  async delete(job_sourcing_id) {
    const result = await getDb().query(`
      DELETE FROM mapping_job_sourcing_seek
      WHERE job_sourcing_id = $1
      RETURNING *
    `, [job_sourcing_id]);
    return result.rows[0];
  }
}

export default new JobPostSeekModel();

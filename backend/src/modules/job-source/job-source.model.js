import getDb from "../../config/postgres.js"

class JobSourceModel {
  async getAll() {
    const result = await getDb().query(`
      SELECT *
      FROM core_job_sourcing
      ORDER BY id ASC
    `);

    return result.rows;
  }

  async getById(id) {
    const result = await getDb().query(`
      SELECT *
      FROM core_job_sourcing
      WHERE id = $1
    `, [id]);

    return result.rows[0];
  }

  async getByAccountId(account_id) {
    const result = await getDb().query(`
      SELECT cjs.*,
      mjss.candidate_count,
      mjss.progress,
      COUNT(mjsj.id)::int AS linked_job_count
      FROM core_job_sourcing cjs
      LEFT JOIN mapping_job_sourcing_seek mjss ON mjss.job_sourcing_id = cjs.id
      LEFT JOIN mapping_job_sourcing_job mjsj ON mjsj.job_sourcing_id = cjs.id
      WHERE cjs.account_id = $1
      GROUP BY cjs.id, mjss.candidate_count, mjss.progress
      ORDER BY cjs.created_at ASC
    `, [account_id]);

    return result.rows;
  }

  async getByJobId(job_id) {
    const result = await getDb().query(`
      SELECT DISTINCT cjs.*
      FROM core_job_sourcing cjs
      JOIN mapping_job_sourcing_job mjsj ON mjsj.job_sourcing_id = cjs.id
      WHERE mjsj.job_id = $1
      ORDER BY cjs.created_at DESC
    `, [job_id]);

    return result.rows;
  }

  // All jobs this sourcing is associated with (origin + manually-linked).
  async getLinkedJobs(sourcing_id) {
    const result = await getDb().query(`
      SELECT mjsj.job_id, mjsj.is_origin, mjsj.created_at, cj.job_title, cj.status
      FROM mapping_job_sourcing_job mjsj
      JOIN core_job cj ON cj.id = mjsj.job_id
      WHERE mjsj.job_sourcing_id = $1
      ORDER BY mjsj.is_origin DESC, mjsj.created_at ASC
    `, [sourcing_id]);

    return result.rows;
  }

  // Ids only — used by the sync auto-promote flow.
  async getLinkedJobIds(sourcing_id) {
    const result = await getDb().query(`
      SELECT job_id
      FROM mapping_job_sourcing_job
      WHERE job_sourcing_id = $1
    `, [sourcing_id]);

    return result.rows.map(r => r.job_id);
  }

  async addJobMapping(sourcing_id, job_id, is_origin = false) {
    const result = await getDb().query(`
      INSERT INTO mapping_job_sourcing_job (job_sourcing_id, job_id, is_origin)
      VALUES ($1, $2, $3)
      ON CONFLICT (job_sourcing_id, job_id) DO NOTHING
      RETURNING *
    `, [sourcing_id, job_id, is_origin]);

    return result.rows[0] ?? null;
  }

  // Only removes non-origin rows — the origin mapping (job this sourcing was
  // published from) is protected and can't be unlinked. Returns the deleted
  // row, or undefined if nothing matched (not linked, or origin-protected).
  async removeJobMapping(sourcing_id, job_id) {
    const result = await getDb().query(`
      DELETE FROM mapping_job_sourcing_job
      WHERE job_sourcing_id = $1 AND job_id = $2 AND is_origin = FALSE
      RETURNING *
    `, [sourcing_id, job_id]);

    return result.rows[0];
  }

  async getByJobPostId(job_post_id) {
    const result = await getDb().query(`
      SELECT *
      FROM core_job_sourcing
      WHERE job_post_id = $1
      ORDER BY created_at DESC
    `, [job_post_id]);

    return result.rows;
  }

  async getByUserId(user_id) {
    const result = await getDb().query(`
      SELECT cjp.*
      FROM core_job_sourcing cjp
      JOIN master_job_account mja ON cjp.account_id = mja.id
      WHERE mja.user_id = $1
      ORDER BY cjp.created_at DESC
    `, [user_id]);

    return result.rows;
  }

  async getByUserIdAndStatus(user_id, status) {
    const result = await getDb().query(`
      SELECT cjp.*
      FROM core_job_sourcing cjp
      JOIN master_job_account mja ON cjp.account_id = mja.id
      WHERE mja.user_id = $1 AND cjp.status = $2
      ORDER BY cjp.created_at DESC
    `, [user_id, status]);

    return result.rows;
  }

  async getByPlatform(platform) {
    const result = await getDb().query(`
      SELECT *
      FROM core_job_sourcing
      WHERE platform = $1
      ORDER BY created_at DESC
    `, [platform]);

    return result.rows;
  }

  async create(account_id, job_post_id, platform, job_title, status = 'Active', additional = null, job_desc = null, job_location = null) {
    const result = await getDb().query(`
      INSERT INTO core_job_sourcing
        (account_id, job_post_id, platform, job_title, status, additional, job_desc, job_location)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [account_id, job_post_id, platform, job_title, status, additional, job_desc, job_location]);

    const sourcing = result.rows[0];

    // Auto-seed the origin mapping — the job this sourcing was published from.
    if (job_post_id) {
      const jobPost = await getDb().query(`SELECT job_id FROM job_post WHERE id = $1`, [job_post_id]);
      const job_id = jobPost.rows[0]?.job_id;
      if (job_id) {
        await this.addJobMapping(sourcing.id, job_id, true);
      }
    }

    return sourcing;
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
      UPDATE core_job_sourcing
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);

    return result.rows[0];
  }

  // --- Live sync-state transitions (per channel) ---
  async markSyncing(id) {
    const result = await getDb().query(`
      UPDATE core_job_sourcing
      SET sync_state = 'syncing', sync_started_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }

  async markSynced(id) {
    const result = await getDb().query(`
      UPDATE core_job_sourcing
      SET sync_state = 'idle', last_sync = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }

  async markSyncError(id) {
    const result = await getDb().query(`
      UPDATE core_job_sourcing
      SET sync_state = 'error', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }

  async updateStatus(id, status) {
    const result = await getDb().query(`
      UPDATE core_job_sourcing
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    return result.rows[0];
  }

  async delete(id) {
    const result = await getDb().query(`
      DELETE FROM core_job_sourcing
      WHERE id = $1
      RETURNING *
    `, [id]);

    return result.rows[0];
  }
}

export default new JobSourceModel();
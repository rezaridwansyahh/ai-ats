import getDb from '../../config/postgres.js';

class BackgroundCheckModel {
  async getByCandidateId(candidate_id) {
    const db = getDb();

    const existing = await db.query(`
      SELECT * FROM candidate_bg
      WHERE candidate_id = $1
    `, [candidate_id]);

    if (existing.rows[0]) return existing.rows[0];

    const meta = await db.query(`
      SELECT mc.job_id, cj.company_id
      FROM master_candidate mc
      LEFT JOIN core_job cj ON cj.id = mc.job_id
      WHERE mc.id = $1
    `, [candidate_id]);

    if (!meta.rows[0]) {
      throw { status: 404, message: `master_candidate ${candidate_id} not found` };
    }

    const { job_id, company_id } = meta.rows[0];

    const inserted = await db.query(`
      INSERT INTO candidate_bg
        (candidate_id, job_id, company_id, status)
      VALUES ($1, $2, $3, 'claims')
      ON CONFLICT (candidate_id, job_id)
      DO UPDATE SET updated_at = NOW()
      RETURNING *
    `, [candidate_id, job_id, company_id || null]);

    return inserted.rows[0];
  }

  async getById(bg_id) {
    const result = await getDb().query(`
      SELECT
        cb.id             AS bg_id,
        cb.candidate_id,
        cb.job_id,
        cb.company_id,
        cb.status,
        cb.status_changed_at,
        cb.verdict,
        cb.verdict_note,
        cb.decided_at,
        cb.decided_by,
        cb.archived_reason,
        cb.created_at,
        cb.updated_at,

        mc.name           AS candidate_name,
        mc.last_position,
        mc.address,
        mc.education      AS education_text,

        cj.job_title,
        cj.job_location,
        cj.work_type,
        cj.seniority_level

      FROM candidate_bg cb
      JOIN master_candidate mc ON mc.id = cb.candidate_id
      JOIN core_job cj          ON cj.id = cb.job_id
      WHERE cb.id = $1
    `, [bg_id]);

    return result.rows[0] || null;
  }

  async getByJob(job_id) {
    const result = await getDb().query(`
      SELECT
        cb.id             AS bg_id,
        cb.candidate_id,
        cb.job_id,
        cb.status,
        cb.status_changed_at,
        cb.verdict,
        cb.archived_reason,
        cb.created_at,

        mc.name           AS candidate_name,
        mc.last_position

      FROM candidate_bg cb
      JOIN master_candidate mc ON mc.id = cb.candidate_id
      WHERE cb.job_id = $1
      ORDER BY cb.created_at ASC
    `, [job_id]);

    return result.rows;
  }

  async getWorkboard(company_id) {
    const db = getDb();

    const positionRows = await db.query(`
      SELECT
        cj.id         AS job_id,
        cj.job_title,
        cj.status,

        COUNT(cb.id)                                                  AS total,
        COUNT(*) FILTER (WHERE cb.status = 'claims')                 AS claims,
        COUNT(*) FILTER (WHERE cb.status = 'consent')                AS consent,
        COUNT(*) FILTER (WHERE cb.status = 'tracker')                AS tracker,
        COUNT(*) FILTER (WHERE cb.status = 'verdict')                AS verdict,
        COUNT(*) FILTER (WHERE cb.status = 'done')                   AS ready

      FROM core_job cj
      LEFT JOIN candidate_bg cb ON cb.job_id = cj.id
      WHERE cj.company_id = $1
      GROUP BY cj.id, cj.job_title, cj.status
      ORDER BY cj.status = 'Active' DESC, cj.id ASC
    `, [company_id]);

    const positions = positionRows.rows.map((r) => ({
      job_id:    r.job_id,
      job_title: r.job_title,
      status:    r.status,
      total:     Number(r.total),
      claims:    Number(r.claims),
      consent:   Number(r.consent),
      tracker:   Number(r.tracker),
      verdict:   Number(r.verdict),
      ready:     Number(r.ready),
    }));

    const counts = positions.reduce(
      (acc, p) => {
        acc.claims  += p.claims;
        acc.consent += p.consent;
        acc.tracker += p.tracker;
        acc.verdict += p.verdict;
        acc.ready   += p.ready;
        return acc;
      },
      { claims: 0, consent: 0, tracker: 0, verdict: 0, ready: 0 }
    );

    return { counts, positions };
  }

  async updateStatus(bg_id, status) {
    const result = await getDb().query(`
      UPDATE candidate_bg
      SET
        status            = $2,
        status_changed_at = NOW(),
        updated_at        = NOW()
      WHERE id = $1
      RETURNING *
    `, [bg_id, status]);

    return result.rows[0] || null;
  }

  async saveVerdict(bg_id, { verdict, verdict_note, decided_by }) {
    const result = await getDb().query(`
      UPDATE candidate_bg
      SET
        verdict           = $2,
        verdict_note      = $3::jsonb,
        decided_by        = $4,
        decided_at        = NOW(),
        status            = 'done',
        status_changed_at = NOW(),
        updated_at        = NOW()
      WHERE id = $1
      RETURNING *
    `, [bg_id, verdict, JSON.stringify(verdict_note || null), decided_by || null]);

    return result.rows[0] || null;
  }

  async archive(bg_id, archived_reason) {
    const result = await getDb().query(`
      UPDATE candidate_bg
      SET
        status            = 'archived',
        status_changed_at = NOW(),
        archived_reason   = $2,
        updated_at        = NOW()
      WHERE id = $1
      RETURNING *
    `, [bg_id, archived_reason]);

    return result.rows[0] || null;
  }

}

export default new BackgroundCheckModel();
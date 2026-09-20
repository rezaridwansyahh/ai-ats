import getDb from '../../config/postgres.js';

class InterviewPackModel {
  /**
   * Create a new interview pack (without candidates).
   */
  async create({ company_id, job_id, title, batch_code, interviewer_name, window_start, window_end, rubric_snapshot, questions_snapshot, created_by }) {
    console.log('🔍 STEP 4 - model received questions_snapshot:', questions_snapshot);
    const result = await getDb().query(
      `INSERT INTO interview_pack
        (company_id, job_id, title, batch_code, interviewer_name, window_start, window_end, rubric_snapshot, questions_snapshot, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10)
      RETURNING *`,
      [
        company_id || null,
        job_id,
        title || 'Interview Round',
        batch_code || null,
        interviewer_name,
        window_start || null,
        window_end || null,
        JSON.stringify(rubric_snapshot),
        JSON.stringify(questions_snapshot || []),
        created_by || null,
      ]
    );
    return result.rows[0];
  }
  /**
   * Bulk-insert candidates into an interview pack.
   * candidates: Array of { applicant_id, sort_order, interview_date, interview_time }
   */
  async addCandidates(pack_id, candidates) {
    if (!candidates || candidates.length === 0) return [];
    const db = getDb();
    const inserted = [];
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const result = await db.query(
        `INSERT INTO interview_pack_candidate
           (pack_id, applicant_id, round_id, sort_order, interview_date, interview_time)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (pack_id, applicant_id) DO UPDATE
           SET round_id       = EXCLUDED.round_id,
               sort_order     = EXCLUDED.sort_order,
               interview_date = EXCLUDED.interview_date,
               interview_time = EXCLUDED.interview_time
         RETURNING *`,
        [
          pack_id,
          c.applicant_id,
          c.round_id || null,
          c.sort_order ?? i,
          c.interview_date || null,
          c.interview_time || null,
        ]
      );
      inserted.push(result.rows[0]);
    }
    return inserted;
  }

  /**
   * Get a single pack by id, with candidates + applicant info + outcomes.
   */
  async getById(id) {
    const db = getDb();

    const packResult = await db.query(
      `SELECT ip.*,
              cj.job_title,
              cj.job_desc,
              cj.qualifications,
              cj.required_skills
         FROM interview_pack ip
         JOIN core_job cj ON cj.id = ip.job_id
        WHERE ip.id = $1`,
      [id]
    );
    if (!packResult.rows[0]) return null;
    const pack = packResult.rows[0];

    const candidatesResult = await db.query(
      `SELECT
         ipc.id             AS pack_candidate_id,
         ipc.applicant_id,
         ipc.round_id,
         ir.round_number,
         ipc.sort_order,
         ipc.interview_date,
         ipc.interview_time,
         ma.name            AS applicant_name,
         ma.last_position,
         ma.email,
         ipo.id             AS outcome_id,
         ipo.scores,
         ipo.weighted_total,
         ipo.recommendation,
         ipo.strengths,
         ipo.concerns,
         ipo.question_notes,
         ipo.updated_at     AS outcome_updated_at
       FROM interview_pack_candidate ipc
       JOIN master_applicant ma ON ma.id = ipc.applicant_id
       LEFT JOIN interview_round ir ON ir.id = ipc.round_id
       LEFT JOIN interview_pack_outcome ipo
              ON ipo.pack_id = ipc.pack_id
             AND ipo.pack_candidate_id = ipc.id
       WHERE ipc.pack_id = $1
       ORDER BY ipc.sort_order ASC, ipc.id ASC`,
      [id]
    );

    pack.candidates = candidatesResult.rows;
    return pack;
  }

  /**
   * Get all packs for a specific job, with candidate + scored counts.
   */
  async getByJob(job_id) {
    const result = await getDb().query(
      `SELECT
         ip.*,
         cj.job_title,
         COUNT(ipc.id)::int AS candidate_count,
         COUNT(ipo.id)::int AS scored_count,
         ARRAY_AGG(DISTINCT ir.round_number) FILTER (WHERE ir.round_number IS NOT NULL) AS round_numbers
       FROM interview_pack ip
       JOIN core_job cj ON cj.id = ip.job_id
       LEFT JOIN interview_pack_candidate ipc ON ipc.pack_id = ip.id
       LEFT JOIN interview_round ir ON ir.id = ipc.round_id
       LEFT JOIN interview_pack_outcome ipo ON ipo.pack_id = ip.id
       WHERE ip.job_id = $1
       GROUP BY ip.id, cj.job_title
       ORDER BY ip.created_at DESC`,
      [job_id]
    );
    return result.rows;
  }

  /**
   * Get all packs for a company, with candidate counts.
   */
  async getByCompany(company_id, limit = 50) {
    const result = await getDb().query(
      `SELECT
         ip.*,
         cj.job_title,
         COUNT(ipc.id)::int AS candidate_count
       FROM interview_pack ip
       JOIN core_job cj ON cj.id = ip.job_id
       LEFT JOIN interview_pack_candidate ipc ON ipc.pack_id = ip.id
       WHERE ip.company_id = $1
       GROUP BY ip.id, cj.job_title
       ORDER BY ip.created_at DESC
       LIMIT $2`,
      [company_id, limit]
    );
    return result.rows;
  }

  /**
   * Resolve a candidate's CV attachment, scoped to the pack's token — the
   * join to interview_pack via token means a pack_candidate_id only resolves
   * if it actually belongs to the pack this token grants access to.
   */
  async getCvByToken(token, packCandidateId) {
    const result = await getDb().query(
      `SELECT ma.attachment, ma.name
       FROM interview_pack_candidate ipc
       JOIN interview_pack ip ON ip.id = ipc.pack_id
       JOIN master_applicant ma ON ma.id = ipc.applicant_id
       WHERE ip.token = $1 AND ipc.id = $2`,
      [token, packCandidateId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get a pack by its unique token (for portal access).
   * Includes full job info + candidates + outcomes.
   */
  async getByToken(token) {
    const db = getDb();

    const packResult = await db.query(
      `SELECT
         ip.*,
         cj.job_title,
         cj.job_desc,
         cj.qualifications,
         cj.required_skills
       FROM interview_pack ip
       JOIN core_job cj ON cj.id = ip.job_id
       WHERE ip.token = $1`,
      [token]
    );
    if (!packResult.rows[0]) return null;
    const pack = packResult.rows[0];

    const candidatesResult = await db.query(
      `SELECT
         ipc.id             AS pack_candidate_id,
         ipc.applicant_id,
         ipc.sort_order,
         ipc.interview_date,
         ipc.interview_time,
         ma.name            AS applicant_name,
         ma.last_position,
         ma.email,
         ipo.id             AS outcome_id,
         ipo.scores,
         ipo.weighted_total,
         ipo.recommendation,
         ipo.strengths,
         ipo.concerns,
         ipo.question_notes,
         ipo.updated_at     AS outcome_updated_at
       FROM interview_pack_candidate ipc
       JOIN master_applicant ma ON ma.id = ipc.applicant_id
       LEFT JOIN interview_pack_outcome ipo
              ON ipo.pack_id = ipc.pack_id
             AND ipo.pack_candidate_id = ipc.id
       WHERE ipc.pack_id = $1
       ORDER BY ipc.sort_order ASC, ipc.id ASC`,
      [pack.id]
    );

    pack.candidates = candidatesResult.rows;
    return pack;
  }

  /**
   * Upsert an outcome record for one candidate in a pack.
   */
    async upsertOutcome({ pack_id, pack_candidate_id, scores, weighted_total, recommendation, strengths, concerns, question_notes }) {
      const result = await getDb().query(
        `INSERT INTO interview_pack_outcome
          (pack_id, pack_candidate_id, scores, weighted_total, recommendation, strengths, concerns, question_notes)
        VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8::jsonb)
        ON CONFLICT (pack_id, pack_candidate_id) DO UPDATE
          SET scores         = EXCLUDED.scores,
              weighted_total = EXCLUDED.weighted_total,
              recommendation = EXCLUDED.recommendation,
              strengths      = EXCLUDED.strengths,
              concerns       = EXCLUDED.concerns,
              question_notes = EXCLUDED.question_notes,
              updated_at     = NOW()
        RETURNING *`,
        [
          pack_id,
          pack_candidate_id,
          JSON.stringify(scores || {}),
          weighted_total ?? null,
          recommendation || null,
          strengths || null,
          concerns || null,
          JSON.stringify(question_notes || {}),
        ]
      );
      return result.rows[0];
    }

  /**
   * Mark the pack as submitted. Only transitions open → submitted.
   */
  async submit(token) {
    const result = await getDb().query(
      `UPDATE interview_pack
          SET status       = 'submitted',
              submitted_at = NOW(),
              updated_at   = NOW()
        WHERE token = $1
          AND status = 'open'
        RETURNING *`,
      [token]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a pack by id.
   */
  async delete(id) {
    const result = await getDb().query(
      `DELETE FROM interview_pack WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }
}

export default new InterviewPackModel();

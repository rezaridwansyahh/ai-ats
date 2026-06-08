import getDb from '../../config/postgres.js';

class InterviewModel {
  async ensureInterviewForCandidate(candidate_id) {
    const db = getDb();

    const existing = await db.query(
      `SELECT * FROM candidate_interview WHERE candidate_id = $1`,
      [candidate_id]
    );
    if (existing.rows[0]) return existing.rows[0];

    const meta = await db.query(
      `SELECT mc.job_id, cj.company_id, cs.id AS screening_id
         FROM master_candidate mc
         LEFT JOIN core_job cj ON cj.id = mc.job_id
         LEFT JOIN candidate_screening cs ON cs.candidate_id = mc.id
        WHERE mc.id = $1`,
      [candidate_id]
    );
    if (!meta.rows[0]) {
      throw { status: 404, message: `master_candidate ${candidate_id} not found` };
    }

    const { job_id, company_id, screening_id } = meta.rows[0];

    const inserted = await db.query(
      `INSERT INTO candidate_interview
         (candidate_id, job_id, screening_id, company_id, status)
       VALUES ($1, $2, $3, $4, 'ongoing')
       ON CONFLICT (candidate_id, job_id) DO UPDATE
         SET screening_id = EXCLUDED.screening_id,
             updated_at   = NOW()
       RETURNING *`,
      [candidate_id, job_id, screening_id || null, company_id || null]
    );
    return inserted.rows[0];
  }

  async getById(interview_id) {
    const result = await getDb().query(
      `SELECT
         ci.id              AS interview_id,
         ci.candidate_id,
         ci.job_id,
         ci.screening_id,
         ci.company_id,
         ci.status,
         ci.scheduled_at,
         ci.created_at,
         ci.updated_at,

         mc.name            AS candidate_name,
         mc.last_position,
         mc.address,
         mc.education       AS education_text,
         mc.attachment,

         cj.job_title,
         cj.job_location,
         cj.work_type,
         cj.work_option,
         cj.seniority_level,
         cj.required_skills,
         cj.preferred_skills,

         ipp.id             AS prep_id,
         ipp.questions,
         ipp.rubric_items,
         ipp.rubric_locked

       FROM candidate_interview ci
       JOIN master_candidate mc ON mc.id = ci.candidate_id
       JOIN core_job cj          ON cj.id = ci.job_id
       LEFT JOIN interview_position_prep ipp ON ipp.job_id = ci.job_id
       WHERE ci.id = $1`,
      [interview_id]
    );
    return result.rows[0] || null;
  }

  async getByJob(job_id) {
    const result = await getDb().query(
      `SELECT
         ci.id              AS interview_id,
         ci.candidate_id,
         ci.job_id,
         ci.status,
         ci.scheduled_at,
         mc.name            AS candidate_name,
         mc.last_position,
         mc.address
       FROM candidate_interview ci
       JOIN master_candidate mc ON mc.id = ci.candidate_id
       WHERE ci.job_id = $1
       ORDER BY ci.created_at ASC`,
      [job_id]
    );
    return result.rows;
  }

  async updateInterviewStatus(interview_id, status) {
    const result = await getDb().query(
      `UPDATE candidate_interview
          SET status     = $2,
              updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
      [interview_id, status]
    );
    return result.rows[0] || null;
  }

  async scheduleInterview(interview_id, scheduled_at) {
    const result = await getDb().query(
      `UPDATE candidate_interview
          SET scheduled_at = $2,
              status       = 'scheduled',
              updated_at   = NOW()
        WHERE id = $1
        RETURNING *`,
      [interview_id, scheduled_at]
    );
    return result.rows[0] || null;
  }

  async getWorkboardData(company_id) {
    const db = getDb();

    const positionRows = await db.query(
      `SELECT
         cj.id      AS job_id,
         cj.job_title,
         cj.status,
         COUNT(ci.id)                                             AS total,
         COUNT(*) FILTER (WHERE ci.status = 'ongoing')           AS ongoing,
         COUNT(*) FILTER (WHERE ci.status = 'scheduled')         AS scheduled,
         COUNT(*) FILTER (WHERE ci.status = 'done')              AS done
       FROM core_job cj
       LEFT JOIN candidate_interview ci ON ci.job_id = cj.id
       WHERE cj.company_id = $1
       GROUP BY cj.id, cj.job_title, cj.status
       ORDER BY cj.status = 'Active' DESC, cj.id ASC`,
      [company_id]
    );

    const positions = positionRows.rows.map((r) => ({
      job_id:    r.job_id,
      job_title: r.job_title,
      status:    r.status,
      total:     Number(r.total),
      ongoing:   Number(r.ongoing),
      scheduled: Number(r.scheduled),
      done:      Number(r.done),
    }));

    const counts = positions.reduce(
      (acc, p) => {
        acc.ongoing   += p.ongoing;
        acc.scheduled += p.scheduled;
        acc.done      += p.done;
        return acc;
      },
      { ongoing: 0, scheduled: 0, done: 0 }
    );

    return { counts, positions };
  }

  //interview_position_prep

  async getPrepByJob(job_id) {
    const result = await getDb().query(
      `SELECT * FROM interview_position_prep WHERE job_id = $1`,
      [job_id]
    );
    return result.rows[0] || null;
  }

  async upsertPrep({ job_id, company_id, questions, rubric_items, created_by }) {
    const result = await getDb().query(
      `INSERT INTO interview_position_prep
         (job_id, company_id, questions, rubric_items, created_by)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5)
       ON CONFLICT (job_id) DO UPDATE SET
         questions        = EXCLUDED.questions,
         rubric_items     = EXCLUDED.rubric_items,
         rubric_locked    = false,
         rubric_locked_at = NULL,
         locked_by        = NULL,
         updated_at       = NOW()
       RETURNING *`,
      [
        job_id,
        company_id || null,
        JSON.stringify(questions || []),
        JSON.stringify(rubric_items || []),
        created_by || null,
      ]
    );
    return result.rows[0];
  }

  async updatePrepQuestions(job_id, questions) {
    const result = await getDb().query(
      `UPDATE interview_position_prep
          SET questions  = $2::jsonb,
              updated_at = NOW()
        WHERE job_id = $1
        RETURNING *`,
      [job_id, JSON.stringify(questions || [])]
    );
    return result.rows[0] || null;
  }

  async updatePrepRubric(job_id, rubric_items) {
    const result = await getDb().query(
      `UPDATE interview_position_prep
          SET rubric_items = $2::jsonb,
              updated_at   = NOW()
        WHERE job_id = $1
        RETURNING *`,
      [job_id, JSON.stringify(rubric_items || [])]
    );
    return result.rows[0] || null;
  }

  async lockRubric(job_id, locked_by) {
    const result = await getDb().query(
      `UPDATE interview_position_prep
          SET rubric_locked    = true,
              rubric_locked_at = NOW(),
              locked_by        = $2,
              updated_at       = NOW()
        WHERE job_id = $1
        RETURNING *`,
      [job_id, locked_by || null]
    );
    return result.rows[0] || null;
  }

  async unlockRubric(job_id) {
    const result = await getDb().query(
      `UPDATE interview_position_prep
          SET rubric_locked    = false,
              rubric_locked_at = NULL,
              locked_by        = NULL,
              updated_at       = NOW()
        WHERE job_id = $1
        RETURNING *`,
      [job_id]
    );
    return result.rows[0] || null;
  }

  async getPrepContext(job_id) {
    const result = await getDb().query(
      `SELECT
         ipp.id              AS prep_id,
         ipp.job_id,
         ipp.company_id,
         ipp.questions,
         ipp.rubric_items,
         ipp.rubric_locked,
         ipp.rubric_locked_at,
         ipp.locked_by,
         ipp.created_by,
         ipp.created_at,
         ipp.updated_at,

         cj.job_title,
         cj.job_desc,
         cj.job_location,
         cj.work_type,
         cj.seniority_level,
         cj.required_skills,
         cj.preferred_skills,
         cj.qualifications
       FROM interview_position_prep ipp
       JOIN core_job cj ON cj.id = ipp.job_id
       WHERE ipp.job_id = $1`,
      [job_id]
    );
    return result.rows[0] || null;
  }
}

export default new InterviewModel();
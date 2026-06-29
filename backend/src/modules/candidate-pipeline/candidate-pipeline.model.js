import getDb from "../../config/postgres.js"

// current_step drives the Report page's step filter (Setup / Take / Score & Decide).
// It mirrors the CandidateDetail tab flow: an active session means the recruiter
// has picked a battery (Take); a completed session means an assessment result
// exists (Score & Decide); neither means we're still at battery-pick (Setup).
//
// Candidate → participant link goes through master_applicant.email, since
// master_candidate has no direct participant_id (see candidate-resolver.js).
const CANDIDATE_PIPELINE_SELECT = `
  SELECT c.id,
         c.job_id,
         c.name AS candidate_name,
         c.last_position,
         c.address,
         c.education,
         c.information,
         c.date,
         c.attachment,
         c.latest_stage,
         c.created_at,
         c.updated_at,
         a.email AS candidate_email,
         COALESCE(js.name, 'Not Started') AS latest_stage_name,
         COALESCE(rsc.name, 'Not Started') AS latest_stage_category,
         CASE
           WHEN latest_active.status = 'completed'         THEN 'decide'
           WHEN latest_active.status IS NOT NULL           THEN 'take'
           ELSE 'setup'
         END AS current_step
  FROM master_candidate c
  LEFT JOIN job_stage js       ON js.id = c.latest_stage
  LEFT JOIN recruitment_stage_category rsc ON rsc.id = js.stage_type_id
  LEFT JOIN master_applicant a ON a.id  = c.applicant_id
  LEFT JOIN LATERAL (
    SELECT s.status
    FROM assessment_sessions s
    WHERE s.candidate_id = c.id
      AND s.job_id = c.job_id
      AND s.status IN ('invited', 'in_progress', 'completed')
    ORDER BY
      CASE s.status WHEN 'completed' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
      s.created_at DESC
    LIMIT 1
  ) latest_active ON TRUE
`;

class CandidatePipeline {
  static async getAll() {
    const result = await getDb().query(`
      SELECT c.id,
         c.job_id,
         cj.job_title,  
         c.name AS candidate_name,
         c.last_position,
         c.address,
         c.education,
         c.information,
         c.date,
         c.attachment,
         c.latest_stage,
         c.created_at,
         c.updated_at,
         a.email AS candidate_email,
         COALESCE(js.name, 'Not Started') AS latest_stage_name
      FROM master_candidate c
      LEFT JOIN job_stage js       ON js.id = c.latest_stage
      LEFT JOIN master_applicant a ON a.id  = c.applicant_id
      LEFT JOIN core_job cj ON cj.id = c.job_id
      ORDER BY c.created_at DESC
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await getDb().query(`
      ${CANDIDATE_PIPELINE_SELECT}
      WHERE c.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async getSummary() {
    const result = await getDb().query(`
      SELECT j.id          AS job_id,
             j.job_title,
             COUNT(c.id)::int AS total
      FROM core_job j
      LEFT JOIN master_candidate c ON c.job_id = j.id
      GROUP BY j.id, j.job_title
      ORDER BY j.id ASC
    `);
    return result.rows;
  }

  static async getSummaryFiltered(category) {
    const result = await getDb().query(`
      SELECT j.id AS job_id,
             j.job_title,
             COUNT(c.id)::int AS total
      FROM core_job j
      LEFT JOIN master_candidate c ON c.job_id = j.id
      LEFT JOIN job_stage js ON js.id = c.latest_stage
      LEFT JOIN recruitment_stage_category rsc ON rsc.id = js.stage_type_id
      WHERE rsc.name = $1
      GROUP BY j.id, j.job_title
      ORDER BY j.id ASC
    `, [category]);
    
    return result.rows;
  }

  static async getByJobId(job_id) {
    const result = await getDb().query(`
      ${CANDIDATE_PIPELINE_SELECT}
      WHERE c.job_id = $1
      ORDER BY c.created_at DESC
    `, [job_id]);
    return result.rows;
  }

  static async getByJobIdCategory(job_id, category) {
    const result = await getDb().query(`
      ${CANDIDATE_PIPELINE_SELECT}
      WHERE c.job_id = $1 AND rsc.name = $2
      ORDER BY c.created_at DESC
    `, [job_id, category]);
    return result.rows;
  }

  static async getByApplicantId(applicant_id) {
    const result = await getDb().query(`
      SELECT c.id, c.job_id, c.applicant_id, c.latest_stage, c.created_at,
             j.job_title, j.status AS job_status
      FROM master_candidate c
      JOIN core_job j ON j.id = c.job_id
      WHERE c.applicant_id = $1
      ORDER BY c.created_at DESC
    `, [applicant_id]);
    return result.rows;
  }

  static async createFromApplicant(applicant_id, job_id, latest_stage) {
    const result = await getDb().query(`
      INSERT INTO master_candidate (
        job_id, applicant_id, name, last_position, address,
        education, information, date, attachment
      )
      SELECT 
        $1 as job_id, 
        a.id, 
        a.name, 
        a.last_position, 
        a.address,
        a.education, 
        a.information, 
        a.date, 
        a.attachment,
        (
          SELECT COALESCE(
            -- Case 1: If custom stages exist in job_stages
            (
              SELECT js.id
              FROM job_stage js
              WHERE js.job_id = $1
              order by js.stage_order ASC 
              limit 1
            ),
            -- Case 2: If using template-based stages
            (
              SELECT js.id
              FROM job_stage js
              LEFT JOIN core_job_template cjt on cjt.job_id = $1
              WHERE js.master_id = cjt.template_stage_id
              order by js.stage_order ASC 
              limit 1
            )
          )
        ) as latest_stage
      FROM master_applicant a
      WHERE a.id = $2
      RETURNING *
    `, [job_id, applicant_id]);
    return result.rows[0];
  }

  // Dup-safe variant for the sync path: promotes an applicant to a candidate
  // for a job, but silently no-ops if they're already a candidate for it
  // (UNIQUE(name, job_id)). Returns the new row, or undefined if it already
  // existed — so a single duplicate never aborts a sync batch.
  static async createFromApplicantIfAbsent(applicant_id, job_id) {
    const result = await getDb().query(`
      INSERT INTO master_candidate (
        job_id, applicant_id, name, last_position, address,
        education, information, date, attachment
      )
      SELECT $1, a.id, a.name, a.last_position, a.address,
             a.education, a.information, a.date, a.attachment
      FROM master_applicant a
      WHERE a.id = $2
      ON CONFLICT (name, job_id) DO NOTHING
      RETURNING *
    `, [job_id, applicant_id]);
    return result.rows[0];
  }

  static async getNotificationContext(candidate_id) {
    const result = await getDb().query(`
      SELECT c.name AS candidate_name,
            a.email AS candidate_email,
            j.job_title,
            COALESCE(auto.email_notify, false) AS email_notify
      FROM master_candidate c
      LEFT JOIN master_applicant a       ON a.id = c.applicant_id
      LEFT JOIN core_job j               ON j.id = c.job_id
      LEFT JOIN job_automation_settings auto ON auto.job_id = c.job_id
      WHERE c.id = $1
    `, [candidate_id])
    return result.rows[0]
  }


  static async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const result = await getDb().query(`
      UPDATE master_candidate
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `, [...values, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await getDb().query(`
      DELETE FROM master_candidate
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  }

  static async getListStages(candidate_id) {
    const result = await getDb().query(`
      WITH candidate_job AS (
        SELECT job_id FROM master_candidate WHERE id = $1
      )
      SELECT 
        js.id,
        js.name,
        js.stage_order,
        CASE 
          WHEN js.master_id IS NOT NULL THEN 'From Template'
          ELSE 'Custom'
        END as stage_type,
        js.master_id,
        js.job_id
      FROM job_stage js
      WHERE 
        -- Use the job_id from the candidate
        js.job_id = (SELECT job_id FROM candidate_job)
        OR js.master_id IN (
          SELECT cjt.template_stage_id
          FROM core_job_template cjt
          WHERE cjt.job_id = (SELECT job_id FROM candidate_job)
        )
      ORDER BY js.stage_order ASC
    `, [candidate_id]);
    return result.rows;
  }

  static async getCurrentStages(candidate_id) {
    const result = await getDb().query(`
      SELECT s.id,
             s.candidate_id,
             s.job_stage_id,
             s.decision,
             s.created_at,
             s.updated_at,
             js.name AS stage_name,
             js.stage_order
      FROM candidate_stages s
      JOIN job_stage js ON js.id = s.job_stage_id
      WHERE s.candidate_id = $1
      ORDER BY s.created_at ASC
    `, [candidate_id]);
    return result.rows;
  }

  static async addStage(candidate_id, job_stage_id, decision) {
    const client = await getDb().connect();
    const decisionJson = JSON.stringify({decision: decision});
    try {
      await client.query('BEGIN');

      const stageInsert = await client.query(`
        INSERT INTO candidate_stages (candidate_id, job_stage_id, decision)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [candidate_id, job_stage_id, decisionJson]);

      const candidateUpdate = await client.query(`
        UPDATE master_candidate
        SET latest_stage = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [job_stage_id, candidate_id]);

      await client.query('COMMIT');
      return { stage: stageInsert.rows[0], candidate: candidateUpdate.rows[0] };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async getProgress(candidate_id) {
    const result = await getDb().query(`
      WITH candidate_data AS (
          SELECT 
              mc.*,  -- This includes mc.applicant_id
              cs.decision as screening_decision,
              cs.decision_reason,
              cs.decided_at
          FROM master_candidate mc
          LEFT JOIN candidate_screening cs ON cs.candidate_id = mc.id
          WHERE mc.id = $1
      ),
      job_stages AS (
          SELECT
              rs.id AS stage_id,
              rs.stage_order,
              rs.name AS stage_name,
              rs.stage_type_id,
              rsc.name AS category,
              cjt.template_stage_id,
              mts.name AS template_name,
              CASE 
                  WHEN cjt.template_stage_id IS NOT NULL THEN 'from_template'
                  ELSE 'custom'
              END AS stage_source,
              cst.id AS candidate_stage_id,
              cst.decision AS stage_decision,
              CASE
                  WHEN rsc.name = 'Screening & Matching' THEN
                      jsonb_build_object(
                          'parse', jsonb_build_object('result', ma.information),
                          'match', jsonb_build_object('result', jsonb_build_object(
                            'score_data', row_to_json(cjs),
                            'additional_info', jsonb_build_object(
                                'required_skills', cj.required_skills,
                                'preferred_skills', cj.preferred_skills
                            ))),
                          'qa', jsonb_build_object('result', row_to_json(sq))
                      )
                  ELSE
                      jsonb_build_object('process', NULL)
              END AS process,
              CASE 
                  WHEN cst.id IS NULL THEN 'locked'
                  WHEN cst.decision->>'status' = 'passed' THEN 'completed'
                  WHEN cst.decision->>'status' = 'in_progress' THEN 'current'
                  WHEN cst.decision->>'status' = 'failed' THEN 'rejected'
                  ELSE 'pending'
              END AS stage_status
          FROM candidate_data cd
          LEFT JOIN core_job_template cjt ON cjt.job_id = cd.job_id 
	        LEFT JOIN master_template_stage mts ON mts.id = cjt.template_stage_id
          LEFT JOIN job_stage rs ON (
              CASE
                  WHEN cjt.template_stage_id IS NOT NULL THEN rs.master_id = cjt.template_stage_id
                  ELSE rs.job_id = cd.job_id
              END
          )
          LEFT JOIN recruitment_stage_category rsc ON rsc.id = rs.stage_type_id
          LEFT JOIN core_job cj ON cj.id = cd.job_id
          LEFT JOIN candidate_stages cst ON cst.job_stage_id = rs.id AND cst.candidate_id = cd.id
          LEFT JOIN master_applicant ma ON ma.id = cd.applicant_id
          LEFT JOIN candidate_screening csr ON csr.candidate_id = cd.id
          LEFT JOIN screening_qa sq ON sq.screening_id = csr.id 
          LEFT JOIN candidate_job_score cjs ON cjs.applicant_id = cd.applicant_id
      )
      SELECT 
          row_to_json(candidate_data) as candidate,
          COALESCE((SELECT json_agg(job_stages ORDER BY stage_order) FROM job_stages), '[]'::json) as stages
      FROM candidate_data;
    `, [candidate_id]);

    return result.rows[0];
  }
}

export default CandidatePipeline;

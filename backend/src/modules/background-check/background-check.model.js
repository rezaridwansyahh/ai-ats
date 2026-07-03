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

  async getBgById(bg_id) {
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

  async getByBgId(candidate_bg_id) {
    const result = await getDb().query(`
      SELECT
        bc.id,
        bc.candidate_bg_id,
        bc.claim_text,
        bc.claim_detail,
        bc.lane_type,
        bc.selected,
        bc.edited_by,
        bc.edited_at,
        bc.created_at,
        bc.updated_at
      FROM bg_claim bc
      WHERE bc.candidate_bg_id = $1
      ORDER BY bc.id ASC
    `, [candidate_bg_id]);

    return result.rows;
  }

  async getClaimById(claim_id) {
    const result = await getDb().query(`
      SELECT * FROM bg_claim WHERE id = $1
    `, [claim_id]);

    return result.rows[0] || null;
  }

  async replaceAiClaims(candidate_bg_id, claims) {
    const db     = getDb();
    const client = await db.connect();

    try {
      await client.query('BEGIN');
      await client.query(`
        DELETE FROM bg_claim WHERE candidate_bg_id = $1
      `, [candidate_bg_id]);

      for (const c of claims) {
        await client.query(`
          INSERT INTO bg_claim
            (candidate_bg_id, claim_text, claim_detail, lane_type, selected)
          VALUES ($1, $2, $3, $4, true)
        `, [candidate_bg_id, c.claim_text, c.claim_detail || null, c.lane_type]);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async create({ candidate_bg_id, claim_text, claim_detail, lane_type }) {
    const result = await getDb().query(`
      INSERT INTO bg_claim
        (candidate_bg_id, claim_text, claim_detail, lane_type, selected)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `, [candidate_bg_id, claim_text, claim_detail || null, lane_type]);

    return result.rows[0];
  }

  async updateSelected(claim_id, selected) {
    const result = await getDb().query(`
      UPDATE bg_claim
      SET selected = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [claim_id, selected]);

    return result.rows[0] || null;
  }

  async update(claim_id, { claim_text, claim_detail, lane_type, edited_by }) {
    const result = await getDb().query(`
      UPDATE bg_claim
      SET
        claim_text   = $2,
        claim_detail = $3,
        lane_type    = $4,
        edited_by    = $5,
        edited_at    = NOW(),
        updated_at   = NOW()
      WHERE id = $1
      RETURNING *
    `, [claim_id, claim_text, claim_detail || null, lane_type, edited_by || null]);

    return result.rows[0] || null;
  }

  async delete(claim_id) {
    const result = await getDb().query(`
      DELETE FROM bg_claim WHERE id = $1 RETURNING *
    `, [claim_id]);

    return result.rows[0] || null;
  }

  async countSelected(candidate_bg_id) {
    const result = await getDb().query(`
      SELECT COUNT(*) FROM bg_claim
      WHERE candidate_bg_id = $1 AND selected = true
    `, [candidate_bg_id]);

    return Number(result.rows[0].count);
  }

  async getSelectedLaneTypes(candidate_bg_id) {
    const result = await getDb().query(`
      SELECT DISTINCT lane_type
      FROM bg_claim
      WHERE candidate_bg_id = $1 AND selected = true
      ORDER BY lane_type ASC
    `, [candidate_bg_id]);

    return result.rows.map((r) => r.lane_type);
  }

  async ensureConsent(candidate_bg_id) {
    const db = getDb();

    const existing = await db.query(`
      SELECT * FROM bg_consent
      WHERE candidate_bg_id = $1
    `, [candidate_bg_id]);

    if (existing.rows[0]) return existing.rows[0];

    const inserted = await db.query(`
      INSERT INTO bg_consent (candidate_bg_id)
      VALUES ($1)
      RETURNING *
    `, [candidate_bg_id]);

    return inserted.rows[0];
  }

  async getConsentByBgId(candidate_bg_id) {
    const result = await getDb().query(`
      SELECT * FROM bg_consent
      WHERE candidate_bg_id = $1
    `, [candidate_bg_id]);

    return result.rows[0] || null;
  }

  async sendConsent(candidate_bg_id, { document, sent_by }) {
    const result = await getDb().query(`
      UPDATE bg_consent
      SET
        document         = $2::jsonb,
        sent_at          = NOW(),
        sent_by          = $3,
        token_expires_at = NOW() + INTERVAL '7 days',
        status           = 'sent',
        updated_at       = NOW()
      WHERE candidate_bg_id = $1
      RETURNING *
    `, [candidate_bg_id, JSON.stringify(document), sent_by || null]);

    return result.rows[0] || null;
  }

  async resendConsent(candidate_bg_id, { document, sent_by }) {
    const result = await getDb().query(`
      UPDATE bg_consent
      SET
        token             = gen_random_uuid(),
        document          = $2::jsonb,
        sent_at           = NOW(),
        sent_by           = $3,
        token_expires_at  = NOW() + INTERVAL '7 days',
        signed_at         = NULL,
        revoked_at        = NULL,
        revoked_by        = NULL,
        revocation_reason = NULL,
        status            = 'sent',
        updated_at        = NOW()
      WHERE candidate_bg_id = $1
      RETURNING *
    `, [candidate_bg_id, JSON.stringify(document), sent_by || null]);

    return result.rows[0] || null;
  }

  async revokeConsent(candidate_bg_id, { revoked_by, revocation_reason }) {
    const result = await getDb().query(`
      UPDATE bg_consent
      SET
        revoked_at        = NOW(),
        revoked_by        = $2,
        revocation_reason = $3,
        status            = 'revoked',
        updated_at        = NOW()
      WHERE candidate_bg_id = $1
      RETURNING *
    `, [candidate_bg_id, revoked_by || null, revocation_reason || null]);

    return result.rows[0] || null;
  }  
  
  async createFromClaims(candidate_bg_id) {
    const db     = getDb();
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      const claims = await client.query(`
        SELECT id, lane_type
        FROM bg_claim
        WHERE candidate_bg_id = $1 AND selected = true
      `, [candidate_bg_id]);

      for (const c of claims.rows) {
        await client.query(`
          INSERT INTO bg_lane (candidate_bg_id, bg_claim_id, lane_type)
          VALUES ($1, $2, $3)
          ON CONFLICT (bg_claim_id) DO NOTHING
        `, [candidate_bg_id, c.id, c.lane_type]);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return this.getLanesByBgId(candidate_bg_id);
  }

  async getLanesByBgId(candidate_bg_id) {
    const result = await getDb().query(`
      SELECT
        bl.id,
        bl.candidate_bg_id,
        bl.bg_claim_id,
        bl.lane_type,
        bl.note,
        bl.status,
        bl.resolved_at,
        bl.resolved_by,
        bl.created_at,
        bl.updated_at,

        bc.claim_text,
        bc.claim_detail

      FROM bg_lane bl
      JOIN bg_claim bc ON bc.id = bl.bg_claim_id
      WHERE bl.candidate_bg_id = $1
      ORDER BY bl.lane_type ASC, bl.id ASC
    `, [candidate_bg_id]);

    return result.rows;
  }

  async getLaneById(lane_id) {
    const result = await getDb().query(`
      SELECT * FROM bg_lane WHERE id = $1
    `, [lane_id]);

    return result.rows[0] || null;
  }

  async updateTracker(lane_id, { note, status, resolved_by }) {
    const isResolved = ['pass', 'pass_with_concerns', 'fail'].includes(status);

    const result = await getDb().query(`
      UPDATE bg_lane
      SET
        note        = $2,
        status      = $3,
        resolved_at = CASE WHEN $4 THEN NOW() ELSE resolved_at END,
        resolved_by = CASE WHEN $4 THEN $5 ELSE resolved_by END,
        updated_at  = NOW()
      WHERE id = $1
      RETURNING *
    `, [lane_id, note || null, status, isResolved, resolved_by || null]);

    return result.rows[0] || null;
  }

  async countLanesByStatus(candidate_bg_id) {
    const result = await getDb().query(`
      SELECT status, COUNT(*) AS count
      FROM bg_lane
      WHERE candidate_bg_id = $1
      GROUP BY status
    `, [candidate_bg_id]);

    const counts = { pending: 0, in_progress: 0, pass: 0, pass_with_concerns: 0, fail: 0, stalled: 0 };
    for (const row of result.rows) {
      counts[row.status] = Number(row.count);
    }
    return counts;
  }  

}

export default new BackgroundCheckModel();
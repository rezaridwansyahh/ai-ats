import getDb from '../../config/postgres.js';

class PortalOfferModel {

  static async getByToken(token) {
    const result = await getDb().query(`
      SELECT
        os.id,
        os.token,
        os.offer_id,
        os.sent_at,
        os.revoked_at,
        os.token_expires_at,
        os.status,
        os.candidate_file,
        os.candidate_uploaded_at,
        os.submitted_at,
        co.position_title,
        co.contract_type,
        mc.name           AS candidate_name,
        ma.email          AS candidate_email,
        cj.job_title,
        cc.name           AS company_name,
        od.file            AS letter_file,
        od.method          AS letter_method,
        od.uploaded_at     AS letter_uploaded_at
      FROM offer_send os
      JOIN candidate_offer co   ON co.id  = os.offer_id
      JOIN master_candidate mc  ON mc.id  = co.candidate_id
      JOIN core_job cj          ON cj.id  = co.job_id
      JOIN core_company cc      ON cc.id  = co.company_id
      LEFT JOIN master_applicant ma ON ma.id = mc.applicant_id
      LEFT JOIN offer_document   od ON od.offer_id = os.offer_id
      WHERE os.token::text = $1
         OR REPLACE(os.token::text, '-', '') = $1
      LIMIT 1
    `, [token]);

    return result.rows[0] || null;
  }

  static async setCandidateFile(id, filePath) {
    const result = await getDb().query(`
      UPDATE offer_send
      SET
        candidate_file        = $2,
        candidate_uploaded_at = NOW(),
        updated_at            = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, filePath]);

    return result.rows[0] || null;
  }

  static async markSubmitted(id) {
    const result = await getDb().query(`
      UPDATE offer_send
      SET
        submitted_at = NOW(),
        status       = 'submitted',
        updated_at   = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    return result.rows[0] || null;
  }

}

export default PortalOfferModel;
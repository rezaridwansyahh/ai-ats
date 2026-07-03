import getDb from '../../config/postgres.js';

class PortalBgConsentModel {

  static async getByToken(token) {
    const result = await getDb().query(`
      SELECT
        bc.id,
        bc.token,
        bc.candidate_bg_id,
        bc.document,
        bc.sent_at,
        bc.signed_at,
        bc.revoked_at,
        bc.token_expires_at,
        bc.status,
        mc.name           AS candidate_name,
        ma.email          AS candidate_email,
        cj.job_title,
        cc.name           AS company_name
      FROM bg_consent bc
      JOIN candidate_bg cb       ON cb.id  = bc.candidate_bg_id
      JOIN master_candidate mc   ON mc.id  = cb.candidate_id
      JOIN core_job cj           ON cj.id  = cb.job_id
      JOIN core_company cc       ON cc.id  = cb.company_id
      LEFT JOIN master_applicant ma ON ma.id = mc.applicant_id
      WHERE bc.token::text = $1
         OR REPLACE(bc.token::text, '-', '') = $1
      LIMIT 1
    `, [token]);

    return result.rows[0] || null;
  }

  static async sign(id) {
    const result = await getDb().query(`
      UPDATE bg_consent
      SET
        signed_at  = NOW(),
        status     = 'signed',
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    return result.rows[0] || null;
  }

}

export default PortalBgConsentModel;

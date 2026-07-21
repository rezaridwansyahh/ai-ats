import getDb from '../../config/postgres.js';

class PortalOfferModel {

  static async getByToken(token) {
    const result = await getDb().query(`
      SELECT
        os.id,
        os.token,
        os.offer_id,
        os.document,
        os.sent_at,
        os.signed_at,
        os.revoked_at,
        os.token_expires_at,
        os.status,
        co.position_title,
        co.contract_type,
        mc.name           AS candidate_name,
        ma.email          AS candidate_email,
        cj.job_title,
        cc.name           AS company_name
      FROM offer_send os
      JOIN candidate_offer co   ON co.id  = os.offer_id
      JOIN master_candidate mc  ON mc.id  = co.candidate_id
      JOIN core_job cj          ON cj.id  = co.job_id
      JOIN core_company cc      ON cc.id  = co.company_id
      LEFT JOIN master_applicant ma ON ma.id = mc.applicant_id
      WHERE os.token::text = $1
         OR REPLACE(os.token::text, '-', '') = $1
      LIMIT 1
    `, [token]);

    return result.rows[0] || null;
  }

  static async sign(id) {
    const result = await getDb().query(`
      UPDATE offer_send
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

export default PortalOfferModel;
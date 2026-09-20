import getDb from '../../../config/postgres.js';

class ConversationModel {
  async findActiveByOnboardingId(onboarding_id) {
    const query = `
      SELECT *
      FROM onboarding_chat_conversation
      WHERE candidate_onboarding_id = $1 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await getDb().query(query, [onboarding_id]);
    return result.rows[0] || null;
  }

  async create({ candidate_onboarding_id, company_id, title }) {
    const query = `
      INSERT INTO onboarding_chat_conversation (candidate_onboarding_id, company_id, title)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [candidate_onboarding_id, company_id, title || 'Onboarding chat'];
    const result = await getDb().query(query, values);
    return result.rows[0];
  }

  async getById(id) {
    const query = `SELECT * FROM onboarding_chat_conversation WHERE id = $1`;
    const result = await getDb().query(query, [id]);
    return result.rows[0] || null;
  }
}

export default new ConversationModel();
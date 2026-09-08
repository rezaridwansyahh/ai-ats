import getDb from '../../../config/postgres.js';

class MessageModel {
  async create({ conversation_id, role, content, retrieved_context = null }) {
    const query = `
      INSERT INTO onboarding_chat_message (conversation_id, role, content, retrieved_context)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [conversation_id, role, content, retrieved_context];
    const result = await getDb().query(query, values);
    return result.rows[0];
  }

  async findByConversationId(conversation_id) {
    const query = `
      SELECT *
      FROM onboarding_chat_message
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `;
    const result = await getDb().query(query, [conversation_id]);
    return result.rows;
  }
}

export default new MessageModel();
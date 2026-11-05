import getDb from "../../config/postgres.js";

class CookieModel {
  async getByAccountId(accountId) {
    const result = await getDb().query(
      'SELECT * FROM cookies WHERE account_id = $1',
      [accountId]
    );

    return result.rows[0] || null;
  }

  async save(accountId, cookies) {
    const result = await getDb().query(`
      INSERT INTO cookies (account_id, cookies)
      VALUES ($1, $2)
      ON CONFLICT (account_id)
      DO UPDATE SET
        cookies = $2,
        updated_at = NOW()
      RETURNING *
    `, [accountId, JSON.stringify(cookies)]);

    return result.rows[0];
  }

  async delete(accountId) {
    await getDb().query(
      'DELETE FROM cookies WHERE account_id = $1',
      [accountId]
    );
  }
}

export default new CookieModel();
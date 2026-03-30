import db from "../../config/postgres.js"

class UserModel {
  async getByEmail(email) {
    const result = await db.query(`
      SELECT *
      FROM master_users
      WHERE email = $1
    `, [email]);

    return result.rows[0];
  }

  async getById(id) {
    const result = await db.query(`
      SELECT *
      FROM master_users
      WHERE id = $1
    `, [id]);

    return result.rows[0];
  }
}

export default new UserModel();

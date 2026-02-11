import db from '../db/connection.js';

class User {
  static async getAll() {
    const result = await db.query(`
      SELECT * 
      FROM master_users
    `);
    
    return result.rows;
  }

  static async getById(id) {
    const result = await db.query(`
      SELECT * 
      FROM master_users 
      WHERE id = $1
    `, [id]);
    
    return result.rows[0];
  }

  static async getByEmail(email) {
    const result = await db.query(`
      SELECT * 
      FROM master_users 
      WHERE email = $1
    `, [email]);
    
    return result.rows[0];
  }

  static async getByRoleId(role_id) {
    const result = await db.query(`
      SELECT u.*
      FROM master_users u
      JOIN mapping_users_roles up ON u.id = up.role_id
      WHERE up.role_id = $1
    `, [role_id]);
  }

  static async create(email, password ) {    
    const result = await db.query(`
      INSERT INTO master_users ( email, password) 
      VALUES ($1, $2) 
      RETURNING *
    `, [ email, password]);
    
    return result.rows[0];
  }

  static async delete(id) {
    const result = await db.query(`
      DELETE FROM master_users 
      WHERE id = $1 
      RETURNING *
    `, [id]);
    
    return result.rows[0];
  }

  static async update(id, fields) {
    const key = Object.keys(fields);
    const value = Object.values(fields);

    const setClause = key.map((k, index) => `${k} = $${index + 1}`).join(', ');

    const result = await db.query(`
      UPDATE master_users 
      SET ${setClause} 
      WHERE id = $${key.length + 1} 
      RETURNING *
    `, [...value, id]);

    return result.rows[0];
  }
}

export default User;
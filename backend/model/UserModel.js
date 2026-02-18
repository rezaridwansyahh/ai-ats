import db from '../db/connection.js';

class User {
  static async getAll() {
    const result = await db.query(`
      SELECT * 
      FROM master_users
    `);
    
    return result.rows;
  }
 
  static async getAllWithRoles() {
    const result = await db.query(`
      SELECT 
        u.id,
        u.email,
        u.username,
        u.password,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', r.id,
              'name', r.name,
              'additional', r.additional
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) as roles
      FROM master_users u
      LEFT JOIN mapping_users_roles mur ON u.id = mur.user_id
      LEFT JOIN master_roles r ON mur.role_id = r.id
      GROUP BY u.id, u.email, u.username, u.password
      ORDER BY u.id ASC
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

  static async create(email, password, username) {    
    const result = await db.query(`
      INSERT INTO master_users ( email, password, username) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `, [ email, password, username]);
    
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
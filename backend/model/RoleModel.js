import db from '../db/connection.js';

class Role {
  static async getAll() {    
    const result = await db.query(`
      SELECT *
      FROM mapping_users_roles
    `);

    return result.rows;
  }

  static async getAllDetails() {
    const result = await db.query(`
      SELECT
        ur.*,
        u.email as user_email,
        r.name as role_name
      FROM mapping_users_roles ur
      JOIN master_users u ON ur.user_id = u.id
      JOIN master_roles r ON ur.role_id  = r.id
    `);

    return result.rows;
  }

  static async getById(id) {
    const result = await db.query(`
      SELECT *
      FROM mapping_users_roles
      WHERE id = $1  
    `, [id]);

    return result.rows[0];
  }

  static async getByUserId(user_id) {
    const result = await db.query(`
      SELECT *
      FROM mapping_users_roles
      WHERE user_id = $1
    `, [user_id]);

    return result.rows;
  } 

  static async getByRoleId(role_id) {
    const result = await db.query(`
      SELECT *
      FROM mapping_users_roles
      WHERE role_id = $1  
    `, [role_id]);

    return result.rows;
  }


  static async getByUserAndRole(user_id, role_id) {
    const result = await db.query(`
      SELECT *
      FROM mapping_users_roles
      WHERE user_id = $1 AND role_id = $2
    `, [user_id, role_id]);

    return result.rows[0];
  }

  static async getByUserAndRoleDetails(user_id, role_id) {
    const result = await db.query(`
      SELECT 
        ur.user_id,
        u.email as user_email,
        ur.role_id,
        r.name as role_name
      FROM mapping_users_roles ur
      JOIN master_users u on ur.user_id = u.id
      JOIN master_roles r on ur.role_id = r.id 
      WHERE ur.user_id = $1 AND ur.role_id = $2
    `, [user_id, role_id]);

    return result.rows;
  }

  static async create(user_id, role_id) {
    const result = await db.query(`
      INSERT INTO mapping_users_roles (user_id, role_id)
      VALUES ($1, $2)
      RETURNING *
    `, [user_id, role_id]);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await db.query(`
      DELETE FROM mapping_users_roles
      WHERE id = $1
      RETURNING *
    `, [id]);

    return result.rows[0];
  }
}

export default Role;
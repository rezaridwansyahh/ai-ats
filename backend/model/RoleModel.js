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

  static async getByPermissionId(permission_id) {
    const result = await db.query(`
      SELECT r.*
      FROM mapping_roles_permissions rp
      JOIN master_roles r ON rp.role_id = r.id
      WHERE rp.permission_id = $1  
    `, [permission_id]);

    return result.rows;
  }  

  static async create(name, additional) {
    const result = await db.query(
      `
      INSERT INTO master_roles (name, additional) 
      VALUES ($1, $2) 
      RETURNING *
    `,
      [name, additional]
    );
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

  static async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    if (keys.length === 0) {
      throw new Error("No fields provided for update");
    }

    const setClause = keys
      .map((key, index) => `"${key}" = $${index + 1}`)
      .join(", ");

    const result = await db.query(
      `
      UPDATE master_roles 
      SET ${setClause} 
      WHERE id = $${keys.length + 1} 
      RETURNING *
    `,
      [...values, id]
    );

    return result.rows[0];
  }

}

export default Role;
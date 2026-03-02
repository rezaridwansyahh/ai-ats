import db from "../../config/postgres.js"

class RoleModel {
  async getAll() {
    const result = await db.query(`
      SELECT * 
      FROM master_roles
    `);

    return result.rows;
  }

  async getById(id) {
    const result = await db.query(`
      SELECT * 
      FROM master_roles 
      WHERE id = $1
      `, [id]);

    return result.rows[0];
  }

  async getByUserId(user_id) {
    const result = await db.query(`
      SELECT 
        r.id,
        r.name,
        mur.role_id
      FROM mapping_users_roles mur
      JOIN master_roles r ON mur.role_id = r.id
      WHERE mur.user_id = $1
    `, [user_id]);

    return result.rows;
  }

  async getByRoleId(role_id) {
    const result = await db.query(`
      SELECT *
      FROM mapping_users_roles
      WHERE role_id = $1  
    `, [role_id]);

    return result.rows;
  }


  async getByUserAndRole(user_id, role_id) {
    const result = await db.query(`
      SELECT *
      FROM mapping_users_roles
      WHERE user_id = $1 AND role_id = $2
    `, [user_id, role_id]);

    return result.rows[0];
  }

  async getByUserAndRoleDetails(user_id, role_id) {
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

  async getAllMasterRoles() {
    const result = await db.query(`
      SELECT id, name, additional
      FROM master_roles
      ORDER BY id ASC
    `);
    return result.rows;
  }

  async replaceUserRoles(user_id, role_ids) {
    await db.query(`DELETE FROM mapping_users_roles WHERE user_id = $1`, [user_id]);
    for (const role_id of role_ids) {
      await db.query(
        `INSERT INTO mapping_users_roles (user_id, role_id) VALUES ($1, $2)`,
        [user_id, role_id]
      );
    }
  }

  async getByPermissionId(permission_id) {
    const result = await db.query(`
      SELECT r.*
      FROM mapping_roles_permissions rp
      JOIN master_roles r ON rp.role_id = r.id
      WHERE rp.permission_id = $1
    `, [permission_id]);
    return result.rows;
  }

  async setRolePermissions(role_id, permission_ids) {
    await db.query(`DELETE FROM mapping_roles_permissions WHERE role_id = $1`, [role_id]);
    for (const permission_id of permission_ids) {
      await db.query(
        `INSERT INTO mapping_roles_permissions (role_id, permission_id) VALUES ($1, $2)`,
        [role_id, permission_id]
      );
    }
  }

  async create(name, additional) {
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


  async delete(id) {
    const result = await db.query(`
      DELETE FROM master_roles WHERE id = $1 RETURNING *
    `, [id]);
    return result.rows[0];
  }

  async update(id, fields) {
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

export default new RoleModel();
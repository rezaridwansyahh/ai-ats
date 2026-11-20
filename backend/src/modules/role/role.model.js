import getDb from "../../config/postgres.js"

class RoleModel {
  // is_system rows (Super Admin) are company_id = NULL and always visible —
  // they're not owned by any tenant, so no company's role list should ever
  // exclude them outright (callers still filter is_system for non-super-admins).
  async getAll(company_id) {
    const result = await getDb().query(`
      SELECT *
      FROM master_roles
      WHERE company_id = $1 OR is_system = true
    `, [company_id]);

    return result.rows;
  }

  // Platform-admin cross-tenant audit — every ordinary role across every
  // company, with its user count. Never used by a company's own Role
  // Management (that stays scoped via getAll above); this is read-only
  // support/debug tooling behind requireSuperAdmin.
  async getAllAcrossCompanies() {
    const result = await getDb().query(`
      SELECT
        r.id, r.name, r.company_id, c.name AS company_name,
        (SELECT COUNT(*)::int FROM mapping_users_roles mur WHERE mur.role_id = r.id) AS user_count
      FROM master_roles r
      JOIN core_company c ON c.id = r.company_id
      WHERE r.is_system = false
      ORDER BY c.name ASC, r.name ASC
    `);
    return result.rows;
  }

  async getById(id) {
    const result = await getDb().query(`
      SELECT * 
      FROM master_roles 
      WHERE id = $1
      `, [id]);

    return result.rows[0];
  }

  async getByUserId(user_id) {
    const result = await getDb().query(`
      SELECT 
        r.id,
        r.name,
        r.is_system,
        mur.role_id
      FROM mapping_users_roles mur
      JOIN master_roles r ON mur.role_id = r.id
      WHERE mur.user_id = $1
    `, [user_id]);

    return result.rows;
  }

  async getByRoleId(role_id) {
    const result = await getDb().query(`
      SELECT *
      FROM mapping_users_roles
      WHERE role_id = $1  
    `, [role_id]);

    return result.rows;
  }


  async getByUserAndRole(user_id, role_id) {
    const result = await getDb().query(`
      SELECT *
      FROM mapping_users_roles
      WHERE user_id = $1 AND role_id = $2
    `, [user_id, role_id]);

    return result.rows[0];
  }

  async getByUserAndRoleDetails(user_id, role_id) {
    const result = await getDb().query(`
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


  async replaceUserRoles(user_id, role_ids) {
    await getDb().query(`DELETE FROM mapping_users_roles WHERE user_id = $1`, [user_id]);
    for (const role_id of role_ids) {
      await getDb().query(
        `INSERT INTO mapping_users_roles (user_id, role_id) VALUES ($1, $2)`,
        [user_id, role_id]
      );
    }
  }

  async getByPermissionId(permission_id) {
    const result = await getDb().query(`
      SELECT r.*
      FROM mapping_roles_permissions rp
      JOIN master_roles r ON rp.role_id = r.id
      WHERE rp.permission_id = $1
    `, [permission_id]);
    return result.rows;
  }

  async setRolePermissions(role_id, permission_ids) {
    await getDb().query(`DELETE FROM mapping_roles_permissions WHERE role_id = $1`, [role_id]);
    for (const permission_id of permission_ids) {
      await getDb().query(
        `INSERT INTO mapping_roles_permissions (role_id, permission_id) VALUES ($1, $2)`,
        [role_id, permission_id]
      );
    }
  }

  async create(name, additional, company_id) {
    const result = await getDb().query(
      `
      INSERT INTO master_roles (name, additional, company_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
      [name, additional, company_id]
    );
    return result.rows[0];
  }

  // Global capability catalog — not company-scoped, same functionality rows
  // every tenant draws from when a new company's default roles are built.
  async getAllGlobalPermissions() {
    const result = await getDb().query(`
      SELECT id, functionality
      FROM global_permissions
    `);
    return result.rows;
  }


  async delete(id) {
    const result = await getDb().query(`
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

    const result = await getDb().query(
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
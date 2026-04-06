import getDb from "../../config/postgres.js"

class PermissionModel {
  async getAll(){
    const result = await getDb().query(`
      SELECT perm.*
      FROM global_permissions perm
      `);

    return result.rows;
  }

  async getById(id) {
    const result = await getDb().query(`
      SELECT perm.*
      FROM global_permissions perm
      WHERE perm.id = $1
    `, [id]);

    return result.rows[0];
  }

  async getByIdDetails(id) {
    const result = await getDb().query(`
      SELECT 
        perm.*,
        r.id AS role_id,
        r.name AS role_name,
        m.id AS module_id,
        m.name AS module_name,
        menu.id AS menu_id,
        menu.name AS menu_name
      FROM global_permissions perm
      JOIN mapping_roles_permissions rp ON perm.id = rp.permission_id
      JOIN master_roles r ON rp.role_id = r.id
      JOIN mapping_modules_menus mm ON perm.module_menu_id = mm.id
      JOIN master_modules m ON mm.module_id = m.id
      JOIN master_menus menu ON mm.menu_id = menu.id
      WHERE perm.id = $1;

    `, [id]);
    
    return result.rows[0];
  }

  async getAllWithDetails() {
    const result = await getDb().query(`
      SELECT
        perm.id          AS permission_id,
        perm.functionality,
        m.id             AS module_id,
        m.name           AS module_name,
        menu.id          AS menu_id,
        menu.name        AS menu_name
      FROM global_permissions perm
      JOIN mapping_modules_menus mm ON perm.module_menu_id = mm.id
      JOIN master_modules m         ON mm.module_id = m.id
      JOIN master_menus menu        ON mm.menu_id   = menu.id
      ORDER BY m.id, menu.id, perm.id
    `);
    return result.rows;
  }

  async getByRoleIdDetails(role_id) {
    const result = await getDb().query(`
      SELECT 
        perm.id AS permission_id,
        perm.functionality,
        r.id AS role_id,
        r.name AS role_name,
        m.id AS module_id,
        m.name AS module_name,
        menu.id AS menu_id,
        menu.name AS menu_name
      FROM master_roles r
      JOIN mapping_roles_permissions rp ON r.id = rp.role_id
      JOIN global_permissions perm ON rp.permission_id = perm.id
      JOIN mapping_modules_menus mm ON perm.module_menu_id = mm.id
      JOIN master_modules m ON mm.module_id = m.id
      JOIN master_menus menu ON mm.menu_id = menu.id
      WHERE r.id = $1
      ORDER BY m.id, menu.id, perm.id
    `, [role_id]);

    return result.rows;
  }

  async checkPermissionMultipleRoles(roleIds, moduleName, menuName, functionality) {
    if (!roleIds || roleIds.length === 0) {
      return false;
    }
    // Create placeholders for SQL IN clause: $2, $3, $4, etc.
    const placeholders = roleIds.map((_, index) => `$${index + 2}`).join(', ');
    
    const query = `
      SELECT COUNT(*) as count
      FROM mapping_roles_permissions rp
      INNER JOIN global_permissions p ON rp.permission_id = p.id
      INNER JOIN mapping_modules_menus mm ON p.module_menu_id = mm.id
      INNER JOIN master_modules mo ON mm.module_id = mo.id
      INNER JOIN master_menus me ON mm.menu_id = me.id
      WHERE rp.role_id IN (${placeholders})
        AND mo.name = $1
        AND me.name = $${roleIds.length + 2}
        AND p.functionality = $${roleIds.length + 3}
    `;

    // Parameters: [moduleName, ...roleIds, menuName, functionality]
    const params = [moduleName, ...roleIds, menuName, functionality];
    
    const result = await getDb().query(query, params);
    return parseInt(result.rows[0].count) > 0;
  }

  async checkPermissionsRoleId(roleIds) {
    const placeholders = roleIds.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `
      SELECT DISTINCT 
        rp.role_id, 
        mo.name as module_name, 
        me.name as menu_name, 
        p.functionality
      FROM mapping_roles_permissions rp
      INNER JOIN global_permissions p ON rp.permission_id = p.id
      INNER JOIN mapping_modules_menus mm ON p.module_menu_id = mm.id
      INNER JOIN master_modules mo ON mm.module_id = mo.id
      INNER JOIN master_menus me ON mm.menu_id = me.id
      WHERE rp.role_id IN (${placeholders})
      ORDER BY mo.name, me.name, p.functionality
    `;
    
    const params = [...roleIds];
    const result = await getDb().query(query, params);
    
    const permissions = [];
    
    result.rows.forEach(row => {
      const { module_name, menu_name, functionality } = row;
      
      // Find existing module
      let module = permissions.find(m => m.module === module_name);
      if (!module) {
        module = { module: module_name, menus: [] };
        permissions.push(module);
      }
      
      // Find existing menu
      let menu = module.menus.find(m => m.menu === menu_name);
      if (!menu) {
        menu = { menu: menu_name, functionalities: [] };
        module.menus.push(menu);
      }
      
      // Add functionality if not exists (no duplicates)
      if (!menu.functionalities.includes(functionality)) {
        menu.functionalities.push(functionality);
      }
    });
    
    return { permissions };
  }

  async create(permission){
    const result = await getDb().query(`
      INSERT INTO global_permissions (fuctionality, module_menu_id)
      VALUES ($1, $2)
      RETURNING *
      `, [permission.functionality, permission.module_menu_id]);
    return result.rows[0];
  }

  async update(id, fields) {
    const key = Object.keys(fields);
    const value = Object.values(fields);

    const setClause = key.map((k, index) => `${k} = $${index + 1}`).join(', ');

    const result = await getDb().query(`
      UPDATE global_permissions 
      SET ${setClause} 
      WHERE id = $${key.length + 1} 
      RETURNING *
    `, [...value, id]);

    return result.rows[0];
  }

  async delete(id){
    const result = await getDb().query(`
      DELETE FROM global_permissions
      WHERE id = $1
      RETURNING *
      `, [id]);
      
    return result.rows[0];
  }
}

export default new PermissionModel();
import db from '../../db/connection.js';
// data
import usersData from '../data/users.js';
import rolesData from '../data/roles.js';
import modulesData from '../data/modules.js';
import menusData from '../data/menus.js';
import moduleMenusData from '../data/module_menu.js';
import permissionsData from '../data/permissions.js';
import rolePermissionsData from '../data/role_permissions.js';
import userRolesData from '../data/user_role.js';

const seed = async () => {
  await db.query('BEGIN');

  try {
    await db.query('DELETE FROM mapping_roles_permissions');
    await db.query('DELETE FROM global_permissions');
    await db.query('DELETE FROM mapping_modules_menus');
    await db.query('DELETE FROM master_menus');
    await db.query('DELETE FROM master_modules');
    await db.query('DELETE FROM mapping_users_roles');
    await db.query('DELETE FROM master_roles');
    await db.query('DELETE FROM master_users');

    // 1. users
    for (const user of usersData) {
      await db.query(
        `INSERT INTO master_users (id, password, email)
         VALUES ($1, $2, $3)`,
        [user.id, user.password, user.email]
      );
    }

    // 2. roles
    for (const role of rolesData) {
      await db.query(
        `INSERT INTO master_roles (id, name, additional)
         VALUES ($1, $2, $3)`,
        [
          role.id,
          role.name,
          JSON.stringify(role.additional || {})
        ]
      );
    }

    // 3. modules
    for (const module of modulesData) {
      await db.query(
        `INSERT INTO master_modules (id, name)
         VALUES ($1, $2)`,
        [module.id, module.name]
      );
    }

    // 4. menus
    for (const menu of menusData) {
      await db.query(
        `INSERT INTO master_menus (id, name)
         VALUES ($1, $2)`,
        [menu.id, menu.name]
      );
    }

    // 5. mapping_modules_menus
    for (const mm of moduleMenusData) {
      await db.query(
        `INSERT INTO mapping_modules_menus (id, module_id, menu_id)
         VALUES ($1, $2, $3)`,
        [mm.id, mm.module_id, mm.menu_id]
      );
    }

    // 6. permissions
    for (const perm of permissionsData) {
      await db.query(
        `INSERT INTO global_permissions (id, module_menu_id, functionality)
         VALUES ($1, $2, $3)`,
        [perm.id, perm.module_menu_id, perm.functionality]
      );
    }

    // 7. role_permissions
    for (const rp of rolePermissionsData) {
      await db.query(
        `INSERT INTO mapping_roles_permissions (id, role_id, permission_id)
         VALUES ($1, $2, $3)`,
        [rp.id, rp.role_id, rp.permission_id]
      );
    }

    // 8. user_roles
    for (const ur of userRolesData) {
      await db.query(
        `INSERT INTO mapping_users_roles (id, user_id, role_id)
         VALUES ($1, $2, $3)`,
        [ur.id, ur.user_id, ur.role_id]
      );
    }

    await db.query('COMMIT');
    console.log('Seed completed successfully');

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  }
};


export default seed;

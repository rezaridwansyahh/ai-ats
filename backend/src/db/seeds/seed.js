import getDb from '../../config/postgres.js';
// data
import usersData from '../data/users.js';
import rolesData from '../data/roles.js';
import modulesData from '../data/modules.js';
import menusData from '../data/menus.js';
import moduleMenusData from '../data/module_menu.js';
import permissionsData from '../data/permissions.js';
import rolePermissionsData from '../data/role_permissions.js';
import userRolesData from '../data/user_role.js';
import stageCategoriesData from '../data/stage_categories.js';
import { templateStages, templateStageRows } from '../data/template_stages.js';

const seed = async () => {
  await getDb().query('BEGIN');

  try {
    await getDb().query('DELETE FROM recruitment_stage');
    await getDb().query('DELETE FROM master_template_stage');
    await getDb().query('DELETE FROM recruitment_stage_category');
    await getDb().query('DELETE FROM mapping_roles_permissions');
    await getDb().query('DELETE FROM global_permissions');
    await getDb().query('DELETE FROM mapping_modules_menus');
    await getDb().query('DELETE FROM master_menus');
    await getDb().query('DELETE FROM master_modules');
    await getDb().query('DELETE FROM mapping_users_roles');
    await getDb().query('DELETE FROM master_roles');
    await getDb().query('DELETE FROM master_users');

    // 1. users
    for (const user of usersData) {
      await getDb().query(
        `INSERT INTO master_users (id, password, email, username)
         VALUES ($1, $2, $3, $4)`,
        [user.id, user.password, user.email, user.username]
      );
    }

    // 2. roles
    for (const role of rolesData) {
      await getDb().query(
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
      await getDb().query(
        `INSERT INTO master_modules (id, name)
         VALUES ($1, $2)`,
        [module.id, module.name]
      );
    }

    // 4. menus
    for (const menu of menusData) {
      await getDb().query(
        `INSERT INTO master_menus (id, name)
         VALUES ($1, $2)`,
        [menu.id, menu.name]
      );
    }

    // 5. mapping_modules_menus
    for (const mm of moduleMenusData) {
      await getDb().query(
        `INSERT INTO mapping_modules_menus (id, module_id, menu_id)
         VALUES ($1, $2, $3)`,
        [mm.id, mm.module_id, mm.menu_id]
      );
    }

    // 6. permissions
    for (const perm of permissionsData) {
      await getDb().query(
        `INSERT INTO global_permissions (id, module_menu_id, functionality)
         VALUES ($1, $2, $3)`,
        [perm.id, perm.module_menu_id, perm.functionality]
      );
    }

    // 7. role_permissions
    for (const rp of rolePermissionsData) {
      await getDb().query(
        `INSERT INTO mapping_roles_permissions (id, role_id, permission_id)
         VALUES ($1, $2, $3)`,
        [rp.id, rp.role_id, rp.permission_id]
      );
    }

    // 8. user_roles
    for (const ur of userRolesData) {
      await getDb().query(
        `INSERT INTO mapping_users_roles (id, user_id, role_id)
         VALUES ($1, $2, $3)`,
        [ur.id, ur.user_id, ur.role_id]
      );
    }

    // 9. stage categories
    for (const cat of stageCategoriesData) {
      await getDb().query(
        `INSERT INTO recruitment_stage_category (id, name)
         VALUES ($1, $2)`,
        [cat.id, cat.name]
      );
    }

    // 10. template stages (master)
    for (const tpl of templateStages) {
      await getDb().query(
        `INSERT INTO master_template_stage (id, name)
         VALUES ($1, $2)`,
        [tpl.id, tpl.name]
      );
    }

    // 11. template stage rows (recruitment_stage with master_id)
    for (const row of templateStageRows) {
      await getDb().query(
        `INSERT INTO recruitment_stage (master_id, stage_type_id, name, stage_order)
         VALUES ($1, $2, $3, $4)`,
        [row.master_id, row.stage_type_id, row.name, row.stage_order]
      );
    }

    await getDb().query('COMMIT');
    console.log('Seed completed successfully');

  } catch (err) {
    await getDb().query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  }
};


export default seed;

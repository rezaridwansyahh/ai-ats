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
import questionsData from '../data/questions.js';
import { jobAccounts, coreJobs, jobSourcing } from '../data/job_sourcing.js';
import applicantsData from '../data/applicants.js';

const seed = async () => {
  await getDb().query('BEGIN');

  try {
    await getDb().query('DELETE FROM master_applicant');
    await getDb().query('DELETE FROM core_job_sourcing');
    await getDb().query('DELETE FROM core_job');
    await getDb().query('DELETE FROM master_job_account');
    await getDb().query('DELETE FROM assessment_questions');
    await getDb().query('DELETE FROM job_stage');
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

    // 11. template stage rows (job_stage with master_id)
    for (const row of templateStageRows) {
      await getDb().query(
        `INSERT INTO job_stage (master_id, stage_type_id, name, stage_order)
         VALUES ($1, $2, $3, $4)`,
        [row.master_id, row.stage_type_id, row.name, row.stage_order]
      );
    }

    // 12. assessment questions
    for (const q of questionsData) {
      await getDb().query(
        `INSERT INTO assessment_questions (id, text, options, correct, points)
         VALUES ($1, $2, $3, $4, $5)`,
        [q.id, q.text, JSON.stringify(q.options), q.correct, q.points]
      );
    }

    // 13. master_job_account
    for (const acc of jobAccounts) {
      await getDb().query(
        `INSERT INTO master_job_account (id, portal_name, email, password, user_id, status_connection, status_sync)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [acc.id, acc.portal_name, acc.email, acc.password, acc.user_id, acc.status_connection, acc.status_sync]
      );
    }

    // 14. core_job
    for (const job of coreJobs) {
      await getDb().query(
        `INSERT INTO core_job (
           id, job_title, job_desc, job_location, work_option, work_type,
           pay_type, currency, pay_min, pay_max, pay_display, status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          job.id, job.job_title, job.job_desc, job.job_location, job.work_option, job.work_type,
          job.pay_type, job.currency, job.pay_min, job.pay_max, job.pay_display, job.status
        ]
      );
    }

    // 15. core_job_sourcing (job_post_id left null — posts are created via SaaS publish flow)
    for (const s of jobSourcing) {
      await getDb().query(
        `INSERT INTO core_job_sourcing (
           id, account_id, job_post_id, job_title, platform, platform_job_id, status, last_sync
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [s.id, s.account_id, s.job_post_id, s.job_title, s.platform, s.platform_job_id, s.status, s.last_sync]
      );
    }

    // 16. master_applicant
    for (const a of applicantsData) {
      await getDb().query(
        `INSERT INTO master_applicant (
           id, job_sourcing_id, name, last_position, address, education, information, date, attachment
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          a.id, a.job_sourcing_id, a.name, a.last_position, a.address,
          a.education, a.information ? JSON.stringify(a.information) : null,
          a.date, a.attachment
        ]
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

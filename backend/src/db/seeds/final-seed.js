import getDb from '../../config/postgres.js';

// Bootstrap-only data — 1 real company, 1 real admin user.
import finalCompanyData from '../data/final_company.js';
import finalUserData, { finalUserRoles } from '../data/final_user.js';

// Structural / reference data — shared with the full dummy seed, kept as-is.
import rolesData from '../data/roles.js';
import modulesData from '../data/modules.js';
import menusData from '../data/menus.js';
import moduleMenusData from '../data/module_menu.js';
import permissionsData from '../data/permissions.js';
import rolePermissionsData from '../data/role_permissions.js';
import stageCategoriesData from '../data/stage_categories.js';
import { templateStages, templateStageRows } from '../data/template_stages.js';
import skillAliasesData from '../data/skill_aliases.js';
import assessmentsData from '../data/assessments.js';
import { createCompanyBudget } from '../data/company_budgets.js';

// Deliberately NOT imported: job_sourcing, applicants, candidate, applicant_scores,
// candidate_interview, candidate_bg, candidate_offer, recruiters, job_templates,
// dummy_insights, dummy_battery_a, dummy_sessions — all fake/demo data, not
// part of a clean bootstrap.

const finalSeed = async () => {
  await getDb().query('BEGIN');

  try {
    // Wipe everything the full seed also wipes, so this script is safe to
    // run against setup.sql's fresh schema OR re-run on top of itself.
    await getDb().query('DELETE FROM company_budgets');
    await getDb().query('DELETE FROM company_usage');
    await getDb().query('DELETE FROM candidate_offer');
    await getDb().query('DELETE FROM bg_claim');
    await getDb().query('DELETE FROM candidate_bg');
    await getDb().query('DELETE FROM candidate_interview');
    await getDb().query('DELETE FROM candidate_screening');
    await getDb().query('DELETE FROM candidate_job_score');
    await getDb().query('DELETE FROM master_skill_alias');
    await getDb().query('DELETE FROM core_applicant_assessment');
    await getDb().query('DELETE FROM master_assessment');
    await getDb().query('DELETE FROM master_candidate');
    await getDb().query('DELETE FROM master_applicant');
    await getDb().query('DELETE FROM master_recruiters');
    await getDb().query('DELETE FROM core_job_sourcing');
    await getDb().query('DELETE FROM assessment_sessions');
    await getDb().query('DELETE FROM core_job_template');
    await getDb().query('DELETE FROM core_job');
    await getDb().query('DELETE FROM master_job_account');
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
    await getDb().query('DELETE FROM core_company');

    // 0. company (must be inserted before users — users reference company_id)
    for (const c of finalCompanyData) {
      await getDb().query(
        `INSERT INTO core_company (id, name, description, email, website, logo_url)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [c.id, c.name, c.description, c.email, c.website, c.logo_url]
      );
    }

    // 1. user
    for (const user of finalUserData) {
      await getDb().query(
        `INSERT INTO master_users (id, password, email, username, company_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, user.password, user.email, user.username, user.company_id ?? null]
      );
    }

    // 2. roles
    for (const role of rolesData) {
      await getDb().query(
        `INSERT INTO master_roles (id, name, additional)
         VALUES ($1, $2, $3)`,
        [role.id, role.name, JSON.stringify(role.additional || {})]
      );
    }

    // 3. modules
    for (const module of modulesData) {
      await getDb().query(
        `INSERT INTO master_modules (id, name) VALUES ($1, $2)`,
        [module.id, module.name]
      );
    }

    // 4. menus
    for (const menu of menusData) {
      await getDb().query(
        `INSERT INTO master_menus (id, name) VALUES ($1, $2)`,
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
    for (const ur of finalUserRoles) {
      await getDb().query(
        `INSERT INTO mapping_users_roles (id, user_id, role_id)
         VALUES ($1, $2, $3)`,
        [ur.id, ur.user_id, ur.role_id]
      );
    }

    // 9. stage categories
    for (const cat of stageCategoriesData) {
      await getDb().query(
        `INSERT INTO recruitment_stage_category (id, name) VALUES ($1, $2)`,
        [cat.id, cat.name]
      );
    }

    // 10. template stages (master) — reusable pipeline templates
    for (const tpl of templateStages) {
      await getDb().query(
        `INSERT INTO master_template_stage (id, name, sort_order)
         VALUES ($1, $2, $3)`,
        [tpl.id, tpl.name, tpl.sort_order ?? 0]
      );
    }

    // 11. template stage rows (job_stage with master_id)
    for (const row of templateStageRows) {
      await getDb().query(
        `INSERT INTO job_stage (id, master_id, stage_type_id, name, stage_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [row.id, row.master_id, row.stage_type_id, row.name, row.stage_order]
      );
    }

    // 12. master_skill_alias — AI matching normalization dictionary
    for (const sa of skillAliasesData) {
      await getDb().query(
        `INSERT INTO master_skill_alias (alias, canonical)
         VALUES ($1, $2)
         ON CONFLICT (alias) DO UPDATE SET canonical = EXCLUDED.canonical`,
        [sa.alias.toLowerCase(), sa.canonical]
      );
    }

    // 13. master_assessment — assessment battery catalog
    for (const a of assessmentsData) {
      await getDb().query(
        `INSERT INTO master_assessment (id, assessment_code, name, description, duration_minutes, options, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [a.id, a.assessment_code, a.name, a.description, a.duration_minutes, JSON.stringify(a.options || {}), a.is_active]
      );
    }

    // 14. company_budgets — required before any AI call can succeed
    //     (checkBudgetOrThrow reads this before every OpenAI request).
    for (const c of finalCompanyData) {
      const budget = createCompanyBudget(c.id);
      await getDb().query(
        `INSERT INTO company_budgets (company_id, month_year, budget_usd, alert_80_sent)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (company_id, month_year) DO UPDATE
         SET budget_usd = EXCLUDED.budget_usd, alert_80_sent = false, updated_at = NOW()`,
        [budget.company_id, budget.month_year, budget.budget_usd, budget.alert_80_sent]
      );
    }

    await getDb().query('COMMIT');
    console.log('Final seed completed successfully — 1 company, 1 user, RBAC + reference data only.');
  } catch (err) {
    await getDb().query('ROLLBACK');
    console.error('Final seed failed:', err);
    throw err;
  }
};

export default finalSeed;

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
import { jobAccounts, coreJobs, jobSourcing } from '../data/job_sourcing.js';
import applicantsData from '../data/applicants.js';
import candidatesData from '../data/candidate.js';
import skillAliasesData from '../data/skill_aliases.js';
import companiesData from '../data/companies.js';
import assessmentsData from '../data/assessments.js';
import jobTemplatesData from '../data/job_templates.js';
import recruitersData from '../data/recruiters.js';
import { applicantScores, candidateScreenings } from '../data/applicant_scores.js';
import {
  insightsResults,
  buildResultsJSON,
  buildSummaryJSON,
  INSIGHTS_COMPLETED_AT,
} from '../data/dummy_insights.js';
import companyBudgetsData, { createCompanyBudget } from '../data/company_budgets.js';
import candidateInterviewData from '../data/candidate_interview.js';
import candidateBgData from '../data/candidate_bg.js';

const seed = async () => {
  await getDb().query('BEGIN');

  try {
    await getDb().query('DELETE FROM company_budgets');
    await getDb().query('DELETE FROM company_usage');
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
    await getDb().query('DELETE FROM candidate_bg');

    // 0. companies (must be inserted before users — users reference company_id)
    for (const c of companiesData) {
      await getDb().query(
        `INSERT INTO core_company (id, name, description, email, website, logo_url)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [c.id, c.name, c.description, c.email, c.website, c.logo_url]
      );
    }

    // 1. users
    for (const user of usersData) {
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
        `INSERT INTO job_stage(id, master_id, stage_type_id, name, stage_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [row.id, row.master_id, row.stage_type_id, row.name, row.stage_order]
      );
    }

    // 12. master_job_account
    for (const acc of jobAccounts) {
      await getDb().query(
        `INSERT INTO master_job_account (id, portal_name, email, password, user_id, company_id, status_connection, status_sync)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [acc.id, acc.portal_name, acc.email, acc.password, acc.user_id, acc.company_id ?? null, acc.status_connection, acc.status_sync]
      );
    }

    // 13. master_recruiters (per-tenant rosters)
    for (const r of recruitersData) {
      await getDb().query(
        `INSERT INTO master_recruiters (id, company_id, name, email, jobs_assigned, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [r.id, r.company_id ?? null, r.name, r.email, r.jobs_assigned ?? 0, r.status ?? 'Active']
      );
    }

    // 14. core_job
    for (const job of coreJobs) {
      await getDb().query(
        `INSERT INTO core_job (
           id, company_id, job_title, job_desc, job_location, work_option, work_type,
           pay_type, currency, pay_min, pay_max, pay_display, status,
           required_skills, preferred_skills, rubric, qualifications
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          job.id, job.company_id ?? null,
          job.job_title, job.job_desc, job.job_location, job.work_option, job.work_type,
          job.pay_type, job.currency, job.pay_min, job.pay_max, job.pay_display, job.status,
          job.required_skills ? JSON.stringify(job.required_skills) : null,
          job.preferred_skills ? JSON.stringify(job.preferred_skills) : null,
          job.rubric ? JSON.stringify(job.rubric) : null,
          job.qualifications ?? null,
        ]
      );
    }

    // 14b. core_job_template — link active jobs to a template so they have a pipeline
    for (const t of jobTemplatesData) {
      await getDb().query(
        `INSERT INTO core_job_template (id, job_id, template_stage_id)
         VALUES ($1, $2, $3)`,
        [t.id, t.job_id, t.template_stage_id]
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

    // 16. master_skill_alias
    for (const sa of skillAliasesData) {
      await getDb().query(
        `INSERT INTO master_skill_alias (alias, canonical)
         VALUES ($1, $2)
         ON CONFLICT (alias) DO UPDATE SET canonical = EXCLUDED.canonical`,
        [sa.alias.toLowerCase(), sa.canonical]
      );
    }

    // 17. master_assessment
    for (const a of assessmentsData) {
      await getDb().query(
        `INSERT INTO master_assessment (id, assessment_code, name, description, duration_minutes, options, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [a.id, a.assessment_code, a.name, a.description, a.duration_minutes, JSON.stringify(a.options || {}), a.is_active]
      );
    }

    // 18. master_applicant — derive company_id via sourcing → account → company,
    //     falling back to matching the sourcing's job_title to core_job for internal sourcings.
    const accountToCompany = new Map(jobAccounts.map(a => [a.id, a.company_id ?? null]));
    const titleToCompany   = new Map(coreJobs.map(j => [j.job_title, j.company_id ?? null]));
    const sourcingToCompany = new Map(
      jobSourcing.map(s => [
        s.id,
        s.account_id != null
          ? (accountToCompany.get(s.account_id) ?? null)
          : (titleToCompany.get(s.job_title) ?? null),
      ])
    );

    for (const a of applicantsData) {
      const company_id = sourcingToCompany.get(a.job_sourcing_id) ?? null;
      await getDb().query(
        `INSERT INTO master_applicant (
           id, job_sourcing_id, company_id, name, email, last_position, address, education, information, date, attachment
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          a.id, a.job_sourcing_id, company_id, a.name, a.email || null, a.last_position, a.address,
          a.education, a.information ? JSON.stringify(a.information) : null,
          a.date, a.attachment
        ]
      );
    }

    // 19. master_candidate — candidates live per job (job_id), may reference an
    //     originating applicant. latest_stage points at job_stage (template
    //     stages for active jobs, null for draft jobs without a pipeline).
    for (const c of candidatesData) {
      await getDb().query(
        `INSERT INTO master_candidate (
           id, job_id, applicant_id, name, last_position, address, education,
           information, date, attachment, latest_stage
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          c.id, c.job_id, c.applicant_id ?? null, c.name, c.last_position ?? null,
          c.address ?? null, c.education ?? null,
          c.information ? JSON.stringify(c.information) : null,
          c.date ?? null, c.attachment ?? null, c.latest_stage ?? null,
        ]
      );
    }

    // 20. candidate_job_score — synthetic AI Matching results (no LLM call).
    //     Computed deterministically in data/applicant_scores.js from
    //     master_applicant.information + core_job.rubric.
    for (const s of applicantScores) {
      await getDb().query(
        `INSERT INTO candidate_job_score (
           applicant_id, job_id,
           overall_score, skills_score, experience_score, career_trajectory_score, education_score,
           matched_skills, missing_skills, custom_criteria_results,
           rubric_snapshot, role_profile, summary, scored_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW() - INTERVAL '2 hours')`,
        [
          s.applicant_id, s.job_id,
          s.overall_score, s.skills_score, s.experience_score, s.career_trajectory_score, s.education_score,
          JSON.stringify(s.matched_skills),
          JSON.stringify(s.missing_skills),
          JSON.stringify(s.custom_criteria_results),
          JSON.stringify(s.rubric_snapshot),
          s.role_profile, s.summary,
        ]
      );
    }

    // 21. candidate_screening — one row per scored candidate.
    //     decision = NULL → row appears in the calibration cohort.
    //     2 pre-decided rows on Job 2 exercise the "already decided" L3 state.
    for (const cs of candidateScreenings) {
      await getDb().query(
        `INSERT INTO candidate_screening (
           candidate_id, job_id, company_id, decision, decision_reason, decided_at, decided_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          cs.candidate_id, cs.job_id, cs.company_id ?? null,
          cs.decision, cs.decision_reason, cs.decided_at, cs.decided_by,
        ]
      );
    }

    console.log(`Seeded ${applicantScores.length} scores and ${candidateScreenings.length} screenings`);

    // 21b. candidate_interview — candidates advanced from screening
    for (const ci of candidateInterviewData) {
      await getDb().query(
        `INSERT INTO candidate_interview
          (id, candidate_id, job_id, company_id, status, scheduled_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (candidate_id, job_id) DO NOTHING`,
        [ci.id, ci.candidate_id, ci.job_id,
        ci.company_id, ci.status, ci.scheduled_at]
      );
    }

    // 21c. candidate_bg — candidates advanced from Interview into Background Check
    for (const bg of candidateBgData) {
      await getDb().query(
        `INSERT INTO candidate_bg
          (id, candidate_id, job_id, company_id, status, verdict, verdict_note, archived_reason)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (candidate_id, job_id) DO NOTHING`,
        [
          bg.id,
          bg.candidate_id,
          bg.job_id,
          bg.company_id,
          bg.status,
          bg.verdict         ?? null,
          bg.verdict_note    ? JSON.stringify(bg.verdict_note) : null,
          bg.archived_reason ?? null,
        ]
      );
    }

    // 23. core_applicant_assessment — Insights results (assessment_id = 5). Status = 'completed'
    //     so the rows show up directly in Score & Decide. assessor JSONB pre-populates HR notes.
    //     started_at is TIMESTAMP (no TZ) and completed_at is TIMESTAMPTZ — pass the value to
    //     two separate parameters so Postgres can deduce each type independently.
    for (const r of insightsResults) {
      await getDb().query(
        `INSERT INTO core_applicant_assessment (
           candidate_id, assessment_id, status,
           results, summary, started_at, completed_at, assessment_date
         )
         VALUES ($1, $2, 'completed', $3, $4, $5::timestamp, $6::timestamptz, CURRENT_DATE)`,
        [
          r.candidate_id, r.assessment_id,
          JSON.stringify(buildResultsJSON(r)),
          JSON.stringify(buildSummaryJSON(r)),
          INSIGHTS_COMPLETED_AT,
          INSIGHTS_COMPLETED_AT,
        ]
      );
    }
    console.log(`Seeded Insights participants and ${insightsResults.length} Insights results`);

    // 24. company_budgets — monthly AI budget caps (Task 6.12: AI cost cap)
    //     Seed budgets for current month for all companies in companiesData.
    //     Creates default $100/month budget (configurable per pilot contract).
    console.log('Seeding company budgets for current month...');

    // First, seed explicit budget records from company_budgets.js
    for (const b of companyBudgetsData) {
      await getDb().query(
        `INSERT INTO company_budgets (company_id, month_year, budget_usd, alert_80_sent)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (company_id, month_year) DO UPDATE
         SET budget_usd = EXCLUDED.budget_usd, alert_80_sent = false, updated_at = NOW()`,
        [b.company_id, b.month_year, b.budget_usd, b.alert_80_sent]
      );
    }

    // Then, create budgets for any companies in companiesData that don't have explicit budgets
    const seededCompanyIds = new Set(companyBudgetsData.map(b => b.company_id));
    const unseededCompanies = companiesData.filter(c => !seededCompanyIds.has(c.id));

    for (const c of unseededCompanies) {
      const budget = createCompanyBudget(c.id);
      await getDb().query(
        `INSERT INTO company_budgets (company_id, month_year, budget_usd, alert_80_sent)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (company_id, month_year) DO NOTHING`,
        [budget.company_id, budget.month_year, budget.budget_usd, budget.alert_80_sent]
      );
    }

    console.log(`Seeded budgets for ${companyBudgetsData.length + unseededCompanies.length} companies`);

    await getDb().query('COMMIT');
    console.log('Seed completed successfully');

  } catch (err) {
    await getDb().query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  }
};


export default seed;

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
import { jobPosts, jobSourcingJobMapping } from '../data/job_post.js';
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
import { batteryAResults, BATTERY_A_COMPLETED_AT } from '../data/dummy_battery_a.js';
import { dummySessions } from '../data/dummy_sessions.js';
import companyBudgetsData, { createCompanyBudget } from '../data/company_budgets.js';
import candidateInterviewData from '../data/candidate_interview.js';
import candidateBgData from '../data/candidate_bg.js';
import candidateOfferData from '../data/candidate_offer.js';
import {
  candidateOnboarding,
  onboardingChecklistItems,
  onboardingDayOneSchedule,
  onboardingMilestones,
  onboardingProbationCheckins,
  onboardingWelcomeMessages,
} from '../data/candidate-onboarding.js';
import onboardingAssessmentsData from '../data/battery-onboarding.js';
import onboardingHrisTasksData from '../data/onboarding_hris_task.js';
import lmsPhasesData from '../data/lms_phases.js';
import lmsModulesData from '../data/lms_modules.js';

const seed = async () => {
  await getDb().query('BEGIN');

  try {
    await getDb().query('DELETE FROM company_budgets');
    await getDb().query('DELETE FROM company_usage');
    await getDb().query('DELETE FROM onboarding_assessment_result');
    await getDb().query('DELETE FROM onboarding_assessment');
    await getDb().query('DELETE FROM onboarding_hris_task');
    await getDb().query('DELETE FROM onboarding_welcome_message');
    await getDb().query('DELETE FROM onboarding_probation_checkin');
    await getDb().query('DELETE FROM onboarding_milestone');
    await getDb().query('DELETE FROM onboarding_day_one_schedule');
    await getDb().query('DELETE FROM onboarding_checklist_item');
    await getDb().query('DELETE FROM candidate_onboarding');
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
    await getDb().query('DELETE FROM mapping_applicant_sourcing');
    await getDb().query('DELETE FROM master_applicant');
    await getDb().query('DELETE FROM master_recruiters');
    await getDb().query('DELETE FROM mapping_job_sourcing_job');
    await getDb().query('DELETE FROM core_job_sourcing');
    await getDb().query('DELETE FROM job_post');
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
        `INSERT INTO master_template_stage (id, name, sort_order)
         VALUES ($1, $2, $3)`,
        [tpl.id, tpl.name, tpl.sort_order ?? 0]
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

    // 14a. job_post — internal pipelines + external platform postings (must
    //      come before core_job_sourcing, whose job_post_id references these)
    for (const jp of jobPosts) {
      await getDb().query(
        `INSERT INTO job_post (id, job_id, type, platform)
         VALUES ($1, $2, $3, $4)`,
        [jp.id, jp.job_id, jp.type, jp.platform]
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

    // 15. core_job_sourcing
    for (const s of jobSourcing) {
      await getDb().query(
        `INSERT INTO core_job_sourcing (
           id, account_id, job_post_id, job_title, platform, platform_job_id, status, last_sync
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [s.id, s.account_id, s.job_post_id, s.job_title, s.platform, s.platform_job_id, s.status, s.last_sync]
      );
    }

    // 15b. mapping_job_sourcing_job — mirrors what JobSourceModel.create() auto-seeds
    //      at runtime (is_origin rows), plus any manually-linked (non-origin) rows.
    for (const m of jobSourcingJobMapping) {
      await getDb().query(
        `INSERT INTO mapping_job_sourcing_job (job_sourcing_id, job_id, is_origin)
         VALUES ($1, $2, $3)`,
        [m.job_sourcing_id, m.job_id, m.is_origin]
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
    
    // 17b. onboarding_assessment — pre-boarding batteries (TKI + Insight)
    for (const a of onboardingAssessmentsData) {
      await getDb().query(
        `INSERT INTO onboarding_assessment (id, assessment_code, name, milestone, duration_minutes, options, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [a.id, a.assessment_code, a.name, a.milestone, a.duration_minutes, JSON.stringify(a.options || {}), a.is_active]
      );
    }
    
    // 17c. lms_phase
    for (const p of lmsPhasesData) {
      await getDb().query(
        `INSERT INTO lms_phase (id, company_id, seq, label, day_offset_start, day_offset_end)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [p.id, p.company_id, p.seq, p.label, p.day_offset_start, p.day_offset_end]
      );
    }
    
    // 17d. lms_module
    for (const m of lmsModulesData) {
      await getDb().query(
        `INSERT INTO lms_module (id, phase_id, title, category, duration_min, sort_order, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [m.id, m.phase_id, m.title, m.category, m.duration_min, m.sort_order, m.status, m.created_by]
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
           id, company_id, name, email, last_position, address, education, information, date, attachment
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          a.id, company_id, a.name, a.email || null, a.last_position, a.address,
          a.education, a.information ? JSON.stringify(a.information) : null,
          a.date, a.attachment
        ]
      );
    }

    // 18b. mapping_applicant_sourcing — links each seed applicant to the
    //      sourcing it came from (mirrors mapping_job_sourcing_job's seed step).
    for (const a of applicantsData) {
      if (a.job_sourcing_id) {
        await getDb().query(
          `INSERT INTO mapping_applicant_sourcing (applicant_id, job_sourcing_id)
           VALUES ($1, $2)`,
          [a.id, a.job_sourcing_id]
        );
      }
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
           overall_score, skills_score, skills_reason, experience_score, experience_reason,
           education_score, education_reason,
           matched_skills, missing_skills, custom_criteria_results,
           rubric_snapshot, summary, scored_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW() - INTERVAL '2 hours')`,
        [
          s.applicant_id, s.job_id,
          s.overall_score, s.skills_score, s.skills_reason,
          s.experience_score, s.experience_reason,
          s.education_score, s.education_reason,
          JSON.stringify(s.matched_skills),
          JSON.stringify(s.missing_skills),
          JSON.stringify(s.custom_criteria_results),
          JSON.stringify(s.rubric_snapshot),
          s.summary,
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

    // 21b. candidate_interview — candidates advanced from screening.
    //      Each seeded interview also gets its round-1 interview_round row,
    //      with candidate_interview.current_round_id pointed at it — required
    //      for schedule/scorecard reads (they join through current_round_id).
    for (const ci of candidateInterviewData) {
      const inserted = await getDb().query(
        `INSERT INTO candidate_interview
          (id, candidate_id, job_id, company_id, status, round, scheduled_at, decision)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (candidate_id, job_id) DO NOTHING
        RETURNING id`,
        [ci.id, ci.candidate_id, ci.job_id,
        ci.company_id, ci.status, ci.round_number || 1, ci.scheduled_at, ci.decision || 'pending']
      );
      const interviewId = inserted.rows[0]?.id ?? ci.id;

      const round = await getDb().query(
        `INSERT INTO interview_round (interview_id, round_number, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (interview_id, round_number) DO NOTHING
         RETURNING id`,
        [interviewId, ci.round_number || 1, ci.status]
      );
      const roundId = round.rows[0]?.id ?? (
        await getDb().query(
          `SELECT id FROM interview_round WHERE interview_id = $1 AND round_number = $2`,
          [interviewId, ci.round_number || 1]
        )
      ).rows[0]?.id;

      if (roundId) {
        await getDb().query(
          `UPDATE candidate_interview SET current_round_id = $2 WHERE id = $1`,
          [interviewId, roundId]
        );
      }
    }

    // 21c. candidate_bg
    for (const bg of candidateBgData) {
      await getDb().query(
        `INSERT INTO candidate_bg
          (id, candidate_id, job_id, company_id, status, verdict, verdict_note, archived_reason)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (candidate_id, job_id) DO NOTHING`,
        [
          bg.id, bg.candidate_id, bg.job_id, bg.company_id,
          bg.status, bg.verdict ?? null,
          bg.verdict_note ? JSON.stringify(bg.verdict_note) : null,
          bg.archived_reason ?? null,
        ]
      );
    }
    await getDb().query(`
      SELECT setval('candidate_bg_id_seq', (SELECT MAX(id) FROM candidate_bg))
    `);
    console.log(`Seeded ${candidateBgData.length} candidate_bg rows`);

    // 21d. candidate_offer
    for (const o of candidateOfferData) {
      await getDb().query(
        `INSERT INTO candidate_offer (
          id, company_id, candidate_id, job_id, position_title, contract_type,
          offer_status, contract_status, metadata,
          sent_at, accepted_at, rejected_at, expired_at, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (candidate_id, job_id) DO NOTHING`,
        [
          o.id, o.company_id, o.candidate_id, o.job_id, o.position_title, o.contract_type,
          o.offer_status, o.contract_status ?? null, JSON.stringify(o.metadata ?? {}),
          o.sent_at, o.accepted_at, o.rejected_at, o.expired_at, o.created_by ?? null,
        ]
      );
    }

    // 21e. candidate_onboarding — only candidates who actually accepted an
    //      offer (see candidate-onboarding.js header comment for which ones).
    for (const ob of candidateOnboarding) {
      await getDb().query(
        `INSERT INTO candidate_onboarding (
          id, company_id, candidate_id, job_id, offer_id, candidate_name, position_title,
          start_date, probation_duration_days, probation_end_date, current_stage, onboarding_status,
          buddy_user_id, buddy_name, manager_user_id, manager_name,
          preboarding_completed_at, day_one_started_at, probation_started_at, confirmed_at, terminated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (candidate_id, offer_id) DO NOTHING`,
        [
          ob.id, ob.company_id, ob.candidate_id, ob.job_id, ob.offer_id, ob.candidate_name, ob.position_title,
          ob.start_date, ob.probation_duration_days, ob.probation_end_date, ob.current_stage, ob.onboarding_status,
          ob.buddy_user_id ?? null, ob.buddy_name ?? null, ob.manager_user_id ?? null, ob.manager_name ?? null,
          ob.preboarding_completed_at, ob.day_one_started_at, ob.probation_started_at, ob.confirmed_at, ob.terminated_at,
        ]
      );
    }

    // 21f. onboarding_checklist_item
    for (const item of onboardingChecklistItems) {
      await getDb().query(
        `INSERT INTO onboarding_checklist_item (
          id, onboarding_id, label, category, owner, status, sort_order, completed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [item.id, item.onboarding_id, item.label, item.category, item.owner, item.status, item.sort_order, item.completed_at]
      );
    }

    // 21g. onboarding_day_one_schedule
    for (const s of onboardingDayOneSchedule) {
      await getDb().query(
        `INSERT INTO onboarding_day_one_schedule (
          id, onboarding_id, time, activity, sort_order, completed
        )
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [s.id, s.onboarding_id, s.time, s.activity, s.sort_order, s.completed]
      );
    }

    // 21h. onboarding_milestone
    for (const m of onboardingMilestones) {
      await getDb().query(
        `INSERT INTO onboarding_milestone (
          id, onboarding_id, week_label, week_number, item_label, status, sort_order, completed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [m.id, m.onboarding_id, m.week_label, m.week_number, m.item_label, m.status, m.sort_order, m.completed_at]
      );
    }

    // 21i. onboarding_probation_checkin
    for (const c of onboardingProbationCheckins) {
      await getDb().query(
        `INSERT INTO onboarding_probation_checkin (
          id, onboarding_id, checkin_code, checkin_title, scheduled_date, status, manager_note, completed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [c.id, c.onboarding_id, c.checkin_code, c.checkin_title, c.scheduled_date, c.status, c.manager_note, c.completed_at]
      );
    }

    // 21j. onboarding_welcome_message
    for (const w of onboardingWelcomeMessages) {
      await getDb().query(
        `INSERT INTO onboarding_welcome_message (
          id, onboarding_id, from_user_id, from_name, message_text
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (onboarding_id) DO NOTHING`,
        [w.id, w.onboarding_id, w.from_user_id, w.from_name, w.message_text]
      );
    }

    // 21k. onboarding_hris_task
    for (const h of onboardingHrisTasksData) {
      await getDb().query(
        `INSERT INTO onboarding_hris_task (
          id, onboarding_id, task_code, task_title, task_description,
          status, integration_data, error_message, retry_count, executed_at, completed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          h.id, h.onboarding_id, h.task_code, h.task_title, h.task_description,
          h.status, JSON.stringify(h.integration_data || {}), h.error_message,
          h.retry_count ?? 0, h.executed_at, h.completed_at,
        ]
      );
    }


    console.log(`Seeded ${candidateOnboarding.length} onboarding record(s)`);

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

    // 24. core_applicant_assessment — Battery A dummy results
    for (const r of batteryAResults) {
      await getDb().query(
        `INSERT INTO core_applicant_assessment (
           candidate_id, assessment_id, status,
           results, summary, started_at, completed_at, assessment_date
         )
         VALUES ($1, $2, 'completed', $3, $4, $5::timestamp, $6::timestamptz, CURRENT_DATE)
         ON CONFLICT (candidate_id, assessment_id) DO NOTHING`,
        [
          r.candidate_id, r.assessment_id,
          JSON.stringify(r.results),
          JSON.stringify(r.summary),
          BATTERY_A_COMPLETED_AT,
          BATTERY_A_COMPLETED_AT,
        ]
      );
    }
    console.log(`Seeded ${batteryAResults.length} Battery A result(s)`);

    // 25. assessment_sessions — Budi Santoso invited for Battery A (fixed token for testing)
    for (const s of dummySessions) {
      await getDb().query(
        `INSERT INTO assessment_sessions (token, battery, candidate_id, job_id, created_by, status, expired_at, submitted_at)
        VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8::timestamptz)
        ON CONFLICT (token) DO NOTHING`,
        [s.token, s.battery, s.candidate_id, s.job_id, s.created_by, s.status, s.expired_at, s.submitted_at ?? null]
      );
    }
    console.log(`Seeded ${dummySessions.length} assessment session(s)`);

    // 26. company_budgets — monthly AI budget caps (Task 6.12: AI cost cap)
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
-- Run this after final-seed.js — same as sync-seq.sql, but every setval is
-- COALESCE-guarded since final-seed.js leaves several tables (core_job,
-- master_applicant, core_job_sourcing, master_job_account, etc.) empty.
-- setval(seq, NULL) errors out in Postgres, which sync-seq.sql's unguarded
-- lines would hit here.
SELECT setval('core_company_id_seq',              COALESCE((SELECT MAX(id) FROM core_company), 1));
SELECT setval('company_setting_id_seq',           COALESCE((SELECT MAX(id) FROM company_setting), 1));
SELECT setval('master_users_id_seq',              COALESCE((SELECT MAX(id) FROM master_users), 1));
SELECT setval('company_usage_id_seq',             COALESCE((SELECT MAX(id) FROM company_usage), 1));
SELECT setval('candidate_screening_id_seq',       COALESCE((SELECT MAX(id) FROM candidate_screening), 1));
SELECT setval('candidate_interview_id_seq',       COALESCE((SELECT MAX(id) FROM candidate_interview), 1));
SELECT setval('master_roles_id_seq',              COALESCE((SELECT MAX(id) FROM master_roles), 1));
SELECT setval('master_modules_id_seq',            COALESCE((SELECT MAX(id) FROM master_modules), 1));
SELECT setval('master_menus_id_seq',              COALESCE((SELECT MAX(id) FROM master_menus), 1));
SELECT setval('mapping_modules_menus_id_seq',     COALESCE((SELECT MAX(id) FROM mapping_modules_menus), 1));
SELECT setval('global_permissions_id_seq',        COALESCE((SELECT MAX(id) FROM global_permissions), 1));
SELECT setval('mapping_roles_permissions_id_seq', COALESCE((SELECT MAX(id) FROM mapping_roles_permissions), 1));
SELECT setval('mapping_users_roles_id_seq',       COALESCE((SELECT MAX(id) FROM mapping_users_roles), 1));
SELECT setval('master_job_account_id_seq',        COALESCE((SELECT MAX(id) FROM master_job_account), 1));
SELECT setval('master_recruiters_id_seq',         COALESCE((SELECT MAX(id) FROM master_recruiters), 1));
SELECT setval('core_job_id_seq',                  COALESCE((SELECT MAX(id) FROM core_job), 1));
SELECT setval('core_job_template_id_seq',         COALESCE((SELECT MAX(id) FROM core_job_template), 1));
SELECT setval('job_stage_id_seq',                 COALESCE((SELECT MAX(id) FROM job_stage), 1));
SELECT setval('core_job_sourcing_id_seq',         COALESCE((SELECT MAX(id) FROM core_job_sourcing), 1));
SELECT setval('master_applicant_id_seq',          COALESCE((SELECT MAX(id) FROM master_applicant), 1));
SELECT setval('master_candidate_id_seq',          COALESCE((SELECT MAX(id) FROM master_candidate), 1));
SELECT setval('master_assessment_id_seq',         COALESCE((SELECT MAX(id) FROM master_assessment), 1));
SELECT setval('candidate_job_score_id_seq',       COALESCE((SELECT MAX(id) FROM candidate_job_score), 1));
SELECT setval('core_applicant_assessment_id_seq', COALESCE((SELECT MAX(id) FROM core_applicant_assessment), 1));

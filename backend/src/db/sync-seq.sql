-- Run this after seeding to sync all PostgreSQL sequences
SELECT setval('master_users_id_seq',              (SELECT MAX(id) FROM master_users));
SELECT setval('master_roles_id_seq',              (SELECT MAX(id) FROM master_roles));
SELECT setval('master_modules_id_seq',            (SELECT MAX(id) FROM master_modules));
SELECT setval('master_menus_id_seq',              (SELECT MAX(id) FROM master_menus));
SELECT setval('mapping_modules_menus_id_seq',     (SELECT MAX(id) FROM mapping_modules_menus));
SELECT setval('global_permissions_id_seq',        (SELECT MAX(id) FROM global_permissions));
SELECT setval('mapping_roles_permissions_id_seq', (SELECT MAX(id) FROM mapping_roles_permissions));
SELECT setval('mapping_users_roles_id_seq',       (SELECT MAX(id) FROM mapping_users_roles));
SELECT setval('master_job_account_id_seq',        (SELECT MAX(id) FROM master_job_account));
SELECT setval('core_job_id_seq',                  (SELECT MAX(id) FROM core_job));
SELECT setval('core_job_sourcing_id_seq',         (SELECT MAX(id) FROM core_job_sourcing));
SELECT setval('master_applicant_id_seq',          (SELECT MAX(id) FROM master_applicant));

-- Sync PostgreSQL sequences after seeding
SELECT setval('master_users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM master_users));
SELECT setval('master_landing_id_seq', (SELECT COALESCE(MAX(id), 1) FROM master_landing));
SELECT setval('master_email_notify_id_seq', (SELECT COALESCE(MAX(id), 1) FROM master_email_notify));

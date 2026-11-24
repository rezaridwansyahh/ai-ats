SELECT setval('master_employee_id_seq', COALESCE((SELECT MAX(id) FROM master_employee), 1));
SELECT setval('master_modules_id_seq', COALESCE((SELECT MAX(id) FROM master_modules), 1));
SELECT setval('master_menus_id_seq', COALESCE((SELECT MAX(id) FROM master_menus), 1));
SELECT setval('mapping_modules_menus_id_seq', COALESCE((SELECT MAX(id) FROM mapping_modules_menus), 1));
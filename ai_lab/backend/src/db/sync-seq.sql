SELECT setval('master_employee_id_seq', COALESCE((SELECT MAX(id) FROM master_employee), 1));
SELECT setval(pg_get_serial_sequence('master_modules', 'id'), (SELECT MAX(id) FROM master_modules));
SELECT setval(pg_get_serial_sequence('master_menus', 'id'), (SELECT MAX(id) FROM master_menus));
SELECT setval(pg_get_serial_sequence('mapping_modules_menus', 'id'), (SELECT MAX(id) FROM mapping_modules_menus));
-- Drop tables in reverse dependency order (most dependent first)
DROP TABLE IF EXISTS master_users CASCADE;
DROP TABLE IF EXISTS master_roles CASCADE;
DROP TABLE IF EXISTS mapping_users_roles CASCADE;
DROP TABLE IF EXISTS master_modules CASCADE;
DROP TABLE IF EXISTS master_menus CASCADE;
DROP TABLE IF EXISTS mappng_modules_menus CASCADE;
DROP TABLE IF EXISTS global_permissions CASCADE;
DROP TABLE IF EXISTS mapping_roles_permissions CASCADE;

CREATE TABLE master_users (
  id SERIAL PRIMARY KEY,
  password TEXT NOT NULL,
  email VARCHAR(100) NOT NULL
);

CREATE TABLE master_roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  additional JSONB
);

CREATE TABLE mapping_users_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES master_users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES master_roles(id) ON DELETE CASCADE,
  UNIQUE (user_id, role_id)
);

CREATE TABLE master_modules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE master_menus (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE mapping_modules_menus (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES master_modules(id) ON DELETE CASCADE,
  menu_id INTEGER NOT NULL REFERENCES master_menus(id) ON DELETE CASCADE,
  UNIQUE (module_id, menu_id)
);

CREATE TABLE global_permissions (
  id SERIAL PRIMARY KEY,
  module_menu_id INTEGER NOT NULL REFERENCES mapping_modules_menus(id) ON DELETE CASCADE,
  functionality VARCHAR(100) NOT NULL,
  UNIQUE (module_menu_id, functionality)
);

CREATE TABLE mapping_roles_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES master_roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES global_permissions(id) ON DELETE CASCADE,
  UNIQUE (role_id, permission_id)
);
-- Drop tables in reverse dependency order (most dependent first)
DROP TABLE IF EXISTS mapping_job_posting_linkedin CASCADE;
DROP TABLE IF EXISTS mapping_job_posting_seek CASCADE;
DROP TABLE IF EXISTS core_job_posting CASCADE;
DROP TABLE IF EXISTS master_job_account CASCADE;
DROP TABLE IF EXISTS master_users CASCADE;
DROP TABLE IF EXISTS master_roles CASCADE;
DROP TABLE IF EXISTS mapping_users_roles CASCADE;
DROP TABLE IF EXISTS master_modules CASCADE;
DROP TABLE IF EXISTS master_menus CASCADE;
DROP TABLE IF EXISTS mapping_modules_menus CASCADE;
DROP TABLE IF EXISTS global_permissions CASCADE;
DROP TABLE IF EXISTS mapping_roles_permissions CASCADE;

-- Drop enums after all tables are gone
DROP TYPE IF EXISTS status_type CASCADE;
DROP TYPE IF EXISTS work_option_type CASCADE;
DROP TYPE IF EXISTS work_type_type CASCADE;
DROP TYPE IF EXISTS pay_type_type CASCADE;
DROP TYPE IF EXISTS currency_type CASCADE;
DROP TYPE IF EXISTS pay_display_type CASCADE;
DROP TYPE IF EXISTS platform_type CASCADE;

-- Create ENUM type
CREATE TYPE status_type AS ENUM ('Draft', 'Submitted', 'Running', 'Expired');
CREATE TYPE work_option_type AS ENUM ('On-site', 'Hybrid', 'Remote');
CREATE TYPE work_type_type AS ENUM ('Full-time', 'Part-time', 'Contract', 'Casual');
CREATE TYPE pay_type_type AS ENUM ('Hourly', 'Monthly', 'Annually');
CREATE TYPE currency_type AS ENUM ('AUD', 'HKD', 'IDR', 'MYR', 'NZD', 'PHP', 'SGD', 'THB', 'USD');
CREATE TYPE pay_display_type AS ENUM ('Show', 'Hide');
CREATE TYPE platform_type AS ENUM ('seek', 'linkedin');

CREATE TABLE master_users (
  id SERIAL PRIMARY KEY,
  password TEXT NOT NULL,
  email VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL
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

CREATE TABLE master_job_account (
  id SERIAL PRIMARY KEY,
  portal_name platform_type NOT NULL,
  email VARCHAR(255) NOT NULL,
  password TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES master_users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE core_job_posting (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES master_job_account(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  job_desc TEXT NOT NULL,
  job_location VARCHAR(255),
  work_option work_option_type,
  work_type  work_type_type,
  status  status_type NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE mapping_job_posting_seek (
  id SERIAL PRIMARY KEY,
  job_posting_id INTEGER NOT NULL UNIQUE REFERENCES core_job_posting(id) ON DELETE CASCADE,
  currency currency_type,
  pay_type pay_type_type,
  pay_min INT,
  pay_max INT,
  pay_display pay_display_type,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE mapping_job_posting_linkedin (
  id SERIAL PRIMARY KEY,
  job_posting_id INTEGER NOT NULL UNIQUE REFERENCES core_job_posting(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
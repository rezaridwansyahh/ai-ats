-- Drop tables in reverse dependency order (most dependent first)
DROP TABLE IF EXISTS demo_bookings;
DROP TABLE IF EXISTS master_landing;
DROP TABLE IF EXISTS mapping_job_posting_linkedin CASCADE;
DROP TABLE IF EXISTS mapping_job_posting_seek CASCADE;
DROP TABLE IF EXISTS core_job_posting CASCADE;
DROP TABLE IF EXISTS master_job_account CASCADE;
DROP TABLE IF EXISTS master_candidates CASCADE;
DROP TABLE IF EXISTS cookies;
DROP TABLE IF EXISTS master_users CASCADE;
DROP TABLE IF EXISTS master_roles CASCADE;
DROP TABLE IF EXISTS mapping_users_roles CASCADE;
DROP TABLE IF EXISTS master_modules CASCADE;
DROP TABLE IF EXISTS master_menus CASCADE;
DROP TABLE IF EXISTS mapping_modules_menus CASCADE;
DROP TABLE IF EXISTS global_permissions CASCADE;
DROP TABLE IF EXISTS mapping_roles_permissions CASCADE;
DROP TABLE IF EXISTS master_sourcing CASCADE;
DROP TABLE IF EXISTS master_sourcing_recruite CASCADE;
DROP TABLE IF EXISTS master_landing CASCADE;

-- Drop enums after all tables are gone
DROP TYPE IF EXISTS booking_status_type CASCADE;
DROP TYPE IF EXISTS session_slot_type CASCADE;
DROP TYPE IF EXISTS status_type CASCADE;
DROP TYPE IF EXISTS work_option_type CASCADE;
DROP TYPE IF EXISTS work_type_type CASCADE;
DROP TYPE IF EXISTS pay_type_type CASCADE;
DROP TYPE IF EXISTS currency_type CASCADE;
DROP TYPE IF EXISTS pay_display_type CASCADE;
DROP TYPE IF EXISTS platform_type CASCADE;
DROP TYPE IF EXISTS candidate_status_type CASCADE;

-- Create ENUM type
CREATE TYPE status_type AS ENUM ('Draft', 'Active', 'Running', 'Expired', 'Failed', 'Blocked');
CREATE TYPE work_option_type AS ENUM ('On-site', 'Hybrid', 'Remote');
CREATE TYPE work_type_type AS ENUM ('Full-time', 'Part-time', 'Contract', 'Casual');
CREATE TYPE pay_type_type AS ENUM ('Hourly', 'Monthly', 'Annually');
CREATE TYPE currency_type AS ENUM ('AUD', 'HKD', 'IDR', 'MYR', 'NZD', 'PHP', 'SGD', 'THB', 'USD');
CREATE TYPE pay_display_type AS ENUM ('Show', 'Hide');
CREATE TYPE platform_type AS ENUM ('seek', 'linkedin');
CREATE TYPE candidate_status_type AS ENUM ('Kotak masuk', 'Prescreen', 'Terpilih', 'Wawancara', 'Penawaran', 'Menerima Tawaran', 'Tidak cocok');
CREATE TYPE booking_status_type AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE session_slot_type   AS ENUM ('10-12', '1-3', '4-6');

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

CREATE TABLE cookies (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES master_job_account(id) ON DELETE CASCADE,
  cookies JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(account_id)  -- prevent duplicates
);

CREATE TABLE core_job_posting (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES master_job_account(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  job_desc TEXT,
  job_location VARCHAR(255),
  work_option work_option_type,
  work_type  work_type_type,
  status status_type NOT NULL DEFAULT 'Running',
  candidate_count INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  additional JSONB
);

CREATE TABLE mapping_job_posting_seek (
  id SERIAL PRIMARY KEY,
  job_posting_id INTEGER NOT NULL UNIQUE REFERENCES core_job_posting(id) ON DELETE CASCADE,
  seek_id VARCHAR(100) UNIQUE,
  currency currency_type,
  pay_type pay_type_type,
  created_date_seek VARCHAR(255),
  created_by VARCHAR(255),
  pay_min INT,
  pay_max INT,
  pay_display pay_display_type,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE master_candidates (
  id SERIAL PRIMARY KEY,
  job_posting_id INTEGER NOT NULL REFERENCES core_job_posting(id) ON DELETE CASCADE,
  candidate_status candidate_status_type NOT NULL,
  candidate_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  last_position VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  education VARCHAR(255),
  information JSONB,
  date TIMESTAMPTZ,
  attachment VARCHAR(255),
  UNIQUE(candidate_id, job_posting_id)
);

CREATE TABLE mapping_job_posting_linkedin (
  id SERIAL PRIMARY KEY,
  job_posting_id INTEGER NOT NULL UNIQUE REFERENCES core_job_posting(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE master_sourcing (
  id INTEGER PRIMARY KEY,
  job_title VARCHAR(255),
  location VARCHAR(255),
  skills_and_assessments VARCHAR(255),
  companies VARCHAR(255),
  schools VARCHAR(255),
  year_graduate INTEGER,
  industries VARCHAR(255),
  keywords VARCHAR(255),

  CONSTRAINT at_least_one_field_filled CHECK (
    job_title IS NOT NULL OR
    location IS NOT NULL OR
    skills_and_assessments IS NOT NULL OR
    companies IS NOT NULL OR
    schools IS NOT NULL OR
    year_graduate IS NOT NULL OR
    industries IS NOT NULL OR
    keywords IS NOT NULL
  )
);

CREATE TABLE master_sourcing_recruite (
  id INTEGER PRIMARY KEY,
  sourcing_id INTEGER REFERENCES master_sourcing(id) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  information VARCHAR(255),
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE master_landing (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company_size VARCHAR(100),
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE demo_bookings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company_size VARCHAR(100),
  message TEXT,
  booking_date DATE NOT NULL,
  session_slot session_slot_type NOT NULL,
  status booking_status_type NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  conference_link TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
-- Drop tables in reverse dependency order (most dependent first)
DROP TABLE IF EXISTS mapping_job_sourcing_linkedin CASCADE;
DROP TABLE IF EXISTS mapping_job_sourcing_seek CASCADE;
DROP TABLE IF EXISTS core_job_sourcing CASCADE;
DROP TABLE IF EXISTS core_job CASCADE;
DROP TABLE IF EXISTS core_project_linkedin CASCADE;
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

DROP TABLE IF EXISTS master_recruiters CASCADE;
DROP TABLE IF EXISTS core_job_pipeline_stages CASCADE;
DROP TABLE IF EXISTS core_job_pipeline CASCADE;
DROP TABLE IF EXISTS recruitment_stage CASCADE;
DROP TABLE IF EXISTS core_job_template CASCADE;
DROP TABLE IF EXISTS master_template_stage CASCADE;
DROP TABLE IF EXISTS recruitment_stage_category CASCADE;
DROP TABLE IF EXISTS mapping_candidates_seek CASCADE;
DROP TABLE IF EXISTS mapping_candidates_linkedin CASCADE;
DROP TABLE IF EXISTS job_stage_sla CASCADE;

-- Drop enums after all tables are gone
DROP TYPE IF EXISTS recruiter_status_type CASCADE;
DROP TYPE IF EXISTS status_type CASCADE;
DROP TYPE IF EXISTS work_option_type CASCADE;
DROP TYPE IF EXISTS work_type_type CASCADE;
DROP TYPE IF EXISTS pay_type_type CASCADE;
DROP TYPE IF EXISTS currency_type CASCADE;
DROP TYPE IF EXISTS pay_display_type CASCADE;
DROP TYPE IF EXISTS platform_type CASCADE;
DROP TYPE IF EXISTS candidate_status_type CASCADE;
DROP TYPE IF EXISTS condition_type CASCADE;
DROP TYPE IF EXISTS stage_category_type CASCADE;
DROP TYPE IF EXISTS booking_status_type CASCADE;
DROP TYPE IF EXISTS session_slot_type CASCADE;

-- Create ENUM type
CREATE TYPE status_type AS ENUM ('Draft', 'Active', 'Running', 'Expired', 'Failed', 'Blocked');
CREATE TYPE work_option_type AS ENUM ('On-site', 'Hybrid', 'Remote');
CREATE TYPE work_type_type AS ENUM ('Full-time', 'Part-time', 'Contract', 'Casual');
CREATE TYPE pay_type_type AS ENUM ('Hourly', 'Monthly', 'Annually');
CREATE TYPE currency_type AS ENUM ('AUD', 'HKD', 'IDR', 'MYR', 'NZD', 'PHP', 'SGD', 'THB', 'USD');
CREATE TYPE pay_display_type AS ENUM ('Show', 'Hide');
CREATE TYPE platform_type AS ENUM ('linkedin', 'seek', 'glints', 'instagram', 'facebook', 'whatsapp');
CREATE TYPE candidate_status_type AS ENUM ('Kotak masuk', 'Prescreen', 'Terpilih', 'Wawancara', 'Penawaran', 'Menerima Tawaran', 'Tidak cocok');
CREATE TYPE recruiter_status_type AS ENUM ('Active', 'Onboarding');
CREATE TYPE booking_status_type AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE session_slot_type   AS ENUM ('10-12', '1-3', '4-6');
CREATE TYPE condition_type AS ENUM ('Connected', 'Not Connected', 'Error');

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
  condition condition_type NOT NULL DEFAULT 'Not Connected',
  last_sync TIMESTAMP,
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

CREATE TABLE recruitment_stage_category (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE master_template_stage (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE core_job (
  id SERIAL PRIMARY KEY,
  -- Common
  job_title VARCHAR(255) NOT NULL,
  job_desc TEXT,
  job_location VARCHAR(255),
  work_option work_option_type,
  work_type work_type_type,
  -- Seek-specific
  pay_type pay_type_type,
  currency currency_type,
  pay_min INTEGER,
  pay_max INTEGER,
  pay_display pay_display_type,
  -- LinkedIn-specific
  company VARCHAR(255),
  seniority_level VARCHAR(255),
  company_url VARCHAR(255),
  -- Job Details
  qualifications TEXT,
  required_skills JSONB,
  preferred_skills JSONB,
  -- Status
  status status_type NOT NULL DEFAULT 'Draft',
  sla_deadline_days INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE core_job_template (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL UNIQUE REFERENCES core_job(id) ON DELETE CASCADE,
  template_stage_id INTEGER NOT NULL REFERENCES master_template_stage(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE recruitment_stage (
  id SERIAL PRIMARY KEY,
  master_id INTEGER REFERENCES master_template_stage(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES core_job(id) ON DELETE CASCADE,
  stage_type_id INTEGER NOT NULL REFERENCES recruitment_stage_category(id),
  name VARCHAR(255) NOT NULL,
  stage_order INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_master_or_job CHECK (
    (master_id IS NOT NULL AND job_id IS NULL) OR
    (master_id IS NULL AND job_id IS NOT NULL)
  ),
  UNIQUE(master_id, stage_order),
  UNIQUE(job_id, stage_order)
);

CREATE TABLE core_job_sourcing (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES master_job_account(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES core_job(id) ON DELETE CASCADE,
  job_title VARCHAR(255) NOT NULL,
  platform platform_type NOT NULL,
  platform_job_id VARCHAR(255),
  status status_type NOT NULL DEFAULT 'Active',
  last_sync TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  additional JSONB,
  UNIQUE (platform, account_id, platform_job_id)
);

CREATE TABLE core_project_linkedin (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  job_location VARCHAR(255) NOT NULL,
  seniority_level VARCHAR(255) NOT NULL,
  company_for VARCHAR(255) NOT NULL,
  project_visible VARCHAR(255)
);

CREATE TABLE mapping_job_sourcing_seek (
  id SERIAL PRIMARY KEY,
  job_sourcing_id INTEGER NOT NULL UNIQUE REFERENCES core_job_sourcing(id) ON DELETE CASCADE,
  seek_id VARCHAR(100) UNIQUE,
  currency currency_type,
  pay_type pay_type_type,
  created_date_seek VARCHAR(255),
  created_by VARCHAR(255),
  candidate_count INTEGER DEFAULT 0,
  pay_min INT,
  pay_max INT,
  pay_display pay_display_type,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE mapping_job_sourcing_linkedin (
  id SERIAL PRIMARY KEY,
  job_sourcing_id INTEGER NOT NULL UNIQUE REFERENCES core_job_sourcing(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES core_project_linkedin(id) ON DELETE SET NULL,
  linkedin_id VARCHAR(100) UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE master_candidates (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES core_job(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  last_position VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  education VARCHAR(255),
  information JSONB,
  date TIMESTAMPTZ,
  attachment VARCHAR(255),
  UNIQUE (name, job_id)
);

CREATE TABLE mapping_candidates_seek (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES master_candidates(id) ON DELETE CASCADE,
  candidate_status candidate_status_type NOT NULL,
  candidate_seek_id INTEGER NOT NULL,
  UNIQUE (candidate_seek_id, candidate_id)
);

CREATE TABLE mapping_candidates_linkedin (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL UNIQUE REFERENCES master_candidates(id) ON DELETE CASCADE
);

CREATE TABLE master_sourcing (
  id SERIAL PRIMARY KEY,
  job_title VARCHAR(255),
  location VARCHAR(255),
  skill VARCHAR(255),
  company VARCHAR(255),
  school VARCHAR(255),
  year_graduate INTEGER,
  industry VARCHAR(255),
  keyword VARCHAR(255),
  CONSTRAINT at_least_one_field_filled CHECK (
    job_title IS NOT NULL OR
    location IS NOT NULL OR
    skill IS NOT NULL OR
    company IS NOT NULL OR
    school IS NOT NULL OR
    year_graduate IS NOT NULL OR
    industry IS NOT NULL OR
    keyword IS NOT NULL
  )
);

CREATE TABLE master_sourcing_recruite (
  id INTEGER PRIMARY KEY,
  sourcing_id INTEGER REFERENCES master_sourcing(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  skill VARCHAR(255) NOT NULL,
  information JSONB,
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE master_recruiters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  jobs_assigned INTEGER NOT NULL DEFAULT 0,
  status recruiter_status_type NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE job_stage_sla (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES core_job(id) ON DELETE CASCADE,
  stage_id INTEGER NOT NULL REFERENCES recruitment_stage(id) ON DELETE CASCADE,
  sla_days INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, stage_id)
);


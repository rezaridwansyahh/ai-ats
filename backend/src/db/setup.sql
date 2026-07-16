-- Drop tables in reverse dependency order (most dependent first)
-- Onboarding tables (Migration 010)
DROP TABLE IF EXISTS onboarding_hris_task CASCADE;
DROP TABLE IF EXISTS onboarding_welcome_message CASCADE;
DROP TABLE IF EXISTS onboarding_probation_checkin CASCADE;
DROP TABLE IF EXISTS onboarding_milestone CASCADE;
DROP TABLE IF EXISTS onboarding_day_one_schedule CASCADE;
DROP TABLE IF EXISTS onboarding_checklist_item CASCADE;
DROP TABLE IF EXISTS candidate_onboarding CASCADE;

DROP TABLE IF EXISTS company_budgets CASCADE;
DROP TABLE IF EXISTS company_usage CASCADE;
DROP TABLE IF EXISTS candidate_interview CASCADE;
DROP TABLE IF EXISTS interview_position_prep CASCADE;
DROP TABLE IF EXISTS interview_schedule CASCADE;
DROP TABLE IF EXISTS screening_qa CASCADE;
DROP TABLE IF EXISTS candidate_screening CASCADE;
DROP TABLE IF EXISTS candidate_job_score CASCADE;
DROP TABLE IF EXISTS applicant_job_score CASCADE;  -- orphan cleanup: old name (renamed → candidate_job_score)
DROP TABLE IF EXISTS master_skill_alias CASCADE;
DROP TABLE IF EXISTS core_company CASCADE;
DROP TABLE IF EXISTS mapping_applicant_linkedin CASCADE;
DROP TABLE IF EXISTS mapping_applicant_seek CASCADE;
DROP TABLE IF EXISTS mapping_job_sourcing_linkedin CASCADE;
DROP TABLE IF EXISTS mapping_job_sourcing_seek CASCADE;
DROP TABLE IF EXISTS master_applicant CASCADE;
DROP TABLE IF EXISTS master_candidate CASCADE;
DROP TABLE IF EXISTS core_job_sourcing CASCADE;
DROP TABLE IF EXISTS core_job CASCADE;
DROP TABLE IF EXISTS core_project_linkedin CASCADE;
DROP TABLE IF EXISTS master_job_account CASCADE;
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
DROP TABLE IF EXISTS interview_schedule;
DROP TABLE IF EXISTS interview_scorecard;
DROP TABLE IF EXISTS bg_lane;
DROP TABLE IF EXISTS bg_claim;
DROP TABLE IF EXISTS bg_consent;
DROP TABLE IF EXISTS bg_lane CASCADE;
DROP TABLE IF EXISTS candidate_bg;
DROP TABLE IF EXISTS offer_negotiation CASCADE;
DROP TABLE IF EXISTS offer_contract CASCADE;
DROP TABLE IF EXISTS offer_compensation CASCADE;
DROP TABLE IF EXISTS candidate_offer CASCADE;

DROP TABLE IF EXISTS master_recruiters CASCADE;
DROP TABLE IF EXISTS core_job_pipeline_stages CASCADE;
DROP TABLE IF EXISTS core_job_pipeline CASCADE;
DROP TABLE IF EXISTS candidate_stages CASCADE;
DROP TABLE IF EXISTS job_stage CASCADE;
DROP TABLE IF EXISTS job_post CASCADE;
DROP TABLE IF EXISTS core_job_template CASCADE;
DROP TABLE IF EXISTS master_template_stage CASCADE;
DROP TABLE IF EXISTS job_stage_category CASCADE;
DROP TABLE IF EXISTS recruitment_stage_category CASCADE;
DROP TABLE IF EXISTS job_automation_settings CASCADE;
DROP TABLE IF EXISTS candidate_job_score CASCADE;
DROP TABLE IF EXISTS assessment_sessions CASCADE;
DROP TABLE IF EXISTS core_applicant_assessment CASCADE;
DROP TABLE IF EXISTS master_assessment CASCADE;
DROP TABLE IF EXISTS participants CASCADE; -- For cleanup only

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
DROP TYPE IF EXISTS status_connection_type CASCADE;
DROP TYPE IF EXISTS status_sync_type CASCADE;
DROP TYPE IF EXISTS sync_state_type CASCADE;
DROP TYPE IF EXISTS stage_category_type CASCADE;
DROP TYPE IF EXISTS booking_status_type CASCADE;
DROP TYPE IF EXISTS session_slot_type CASCADE;
DROP TYPE IF EXISTS job_post_type CASCADE;
DROP TYPE IF EXISTS sourcing_status_type CASCADE;
DROP TYPE IF EXISTS battery_type CASCADE;
DROP TYPE IF EXISTS status_session_type CASCADE;
DROP TYPE IF EXISTS assessment_status_type CASCADE;
DROP TYPE IF EXISTS screening_qa_status_type CASCADE;
DROP TYPE IF EXISTS interview_status_type CASCADE;
DROP TYPE IF EXISTS interview_recommendation_type CASCADE;
DROP TYPE IF EXISTS offer_status_type CASCADE;
DROP TYPE IF EXISTS contract_status_type CASCADE;
DROP TYPE IF EXISTS contract_type_enum CASCADE;
DROP TYPE IF EXISTS negotiation_initiator_type CASCADE;

-- Create ENUM type
CREATE TYPE status_type AS ENUM ('Draft', 'Active', 'Running', 'Expired', 'Failed', 'Blocked');
CREATE TYPE work_option_type AS ENUM ('On-site', 'Hybrid', 'Remote');
CREATE TYPE work_type_type AS ENUM ('Full-time', 'Part-time', 'Contract', 'Casual');
CREATE TYPE pay_type_type AS ENUM ('Hourly', 'Monthly', 'Annually');
CREATE TYPE currency_type AS ENUM ('AUD', 'HKD', 'IDR', 'MYR', 'NZD', 'PHP', 'SGD', 'THB', 'USD');
CREATE TYPE pay_display_type AS ENUM ('Show', 'Hide');
CREATE TYPE platform_type AS ENUM ('linkedin', 'seek', 'glints', 'instagram', 'facebook', 'whatsapp', 'internal');
CREATE TYPE candidate_status_type AS ENUM ('Kotak masuk', 'Prescreen', 'Terpilih', 'Wawancara', 'Penawaran', 'Menerima Tawaran', 'Tidak cocok');
CREATE TYPE recruiter_status_type AS ENUM ('Active', 'Onboarding');
CREATE TYPE booking_status_type AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE session_slot_type   AS ENUM ('10-12', '1-3', '4-6');
CREATE TYPE status_connection_type AS ENUM ('Connected', 'Not Connected', 'Error');
CREATE TYPE status_sync_type AS ENUM ('Sync', 'Not Sync', 'Error');
CREATE TYPE sync_state_type AS ENUM ('idle', 'syncing', 'error');
CREATE TYPE job_post_type AS ENUM ('Internal', 'Publish');
CREATE TYPE sourcing_status_type AS ENUM ('Pending', 'Processing', 'Done', 'Failed');
CREATE TYPE stage_category_type AS ENUM ('Job Management', 'Screening & Matching', 'Interview', 'Assessment', 'Background Check', 'Offering & Contract', 'Other');
CREATE TYPE battery_type AS ENUM ('A', 'B', 'C', 'D', 'I', 'T');
CREATE TYPE status_session_type AS ENUM ('invited', 'in_progress', 'completed', 'expired', 'revoked');
CREATE TYPE assessment_status_type AS ENUM ('in_progress', 'completed', 'expired');
CREATE TYPE screening_qa_status_type AS ENUM ('draft', 'sent', 'responded', 'expired');
CREATE TYPE interview_status_type AS ENUM ('ongoing', 'interviewed', 'no_show', 'reschedule', 'cancelled', 'done');
CREATE TYPE interview_recommendation_type  AS ENUM ('strong_no_hire', 'no_hire', 'hire', 'strong_hire');
CREATE TYPE offer_status_type AS ENUM ('draft', 'sent', 'negotiating', 'accepted', 'rejected', 'expired');
CREATE TYPE contract_status_type AS ENUM ('draft', 'ready', 'sent', 'signed', 'expired');
CREATE TYPE contract_type_enum AS ENUM ('PKWT', 'PKWTT'); -- PKWT = Fixed-term, PKWTT = Permanent
CREATE TYPE negotiation_initiator_type AS ENUM ('candidate', 'recruiter');
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE core_company (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  email VARCHAR(255),
  website VARCHAR(255),
  logo_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE master_users (
  id SERIAL PRIMARY KEY,
  password TEXT NOT NULL,
  email VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL,
  company_id INTEGER REFERENCES core_company(id) ON DELETE SET NULL
);

CREATE TABLE company_usage (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  service VARCHAR(50) NOT NULL DEFAULT 'openai',
  model VARCHAR(100) NOT NULL,
  operation VARCHAR(100) NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(10, 6),
  request_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_company_usage_company_created ON company_usage (company_id, created_at DESC);
CREATE INDEX idx_company_usage_operation ON company_usage (operation);

-- Migration 009: Company AI Budget Management (Task 6.12)
CREATE TABLE company_budgets (
  id                SERIAL PRIMARY KEY,
  company_id        INTEGER NOT NULL REFERENCES core_company(id) ON DELETE CASCADE,
  month_year        DATE NOT NULL,
  budget_usd        NUMERIC(10,2) NOT NULL,
  alert_80_sent     BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_company_budgets_company_month UNIQUE (company_id, month_year)
);
CREATE INDEX idx_company_budgets_company_month ON company_budgets (company_id, month_year DESC);
CREATE INDEX idx_company_budgets_month_year ON company_budgets (month_year DESC);

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
  company_id INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
  status_connection status_connection_type NOT NULL DEFAULT 'Not Connected',
  status_sync status_sync_type NOT NULL DEFAULT 'Not Sync',
  last_connect TIMESTAMP,
  last_sync TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, portal_name)
);
CREATE INDEX idx_master_job_account_company ON master_job_account (company_id);

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
  company_id INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
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
  benefits JSONB,
  rubric JSONB,
  -- Status
  status status_type NOT NULL DEFAULT 'Draft',
  sla_start_date DATE NULL DEFAULT NOW(),
  sla_end_date DATE NULL DEFAULT NOW(),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_core_job_company ON core_job (company_id);

CREATE TABLE core_job_template (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL UNIQUE REFERENCES core_job(id) ON DELETE CASCADE,
  template_stage_id INTEGER NOT NULL REFERENCES master_template_stage(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE job_stage (
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

CREATE TABLE job_post (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES core_job(id) ON DELETE CASCADE,
  type job_post_type NOT NULL,
  platform platform_type NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE core_job_sourcing (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES master_job_account(id) ON DELETE CASCADE,
  job_post_id INTEGER REFERENCES job_post(id) ON DELETE CASCADE,
  job_title VARCHAR(255) NOT NULL,
  platform platform_type NOT NULL,
  platform_job_id VARCHAR(255),
  status status_type NOT NULL DEFAULT 'Active',
  last_sync TIMESTAMP,
  sync_state sync_state_type NOT NULL DEFAULT 'idle',  -- live applicant-sync state for this channel
  sync_started_at TIMESTAMP,
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

CREATE TABLE master_applicant (
  id SERIAL PRIMARY KEY,
  job_sourcing_id INTEGER NOT NULL REFERENCES core_job_sourcing(id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  last_position VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  education VARCHAR(255),
  information JSONB,
  date TIMESTAMPTZ,
  attachment VARCHAR(255),
  UNIQUE (name, job_sourcing_id)
);
CREATE INDEX idx_master_applicant_company ON master_applicant (company_id);

CREATE TABLE master_candidate (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES core_job(id) ON DELETE CASCADE,
  applicant_id INTEGER REFERENCES master_applicant(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  last_position VARCHAR(255),
  address VARCHAR(255),
  education VARCHAR(255),
  information JSONB,
  date TIMESTAMPTZ,
  attachment VARCHAR(255),
  latest_stage INTEGER REFERENCES job_stage(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (name, job_id)
);

CREATE TABLE mapping_applicant_seek (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES master_applicant(id) ON DELETE CASCADE,
  candidate_status candidate_status_type NOT NULL,
  candidate_seek_id INTEGER NOT NULL,
  UNIQUE (candidate_seek_id, candidate_id)
);

CREATE TABLE mapping_applicant_linkedin (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL UNIQUE REFERENCES master_applicant(id) ON DELETE CASCADE
);

CREATE TABLE master_sourcing (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES master_job_account(id) ON DELETE SET NULL,
  job_title VARCHAR(255),
  location VARCHAR(255),
  skill VARCHAR(255),
  company VARCHAR(255),
  school VARCHAR(255),
  year_graduate INTEGER,
  industry VARCHAR(255),
  keyword VARCHAR(255),
  status sourcing_status_type NOT NULL DEFAULT 'Pending',
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
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
  company_id INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  jobs_assigned INTEGER NOT NULL DEFAULT 0,
  status recruiter_status_type NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_master_recruiters_company ON master_recruiters (company_id);

CREATE TABLE job_automation_settings (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL UNIQUE REFERENCES core_job(id) ON DELETE CASCADE,
  ai_screening BOOLEAN NOT NULL,
  ai_follow_up BOOLEAN NOT NULL,
  auto_schedule BOOLEAN NOT NULL,
  auto_reject BOOLEAN NOT NULL,
  auto_advance BOOLEAN NOT NULL,
  email_notify BOOLEAN NOT NULL,
  reject_threshold INTEGER NOT NULL,
  advance_threshold INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE candidate_job_score (
  id                       SERIAL PRIMARY KEY,
  applicant_id             INTEGER NOT NULL REFERENCES master_applicant(id) ON DELETE CASCADE,
  job_id                   INTEGER NOT NULL REFERENCES core_job(id) ON DELETE CASCADE,
  overall_score            INTEGER NOT NULL CHECK (overall_score           BETWEEN 0 AND 100),
  skills_score             INTEGER          CHECK (skills_score            BETWEEN 0 AND 100),
  experience_score         INTEGER          CHECK (experience_score        BETWEEN 0 AND 100),
  career_trajectory_score  INTEGER          CHECK (career_trajectory_score BETWEEN 0 AND 100),
  education_score          INTEGER          CHECK (education_score         BETWEEN 0 AND 100),
  matched_skills           JSONB,
  missing_skills           JSONB,
  custom_criteria_results  JSONB,
  rubric_snapshot          JSONB,
  role_profile             VARCHAR(50),
  summary                  TEXT,
  scored_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (applicant_id, job_id)
);

CREATE INDEX idx_cjs_job_score ON candidate_job_score (job_id, overall_score DESC);
CREATE INDEX idx_cjs_applicant ON candidate_job_score (applicant_id);

-- candidate_screening: parent row for the L3 candidate-detail surface.
-- 1:1 with master_candidate; tracks recruiter decision (advance/hold/reject) at
-- the (candidate, job) scope. Engine state (parse/match/done) is *derived* from
-- master_applicant.information + candidate_job_score in queries — not stored
-- here to avoid sync drift for v1.
CREATE TABLE candidate_screening (
  id              SERIAL PRIMARY KEY,
  candidate_id    INTEGER NOT NULL UNIQUE REFERENCES master_candidate(id) ON DELETE CASCADE,
  job_id          INTEGER NOT NULL REFERENCES core_job(id) ON DELETE CASCADE,
  company_id      INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
  decision        VARCHAR(20),                              -- advance | hold | reject | NULL
  decision_reason TEXT,
  decided_at      TIMESTAMPTZ,
  decided_by      INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cs_job        ON candidate_screening (job_id);
CREATE INDEX idx_cs_company    ON candidate_screening (company_id);
CREATE INDEX idx_cs_decision   ON candidate_screening (decision);

CREATE TABLE screening_qa (
  id SERIAL PRIMARY KEY,
  screening_id INTEGER NOT NULL UNIQUE REFERENCES candidate_screening(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(), 
  focus_area VARCHAR(50),
  language VARCHAR(20),
  num_questions INTEGER,
  questions JSONB NOT NULL,
  answers JSONB,
  application_form        JSONB,        
  application_form_schema JSONB,       
  status screening_qa_status_type NOT NULL DEFAULT 'draft',
  sent_at  TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  expired_at  TIMESTAMPTZ,
  created_by  INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE candidate_interview (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES master_candidate(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES core_job(id)         ON DELETE CASCADE,
  company_id INTEGER REFERENCES core_company(id)              ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'ongoing',  -- ongoing | scheduled | interviewed | no_show | reschedule | done | cancelled
  scheduled_at TIMESTAMPTZ,
  decision VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | advanced | hold | rejected
  reject_reason VARCHAR(100),
  reject_note TEXT,
  decided_by INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  custom_questions JSONB DEFAULT '[]'::jsonb,
  UNIQUE (candidate_id, job_id)
);
CREATE INDEX idx_ci_job     ON candidate_interview (job_id);
CREATE INDEX idx_ci_company ON candidate_interview (company_id);

CREATE TABLE interview_position_prep (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES core_job(id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
  questions JSONB NOT NULL,
  rubric_items JSONB NOT NULL,
  created_by INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id)
);

CREATE TABLE interview_schedule (
  id SERIAL PRIMARY KEY,
  interview_id INTEGER NOT NULL REFERENCES candidate_interview(id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  confirmed_by INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  confirmation_note TEXT,
  created_by INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  status interview_status_type NOT NULL DEFAULT 'ongoing', -- interviewed | no_show | reschedule
  outcome_note TEXT,
  outcome_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE interview_scorecard (
  id SERIAL PRIMARY KEY,
  interview_id INTEGER NOT NULL UNIQUE REFERENCES candidate_interview(id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
  competency_scores   JSONB NOT NULL DEFAULT '{}',  -- {"HRD-01": 5, "HRD-02": 6, ...}
  competency_comments JSONB NOT NULL DEFAULT '{}',  -- {"HRD-01": "showed clear thinking..."}
  weighted_total NUMERIC(4,2),   -- computed on save, stored for Calibration sort
  review_flag BOOLEAN NOT NULL DEFAULT false,   -- true if any score <= 2
  recommendation interview_recommendation_type,
  standout_strengths TEXT,
  concerns TEXT,
  submitted_by INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  is_draft  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE candidate_bg (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES master_candidate(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES core_job(id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'claims',  -- claims | consent | tracker | verdict | done | archived
  status_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verdict VARCHAR(30),                            -- pass | pass_with_concerns | fail
  verdict_note JSONB,                                 
  decided_at TIMESTAMPTZ,
  decided_by INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  archived_reason VARCHAR(30),                            -- no_consent | consent_timeout | verdict_fail | calibration_advance
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (candidate_id, job_id)
);

CREATE TABLE bg_claim (
  id               SERIAL PRIMARY KEY,
  candidate_bg_id  INTEGER NOT NULL REFERENCES candidate_bg(id) ON DELETE CASCADE,
  claim_text       TEXT NOT NULL,
  claim_detail     TEXT,
  lane_type        VARCHAR(20) NOT NULL,  -- identity | edu | emp | cert | crim | cred | salary
  selected         BOOLEAN NOT NULL DEFAULT true,
  edited_by        INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  edited_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bg_consent (
  id SERIAL PRIMARY KEY,
  candidate_bg_id INTEGER NOT NULL UNIQUE REFERENCES candidate_bg(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  token_expires_at TIMESTAMPTZ,
  document JSONB,
  sent_at TIMESTAMPTZ,
  sent_by INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  signed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  revocation_reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bg_lane (
  id SERIAL PRIMARY KEY,
  candidate_bg_id INTEGER NOT NULL REFERENCES candidate_bg(id) ON DELETE CASCADE,
  bg_claim_id INTEGER NOT NULL REFERENCES bg_claim(id) ON DELETE CASCADE,
  lane_type VARCHAR(20) NOT NULL,
  note TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  resolved_by INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bg_claim_id)
);

-- =============================================================================
-- OFFER & CONTRACT MODULE
-- =============================================================================

CREATE TABLE candidate_offer (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES core_company(id) ON DELETE CASCADE,
  candidate_id INTEGER NOT NULL REFERENCES master_candidate(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES core_job(id) ON DELETE CASCADE,
  position_title VARCHAR(255) NOT NULL,
  contract_type contract_type_enum NOT NULL,
  offer_status offer_status_type NOT NULL DEFAULT 'draft',
  contract_status contract_status_type,
  metadata JSONB NOT NULL DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  created_by INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (candidate_id, job_id)
);

CREATE INDEX idx_candidate_offer_company ON candidate_offer(company_id);
CREATE INDEX idx_candidate_offer_candidate ON candidate_offer(candidate_id);
CREATE INDEX idx_candidate_offer_job ON candidate_offer(job_id);
CREATE INDEX idx_candidate_offer_status ON candidate_offer(offer_status);

CREATE TABLE offer_compensation (
  id SERIAL PRIMARY KEY,
  offer_id INTEGER NOT NULL UNIQUE REFERENCES candidate_offer(id) ON DELETE CASCADE,
  base_salary NUMERIC(15,2) NOT NULL,
  allowances JSONB NOT NULL DEFAULT '{}', -- { transport, meal, health, communication, etc }
  bonus_structure JSONB NOT NULL DEFAULT '{}', -- { annual_bonus, performance_bonus, etc }
  gross_salary NUMERIC(15,2) NOT NULL, -- base + allowances
  pph21 NUMERIC(15,2) NOT NULL, -- Indonesian income tax
  bpjs_kesehatan NUMERIC(15,2) NOT NULL, -- Health insurance (employee portion)
  bpjs_ketenagakerjaan NUMERIC(15,2) NOT NULL, -- Employment insurance
  net_salary NUMERIC(15,2) NOT NULL, -- take-home pay
  calculation_metadata JSONB NOT NULL DEFAULT '{}', -- audit trail of calculation
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offer_compensation_offer ON offer_compensation(offer_id);

CREATE TABLE offer_negotiation (
  id SERIAL PRIMARY KEY,
  offer_id INTEGER NOT NULL REFERENCES candidate_offer(id) ON DELETE CASCADE,
  initiated_by negotiation_initiator_type NOT NULL,
  message TEXT NOT NULL,
  requested_salary NUMERIC(15,2),
  response_type VARCHAR(20), -- 'accept' | 'counter' | 'decline'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | responded | closed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offer_negotiation_offer ON offer_negotiation(offer_id);
CREATE INDEX idx_offer_negotiation_created ON offer_negotiation(created_at DESC);

CREATE TABLE offer_contract (
  id SERIAL PRIMARY KEY,
  offer_id INTEGER NOT NULL UNIQUE REFERENCES candidate_offer(id) ON DELETE CASCADE,
  contract_type contract_type_enum NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL for PKWTT (permanent), required for PKWT (fixed-term)
  status contract_status_type NOT NULL DEFAULT 'draft',
  pdf_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}', -- { clauses, benefits, termination_conditions, etc }
  signature_data TEXT, -- base64 PNG of candidate signature
  signed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_by INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  generated_by INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offer_contract_offer ON offer_contract(offer_id);
CREATE INDEX idx_offer_contract_status ON offer_contract(status);

-- =============================================================================
-- END OFFER & CONTRACT MODULE

-- =============================================================================
-- Migration 010: Onboarding Module
-- MVP scaffold for post-offer onboarding flow
-- Created: 14 Jul 2026
-- =============================================================================

-- Main onboarding record
CREATE TABLE candidate_onboarding (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES core_company(id) ON DELETE CASCADE,
  candidate_id INTEGER NOT NULL REFERENCES master_candidate(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES core_job(id) ON DELETE CASCADE,
  offer_id INTEGER NOT NULL REFERENCES candidate_offer(id) ON DELETE CASCADE,
  candidate_name VARCHAR(255) NOT NULL,
  position_title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  probation_duration_days INTEGER DEFAULT 90,
  probation_end_date DATE,
  current_stage VARCHAR(50) DEFAULT 'pre-boarding',
  onboarding_status VARCHAR(50) DEFAULT 'pending',
  buddy_user_id INTEGER REFERENCES master_users(id),
  buddy_name VARCHAR(255),
  manager_user_id INTEGER REFERENCES master_users(id),
  manager_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  preboarding_completed_at TIMESTAMP,
  day_one_started_at TIMESTAMP,
  probation_started_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  terminated_at TIMESTAMP,
  CONSTRAINT unique_candidate_onboarding UNIQUE(candidate_id, offer_id)
);

CREATE INDEX idx_onboarding_company ON candidate_onboarding(company_id);
CREATE INDEX idx_onboarding_candidate ON candidate_onboarding(candidate_id);
CREATE INDEX idx_onboarding_job ON candidate_onboarding(job_id);
CREATE INDEX idx_onboarding_offer ON candidate_onboarding(offer_id);
CREATE INDEX idx_onboarding_status ON candidate_onboarding(onboarding_status);
CREATE INDEX idx_onboarding_stage ON candidate_onboarding(current_stage);
CREATE INDEX idx_onboarding_start_date ON candidate_onboarding(start_date);

-- Pre-boarding checklist items
CREATE TABLE onboarding_checklist_item (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES candidate_onboarding(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'document',
  owner VARCHAR(100) DEFAULT 'Candidate',
  status VARCHAR(50) DEFAULT 'notStarted',
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_checklist_onboarding ON onboarding_checklist_item(onboarding_id);
CREATE INDEX idx_checklist_status ON onboarding_checklist_item(status);

-- Day 1 schedule
CREATE TABLE onboarding_day_one_schedule (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES candidate_onboarding(id) ON DELETE CASCADE,
  time VARCHAR(10) NOT NULL,
  activity TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schedule_onboarding ON onboarding_day_one_schedule(onboarding_id);

-- Day 1-30 milestones
CREATE TABLE onboarding_milestone (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES candidate_onboarding(id) ON DELETE CASCADE,
  week_label VARCHAR(50),
  week_number INTEGER,
  item_label VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'notStarted',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_milestone_onboarding ON onboarding_milestone(onboarding_id);
CREATE INDEX idx_milestone_week ON onboarding_milestone(week_number);
CREATE INDEX idx_milestone_status ON onboarding_milestone(status);

-- Probation check-ins
CREATE TABLE onboarding_probation_checkin (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES candidate_onboarding(id) ON DELETE CASCADE,
  checkin_code VARCHAR(10) NOT NULL,
  checkin_title VARCHAR(100) NOT NULL,
  scheduled_date DATE,
  status VARCHAR(50) DEFAULT 'awaiting',
  manager_note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_checkin_onboarding ON onboarding_probation_checkin(onboarding_id);
CREATE INDEX idx_checkin_status ON onboarding_probation_checkin(status);

-- Welcome message
CREATE TABLE onboarding_welcome_message (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES candidate_onboarding(id) ON DELETE CASCADE,
  from_user_id INTEGER REFERENCES master_users(id),
  from_name VARCHAR(255),
  message_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_welcome_message UNIQUE(onboarding_id)
);

CREATE INDEX idx_welcome_onboarding ON onboarding_welcome_message(onboarding_id);

-- HRIS integration tasks
CREATE TABLE onboarding_hris_task (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES candidate_onboarding(id) ON DELETE CASCADE,
  task_code VARCHAR(20),
  task_title VARCHAR(255) NOT NULL,
  task_description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  integration_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_hris_task_onboarding ON onboarding_hris_task(onboarding_id);
CREATE INDEX idx_hris_task_status ON onboarding_hris_task(status);

-- =============================================================================
-- END ONBOARDING MODULE
-- =============================================================================

CREATE INDEX idx_applicant_information_gin
  ON master_applicant USING GIN (information jsonb_path_ops);

-- pg_trgm indexes for fuzzy / typo-tolerant search on master_applicant text columns.
CREATE INDEX idx_applicant_name_trgm          ON master_applicant USING GIN (name          gin_trgm_ops);
CREATE INDEX idx_applicant_last_position_trgm ON master_applicant USING GIN (last_position gin_trgm_ops);
CREATE INDEX idx_applicant_education_trgm     ON master_applicant USING GIN (education     gin_trgm_ops);
CREATE INDEX idx_applicant_address_trgm       ON master_applicant USING GIN (address       gin_trgm_ops);

CREATE TABLE master_skill_alias (
  alias        VARCHAR(100) PRIMARY KEY,
  canonical    VARCHAR(100) NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_skill_alias_canonical ON master_skill_alias (canonical);

CREATE TABLE candidate_stages(
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES master_candidate(id) ON DELETE CASCADE,
  job_stage_id INTEGER NOT NULL REFERENCES job_stage(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  decision JSONB NOT NULL
);

CREATE TABLE master_assessment(
  id SERIAL PRIMARY KEY,
  assessment_code VARCHAR(50) UNIQUE NOT NULL, -- 'myralix_battery_a', 'disc', 'bigfive'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT,  
  options JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE core_applicant_assessment(
  id SERIAL PRIMARY KEY,
  candidate_id  INTEGER NOT NULL REFERENCES master_candidate(id) ON DELETE CASCADE,
  assessment_id INT REFERENCES master_assessment(id),
  status assessment_status_type NOT NULL DEFAULT 'in_progress',
  results JSONB NOT NULL, -- HASIL LENGKAP (raw data + detail scoring)
  summary JSONB, -- HASIL SINGKAT (untuk quick view)
  narrative_report TEXT, -- laporan naratif lengkap (beberapa paragraf)
  strengths TEXT, -- kekuatan kandidat (bullet points)
  development_areas TEXT, -- area pengembangan (bullet points)
  recommended_roles TEXT, -- rekomendasi posisi yang sesuai (bullet points)
  ai_section_narratives JSONB, -- per-subtest AI interpretations: { tk, bigfive, disc, holland, ... }
  ai_evidence_bundle JSONB, -- deterministic anchors fed to the LLM (audit + regenerate)
  ai_report_status TEXT, -- pending | generating | completed | failed (NULL on legacy rows; resolved to 'not_generated' in JS)
  ai_report_generated_at TIMESTAMP,
  ai_report_error TEXT, -- last failure reason, surfaced in UI; cleared on next successful generation

  started_at TIMESTAMP,
  completed_at TIMESTAMPTZ,
  assessment_date DATE NOT NULL DEFAULT   CURRENT_DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (candidate_id, assessment_id)
);
CREATE INDEX idx_applicant_assessment ON core_applicant_assessment(candidate_id);
CREATE INDEX idx_assessment_date      ON core_applicant_assessment(assessment_date);
CREATE INDEX idx_assessment_type      ON core_applicant_assessment(assessment_id);

CREATE TABLE assessment_sessions(
  id SERIAL PRIMARY KEY,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  battery battery_type NOT NULL,
  candidate_id  INTEGER REFERENCES master_candidate(id) ON DELETE SET NULL,
  job_id INTEGER REFERENCES core_job(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  status status_session_type NOT NULL DEFAULT 'invited',
  expired_at TIMESTAMP NOT NULL,
  submitted_at TIMESTAMP,
  revoked_by INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
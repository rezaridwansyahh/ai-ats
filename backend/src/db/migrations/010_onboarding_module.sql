-- Migration 010: Onboarding Module
-- MVP scaffold for post-offer onboarding flow
-- Created: 14 Jul 2026

-- ============================================================================
-- ONBOARDING MODULE SCHEMA
-- ============================================================================
-- Tables untuk Onboarding flow (setelah offer diterima & contract ditandatangani)
-- 3 tahapan: Pre-boarding → Day 1-30 → Probation (90 hari)

-- Drop existing tables if exists (for re-runs)
DROP TABLE IF EXISTS onboarding_hris_task CASCADE;
DROP TABLE IF EXISTS onboarding_welcome_message CASCADE;
DROP TABLE IF EXISTS onboarding_probation_checkin CASCADE;
DROP TABLE IF EXISTS onboarding_milestone CASCADE;
DROP TABLE IF EXISTS onboarding_day_one_schedule CASCADE;
DROP TABLE IF EXISTS onboarding_checklist_item CASCADE;
DROP TABLE IF EXISTS candidate_onboarding CASCADE;

-- ----------------------------------------------------------------------------
-- Main onboarding record
-- ----------------------------------------------------------------------------
CREATE TABLE candidate_onboarding (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES master_companies(id) ON DELETE CASCADE,
  candidate_id INTEGER NOT NULL REFERENCES master_candidate(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES core_job(id) ON DELETE CASCADE,
  offer_id INTEGER NOT NULL REFERENCES candidate_offer(id) ON DELETE CASCADE,

  -- Metadata
  candidate_name VARCHAR(255) NOT NULL,
  position_title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,

  -- Probation settings
  probation_duration_days INTEGER DEFAULT 90, -- Biasanya 90 hari
  probation_end_date DATE,

  -- Status tracking
  current_stage VARCHAR(50) DEFAULT 'pre-boarding', -- 'pre-boarding', 'day-1-30', 'probation', 'confirmed', 'terminated'
  onboarding_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in-progress', 'completed', 'failed'

  -- Buddy assignment
  buddy_user_id INTEGER REFERENCES master_users(id),
  buddy_name VARCHAR(255),

  -- Manager
  manager_user_id INTEGER REFERENCES master_users(id),
  manager_name VARCHAR(255),

  -- Timestamps
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

COMMENT ON TABLE candidate_onboarding IS 'Main onboarding record for candidates who accepted offer. Tracks pre-boarding, first 30 days, and 90-day probation.';

-- ----------------------------------------------------------------------------
-- Pre-boarding checklist items
-- ----------------------------------------------------------------------------
CREATE TABLE onboarding_checklist_item (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES candidate_onboarding(id) ON DELETE CASCADE,

  -- Item details
  label VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'document', -- 'document', 'equipment', 'access', 'training', 'other'

  -- Ownership
  owner VARCHAR(100) DEFAULT 'Candidate', -- 'Candidate', 'HR', 'IT/Ops', 'Manager', etc.

  -- Status
  status VARCHAR(50) DEFAULT 'notStarted', -- 'notStarted', 'inProgress', 'done', 'blocked'

  -- Order
  sort_order INTEGER DEFAULT 0,

  -- Metadata
  notes TEXT,
  due_date DATE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_checklist_onboarding ON onboarding_checklist_item(onboarding_id);
CREATE INDEX idx_checklist_status ON onboarding_checklist_item(status);

COMMENT ON TABLE onboarding_checklist_item IS 'Pre-boarding checklist (KTP, NPWP, equipment, etc.). Auto-generated from template on onboarding creation.';

-- ----------------------------------------------------------------------------
-- Day 1 schedule (first day activities)
-- ----------------------------------------------------------------------------
CREATE TABLE onboarding_day_one_schedule (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES candidate_onboarding(id) ON DELETE CASCADE,

  -- Schedule details
  time VARCHAR(10) NOT NULL, -- '09:00', '10:00', etc.
  activity TEXT NOT NULL,

  -- Order
  sort_order INTEGER DEFAULT 0,

  -- Status
  completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schedule_onboarding ON onboarding_day_one_schedule(onboarding_id);

COMMENT ON TABLE onboarding_day_one_schedule IS 'First day schedule (HR welcome, team intro, lunch, 1:1, setup). Shown in pre-boarding view.';

-- ----------------------------------------------------------------------------
-- Day 1-30 milestones
-- ----------------------------------------------------------------------------
CREATE TABLE onboarding_milestone (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES candidate_onboarding(id) ON DELETE CASCADE,

  -- Milestone details
  week_label VARCHAR(50), -- 'Week 1', 'Week 2', 'Week 3-4', etc.
  week_number INTEGER, -- 1, 2, 3, 4
  item_label VARCHAR(255) NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'notStarted', -- 'notStarted', 'inProgress', 'done'

  -- Order
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_milestone_onboarding ON onboarding_milestone(onboarding_id);
CREATE INDEX idx_milestone_week ON onboarding_milestone(week_number);
CREATE INDEX idx_milestone_status ON onboarding_milestone(status);

COMMENT ON TABLE onboarding_milestone IS 'Day 1-30 milestones (workspace access, first PR, buddy sync, demo). Grouped by week.';

-- ----------------------------------------------------------------------------
-- Probation check-ins (30-day, 60-day, 90-day)
-- ----------------------------------------------------------------------------
CREATE TABLE onboarding_probation_checkin (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES candidate_onboarding(id) ON DELETE CASCADE,

  -- Check-in details
  checkin_code VARCHAR(10) NOT NULL, -- 'D30', 'D60', 'D90'
  checkin_title VARCHAR(100) NOT NULL, -- '30-day check-in', etc.
  scheduled_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'awaiting', -- 'awaiting', 'onTrack', 'atRisk', 'completed'

  -- Notes from manager
  manager_note TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_checkin_onboarding ON onboarding_probation_checkin(onboarding_id);
CREATE INDEX idx_checkin_status ON onboarding_probation_checkin(status);

COMMENT ON TABLE onboarding_probation_checkin IS 'Probation check-ins at D30, D60, D90. Manager adds notes and sets status (onTrack/atRisk).';

-- ----------------------------------------------------------------------------
-- Welcome message (from manager)
-- ----------------------------------------------------------------------------
CREATE TABLE onboarding_welcome_message (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES candidate_onboarding(id) ON DELETE CASCADE,

  -- Message details
  from_user_id INTEGER REFERENCES master_users(id),
  from_name VARCHAR(255),
  message_text TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_welcome_message UNIQUE(onboarding_id)
);

CREATE INDEX idx_welcome_onboarding ON onboarding_welcome_message(onboarding_id);

COMMENT ON TABLE onboarding_welcome_message IS 'Welcome message from manager shown in pre-boarding view.';

-- ----------------------------------------------------------------------------
-- HRIS integration tasks (push to Talenta, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE onboarding_hris_task (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES candidate_onboarding(id) ON DELETE CASCADE,

  -- Task details
  task_code VARCHAR(20), -- 'ON-03', etc.
  task_title VARCHAR(255) NOT NULL,
  task_description TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in-progress', 'completed', 'failed'

  -- Integration metadata (JSONB untuk flexibility)
  integration_data JSONB DEFAULT '{}'::jsonb,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_hris_task_onboarding ON onboarding_hris_task(onboarding_id);
CREATE INDEX idx_hris_task_status ON onboarding_hris_task(status);

COMMENT ON TABLE onboarding_hris_task IS 'HRIS integration tasks (push to Talenta, create email, provision Slack). Queued for automation.';

-- ============================================================================
-- Migration complete
-- ============================================================================

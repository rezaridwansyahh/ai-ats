-- ============================================================================
-- ONBOARDING MODULE SCHEMA
-- ============================================================================
-- Tables untuk Onboarding flow (setelah offer diterima & contract ditandatangani)
-- 3 tahapan: Pre-boarding → Day 1-30 → Probation (90 hari)

-- ----------------------------------------------------------------------------
-- Main onboarding record
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidate_onboarding (
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

-- ----------------------------------------------------------------------------
-- Pre-boarding checklist items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS onboarding_checklist_item (
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

-- ----------------------------------------------------------------------------
-- Day 1 schedule (first day activities)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS onboarding_day_one_schedule (
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

-- ----------------------------------------------------------------------------
-- Day 1-30 milestones
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS onboarding_milestone (
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

-- ----------------------------------------------------------------------------
-- Probation check-ins (30-day, 60-day, 90-day)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS onboarding_probation_checkin (
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

-- ----------------------------------------------------------------------------
-- Welcome message (from manager)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS onboarding_welcome_message (
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

-- ----------------------------------------------------------------------------
-- HRIS integration tasks (push to Talenta, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS onboarding_hris_task (
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

-- ============================================================================
-- SEED DEFAULT DATA (Template checklist items, milestones)
-- ============================================================================
-- Note: Actual seed data akan di-handle oleh backend service saat create onboarding
-- Ini hanya contoh structure yang bisa di-customize per company

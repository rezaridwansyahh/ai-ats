-- Migration 025: External assessment battery send+decide flow
-- New table for jobs using the 'External' assessment_battery — no internal
-- test, admin pastes a third-party assessment URL and emails it to the
-- candidate, then later records a manual decision (advance/hold/reject).
-- Modeled on candidate_bg's shape (free-text status, decided_at/decided_by),
-- not on assessment_sessions (no token/expiry/polling semantics apply here).
--
-- Note: this project's DB reset flow (node src/db/run-script.js) only runs
-- setup.sql, not this migrations/ folder — the equivalent change has already
-- been baked directly into setup.sql. This file exists only for anyone
-- upgrading an existing database without a full reset.

BEGIN;

CREATE TABLE IF NOT EXISTS candidate_external_assessment (
  id              SERIAL PRIMARY KEY,
  candidate_id    INTEGER NOT NULL REFERENCES master_candidate(id) ON DELETE CASCADE,
  job_id          INTEGER NOT NULL REFERENCES core_job(id) ON DELETE CASCADE,
  company_id      INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
  assessment_url  TEXT NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  sent_at         TIMESTAMPTZ,
  sent_by         INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  decision        VARCHAR(20),
  decided_at      TIMESTAMPTZ,
  decided_by      INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (candidate_id, job_id)
);

COMMIT;

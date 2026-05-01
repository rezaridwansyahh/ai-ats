-- Migration: AI Matching rubric + applicant_job_score restructure
-- Apply with:  psql "$DATABASEURL" -f backend/src/db/migrations/2026-05-01-ai-matching-rubric.sql
-- Idempotent — safe to re-run.

BEGIN;

-- core_job: rubric column
ALTER TABLE core_job
  ADD COLUMN IF NOT EXISTS rubric JSONB;

-- applicant_job_score: drop old position_score, add new rubric-driven columns
ALTER TABLE applicant_job_score
  DROP COLUMN IF EXISTS position_score;

ALTER TABLE applicant_job_score
  ADD COLUMN IF NOT EXISTS career_trajectory_score INTEGER
    CHECK (career_trajectory_score BETWEEN 0 AND 100);

ALTER TABLE applicant_job_score
  ADD COLUMN IF NOT EXISTS custom_criteria_results JSONB;

ALTER TABLE applicant_job_score
  ADD COLUMN IF NOT EXISTS rubric_snapshot JSONB;

ALTER TABLE applicant_job_score
  ADD COLUMN IF NOT EXISTS role_profile VARCHAR(50);

COMMIT;

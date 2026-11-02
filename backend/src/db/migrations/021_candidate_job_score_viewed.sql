-- Migration 021: "unviewed" flag for the AI Screening Match tab
-- Lets the Match workboard show a distinct outline for candidates the
-- recruiter hasn't opened the preview modal for yet. Lives on
-- candidate_job_score (not master_candidate) since the Match tab's ranked
-- list is keyed by the score row's existence, and "viewed" is naturally
-- scoped to one specific score, not the candidate in general.

BEGIN;

ALTER TABLE candidate_job_score
  ADD COLUMN IF NOT EXISTS is_viewed BOOLEAN NOT NULL DEFAULT false;

COMMIT;

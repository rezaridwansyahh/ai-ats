-- Migration 023: position-specific application form questions
-- Adds additional_application_questions to core_job — the job-level
-- questions layered on top of the company-wide application form (Settings →
-- Application Form). Saved/edited via PositionFormEditor, combined with the
-- company form at screening-send time by formService.getCombinedForm.
--
-- Note: this project's DB reset flow (node src/db/run-script.js) only runs
-- setup.sql, not this migrations/ folder — the equivalent change has already
-- been baked directly into setup.sql. This file exists only for anyone
-- upgrading an existing database without a full reset.

BEGIN;

ALTER TABLE core_job ADD COLUMN IF NOT EXISTS additional_application_questions JSONB;

COMMIT;

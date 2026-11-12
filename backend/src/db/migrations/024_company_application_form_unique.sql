-- Migration 024: company_application_form.company_id unique constraint
-- Required so PUT /api/form/company can upsert
-- (INSERT ... ON CONFLICT (company_id) DO UPDATE) instead of needing a
-- separate insert-or-update branch. The new Settings → Application Form
-- editor relies on this.
--
-- Note: this project's DB reset flow (node src/db/run-script.js) only runs
-- setup.sql, not this migrations/ folder — the equivalent change has already
-- been baked directly into setup.sql. This file exists only for anyone
-- upgrading an existing database without a full reset.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_application_form_company_id_key'
  ) THEN
    ALTER TABLE company_application_form
      ADD CONSTRAINT company_application_form_company_id_key UNIQUE (company_id);
  END IF;
END $$;

COMMIT;

-- Migration 028: public career page support
-- core_company.slug: public career page URL segment (/careers/:slug), not
-- backfilled here — run the companion backfill below per-row or via the app
-- (company.service.js now auto-generates one on create).
-- master_applicant.phone: the career apply form collects a phone number
-- (WhatsApp) with no existing structured column to put it in.

BEGIN;

ALTER TABLE core_company ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;
ALTER TABLE master_applicant ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Backfill slugs for existing companies from their name (lowercase,
-- non-alphanumerics to hyphens, collapsed). Skips rows that already have one.
UPDATE core_company
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
WHERE slug IS NULL;

COMMIT;

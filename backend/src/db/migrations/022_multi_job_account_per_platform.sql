-- Migration 022: allow multiple job accounts per platform per user
-- A recruiter can legitimately manage more than one account on the same
-- platform (e.g. two separate Seek accounts for two different clients).
-- Drops the UNIQUE(user_id, portal_name) constraint that previously capped
-- this at one account per platform per user.

BEGIN;

ALTER TABLE master_job_account
  DROP CONSTRAINT IF EXISTS master_job_account_user_id_portal_name_key;

COMMIT;

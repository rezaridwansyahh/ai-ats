-- Migration 026: battery_type 'External' value
-- Adds the 'External' assessment battery — jobs using it skip the internal
-- test-taking flow entirely in favor of the send/decide flow built on
-- candidate_external_assessment (migration 025). This value was already
-- added directly to setup.sql's battery_type enum but never got its own
-- migration file until now.
--
-- Note: this project's DB reset flow (node src/db/run-script.js) only runs
-- setup.sql, not this migrations/ folder — the equivalent change has already
-- been baked directly into setup.sql. This file exists only for anyone
-- upgrading an existing database without a full reset.

BEGIN;

ALTER TYPE battery_type ADD VALUE IF NOT EXISTS 'External';

COMMIT;

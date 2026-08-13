-- Migration 012: Round-aware interview pack candidates
-- Adds round_id to interview_pack_candidate so a candidate's pack entry can
-- be traced back to which interview round it belongs to. Needed for the
-- Result tab's per-round dropdown (getRoundsWithOutcomes).
--
-- Note: this project's DB reset flow (node src/db/run-script.js) only runs
-- setup.sql, not this migrations/ folder — the equivalent change has already
-- been baked directly into setup.sql. This file exists only for anyone
-- upgrading an existing database without a full reset.
--
-- Created: 12 Aug 2026

BEGIN;

ALTER TABLE interview_pack_candidate ADD COLUMN IF NOT EXISTS round_id INTEGER REFERENCES interview_round(id);
CREATE INDEX IF NOT EXISTS idx_ipc_round ON interview_pack_candidate(round_id);

COMMIT;

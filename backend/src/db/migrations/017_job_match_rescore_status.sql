-- Migration 017: async "re-score everyone" tracking for core_job
-- Backs the AI Matching workboard's "Edit Job Details & Re-score All" flow —
-- a BullMQ-queued force-rescore of every candidate on the job. Mirrors
-- core_job_sourcing.sync_state: a status column directly on the entity
-- rather than a side tracking table (one row per job).

BEGIN;

CREATE TYPE match_rescore_status_type AS ENUM ('idle', 'running', 'done', 'failed');

ALTER TABLE core_job
  ADD COLUMN match_rescore_status match_rescore_status_type NOT NULL DEFAULT 'idle',
  ADD COLUMN match_rescore_total INTEGER,
  ADD COLUMN match_rescore_processed INTEGER,
  ADD COLUMN match_rescore_error TEXT,
  ADD COLUMN match_rescore_started_at TIMESTAMP,
  ADD COLUMN match_rescore_finished_at TIMESTAMP;

COMMIT;

-- Migration 020: resumable-pagination cursor for Seek candidate extraction
-- Backs seek-extract-candidate retries: on failure mid-scrape, these two
-- columns let the next attempt skip buckets already fully processed and jump
-- straight to the last candidate's current page (via Seek's own `selected=`
-- URL resolution) instead of restarting the whole multi-bucket scrape from
-- page 1. Cleared back to NULL on a clean full completion (markSynced).

BEGIN;

ALTER TABLE core_job_sourcing
  ADD COLUMN current_bucket VARCHAR(100),
  ADD COLUMN last_seek_candidate_id VARCHAR(100);

COMMIT;

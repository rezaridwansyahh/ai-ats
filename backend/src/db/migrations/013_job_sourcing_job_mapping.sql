BEGIN;

CREATE TABLE IF NOT EXISTS mapping_job_sourcing_job (
  id SERIAL PRIMARY KEY,
  job_sourcing_id INTEGER NOT NULL REFERENCES core_job_sourcing(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES core_job(id) ON DELETE CASCADE,
  is_origin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (job_sourcing_id, job_id)
);
CREATE INDEX IF NOT EXISTS idx_mapping_job_sourcing_job_sourcing ON mapping_job_sourcing_job (job_sourcing_id);
CREATE INDEX IF NOT EXISTS idx_mapping_job_sourcing_job_job ON mapping_job_sourcing_job (job_id);

-- Backfill: seed origin mappings for existing sourcings that already have a job_post_id.
INSERT INTO mapping_job_sourcing_job (job_sourcing_id, job_id, is_origin)
SELECT cjs.id, jp.job_id, TRUE
FROM core_job_sourcing cjs
JOIN job_post jp ON jp.id = cjs.job_post_id
WHERE jp.job_id IS NOT NULL
ON CONFLICT (job_sourcing_id, job_id) DO NOTHING;

COMMIT;

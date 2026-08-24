BEGIN;

CREATE TABLE IF NOT EXISTS mapping_applicant_sourcing (
  id SERIAL PRIMARY KEY,
  applicant_id INTEGER NOT NULL REFERENCES master_applicant(id) ON DELETE CASCADE,
  job_sourcing_id INTEGER NOT NULL REFERENCES core_job_sourcing(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (applicant_id, job_sourcing_id)
);
CREATE INDEX IF NOT EXISTS idx_mapping_applicant_sourcing_applicant ON mapping_applicant_sourcing (applicant_id);
CREATE INDEX IF NOT EXISTS idx_mapping_applicant_sourcing_sourcing ON mapping_applicant_sourcing (job_sourcing_id);

-- Backfill: every existing applicant with a job_sourcing_id gets a mapping row.
INSERT INTO mapping_applicant_sourcing (applicant_id, job_sourcing_id)
SELECT id, job_sourcing_id
FROM master_applicant
WHERE job_sourcing_id IS NOT NULL
ON CONFLICT (applicant_id, job_sourcing_id) DO NOTHING;

-- Drop the now-redundant scalar column + its UNIQUE constraint from master_applicant.
ALTER TABLE master_applicant DROP CONSTRAINT IF EXISTS master_applicant_name_job_sourcing_id_key;
ALTER TABLE master_applicant DROP COLUMN IF EXISTS job_sourcing_id;

COMMIT;

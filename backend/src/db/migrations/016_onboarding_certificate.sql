BEGIN;

CREATE TABLE IF NOT EXISTS onboarding_certificate (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES candidate_onboarding(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES core_company(id) ON DELETE CASCADE,
  phase_id INTEGER NULL,
  title VARCHAR(255) NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (onboarding_id, phase_id)
);

COMMIT;
BEGIN;

CREATE TABLE IF NOT EXISTS company_email_template (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES core_company(id) ON DELETE CASCADE,
  stage_type_id INTEGER NOT NULL REFERENCES recruitment_stage_category(id),
  template_key VARCHAR(50) NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_by INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, stage_type_id, template_key)
);

COMMIT;

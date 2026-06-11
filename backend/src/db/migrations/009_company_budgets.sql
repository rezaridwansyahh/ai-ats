-- Migration 009: Company AI Budget Management
-- Task 6.12: AI cost cap + 80% alert (PH-CC)
-- Created: 1 June 2026

-- Drop existing table if exists (for re-runs)
DROP TABLE IF EXISTS company_budgets CASCADE;

-- Create company_budgets table
CREATE TABLE company_budgets (
  id                SERIAL PRIMARY KEY,
  company_id        INTEGER NOT NULL REFERENCES core_company(id) ON DELETE CASCADE,
  month_year        DATE NOT NULL,                -- First day of month (e.g., '2026-06-01')
  budget_usd        NUMERIC(10,2) NOT NULL,       -- Monthly AI budget cap in USD
  alert_80_sent     BOOLEAN NOT NULL DEFAULT false, -- Flag to prevent duplicate 80% alerts
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one budget per company per month
  CONSTRAINT uq_company_budgets_company_month UNIQUE (company_id, month_year)
);

-- Indexes for efficient lookups
CREATE INDEX idx_company_budgets_company_month ON company_budgets (company_id, month_year DESC);
CREATE INDEX idx_company_budgets_month_year ON company_budgets (month_year DESC);

-- Comments for documentation
COMMENT ON TABLE company_budgets IS 'Monthly AI usage budget caps per company. Enforces cost limits via checkBudgetOrThrow() in company-usage.service.js';
COMMENT ON COLUMN company_budgets.month_year IS 'First day of month (YYYY-MM-01). Use date_trunc(''month'', CURRENT_DATE) for matching.';
COMMENT ON COLUMN company_budgets.budget_usd IS 'Monthly spending cap in USD. Default recommendation: $50-100 for pilot companies.';
COMMENT ON COLUMN company_budgets.alert_80_sent IS 'True if 80% budget alert has been sent this month. Prevents duplicate Slack notifications. Resets next month.';

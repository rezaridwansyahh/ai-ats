-- Migration 027: company-scoped roles
-- master_roles has never been tenant-isolated — every company shares the
-- same literal Admin/Manager/Staff/Intern rows (and any custom role any
-- company created), which means one company's Role Management edits
-- silently affect every other tenant. This adds the column; it does NOT
-- migrate existing data — run scripts/migrate-roles-to-company-scope.js
-- (dry-run by default, --apply to write) after this to clone the existing
-- shared roles per company and repoint mapping_users_roles.
--
-- Nullable: is_system rows (Super Admin) stay company_id = NULL — platform-
-- wide, owned by no tenant. Every ordinary role must belong to one company
-- going forward (enforced at the application layer, not here).

BEGIN;

ALTER TABLE master_roles
  ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES core_company(id) ON DELETE CASCADE;

COMMIT;

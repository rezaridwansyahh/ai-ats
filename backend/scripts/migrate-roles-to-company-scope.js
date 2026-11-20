// One-off migration — master_roles was never company-scoped, so every
// tenant shared the exact same Admin/Manager/Staff/Intern rows (and any
// custom role any company ever created via POST /role). This clones every
// such role per company that's actually using it (inferred from who's
// currently assigned, via mapping_users_roles -> master_users.company_id),
// copies its permission grants to the clone, repoints that company's users
// onto the clone, and deletes the original once nothing references it
// anymore. Roles with zero assigned users (no company inferable) are
// deleted outright.
//
// Requires migration 027_role_company_scoping.sql (adds master_roles.company_id)
// to already be applied.
//
// Run with:
//   cd backend && node scripts/migrate-roles-to-company-scope.js          # dry run, writes nothing
//   cd backend && node scripts/migrate-roles-to-company-scope.js --apply  # actually writes
//
// Safe to re-run — only operates on is_system = false AND company_id IS NULL
// rows, so anything already migrated in a prior run is left alone.

import '../src/config/env.js';
import getDb from '../src/config/postgres.js';

const APPLY = process.argv.includes('--apply');

async function run() {
  const db = getDb();

  const { rows: candidateRoles } = await db.query(`
    SELECT id, name, additional
    FROM master_roles
    WHERE is_system = false AND company_id IS NULL
    ORDER BY id ASC
  `);

  if (candidateRoles.length === 0) {
    console.log('No unscoped roles found — nothing to migrate.');
    return;
  }

  console.log(`Found ${candidateRoles.length} unscoped role(s) to process.\n`);

  if (APPLY) await db.query('BEGIN');

  try {
    for (const role of candidateRoles) {
      const { rows: companyRows } = await db.query(`
        SELECT DISTINCT u.company_id
        FROM mapping_users_roles mur
        JOIN master_users u ON u.id = mur.user_id
        WHERE mur.role_id = $1 AND u.company_id IS NOT NULL
      `, [role.id]);

      const companyIds = companyRows.map((r) => r.company_id);

      if (companyIds.length === 0) {
        console.log(`[role ${role.id} "${role.name}"] no users assigned — deleting (no company inferable).`);
        if (APPLY) await db.query('DELETE FROM master_roles WHERE id = $1', [role.id]);
        continue;
      }

      console.log(`[role ${role.id} "${role.name}"] used by ${companyIds.length} compan${companyIds.length === 1 ? 'y' : 'ies'}: ${companyIds.join(', ')}`);

      for (const companyId of companyIds) {
        if (!APPLY) {
          const { rows: countRows } = await db.query(`
            SELECT COUNT(*)::int AS n
            FROM mapping_users_roles mur
            JOIN master_users u ON u.id = mur.user_id
            WHERE mur.role_id = $1 AND u.company_id = $2
          `, [role.id, companyId]);
          console.log(`  would clone for company ${companyId}, repointing ${countRows[0].n} user(s)`);
          continue;
        }

        const { rows: [clone] } = await db.query(`
          INSERT INTO master_roles (name, additional, is_system, company_id)
          VALUES ($1, $2, false, $3)
          RETURNING id
        `, [role.name, role.additional, companyId]);

        await db.query(`
          INSERT INTO mapping_roles_permissions (role_id, permission_id)
          SELECT $1, permission_id FROM mapping_roles_permissions WHERE role_id = $2
        `, [clone.id, role.id]);

        const { rowCount } = await db.query(`
          UPDATE mapping_users_roles
          SET role_id = $1
          WHERE role_id = $2
            AND user_id IN (SELECT id FROM master_users WHERE company_id = $3)
        `, [clone.id, role.id, companyId]);

        console.log(`  cloned as role ${clone.id} for company ${companyId}, repointed ${rowCount} user(s)`);
      }

      if (APPLY) {
        const { rows: [{ n: remaining }] } = await db.query(`
          SELECT COUNT(*)::int AS n FROM mapping_users_roles WHERE role_id = $1
        `, [role.id]);

        if (remaining === 0) {
          await db.query('DELETE FROM master_roles WHERE id = $1', [role.id]);
          console.log(`  original role ${role.id} now unused — deleted.`);
        } else {
          console.warn(`  WARNING: role ${role.id} still has ${remaining} user(s) attached after migration — not deleting. Investigate manually.`);
        }
      }
    }

    if (APPLY) {
      await db.query('COMMIT');
      console.log('\nMigration committed.');
    } else {
      console.log('\nDry run complete — no changes written. Re-run with --apply to execute.');
    }
  } catch (err) {
    if (APPLY) await db.query('ROLLBACK').catch(() => {});
    throw err;
  }
}

run()
  .then(() => getDb().end())
  .catch(async (err) => {
    console.error('Migration failed:', err.message);
    await getDb().end().catch(() => {});
    process.exit(1);
  });

// Ad hoc tenant seeder — creates ONE new company + role + user (with a full
// set of permissions on that role), without touching any existing data.
// (not part of the main reset flow in seed.js / run-script.js)
//
// Run with:
//   cd backend && node src/db/seeds/seed-new-tenant.js
//
// Safe to re-run — looks up company (by name), role (by name) and user
// (by email) before inserting, so re-running with the same config just
// reports "already exists" instead of creating duplicates.

import bcrypt from 'bcrypt';
import '../../config/env.js';
import getDb from '../../config/postgres.js';

// ---- Edit these before running -------------------------------------------
const COMPANY = {
  name: 'PT Test ABC',
  description: 'Demo tenant created via seed-new-tenant.js',
  email: 'hello@nusantaratalent.example',
  website: 'https://nusantaratalent.example',
};

const ROLE = {
  name: 'Admin',
  // Which functionalities to grant across every existing module/menu.
  // Mirrors the "Admin" tier in role_permissions.js (full CRUD).
  functionalities: ['read', 'create', 'update', 'delete'],
};

const USER = {
  email: 'admin@tes.com',
  username: 'tes admin',
  password: 'pass1', // plaintext here, hashed below before insert
};
// ---------------------------------------------------------------------------

async function run() {
  const db = getDb();
  await db.query('BEGIN');

  try {
    // 1. Company — core_company.name is UNIQUE, so look up first.
    let companyRes = await db.query('SELECT id FROM core_company WHERE name = $1', [COMPANY.name]);
    let companyId;
    if (companyRes.rows.length) {
      companyId = companyRes.rows[0].id;
      console.log(`Company "${COMPANY.name}" already exists (id=${companyId}), reusing.`);
    } else {
      const insertCompany = await db.query(
        `INSERT INTO core_company (name, description, email, website)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [COMPANY.name, COMPANY.description, COMPANY.email, COMPANY.website]
      );
      companyId = insertCompany.rows[0].id;
      console.log(`+ Created company "${COMPANY.name}" (id=${companyId})`);
    }

    // 2. Role — master_roles has no UNIQUE(name), so look up manually.
    let roleRes = await db.query('SELECT id FROM master_roles WHERE name = $1', [ROLE.name]);
    let roleId;
    if (roleRes.rows.length) {
      roleId = roleRes.rows[0].id;
      console.log(`Role "${ROLE.name}" already exists (id=${roleId}), reusing.`);
    } else {
      const insertRole = await db.query(
        `INSERT INTO master_roles (name, additional) VALUES ($1, $2) RETURNING id`,
        [ROLE.name, JSON.stringify({})]
      );
      roleId = insertRole.rows[0].id;
      console.log(`+ Created role "${ROLE.name}" (id=${roleId})`);
    }

    // 3. Permissions — reuse the existing global_permissions rows (the
    // module/menu/functionality taxonomy is global, not per-company) and
    // just map the new role onto every one matching the chosen functionalities.
    const permsRes = await db.query(
      `SELECT id FROM global_permissions WHERE functionality = ANY($1::text[])`,
      [ROLE.functionalities]
    );
    let grantedCount = 0;
    for (const { id: permissionId } of permsRes.rows) {
      const result = await db.query(
        `INSERT INTO mapping_roles_permissions (role_id, permission_id)
         VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [roleId, permissionId]
      );
      if (result.rowCount) grantedCount++;
    }
    console.log(`+ Granted ${grantedCount} new permission(s) to role "${ROLE.name}" (${permsRes.rows.length} total matched functionalities: ${ROLE.functionalities.join('/')})`);

    // 4. User — no UNIQUE constraint on master_users.email, so check manually.
    let userRes = await db.query('SELECT id FROM master_users WHERE email = $1', [USER.email]);
    let userId;
    if (userRes.rows.length) {
      userId = userRes.rows[0].id;
      console.log(`User "${USER.email}" already exists (id=${userId}), reusing.`);
    } else {
      const hashedPassword = bcrypt.hashSync(USER.password, 12);
      const insertUser = await db.query(
        `INSERT INTO master_users (password, email, username, company_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [hashedPassword, USER.email, USER.username, companyId]
      );
      userId = insertUser.rows[0].id;
      console.log(`+ Created user "${USER.email}" (id=${userId}), company_id=${companyId}`);
    }

    // 5. Link user -> role.
    const linkResult = await db.query(
      `INSERT INTO mapping_users_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId]
    );
    console.log(
      linkResult.rowCount
        ? `+ Linked user (id=${userId}) to role (id=${roleId})`
        : `User (id=${userId}) already linked to role (id=${roleId})`
    );

    await db.query('COMMIT');

    console.log('\nDone. Login with:');
    console.log(`  email:    ${USER.email}`);
    console.log(`  password: ${USER.password}`);
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
}

run()
  .then(() => getDb().end())
  .catch(async (err) => {
    console.error('Seed failed:', err.message);
    await getDb().end().catch(() => {});
    process.exit(1);
  });

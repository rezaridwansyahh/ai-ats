// Read-only diagnostic — lists master_applicant rows with ZERO row in
// mapping_applicant_sourcing. applicantModel.create() inserts into
// master_applicant first, then calls addSourcingMapping() as a second,
// separate statement (not wrapped in a transaction) — if that second insert
// fails for any reason (pool exhaustion, connection drop, etc.), the
// applicant row is left permanently orphaned: no mapping means no job's
// sourcing page will ever show them, and no future sync will recognize them
// via checkExists (which is scoped through the mapping join) either.
//
// This does NOT fix anything — it only reports. Run it to confirm/quantify
// the gap before deciding on a fix (either add a transaction around create(),
// or write a follow-up backfill once you know what sourcing each orphan
// should have been mapped to).
//
// Run with:
//   cd backend && node scripts/find-unmapped-applicants.js

import '../src/config/env.js';
import getDb from '../src/config/postgres.js';

async function run() {
  const db = getDb();

  const { rows } = await db.query(`
    SELECT ma.id, ma.name, ma.email, ma.company_id, ma.upload_batch_id
    FROM master_applicant ma
    LEFT JOIN mapping_applicant_sourcing mas ON mas.applicant_id = ma.id
    WHERE mas.applicant_id IS NULL
    ORDER BY ma.id ASC
  `);

  console.log(`Applicants with zero sourcing mapping: ${rows.length}`);
  rows.forEach((r) => {
    // upload_batch_id non-null means this applicant came from a manual
    // Talent Pool CV upload, not RPA extraction — no mapping is EXPECTED
    // there, not a bug. Flag it so it's not confused with the real gap.
    const note = r.upload_batch_id ? '(manual upload — expected, not a bug)' : '(no upload_batch_id — unexplained)';
    console.log(`  - id=${r.id} name=${r.name} email=${r.email} company=${r.company_id} ${note}`);
  });
}

run()
  .then(() => getDb().end())
  .catch(async (err) => {
    console.error('Diagnostic failed:', err.message);
    await getDb().end().catch(() => {});
    process.exit(1);
  });

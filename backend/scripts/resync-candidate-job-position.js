// One-off resync — master_candidate.information is a ONE-TIME SNAPSHOT copied
// from master_applicant.information at the moment an applicant was added to a
// job's pipeline (see candidate-pipeline.model.js's createFromApplicant /
// createFromApplicantIfAbsent), and is never resynced afterward. So running
// backfill-job-position-detail.js (which updates master_applicant only) does
// NOT make duration/location show up for candidates that were already added
// to a pipeline before that backfill ran — their snapshot predates it.
//
// This re-copies just the job_position facet from master_applicant into
// master_candidate for those already-existing candidates. It is additive only:
// - Only the `job_position` key inside `information` is touched (via
//   jsonb_set) — every other key (skills, education, experience, etc.) on the
//   candidate's information is left exactly as-is.
// - Within job_position itself, the candidate's existing fields are merged
//   with (not replaced by) the applicant's via the `||` jsonb concat operator,
//   so the applicant's newer data (duration/location, possibly a refreshed
//   current/category) fills in/overwrites only matching keys — nothing is
//   deleted from either side.
//
// Run with:
//   cd backend && node scripts/resync-candidate-job-position.js
//
// Safe to re-run — a candidate only qualifies if their linked applicant's
// job_position has a 'duration' key that the candidate's own job_position
// doesn't have yet. Typically run once, right after backfill-job-position-detail.js.

import '../src/config/env.js';
import getDb from '../src/config/postgres.js';

async function run() {
  const db = getDb();

  const { rows: preview } = await db.query(`
    SELECT c.id AS candidate_id, c.job_id, c.name
    FROM master_candidate c
    JOIN master_applicant a ON c.applicant_id = a.id
    WHERE a.information -> 'job_position' ? 'duration'
      AND NOT (COALESCE(c.information -> 'job_position', '{}'::jsonb) ? 'duration')
    ORDER BY c.id ASC
  `);

  if (preview.length === 0) {
    console.log('Nothing to resync — every candidate already matches their applicant\'s job_position.');
    return;
  }

  console.log(`Resyncing job_position for ${preview.length} candidate(s)...`);

  const { rowCount } = await db.query(`
    UPDATE master_candidate c
    SET information = jsonb_set(
      COALESCE(c.information, '{}'::jsonb),
      '{job_position}',
      COALESCE(c.information -> 'job_position', '{}'::jsonb) || COALESCE(a.information -> 'job_position', '{}'::jsonb)
    )
    FROM master_applicant a
    WHERE c.applicant_id = a.id
      AND a.information -> 'job_position' ? 'duration'
      AND NOT (COALESCE(c.information -> 'job_position', '{}'::jsonb) ? 'duration')
  `);

  console.log(`Done. Resynced ${rowCount} candidate(s):`);
  preview.forEach((r) => console.log(`  - candidate ${r.candidate_id} (job ${r.job_id}): ${r.name}`));
}

run()
  .then(() => getDb().end())
  .catch(async (err) => {
    console.error('Resync failed:', err.message);
    await getDb().end().catch(() => {});
    process.exit(1);
  });

// One-off backfill — applicants parsed before the job_position facet carried
// duration/location (see ai.service.js's extractFacets / extractFacetsFromFile /
// extractCvForTalentPool, all updated to request them going forward) are stuck
// with job_position = { current, category } only, even though their raw
// last_position string often already has the duration/location crammed into
// it (e.g. Seek-scraped candidates — see extract-candidate.rpa.js).
//
// This does NOT re-read the original CV. It takes the already-stored
// last_position string for each applicant and asks a small, cheap OpenAI call
// (aiService.restructureJobPosition) to split it into
// { current, category, duration, location }, then merges that into
// master_applicant.information.job_position — preserving the existing
// current/category if one was already parsed from the full CV (more reliable
// than re-deriving it from the short last_position string alone), and only
// filling in duration/location.
//
// Scope: master_applicant only. master_candidate rows are a one-time snapshot
// taken at the moment an applicant was added to a job's pipeline and are never
// resynced from master_applicant afterward (by design, elsewhere in this
// codebase) — this script does not touch them.
//
// Safe to re-run: a row only qualifies if information->'job_position' does not
// yet have a 'duration' key at all. Every processed row gets duration written
// as a real string (possibly ''), never left absent, so it won't be picked up
// again on a later run.
//
// Run with:
//   cd backend && node scripts/backfill-job-position-detail.js
//
// Optional: LIMIT=50 node scripts/backfill-job-position-detail.js   (dry run on a small batch first)

import '../src/config/env.js';
import getDb from '../src/config/postgres.js';
import aiService from '../src/shared/services/ai.service.js';

const CONCURRENCY = 5;
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : null;

async function fetchCandidateRows() {
  const db = getDb();
  const result = await db.query(`
    SELECT id, company_id, last_position, information
    FROM master_applicant
    WHERE last_position IS NOT NULL
      AND last_position <> ''
      AND last_position <> 'Not specified'
      AND (information IS NULL OR NOT (information -> 'job_position' ? 'duration'))
    ORDER BY id ASC
    ${LIMIT ? 'LIMIT $1' : ''}
  `, LIMIT ? [LIMIT] : []);
  return result.rows;
}

async function processOne(row, db) {
  const restructured = await aiService.restructureJobPosition(row.last_position, {
    company_id: row.company_id,
    metadata: { applicant_id: row.id, source: 'backfill-job-position-detail' },
  });

  const existing = row.information?.job_position || {};
  const hasExistingCurrent = typeof existing.current === 'string' && existing.current.trim().length > 0;

  const mergedJobPosition = {
    current:  hasExistingCurrent ? existing.current : (restructured.current || row.last_position),
    category: hasExistingCurrent && existing.category ? existing.category : restructured.category,
    duration: restructured.duration,
    location: restructured.location,
  };

  const updatedInformation = {
    ...(row.information || {}),
    job_position: mergedJobPosition,
  };

  await db.query(
    `UPDATE master_applicant SET information = $1 WHERE id = $2`,
    [JSON.stringify(updatedInformation), row.id]
  );

  return mergedJobPosition;
}

async function run() {
  const db = getDb();
  const rows = await fetchCandidateRows();

  if (rows.length === 0) {
    console.log('Nothing to backfill — every applicant with a last_position already has job_position.duration set.');
    return;
  }

  console.log(`Backfilling job_position detail for ${rows.length} applicant(s), concurrency=${CONCURRENCY}...`);

  let done = 0;
  let failed = 0;
  const failures = [];
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < rows.length) {
      const i = nextIndex++;
      const row = rows[i];
      try {
        const result = await processOne(row, db);
        done++;
        if (done % 50 === 0 || done === rows.length) {
          console.log(`  ${done}/${rows.length} done...`);
        }
        if (process.env.VERBOSE) {
          console.log(`  #${row.id} "${row.last_position}" ->`, result);
        }
      } catch (err) {
        failed++;
        failures.push({ id: row.id, name: row.last_position, error: err.message });
        console.error(`  ! applicant ${row.id} failed: ${err.message}`);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, rows.length) }, worker));

  console.log(`\nDone. Succeeded: ${done - failed}/${rows.length}. Failed: ${failed}.`);
  if (failures.length > 0) {
    console.log('Failures (re-run the script to retry these — they still qualify since duration was never written):');
    failures.forEach((f) => console.log(`  - applicant ${f.id} (${f.name}): ${f.error}`));
  }
}

run()
  .then(() => getDb().end())
  .catch(async (err) => {
    console.error('Backfill failed:', err.message);
    await getDb().end().catch(() => {});
    process.exit(1);
  });

// One-off remediation for a race condition in seek.service.js's
// extractCandidates(): the per-candidate auto-promote loop used to read
// linkedJobIds ONCE at the top of the sync and reuse that stale snapshot for
// every candidate saved during that run. If a user linked the sourcing to a
// job mid-sync, any candidate onSave'd AFTER the link but using the stale
// snapshot was never promoted — and since extract-candidate.rpa.js's
// checkExists() permanently skips already-saved candidates before onSave
// ever runs again, those candidates could never be caught by a future sync
// either. job-source.service.js's linkToJob() already backfills applicants
// that exist AT THE MOMENT a link is created, but these candidates didn't
// exist yet at that moment — they were saved moments later by the in-flight
// sync. The underlying race is now fixed (extractCandidates re-fetches
// linkedJobIds per-candidate), but this script sweeps up anyone who already
// fell through the gap before that fix existed.
//
// Approach: replay the same backfill linkToJob() already does, but for
// EVERY existing (job_sourcing_id, job_id) mapping, not just a newly-created
// one. createFromApplicantIfAbsent() is dup-safe (ON CONFLICT DO NOTHING),
// so this is safe to run repeatedly — it only acts on applicants missing a
// pipeline entry for a job their sourcing is already linked to.
//
// Run with:
//   cd backend && node scripts/backfill-stuck-sourcing-candidates.js
//
// Safe to re-run — no-ops once nothing is stuck.

import '../src/config/env.js';
import getDb from '../src/config/postgres.js';
import applicantModel from '../src/modules/applicant/applicant.model.js';
import candidatePipelineModel from '../src/modules/candidate-pipeline/candidate-pipeline.model.js';
import screeningService from '../src/modules/screening/screening.service.js';

async function run() {
  const db = getDb();

  const { rows: mappings } = await db.query(`
    SELECT job_sourcing_id, job_id
    FROM mapping_job_sourcing_job
    ORDER BY job_sourcing_id ASC, job_id ASC
  `);

  console.log(`Checking ${mappings.length} sourcing-job link(s) for stuck applicants...`);

  let promoted = 0;
  let checked = 0;

  for (const { job_sourcing_id, job_id } of mappings) {
    const applicants = await applicantModel.getByJobSourcingId(job_sourcing_id);
    checked += applicants.length;

    for (const applicant of applicants) {
      try {
        const created = await candidatePipelineModel.createFromApplicantIfAbsent(applicant.id, job_id);
        if (created) {
          promoted++;
          await screeningService.autoScoreIfPossible(applicant.id, job_id);
          console.log(`  promoted applicant ${applicant.id} -> job ${job_id} (sourcing ${job_sourcing_id})`);
        }
      } catch (err) {
        console.error(`  failed applicant ${applicant.id} -> job ${job_id}:`, err.message);
      }
    }
  }

  console.log(`Done. Checked ${checked} applicant-link pair(s), promoted ${promoted} stuck candidate(s).`);
}

run()
  .then(() => getDb().end())
  .catch(async (err) => {
    console.error('Backfill failed:', err.message);
    await getDb().end().catch(() => {});
    process.exit(1);
  });

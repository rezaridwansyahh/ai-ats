// Ad hoc seeder — attaches sample "Kecocokan preferensi" data (scraped
// screening Q&A) to EVERY existing candidate, so the AI Matching card's
// preference-match section has something to show instead of the 0/0
// empty state.
//
// "Kecocokan preferensi" reads from mapping_applicant_sourcing.information,
// scoped by (applicant_id, job_sourcing_id) where that job_sourcing_id is
// linked (via mapping_job_sourcing_job) to the candidate's job — the same
// join screening.model.js's getCandidatesByJobAndEngine/getCalibrationCohort
// use. This script requires that link to already exist per job (i.e. the
// job has a real Seek/LinkedIn sourcing, or one was set up manually) — it
// does not create a new job_sourcing from scratch. Candidates whose job has
// no linked job_sourcing are skipped and reported at the end.
//
// (not part of the main reset flow in seed.js / run-script.js)
//
// Run with:
//   cd backend && node src/db/seeds/seed-preference-match.js
//
// Safe to re-run — upserts on (applicant_id, job_sourcing_id), so re-running
// just refreshes each row's information instead of duplicating.

import '../../config/env.js';
import getDb from '../../config/postgres.js';

const SAMPLE_QA = {
  'Berapa gaji bulanan yang diharapkan?': { answer: 'Rp 15.000.000', meets_requirement: true },
  'Apakah bersedia bekerja penuh dari kantor (WFO)?': { answer: 'Ya', meets_requirement: true },
  'Berapa tahun pengalaman yang relevan dengan posisi ini?': { answer: '4 tahun', meets_requirement: true },
  'Apakah memiliki SIM A?': { answer: 'Tidak', meets_requirement: false },
};

async function run() {
  const db = getDb();

  const candidatesRes = await db.query(
    `SELECT id, applicant_id, job_id, name FROM master_candidate WHERE applicant_id IS NOT NULL ORDER BY id ASC`
  );
  const candidates = candidatesRes.rows;
  if (candidates.length === 0) {
    console.log('No candidates found — nothing to do.');
    return;
  }

  // Cache job_id -> job_sourcing_id lookups so jobs with many candidates
  // don't repeat the same query.
  const jobSourcingByJobId = new Map();
  const resolveJobSourcingId = async (job_id) => {
    if (jobSourcingByJobId.has(job_id)) return jobSourcingByJobId.get(job_id);
    const res = await db.query(
      `SELECT mjsj.job_sourcing_id
       FROM mapping_job_sourcing_job mjsj
       WHERE mjsj.job_id = $1
       ORDER BY mjsj.is_origin DESC
       LIMIT 1`,
      [job_id]
    );
    const id = res.rows[0]?.job_sourcing_id ?? null;
    jobSourcingByJobId.set(job_id, id);
    return id;
  };

  let attached = 0;
  const skipped = [];

  for (const candidate of candidates) {
    const jobSourcingId = await resolveJobSourcingId(candidate.job_id);
    if (!jobSourcingId) {
      skipped.push(`${candidate.name} (candidate_id=${candidate.id}, job_id=${candidate.job_id} has no linked job_sourcing)`);
      continue;
    }

    await db.query(
      `INSERT INTO mapping_applicant_sourcing (applicant_id, job_sourcing_id, information)
       VALUES ($1, $2, $3)
       ON CONFLICT (applicant_id, job_sourcing_id) DO UPDATE SET information = EXCLUDED.information`,
      [candidate.applicant_id, jobSourcingId, JSON.stringify(SAMPLE_QA)]
    );

    console.log(`+ ${candidate.name} (candidate_id=${candidate.id}, job_sourcing_id=${jobSourcingId})`);
    attached++;
  }

  console.log(`\nDone. Attached to ${attached}/${candidates.length} candidates.`);
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} (no linked job_sourcing):`);
    skipped.forEach((s) => console.log(`  - ${s}`));
  }
}

run()
  .then(() => getDb().end())
  .catch(async (err) => {
    console.error('Seed failed:', err.message);
    await getDb().end().catch(() => {});
    process.exit(1);
  });

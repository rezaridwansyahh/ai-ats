// Step 4/5 — candidate: promotes the applicant from step 3 into a real
// pipeline candidate for the job (master_candidate), with a passing AI Match
// score and latest_stage parked at the final ("Offering & Contract") stage —
// standing in for having already cleared Screening/Interview/Assessment/BG
// Check, since this chain's goal is reaching Onboarding, not exercising
// every stage in between.
//
// Run with:
//   cd backend && node src/db/seeds/onboarding-flow/04-candidate.js
//
// Requires: 03-sourcing-applicant.js already run.
// Safe to re-run — candidate looked up by (name, job_id), score by
// (applicant_id, job_id), both upserted rather than duplicated.

import '../../../config/env.js';
import getDb from '../../../config/postgres.js';
import { COMPANY, JOB, APPLICANT } from './config.js';

async function run() {
  const db = getDb();

  const companyRes = await db.query('SELECT id FROM core_company WHERE name = $1', [COMPANY.name]);
  const companyId = companyRes.rows[0]?.id;
  if (!companyId) throw new Error(`Company "${COMPANY.name}" not found — run 01-tenant.js first.`);

  const jobRes = await db.query(
    'SELECT id FROM core_job WHERE company_id = $1 AND job_title = $2',
    [companyId, JOB.job_title]
  );
  const jobId = jobRes.rows[0]?.id;
  if (!jobId) throw new Error(`Job "${JOB.job_title}" not found — run 02-job.js first.`);

  const applicantRes = await db.query(
    'SELECT id FROM master_applicant WHERE name = $1 AND company_id = $2',
    [APPLICANT.name, companyId]
  );
  const applicantId = applicantRes.rows[0]?.id;
  if (!applicantId) throw new Error(`Applicant "${APPLICANT.name}" not found — run 03-sourcing-applicant.js first.`);

  // Final stage — "Offering & Contract" at stage_order 5, per 02-job.js's STAGE_PLAN.
  const finalStageRes = await db.query(
    `SELECT id FROM job_stage WHERE job_id = $1 ORDER BY stage_order DESC LIMIT 1`,
    [jobId]
  );
  const finalStageId = finalStageRes.rows[0]?.id ?? null;

  let candidateId;
  const existingCandidate = await db.query(
    'SELECT id FROM master_candidate WHERE name = $1 AND job_id = $2',
    [APPLICANT.name, jobId]
  );
  if (existingCandidate.rows.length) {
    candidateId = existingCandidate.rows[0].id;
    console.log(`Candidate "${APPLICANT.name}" already exists (id=${candidateId}), reusing.`);
    if (finalStageId) {
      await db.query('UPDATE master_candidate SET latest_stage = $1, updated_at = NOW() WHERE id = $2', [finalStageId, candidateId]);
    }
  } else {
    const insertCandidate = await db.query(
      `INSERT INTO master_candidate (job_id, applicant_id, name, last_position, address, education, date, latest_stage)
       SELECT $1, a.id, a.name, a.last_position, a.address, a.education, a.date, $2
       FROM master_applicant a WHERE a.id = $3
       RETURNING id`,
      [jobId, finalStageId, applicantId]
    );
    candidateId = insertCandidate.rows[0].id;
    console.log(`+ Created candidate "${APPLICANT.name}" (candidate_id=${candidateId}), latest_stage=${finalStageId}`);
  }

  const hasScore = await db.query(
    'SELECT 1 FROM candidate_job_score WHERE applicant_id = $1 AND job_id = $2',
    [applicantId, jobId]
  );
  if (!hasScore.rows.length) {
    await db.query(
      `INSERT INTO candidate_job_score
         (applicant_id, job_id, overall_score, skills_score, experience_score, education_score, matched_skills, missing_skills, summary)
       VALUES ($1, $2, 88, 90, 85, 88, $3, $4, $5)`,
      [
        applicantId, jobId,
        JSON.stringify(['React', 'TypeScript', 'CSS']),
        JSON.stringify([]),
        'Strong fit — solid frontend track record, cleared every stage.',
      ]
    );
    console.log('+ Added a passing candidate_job_score (88)');
  }

  console.log(`\nDone. candidate_id=${candidateId}`);
  console.log('Next: node src/db/seeds/onboarding-flow/05-onboarding.js');
}

run()
  .then(() => getDb().end())
  .catch(async (err) => {
    console.error('Seed failed:', err.message);
    await getDb().end().catch(() => {});
    process.exit(1);
  });

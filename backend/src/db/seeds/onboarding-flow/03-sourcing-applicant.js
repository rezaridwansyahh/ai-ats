// Step 3/5 — sourcing + applicant: a core_job_sourcing linked to the job
// from step 2, and one master_applicant sourced through it. This is what
// candidate cards' "Kecocokan preferensi" section reads from, so a sample
// screening Q&A is attached too.
//
// Run with:
//   cd backend && node src/db/seeds/onboarding-flow/03-sourcing-applicant.js
//
// Requires: 02-job.js already run.
// Safe to re-run — job_sourcing is looked up by (job_title, platform), the
// applicant by (name, company_id), and the sourcing mapping upserts.

import '../../../config/env.js';
import getDb from '../../../config/postgres.js';
import { COMPANY, JOB, APPLICANT } from './config.js';

const SAMPLE_QA = {
  'Berapa gaji bulanan yang diharapkan?': { answer: 'Rp 20.000.000', meets_requirement: true },
  'Apakah bersedia bekerja hybrid?': { answer: 'Ya', meets_requirement: true },
  'Berapa tahun pengalaman relevan?': { answer: '5 tahun', meets_requirement: true },
};

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

  // 1. Job sourcing — 'internal' platform, no master_job_account needed
  // (account_id is nullable) since this is a manually-set-up sourcing, not a
  // real Seek/LinkedIn sync.
  let jobSourcingId;
  const existingSourcing = await db.query(
    `SELECT id FROM core_job_sourcing WHERE job_title = $1 AND platform = 'internal' AND account_id IS NULL`,
    [JOB.job_title]
  );
  if (existingSourcing.rows.length) {
    jobSourcingId = existingSourcing.rows[0].id;
    console.log(`Job sourcing for "${JOB.job_title}" already exists (id=${jobSourcingId}), reusing.`);
  } else {
    const insertSourcing = await db.query(
      `INSERT INTO core_job_sourcing (job_title, job_desc, job_location, platform, status)
       VALUES ($1, $2, $3, 'internal', 'Active')
       RETURNING id`,
      [JOB.job_title, JOB.job_desc, JOB.job_location]
    );
    jobSourcingId = insertSourcing.rows[0].id;
    console.log(`+ Created job_sourcing (id=${jobSourcingId}) for "${JOB.job_title}"`);
  }

  await db.query(
    `INSERT INTO mapping_job_sourcing_job (job_sourcing_id, job_id, is_origin)
     VALUES ($1, $2, true)
     ON CONFLICT (job_sourcing_id, job_id) DO NOTHING`,
    [jobSourcingId, jobId]
  );

  // 2. Applicant
  let applicantId;
  const existingApplicant = await db.query(
    'SELECT id FROM master_applicant WHERE name = $1 AND company_id = $2',
    [APPLICANT.name, companyId]
  );
  if (existingApplicant.rows.length) {
    applicantId = existingApplicant.rows[0].id;
    console.log(`Applicant "${APPLICANT.name}" already exists (id=${applicantId}), reusing.`);
  } else {
    const insertApplicant = await db.query(
      `INSERT INTO master_applicant (company_id, name, email, last_position, address, education, date)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id`,
      [companyId, APPLICANT.name, APPLICANT.email, APPLICANT.last_position, APPLICANT.address, APPLICANT.education]
    );
    applicantId = insertApplicant.rows[0].id;
    console.log(`+ Created applicant "${APPLICANT.name}" (id=${applicantId})`);
  }

  // 3. Link applicant to the sourcing, with sample screening Q&A attached
  // (what "Kecocokan preferensi" on the AI Matching card reads from).
  await db.query(
    `INSERT INTO mapping_applicant_sourcing (applicant_id, job_sourcing_id, information)
     VALUES ($1, $2, $3)
     ON CONFLICT (applicant_id, job_sourcing_id) DO UPDATE SET information = EXCLUDED.information`,
    [applicantId, jobSourcingId, JSON.stringify(SAMPLE_QA)]
  );

  console.log(`\nDone. applicant_id=${applicantId}, job_sourcing_id=${jobSourcingId}`);
  console.log('Next: node src/db/seeds/onboarding-flow/04-candidate.js');
}

run()
  .then(() => getDb().end())
  .catch(async (err) => {
    console.error('Seed failed:', err.message);
    await getDb().end().catch(() => {});
    process.exit(1);
  });

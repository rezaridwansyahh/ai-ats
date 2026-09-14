// Step 2/5 — job management: one core_job under the tenant from step 1,
// plus a custom pipeline (job_stage rows, one per recruitment_stage_category)
// so later steps have somewhere real to point latest_stage at.
//
// Run with:
//   cd backend && node src/db/seeds/onboarding-flow/02-job.js
//
// Requires: 01-tenant.js already run (looks up the company by COMPANY.name).
// Safe to re-run — the job is looked up by (company_id, job_title) first,
// and stages are looked up by (job_id, stage_order) before inserting.

import '../../../config/env.js';
import getDb from '../../../config/postgres.js';
import { COMPANY, JOB } from './config.js';

// One custom stage per category, in pipeline order — mirrors the categories
// a real "configure this job's stages" step in Job Management would use.
const STAGE_PLAN = [
  { name: 'Screening & Matching', category: 'Screening & Matching' },
  { name: 'Interview',            category: 'Interview' },
  { name: 'Assessment',           category: 'Assessment' },
  { name: 'Background Check',     category: 'Background Check' },
  { name: 'Offering & Contract',  category: 'Offering & Contract' },
];

async function run() {
  const db = getDb();

  const companyRes = await db.query('SELECT id FROM core_company WHERE name = $1', [COMPANY.name]);
  const companyId = companyRes.rows[0]?.id;
  if (!companyId) {
    throw new Error(`Company "${COMPANY.name}" not found — run 01-tenant.js first.`);
  }

  let jobId;
  const existingJob = await db.query(
    'SELECT id FROM core_job WHERE company_id = $1 AND job_title = $2',
    [companyId, JOB.job_title]
  );
  if (existingJob.rows.length) {
    jobId = existingJob.rows[0].id;
    console.log(`Job "${JOB.job_title}" already exists (id=${jobId}), reusing.`);
  } else {
    const insertJob = await db.query(
      `INSERT INTO core_job
         (company_id, job_title, job_desc, job_location, work_option, work_type, seniority_level, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [companyId, JOB.job_title, JOB.job_desc, JOB.job_location, JOB.work_option, JOB.work_type, JOB.seniority_level, JOB.status]
    );
    jobId = insertJob.rows[0].id;
    console.log(`+ Created job "${JOB.job_title}" (id=${jobId}), company_id=${companyId}`);
  }

  let stageOrder = 1;
  for (const stage of STAGE_PLAN) {
    const categoryRes = await db.query(
      'SELECT id FROM recruitment_stage_category WHERE name = $1',
      [stage.category]
    );
    const stageTypeId = categoryRes.rows[0]?.id;
    if (!stageTypeId) {
      console.log(`  - Skipping "${stage.name}" — recruitment_stage_category "${stage.category}" not found.`);
      stageOrder++;
      continue;
    }

    const existingStage = await db.query(
      'SELECT id FROM job_stage WHERE job_id = $1 AND stage_order = $2',
      [jobId, stageOrder]
    );
    if (existingStage.rows.length) {
      console.log(`  = Stage "${stage.name}" already exists at order ${stageOrder}, reusing.`);
    } else {
      await db.query(
        `INSERT INTO job_stage (job_id, stage_type_id, name, stage_order)
         VALUES ($1, $2, $3, $4)`,
        [jobId, stageTypeId, stage.name, stageOrder]
      );
      console.log(`  + Created stage "${stage.name}" (order ${stageOrder})`);
    }
    stageOrder++;
  }

  console.log(`\nDone. job_id=${jobId}`);
  console.log('Next: node src/db/seeds/onboarding-flow/03-sourcing-applicant.js');
}

run()
  .then(() => getDb().end())
  .catch(async (err) => {
    console.error('Seed failed:', err.message);
    await getDb().end().catch(() => {});
    process.exit(1);
  });

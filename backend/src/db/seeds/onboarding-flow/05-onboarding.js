// Step 5/5 — onboarding: accepts an offer for the candidate from step 4,
// then calls the REAL OnboardingService.createOnboarding() (not a hand-rolled
// insert) so the checklist, Day-1 schedule, milestones, and probation
// check-ins are generated exactly the way a real accepted offer would
// produce them — same templates OnboardingService uses for every company.
//
// Run with:
//   cd backend && node src/db/seeds/onboarding-flow/05-onboarding.js
//
// Requires: 04-candidate.js already run.
// Safe to re-run — the offer is looked up by (candidate_id, job_id) and just
// re-marked accepted if found; OnboardingService.createOnboarding() itself
// is NOT idempotent (it always creates fresh checklist/schedule/milestone
// rows), so this script skips calling it if an onboarding record already
// exists for this (candidate_id, offer_id) — matching the UNIQUE constraint
// on candidate_onboarding.

import '../../../config/env.js';
import getDb from '../../../config/postgres.js';
import onboardingService from '../../../modules/onboarding/onboarding.service.js';
import { COMPANY, JOB, APPLICANT, ONBOARDING } from './config.js';

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

  const candidateRes = await db.query(
    'SELECT id, name FROM master_candidate WHERE name = $1 AND job_id = $2',
    [APPLICANT.name, jobId]
  );
  const candidate = candidateRes.rows[0];
  if (!candidate) throw new Error(`Candidate "${APPLICANT.name}" not found — run 04-candidate.js first.`);

  // 1. Offer — accepted, so candidate_onboarding's FK to it is satisfiable.
  let offer;
  const existingOffer = await db.query(
    'SELECT * FROM candidate_offer WHERE candidate_id = $1 AND job_id = $2',
    [candidate.id, jobId]
  );
  if (existingOffer.rows.length) {
    offer = existingOffer.rows[0];
    if (offer.offer_status !== 'accepted') {
      const updated = await db.query(
        `UPDATE candidate_offer SET offer_status = 'accepted', accepted_at = NOW(), updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [offer.id]
      );
      offer = updated.rows[0];
      console.log(`Offer id=${offer.id} already existed — marked accepted.`);
    } else {
      console.log(`Offer id=${offer.id} already accepted, reusing.`);
    }
  } else {
    const inserted = await db.query(
      `INSERT INTO candidate_offer (company_id, candidate_id, job_id, position_title, contract_type, offer_status, sent_at, accepted_at)
       VALUES ($1, $2, $3, $4, 'PKWTT', 'accepted', NOW(), NOW())
       RETURNING *`,
      [companyId, candidate.id, jobId, JOB.job_title]
    );
    offer = inserted.rows[0];
    console.log(`+ Created accepted offer (id=${offer.id}) for "${candidate.name}"`);
  }

  // 2. Onboarding — via the real service, so checklist/schedule/milestones/
  // check-ins are the same templates a real accepted offer would generate.
  const existingOnboarding = await db.query(
    'SELECT id FROM candidate_onboarding WHERE candidate_id = $1 AND offer_id = $2',
    [candidate.id, offer.id]
  );
  if (existingOnboarding.rows.length) {
    console.log(`Onboarding record already exists (id=${existingOnboarding.rows[0].id}) for this candidate+offer — nothing more to do.`);
    console.log('\nDone.');
    return;
  }

  const onboarding = await onboardingService.createOnboarding({
    company_id: companyId,
    candidate_id: candidate.id,
    job_id: jobId,
    offer_id: offer.id,
    candidate_name: candidate.name,
    position_title: JOB.job_title,
    start_date: ONBOARDING.start_date,
  });

  console.log(`+ Created onboarding record (id=${onboarding.id}) — checklist, Day-1 schedule, milestones, and D30/D60/D90 check-ins all auto-generated.`);
  console.log('\nDone. The full chain is seeded — check the Onboarding workboard.');
}

run()
  .then(() => getDb().end())
  .catch(async (err) => {
    console.error('Seed failed:', err.message);
    await getDb().end().catch(() => {});
    process.exit(1);
  });

// Ad hoc onboarding seeder — creates ONE onboarding record from an already-
// accepted offer, and runs a compliance PDF already sitting in
// backend/uploads/ through the real SourceService.upload() pipeline
// (parse → chunk → embed into Weaviate → onboarding_source row).
// (not part of the main reset flow in seed.js / run-script.js)
//
// Run with:
//   cd backend && node src/db/seeds/seed-onboarding.js
//
// Safe to re-run:
//  - the onboarding record is looked up by (candidate_id, offer_id) first,
//    so re-running just reports "already exists" instead of duplicating.
//  - any existing onboarding_source row for the same (company_id, file) is
//    removed (via SourceService.remove(), so its Weaviate chunks get
//    cleaned up too) before re-indexing, so re-running re-chunks fresh
//    instead of piling up duplicate/stale rows.

import path from 'path';
import { fileURLToPath } from 'url';
import '../../config/env.js';
import getDb from '../../config/postgres.js';
import SourceService from '../../modules/chat-bot/source/source.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- Edit these before running -------------------------------------------
// Which accepted offer to build the onboarding record from.
const OFFER = {
  candidate_id: 6,
  job_id: 1,
};

const ONBOARDING = {
  start_date: '2026-07-01',
  probation_duration_days: 90,
  current_stage: 'pre-boarding',
  onboarding_status: 'pending',
  buddy_name: null,
  manager_name: null,
};

const UPLOADED_BY_EMAIL = 'admin@tes.com';

// Compliance PDF to index for the onboarding chatbot's RAG source list.
// File must already exist in backend/uploads/.
const FILE_NAME = 'HR.007.001-KP  Ketertiban Kerja.Rev03.review 7.pdf';
// ---------------------------------------------------------------------------

async function seedOnboardingRecord(db) {
  const offerRes = await db.query(
    `SELECT id, company_id, candidate_id, job_id, position_title, accepted_at
     FROM candidate_offer
     WHERE candidate_id = $1 AND job_id = $2`,
    [OFFER.candidate_id, OFFER.job_id]
  );
  if (!offerRes.rows.length) {
    throw new Error(`No candidate_offer found for candidate_id=${OFFER.candidate_id}, job_id=${OFFER.job_id}. Create/accept an offer first.`);
  }
  const offer = offerRes.rows[0];
  if (!offer.accepted_at) {
    throw new Error(`candidate_offer id=${offer.id} has not been accepted yet (accepted_at is null).`);
  }
  console.log(`Using offer id=${offer.id} (company_id=${offer.company_id}, "${offer.position_title}")`);

  const candidateRes = await db.query('SELECT name FROM master_candidate WHERE id = $1', [offer.candidate_id]);
  const candidateName = candidateRes.rows[0]?.name ?? `Candidate #${offer.candidate_id}`;

  const onboardingRes = await db.query(
    'SELECT id FROM candidate_onboarding WHERE candidate_id = $1 AND offer_id = $2',
    [offer.candidate_id, offer.id]
  );
  if (onboardingRes.rows.length) {
    const onboardingId = onboardingRes.rows[0].id;
    console.log(`Onboarding record already exists (id=${onboardingId}), reusing.`);
    return { onboardingId, companyId: offer.company_id };
  }

  const insertOnboarding = await db.query(
    `INSERT INTO candidate_onboarding (
       company_id, candidate_id, job_id, offer_id, candidate_name, position_title,
       start_date, probation_duration_days, current_stage, onboarding_status,
       buddy_name, manager_name
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id`,
    [
      offer.company_id, offer.candidate_id, offer.job_id, offer.id, candidateName, offer.position_title,
      ONBOARDING.start_date, ONBOARDING.probation_duration_days, ONBOARDING.current_stage, ONBOARDING.onboarding_status,
      ONBOARDING.buddy_name, ONBOARDING.manager_name,
    ]
  );
  const onboardingId = insertOnboarding.rows[0].id;
  console.log(`+ Created onboarding record (id=${onboardingId}) for "${candidateName}"`);
  return { onboardingId, companyId: offer.company_id };
}

async function seedIndexedSource(db, companyId) {
  const uploaderRes = await db.query('SELECT id FROM master_users WHERE email = $1', [UPLOADED_BY_EMAIL]);
  const uploadedBy = uploaderRes.rows[0]?.id ?? null;
  if (!uploadedBy) {
    console.warn(`Warning: no user found with email "${UPLOADED_BY_EMAIL}" — uploaded_by will be NULL.`);
  }

  // Clean up any existing row for this (company_id, file) — SourceModel.create()
  // always inserts a fresh row, so re-running without this would leave a
  // stuck-at-pending row behind instead of fixing it.
  const existing = await db.query(
    'SELECT id FROM onboarding_source WHERE company_id = $1 AND file = $2',
    [companyId, FILE_NAME]
  );
  for (const row of existing.rows) {
    console.log(`Removing existing source row id=${row.id} before re-indexing...`);
    await SourceService.remove(row.id, companyId).catch(async (err) => {
      // A row stuck at 'pending' was never actually written to Weaviate, so
      // deleteBySourceId() there has nothing to clean up and may no-op or
      // error harmlessly — fall back to a raw delete either way.
      console.warn(`  (Weaviate cleanup skipped: ${err.message})`);
      await db.query('DELETE FROM onboarding_source WHERE id = $1', [row.id]);
    });
  }

  const filePath = path.resolve(__dirname, '../../../uploads', FILE_NAME);
  console.log(`Indexing "${FILE_NAME}"\n  from ${filePath} ...`);

  const result = await SourceService.upload({
    company_id: companyId,
    uploaded_by: uploadedBy,
    filePath,
    originalName: FILE_NAME,
  });

  console.log(`Source indexed: id=${result.id}, status=${result.status}, chunk_count=${result.chunk_count}`);
}

async function run() {
  const db = getDb();

  // The onboarding record is created in its own transaction (kept atomic,
  // like the original), separately from source indexing — the latter talks
  // to the filesystem and Weaviate, which aren't things a DB transaction
  // can roll back anyway.
  await db.query('BEGIN');
  let companyId;
  try {
    const result = await seedOnboardingRecord(db);
    companyId = result.companyId;
    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }

  await seedIndexedSource(db, companyId);

  console.log('\nDone.');
}

run()
  .then(() => getDb().end())
  .catch(async (err) => {
    console.error('Seed failed:', err.message || err);
    await getDb().end().catch(() => {});
    process.exit(1);
  });
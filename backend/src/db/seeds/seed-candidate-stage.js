// Ad hoc seeder — advances ONE dummy candidate to a single pipeline stage at
// a time, so you can push it forward stage-by-stage and check each stage's
// UI as you go, instead of getting every stage populated at once.
//
// (not part of the main reset flow in seed.js / run-script.js)
//
// Usage: edit JOB_ID and STAGE below, then run:
//   cd backend && node src/db/seeds/seed-candidate-stage.js
//
// Re-run with a different STAGE to push the SAME candidate further —
// e.g. run once with STAGE='screening', check the AI Matching ranking,
// then change STAGE to 'interview' and run again to move it there next,
// and so on. Previously-seeded stage data (e.g. the screening score) is
// left in place when you advance — only latest_stage moves forward, plus
// whatever row the new stage needs.
//
// Safe to re-run with the same STAGE — the candidate is looked up by
// (name, job_id) and every stage-specific row is looked up before
// inserting, so nothing gets duplicated.

import '../../config/env.js';
import getDb from '../../config/postgres.js';

// ---- Edit these before running ---------------------------------------------
const JOB_ID = 12;         // <-- set to the job you want seeded
const STAGE  = 'interview'; // <-- one of: screening | interview | assessment | background_check | offering
// -----------------------------------------------------------------------------

const CANDIDATE_NAME = 'Zebedeus Candra Hadiyanto';

const STAGE_CONFIG = {
  screening:         { category: 'Screening & Matching', seed: seedScreening },
  interview:         { category: 'Interview',            seed: seedInterview },
  assessment:        { category: 'Assessment',            seed: seedAssessment },
  background_check:  { category: 'Background Check',     seed: seedBackgroundCheck },
  offering:          { category: 'Offering & Contract',  seed: seedOffering },
};

async function run() {
  const config = STAGE_CONFIG[STAGE];
  if (!config) {
    throw new Error(`Unknown STAGE "${STAGE}" — must be one of: ${Object.keys(STAGE_CONFIG).join(', ')}`);
  }

  const db = getDb();

  const jobRes = await db.query('SELECT id, job_title, company_id FROM core_job WHERE id = $1', [JOB_ID]);
  const job = jobRes.rows[0];
  if (!job) throw new Error(`core_job id ${JOB_ID} not found`);

  // Resolve this job's stage for the requested category — either a custom
  // stage owned by this job (job_stage.job_id = JOB_ID) or a template stage
  // inherited via core_job_template (job_stage.master_id ->
  // core_job_template.template_stage_id). Same resolution used by
  // candidate-pipeline.model.js's getListStages().
  const stageRes = await db.query(`
    SELECT js.id AS stage_id
    FROM job_stage js
    JOIN recruitment_stage_category rsc ON rsc.id = js.stage_type_id
    LEFT JOIN core_job_template cjt ON cjt.job_id = $1
    WHERE (js.job_id = $1 OR js.master_id = cjt.template_stage_id)
      AND rsc.name = $2
    ORDER BY js.stage_order ASC
    LIMIT 1
  `, [JOB_ID, config.category]);

  const stageId = stageRes.rows[0]?.stage_id;
  if (!stageId) {
    throw new Error(`Job ${JOB_ID} has no "${config.category}" stage — nothing to advance it to.`);
  }

  const candidate = await findOrCreateCandidate(db, job);

  await db.query(
    `UPDATE master_candidate SET latest_stage = $1, updated_at = NOW() WHERE id = $2`,
    [stageId, candidate.id]
  );
  console.log(`Moved candidate_id=${candidate.id} to "${config.category}" (job_stage.id=${stageId})`);

  await config.seed(db, { job, candidate });

  console.log('Done.');
}

// ---- shared helper: find or create the one evolving candidate --------------

async function findOrCreateCandidate(db, job) {
  const existing = await db.query(
    `SELECT id, applicant_id FROM master_candidate WHERE name = $1 AND job_id = $2`,
    [CANDIDATE_NAME, job.id]
  );
  if (existing.rows.length) return existing.rows[0];

  const applicantRes = await db.query(
    `INSERT INTO master_applicant (company_id, name, email, last_position, address, education, information, date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING id`,
    [
      job.company_id,
      CANDIDATE_NAME,
      'seed.candidate@example.com',
      'Sales Manager',
      'Jakarta, Indonesia',
      "Bachelor's in Business Administration",
      JSON.stringify({
        job_position: { current: 'Sales Manager', category: 'Sales' },
        skills: ['B2B Sales', 'Negotiation', 'CRM'],
        education: [{ school: 'Universitas Indonesia', degree: "Bachelor's in Business Administration", year: 2016, tier: 'top' }],
        experience: { years_total: 6, positions: [{ title: 'Sales Manager', company: 'Demo Corp', years: 6 }] },
      }),
    ]
  );
  const applicantId = applicantRes.rows[0].id;

  const candidateRes = await db.query(
    `INSERT INTO master_candidate (job_id, applicant_id, name, last_position, address, education, information, date)
     SELECT $1, a.id, a.name, a.last_position, a.address, a.education, a.information, a.date
     FROM master_applicant a WHERE a.id = $2
     RETURNING id, applicant_id`,
    [job.id, applicantId]
  );

  console.log(`+ Created candidate_id=${candidateRes.rows[0].id} (applicant_id=${applicantId})`);
  return candidateRes.rows[0];
}

// ---- per-stage seeders -------------------------------------------------------

async function seedScreening(db, { job, candidate }) {
  const hasScore = await db.query(
    `SELECT 1 FROM candidate_job_score WHERE applicant_id = $1 AND job_id = $2`,
    [candidate.applicant_id, job.id]
  );
  if (!hasScore.rows.length) {
    await db.query(
      `INSERT INTO candidate_job_score
         (applicant_id, job_id, overall_score, skills_score, experience_score, education_score, matched_skills, missing_skills, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        candidate.applicant_id, job.id, 82, 85, 78, 70,
        JSON.stringify(['B2B Sales', 'CRM']), JSON.stringify(['Forecasting']),
        'Strong fit — solid sales track record, minor gap in forecasting experience.',
      ]
    );
  }

  const hasScreening = await db.query(`SELECT 1 FROM candidate_screening WHERE candidate_id = $1`, [candidate.id]);
  if (!hasScreening.rows.length) {
    // decision left NULL — undecided, shows up in the AI Matching ranking list.
    await db.query(
      `INSERT INTO candidate_screening (candidate_id, job_id, company_id, decision) VALUES ($1, $2, $3, NULL)`,
      [candidate.id, job.id, job.company_id]
    );
  }
}

async function seedInterview(db, { job, candidate }) {
  const existing = await db.query(
    `SELECT id, current_round_id FROM candidate_interview WHERE candidate_id = $1 AND job_id = $2`,
    [candidate.id, job.id]
  );

  let interview = existing.rows[0];
  if (!interview) {
    // status/round/decision take their table defaults (setup / 1 / pending).
    const inserted = await db.query(
      `INSERT INTO candidate_interview (candidate_id, job_id, company_id)
       VALUES ($1, $2, $3)
       RETURNING id, current_round_id`,
      [candidate.id, job.id, job.company_id]
    );
    interview = inserted.rows[0];
  }

  // Mirrors interview.model.js#ensureInterviewForCandidate — a candidate_interview
  // row alone isn't enough, the Interview detail page reads its active round via
  // current_round_id, which stays NULL (and the page effectively empty) unless
  // an interview_round row is created and linked back.
  if (!interview.current_round_id) {
    const round = await db.query(
      `INSERT INTO interview_round (interview_id, round_number, status)
       VALUES ($1, 1, 'setup')
       ON CONFLICT (interview_id, round_number) DO NOTHING
       RETURNING id`,
      [interview.id]
    );
    const roundId = round.rows[0]?.id ?? (
      await db.query(
        `SELECT id FROM interview_round WHERE interview_id = $1 AND round_number = 1`,
        [interview.id]
      )
    ).rows[0]?.id;

    if (roundId) {
      await db.query(
        `UPDATE candidate_interview SET current_round_id = $2, updated_at = NOW() WHERE id = $1`,
        [interview.id, roundId]
      );
    }
  }
}

async function seedAssessment(db, { job, candidate }) {
  const exists = await db.query(
    `SELECT 1 FROM assessment_sessions WHERE candidate_id = $1 AND job_id = $2`,
    [candidate.id, job.id]
  );
  if (!exists.rows.length) {
    await db.query(
      `INSERT INTO assessment_sessions (battery, candidate_id, job_id, status, expired_at)
       VALUES ($1, $2, $3, 'invited', NOW() + INTERVAL '30 days')`,
      ['A', candidate.id, job.id]
    );
  }
}

async function seedBackgroundCheck(db, { job, candidate }) {
  const exists = await db.query(
    `SELECT 1 FROM candidate_bg WHERE candidate_id = $1 AND job_id = $2`,
    [candidate.id, job.id]
  );
  if (!exists.rows.length) {
    // status takes its table default ('claims').
    await db.query(
      `INSERT INTO candidate_bg (candidate_id, job_id, company_id) VALUES ($1, $2, $3)`,
      [candidate.id, job.id, job.company_id]
    );
  }
}

async function seedOffering(db, { job, candidate }) {
  const exists = await db.query(
    `SELECT 1 FROM candidate_offer WHERE candidate_id = $1 AND job_id = $2`,
    [candidate.id, job.id]
  );
  if (!exists.rows.length) {
    // offer_status takes its table default ('draft').
    await db.query(
      `INSERT INTO candidate_offer (company_id, candidate_id, job_id, position_title, contract_type)
       VALUES ($1, $2, $3, $4, $5)`,
      [job.company_id, candidate.id, job.id, job.job_title, 'PKWTT']
    );
  }
}

run()
  .then(() => getDb().end())
  .catch(async (err) => {
    console.error('Seed failed:', err.message);
    await getDb().end().catch(() => {});
    process.exit(1);
  });

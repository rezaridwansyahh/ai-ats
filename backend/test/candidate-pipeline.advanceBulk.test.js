import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import '../src/config/env.js';
import getDb from '../src/config/postgres.js';
import candidatePipelineService from '../src/modules/candidate-pipeline/candidate-pipeline.service.js';

let jobId;
let stageA; // "Screening & Matching" category on purpose — no side-effect
let stageB; // handler fires for this category, keeping the test focused on

let candidateId;

before(async () => {
  const db = getDb();

  const job = await db.query(
    `INSERT INTO core_job (job_title) VALUES ($1) RETURNING id`,
    ['TEST FIXTURE — advanceBulk integration test']
  );
  jobId = job.rows[0].id;

  const category = await db.query(
    `SELECT id FROM recruitment_stage_category WHERE name = 'Screening & Matching'`
  );
  const categoryId = category.rows[0].id;

  const stages = await db.query(
    `INSERT INTO job_stage (job_id, stage_type_id, name, stage_order)
     VALUES ($1, $2, 'Stage A', 1), ($1, $2, 'Stage B', 2)
     RETURNING id, stage_order`,
    [jobId, categoryId]
  );
  stageA = stages.rows.find((s) => s.stage_order === 1);
  stageB = stages.rows.find((s) => s.stage_order === 2);

  const candidate = await db.query(
    `INSERT INTO master_candidate (job_id, name, latest_stage) VALUES ($1, $2, $3) RETURNING id`,
    [jobId, 'TEST FIXTURE candidate', stageA.id]
  );
  candidateId = candidate.rows[0].id;
});

after(async () => {
  // Cascades through job_stage -> master_candidate -> candidate_stages
  // (all ON DELETE CASCADE from core_job), so one statement cleans up
  // everything this fixture created.
  await getDb().query(`DELETE FROM core_job WHERE id = $1`, [jobId]);
  await getDb().end();
});

test('advances an eligible candidate to the next stage', async () => {
  const result = await candidatePipelineService.advanceBulk(jobId, [candidateId], stageA.id, 'test-advance');

  assert.deepEqual(result.advanced, [candidateId]);
  assert.deepEqual(result.skipped, []);
  assert.equal(result.nextStage.id, stageB.id);

  const db = getDb();
  const candidateRow = await db.query(`SELECT latest_stage FROM master_candidate WHERE id = $1`, [candidateId]);
  assert.equal(candidateRow.rows[0].latest_stage, stageB.id);

  const stageRows = await db.query(`SELECT * FROM candidate_stages WHERE candidate_id = $1`, [candidateId]);
  assert.equal(stageRows.rows.length, 1);
  assert.equal(stageRows.rows[0].job_stage_id, stageB.id);
});

test('skips a candidate whose stage already changed since selection (race guard), with zero writes', async () => {
  const db = getDb();
  const before = await db.query(`SELECT latest_stage, updated_at FROM master_candidate WHERE id = $1`, [candidateId]);

  // Still passing stageA.id here — stale, since the previous test already
  // moved this candidate to stageB. This is exactly the scenario that used
  // to double-advance a candidate before the expected_stage_id guard existed.
  const result = await candidatePipelineService.advanceBulk(jobId, [candidateId], stageA.id, 'test-advance-again');

  assert.deepEqual(result.advanced, []);
  assert.deepEqual(result.skipped, [{ candidate_id: candidateId, reason: 'stage changed since selection' }]);

  const after = await db.query(`SELECT latest_stage, updated_at FROM master_candidate WHERE id = $1`, [candidateId]);
  assert.deepEqual(after.rows[0], before.rows[0]);

  const stageRows = await db.query(`SELECT * FROM candidate_stages WHERE candidate_id = $1`, [candidateId]);
  assert.equal(stageRows.rows.length, 1); // still just the one row from the first test — no duplicate insert
});

test('throws when expected_stage_id is not part of the job\'s stage list', async () => {
  await assert.rejects(
    () => candidatePipelineService.advanceBulk(jobId, [candidateId], 999999999, 'test-advance'),
    (err) => {
      assert.equal(err.status, 409);
      return true;
    }
  );
});

test('throws when a candidate does not belong to the job', async () => {
  await assert.rejects(
    () => candidatePipelineService.advanceBulk(jobId, [999999999], stageB.id, 'test-advance'),
    (err) => {
      assert.equal(err.status, 404);
      return true;
    }
  );
});
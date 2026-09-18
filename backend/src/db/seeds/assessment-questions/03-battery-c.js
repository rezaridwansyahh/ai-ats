// Step 3/4 — normalizes Battery C's hardcoded question banks
// (frontend/src/components/assessment-c/data/{tk,epps,papi,sjt}.js)
// into assessment_subtest + assessment_question rows.
//
// Run with:
//   cd backend && node src/db/seeds/assessment-questions/03-battery-c.js
//
// Requires: migration 019 applied; master_assessment seeded (assessment_code = 'myralix_battery_c').
// Safe to re-run — same upsert-subtest / replace-questions approach as Battery A/B.

import '../../../config/env.js';
import getDb from '../../../config/postgres.js';

import { SUBS, KEYS, WPT_RAW_QS, DATQS } from '../../../../../frontend/src/components/assessment-c/data/tk.js';
import { ITEMS as EPPS_ITEMS, EPPS_ANSKEY } from '../../../../../frontend/src/components/assessment-c/data/epps.js';
import { PAPI_QS, SCORING_KEY as PAPI_SCORING_KEY } from '../../../../../frontend/src/components/assessment-c/data/papi.js';
import { SJT_QS } from '../../../../../frontend/src/components/assessment-c/data/sjt.js';

const ASSESSMENT_CODE = 'myralix_battery_c';

async function upsertSubtest(db, { assessmentId, subtestKey, groupKey, name, weight, timeLimitSeconds, orderIndex }) {
  const existing = await db.query(
    `SELECT id FROM assessment_subtest WHERE assessment_id = $1 AND subtest_key = $2`,
    [assessmentId, subtestKey],
  );
  if (existing.rows[0]) {
    await db.query(
      `UPDATE assessment_subtest SET group_key=$1, name=$2, weight=$3, time_limit_seconds=$4, order_index=$5, updated_at=NOW() WHERE id=$6`,
      [groupKey, name, weight, timeLimitSeconds, orderIndex, existing.rows[0].id],
    );
    return existing.rows[0].id;
  }
  const res = await db.query(
    `INSERT INTO assessment_subtest (assessment_id, subtest_key, group_key, name, weight, time_limit_seconds, order_index)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [assessmentId, subtestKey, groupKey, name, weight, timeLimitSeconds, orderIndex],
  );
  return res.rows[0].id;
}

async function replaceQuestions(db, subtestId, rows) {
  await db.query(`DELETE FROM assessment_question WHERE subtest_id = $1`, [subtestId]);
  for (const row of rows) {
    await db.query(
      `INSERT INTO assessment_question (subtest_id, question_type, order_index, content)
       VALUES ($1,$2,$3,$4::jsonb)`,
      [subtestId, row.question_type, row.order_index, JSON.stringify(row.content)],
    );
  }
}

function datqsRows(items) {
  return items.map((q, idx) => ({
    question_type: 'mc',
    order_index: idx + 1,
    content: { text: q.s, choices: q.o, correct: q.a },
  }));
}

async function run() {
  const db = getDb();

  const assessmentRes = await db.query('SELECT id FROM master_assessment WHERE assessment_code = $1', [ASSESSMENT_CODE]);
  const assessmentId = assessmentRes.rows[0]?.id;
  if (!assessmentId) throw new Error(`master_assessment "${ASSESSMENT_CODE}" not found — seed assessments.js first.`);

  // ── TK group: GI, PV, KN, PA, KA ─────────────────────────────────────────
  const giId = await upsertSubtest(db, {
    assessmentId, subtestKey: 'GI', groupKey: 'tk', name: SUBS.GI.nameID,
    weight: SUBS.GI.weight, timeLimitSeconds: SUBS.GI.time, orderIndex: 1,
  });
  const giRows = WPT_RAW_QS.map((q) => ({
    question_type: q.type === 'input' ? 'input' : 'mc',
    order_index: q.n,
    content: { text: q.text, choices: q.opts ?? null, correct: KEYS[q.n] ?? null, hint: q.hint ?? null, svg_html: q.svgHtml ?? null },
  }));
  await replaceQuestions(db, giId, giRows);
  console.log(`GI: ${giRows.length} questions seeded (subtest_id=${giId})`);

  const tkParts = [
    { key: 'PV', order: 2 },
    { key: 'KN', order: 3 },
    { key: 'PA', order: 4 },
    { key: 'KA', order: 5 },
  ];
  for (const part of tkParts) {
    const subId = await upsertSubtest(db, {
      assessmentId, subtestKey: part.key, groupKey: 'tk', name: SUBS[part.key].nameID,
      weight: SUBS[part.key].weight, timeLimitSeconds: SUBS[part.key].time, orderIndex: part.order,
    });
    const rows = datqsRows(DATQS[part.key]);
    await replaceQuestions(db, subId, rows);
    console.log(`${part.key}: ${rows.length} questions seeded (subtest_id=${subId})`);
  }

  // ── EPPS (ipsative forced-choice pairs — only one side scores, per ANSKEY) ─
  const eppsId = await upsertSubtest(db, {
    assessmentId, subtestKey: 'epps', groupKey: null, name: 'EPPS',
    weight: 0.20, timeLimitSeconds: null, orderIndex: 6,
  });
  const eppsRows = EPPS_ITEMS.map((item, idx) => {
    const key = EPPS_ANSKEY[idx];
    return {
      question_type: 'forced_choice_pair',
      order_index: idx + 1,
      content: {
        a: { text: item.a, scale: key.a === 'a' ? key.s : null },
        b: { text: item.b, scale: key.a === 'b' ? key.s : null },
      },
    };
  });
  await replaceQuestions(db, eppsId, eppsRows);
  console.log(`epps: ${eppsRows.length} questions seeded (subtest_id=${eppsId})`);

  // ── PAPI (both sides score, per-item dimension pair) ─────────────────────
  const papiId = await upsertSubtest(db, {
    assessmentId, subtestKey: 'papi', groupKey: null, name: 'PAPI Standard',
    weight: 0.20, timeLimitSeconds: null, orderIndex: 7,
  });
  const papiRows = PAPI_QS.map((item, idx) => {
    const [, dimA, dimB] = PAPI_SCORING_KEY[idx];
    return {
      question_type: 'forced_choice_pair',
      order_index: idx + 1,
      content: { a: { text: item.a, scale: dimA }, b: { text: item.b, scale: dimB } },
    };
  });
  await replaceQuestions(db, papiId, papiRows);
  console.log(`papi: ${papiRows.length} questions seeded (subtest_id=${papiId})`);

  // ── SJT — Leadership (scenario + 4 options, per-option score + competency) ─
  const sjtId = await upsertSubtest(db, {
    assessmentId, subtestKey: 'sjt', groupKey: null, name: 'SJT — Leadership',
    weight: 0.20, timeLimitSeconds: null, orderIndex: 8,
  });
  const sjtRows = SJT_QS.map((q, idx) => ({
    question_type: 'scenario_mc',
    order_index: idx + 1,
    content: {
      situation: q.situation,
      question: q.q,
      competency: q.comp,
      options: q.opts.map((o) => ({ label: o.l, text: o.t, score: o.s })),
    },
  }));
  await replaceQuestions(db, sjtId, sjtRows);
  console.log(`sjt: ${sjtRows.length} questions seeded (subtest_id=${sjtId})`);

  console.log('Battery C question bank seeded successfully.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Battery C seed failed:', err);
  process.exit(1);
});

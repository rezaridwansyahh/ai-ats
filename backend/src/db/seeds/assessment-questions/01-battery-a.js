// Step 1/4 — normalizes Battery A's hardcoded question banks
// (frontend/src/components/assessment-a/data/{tk,bigfive,disc,holland}.js)
// into assessment_subtest + assessment_question rows.
//
// Run with:
//   cd backend && node src/db/seeds/assessment-questions/01-battery-a.js
//
// Requires: migration 019_assessment_question_bank.sql already applied, and
// master_assessment seeded (assessment_code = 'myralix_battery_a').
// Safe to re-run — subtests are looked up by (assessment_id, subtest_key)
// before inserting, and questions are fully replaced (DELETE + re-INSERT)
// for whichever subtest is being seeded, so re-running just refreshes content.

import '../../../config/env.js';
import getDb from '../../../config/postgres.js';

import { SUBS, KEYS, GI_QS, KA_QS } from '../../../../../frontend/src/components/assessment-a/data/tk.js';
import { BF_ITEMS, BF_QS } from '../../../../../frontend/src/components/assessment-a/data/bigfive.js';
import { GROUPS } from '../../../../../frontend/src/components/assessment-a/data/disc.js';
import { HOL_QS } from '../../../../../frontend/src/components/assessment-a/data/holland.js';

const ASSESSMENT_CODE = 'myralix_battery_a';

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

export async function run() {
  const db = getDb();

  const assessmentRes = await db.query('SELECT id FROM master_assessment WHERE assessment_code = $1', [ASSESSMENT_CODE]);
  const assessmentId = assessmentRes.rows[0]?.id;
  if (!assessmentId) throw new Error(`master_assessment "${ASSESSMENT_CODE}" not found — seed assessments.js first.`);

  // ── GI (cognitive, part of the "tk" group) ──────────────────────────────
  const giId = await upsertSubtest(db, {
    assessmentId, subtestKey: 'GI', groupKey: 'tk', name: SUBS.GI.nameID,
    weight: SUBS.GI.weight, timeLimitSeconds: SUBS.GI.time, orderIndex: 1,
  });
  const giRows = GI_QS.map((q) => ({
    question_type: q.type === 'input' ? 'input' : 'mc',
    order_index: q.n,
    content: {
      text: q.text,
      choices: q.opts ?? null,
      correct: KEYS[q.n] ?? null,
      hint: q.hint ?? null,
      svg_html: q.svgHtml ?? null,
    },
  }));
  await replaceQuestions(db, giId, giRows);
  console.log(`GI: ${giRows.length} questions seeded (subtest_id=${giId})`);

  // ── KA (clerical speed & accuracy, part of the "tk" group) ──────────────
  const kaId = await upsertSubtest(db, {
    assessmentId, subtestKey: 'KA', groupKey: 'tk', name: SUBS.KA.nameID,
    weight: SUBS.KA.weight, timeLimitSeconds: SUBS.KA.time, orderIndex: 2,
  });
  const kaRows = KA_QS.map((q, idx) => ({
    question_type: 'mc',
    order_index: idx + 1,
    content: { text: q.s, choices: q.o, correct: q.a },
  }));
  await replaceQuestions(db, kaId, kaRows);
  console.log(`KA: ${kaRows.length} questions seeded (subtest_id=${kaId})`);

  // ── Big Five (OCEAN) ─────────────────────────────────────────────────────
  const bigfiveId = await upsertSubtest(db, {
    assessmentId, subtestKey: 'bigfive', groupKey: null, name: 'Big Five (OCEAN)',
    weight: 0.20, timeLimitSeconds: null, orderIndex: 3,
  });
  const bigfiveRows = BF_ITEMS.map(([n, trait, reversed]) => ({
    question_type: 'likert',
    order_index: n,
    content: { text: BF_QS[n - 1], trait, reverse: reversed },
  }));
  await replaceQuestions(db, bigfiveId, bigfiveRows);
  console.log(`bigfive: ${bigfiveRows.length} questions seeded (subtest_id=${bigfiveId})`);

  // ── DISC ─────────────────────────────────────────────────────────────────
  const discId = await upsertSubtest(db, {
    assessmentId, subtestKey: 'disc', groupKey: null, name: 'DISC',
    weight: 0.20, timeLimitSeconds: null, orderIndex: 4,
  });
  const discRows = GROUPS.map((g) => ({
    question_type: 'forced_choice_quad',
    order_index: g.no,
    content: { options: g.options.map((o) => ({ text: o.t, most_dim: o.p, least_dim: o.k })) },
  }));
  await replaceQuestions(db, discId, discRows);
  console.log(`disc: ${discRows.length} questions seeded (subtest_id=${discId})`);

  // ── Holland RIASEC ───────────────────────────────────────────────────────
  const hollandId = await upsertSubtest(db, {
    assessmentId, subtestKey: 'holland', groupKey: null, name: 'Holland RIASEC',
    weight: 0.20, timeLimitSeconds: null, orderIndex: 5,
  });
  const hollandRows = HOL_QS.map((q) => ({
    question_type: 'yes_no',
    order_index: q.n,
    content: { text: q.q, dimension: q.t },
  }));
  await replaceQuestions(db, hollandId, hollandRows);
  console.log(`holland: ${hollandRows.length} questions seeded (subtest_id=${hollandId})`);

  console.log('Battery A question bank seeded successfully.');
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Battery A seed failed:', err);
      process.exit(1);
    });
}

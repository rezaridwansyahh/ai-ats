// Step 4/4 — normalizes Battery D's hardcoded question banks
// (frontend/src/components/assessment-d/data/{tk,sjt,pf,msdt,papil}.js)
// into assessment_subtest + assessment_question rows.
//
// Run with:
//   cd backend && node src/db/seeds/assessment-questions/04-battery-d.js
//
// Requires: migration 019 applied; master_assessment seeded (assessment_code = 'myralix_battery_d').
// Safe to re-run — same upsert-subtest / replace-questions approach as Battery A/B/C.
// Note: Battery D's TK_ORDER is ["GI","PV","KN","PA"] — no KA subtest here.

import '../../../config/env.js';
import getDb from '../../../config/postgres.js';

import { SUBS, KEYS, WPT_RAW_QS, DATQS } from '../../../../../frontend/src/components/assessment-d/data/tk.js';
import { SJT_QS } from '../../../../../frontend/src/components/assessment-d/data/sjt.js';
import { PF_QS, KEY as PF_KEY } from '../../../../../frontend/src/components/assessment-d/data/pf.js';
import { MSDT_QS } from '../../../../../frontend/src/components/assessment-d/data/msdt.js';
import { PAPI_LD_QS, SCORING_KEY as PAPIL_SCORING_KEY } from '../../../../../frontend/src/components/assessment-d/data/papil.js';

const ASSESSMENT_CODE = 'myralix_battery_d';
const REASONING_LETTER_TO_INDEX = { a: 0, b: 1, c: 2 };

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

export async function run() {
  const db = getDb();

  const assessmentRes = await db.query('SELECT id FROM master_assessment WHERE assessment_code = $1', [ASSESSMENT_CODE]);
  const assessmentId = assessmentRes.rows[0]?.id;
  if (!assessmentId) throw new Error(`master_assessment "${ASSESSMENT_CODE}" not found — seed assessments.js first.`);

  // ── TK group: GI, PV, KN, PA (no KA in Battery D) ────────────────────────
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

  // ── SJT — Senior Leadership ────────────────────────────────────────────
  const sjtId = await upsertSubtest(db, {
    assessmentId, subtestKey: 'sjt', groupKey: null, name: 'SJT — Senior Leadership',
    weight: 0.20, timeLimitSeconds: null, orderIndex: 5,
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

  // ── 16PF — trichotomous self-report items + a handful of objective reasoning items ─
  const pfId = await upsertSubtest(db, {
    assessmentId, subtestKey: 'pf', groupKey: null, name: '16PF',
    weight: 0.20, timeLimitSeconds: null, orderIndex: 6,
  });
  const pfRows = PF_QS.map((q, idx) => {
    const n = idx + 1;
    const key = PF_KEY[n];
    const [factor, second] = key;
    const isReasoning = q.b === true;
    return {
      question_type: 'trichotomous_rated',
      order_index: n,
      content: {
        text: q.s,
        choices: q.o,
        factor,
        is_reasoning: isReasoning,
        // Non-reasoning: extreme answers (index 0 / index 2) score `second`/third key value; middle is implicitly 1 point.
        // Reasoning: `second` is a letter naming the objectively correct choice.
        score_first: isReasoning ? null : second,
        score_last: isReasoning ? null : key[2],
        correct_index: isReasoning ? (REASONING_LETTER_TO_INDEX[second] ?? null) : null,
      },
    };
  });
  await replaceQuestions(db, pfId, pfRows);
  console.log(`pf: ${pfRows.length} questions seeded (subtest_id=${pfId})`);

  // ── MSDT — Gaya Kepemimpinan (forced-choice pair, style codes inline) ────
  const msdtId = await upsertSubtest(db, {
    assessmentId, subtestKey: 'msdt', groupKey: null, name: 'MSDT — Gaya Kepemimpinan',
    weight: 0.15, timeLimitSeconds: null, orderIndex: 7,
  });
  const msdtRows = MSDT_QS.map((item, idx) => ({
    question_type: 'forced_choice_pair',
    order_index: idx + 1,
    content: { a: { text: item.a, scale: item.sa }, b: { text: item.b, scale: item.sb } },
  }));
  await replaceQuestions(db, msdtId, msdtRows);
  console.log(`msdt: ${msdtRows.length} questions seeded (subtest_id=${msdtId})`);

  // ── PAPI-L — Preferensi Kepemimpinan (both sides score, same shape as PAPI) ─
  const papilId = await upsertSubtest(db, {
    assessmentId, subtestKey: 'papil', groupKey: null, name: 'PAPI-L Kepemimpinan',
    weight: 0.15, timeLimitSeconds: null, orderIndex: 8,
  });
  const papilRows = PAPI_LD_QS.map((item, idx) => {
    const [, dimA, dimB] = PAPIL_SCORING_KEY[idx];
    return {
      question_type: 'forced_choice_pair',
      order_index: idx + 1,
      content: { a: { text: item.a, scale: dimA }, b: { text: item.b, scale: dimB } },
    };
  });
  await replaceQuestions(db, papilId, papilRows);
  console.log(`papil: ${papilRows.length} questions seeded (subtest_id=${papilId})`);

  console.log('Battery D question bank seeded successfully.');
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Battery D seed failed:', err);
      process.exit(1);
    });
}

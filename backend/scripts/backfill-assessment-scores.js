// One-off backfill — recomputes every subtest score (assessment_score) and
// the final composite (core_applicant_assessment.results/summary) from the
// real assessment_answer rows, using the same server-side scoring registry
// now used live (src/shared/services/assessment-scoring/). Needed because a
// stale-closure bug in the candidate timer's auto-timeout path (TKTest.jsx,
// fixed separately) could score a GI/KN subtest as 0 despite the candidate's
// real answers being correctly saved — e.g. result_id=11 persisted GI=0/50
// and KN=0/40 when the real data replays to 21/50 and 29/40.
//
// Dry-run by default — prints every discrepancy found (old vs. new value)
// without writing anything. Pass --apply to actually write the corrections.
//
// Run with:
//   cd backend && node scripts/backfill-assessment-scores.mjs            # dry run, all completed results
//   cd backend && node scripts/backfill-assessment-scores.mjs --apply    # apply, all completed results
//   cd backend && node scripts/backfill-assessment-scores.mjs 11 42      # dry run, only these result_ids
//   cd backend && node scripts/backfill-assessment-scores.mjs 11 --apply # apply, only this result_id
//
// Safe to re-run — a result with no discrepancies is reported as clean and
// left untouched.

import '../src/config/env.js';
import getDb from '../src/config/postgres.js';
import Question from '../src/modules/assessment/question/question.model.js';
import AssessmentAnswer from '../src/modules/assessment/assessment-answer/assessment-answer.model.js';
import AssessmentScore from '../src/modules/assessment/assessment-score/assessment-score.model.js';
import AssessmentBatteryResult from '../src/modules/assessment/assessment-battery-result/assessment-battery-result.model.js';
import { composeAuthoritativeResults } from '../src/modules/assessment/assessment-battery-result/assessment-battery-result.service.js';
import { scoreSubtest } from '../src/shared/services/assessment-scoring/index.js';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const explicitIds = args.filter((a) => /^\d+$/.test(a)).map(Number);

// Plain JSON.stringify is key-order-sensitive, and Postgres's JSONB storage
// doesn't preserve the original insertion order — so comparing a freshly
// computed score object against one round-tripped through the DB produces
// false-positive "diffs" even when every value matches. Sort keys
// recursively before comparing so only real value differences are reported.
function canonicalJSON(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJSON(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

async function recomputeSubtestScores(result_id, assessment_id) {
  const subtests = await Question.getSubtestsByAssessmentId(assessment_id);
  const diffs = [];

  for (const st of subtests) {
    const items = await Question.getQuestionsBySubtestId(st.id);
    if (!items.length) continue;

    const answerRows = await AssessmentAnswer.getByResultIdAndSubtestId(result_id, st.id);
    if (!answerRows.length) continue; // never attempted — nothing to recompute

    const answersByOrderIndex = {};
    answerRows.forEach((r) => { answersByOrderIndex[r.order_index] = r.answer; });

    const newScore = scoreSubtest({
      assessment_id, subtest_key: st.subtest_key, group_key: st.group_key, items, answersByOrderIndex,
    });

    const existing = await getDb().query(
      `SELECT score FROM assessment_score WHERE result_id = $1 AND subtest_id = $2`, [result_id, st.id]
    );
    const oldScore = existing.rows[0]?.score ?? null;

    if (canonicalJSON(oldScore) !== canonicalJSON(newScore)) {
      diffs.push({ subtest_key: st.subtest_key, subtest_id: st.id, old: oldScore, new: newScore });
      if (APPLY) {
        await AssessmentScore.upsert({ result_id, subtest_id: st.id, score: newScore });
      }
    }
  }

  return diffs;
}

async function run() {
  const targetRows = explicitIds.length
    ? (await Promise.all(explicitIds.map(async (id) => {
        const r = await getDb().query(
          `SELECT id, assessment_id, status FROM core_applicant_assessment WHERE id = $1`, [id]
        );
        return r.rows[0];
      }))).filter(Boolean)
    : (await getDb().query(
        `SELECT id, assessment_id, status FROM core_applicant_assessment WHERE status = 'completed' ORDER BY id`
      )).rows;

  console.log(`${APPLY ? 'APPLYING corrections' : 'DRY RUN (pass --apply to write)'} — checking ${targetRows.length} result(s)...\n`);

  let anyDiff = false;

  for (const row of targetRows) {
    const diffs = await recomputeSubtestScores(row.id, row.assessment_id);
    if (diffs.length === 0) continue;

    anyDiff = true;
    console.log(`result_id=${row.id} (assessment_id=${row.assessment_id}, status=${row.status}):`);
    diffs.forEach((d) => {
      console.log(`  ${d.subtest_key}: ${JSON.stringify(d.old)}`);
      console.log(`    -> ${JSON.stringify(d.new)}`);
    });

    if (APPLY && row.status === 'completed') {
      const current = await AssessmentBatteryResult.getById(row.id);
      const authoritative = await composeAuthoritativeResults({
        assessment_id: row.assessment_id,
        result_id: row.id,
        clientBySubtest: current?.results?.by_subtest,
      });
      if (authoritative) {
        await AssessmentBatteryResult.update(getDb(), row.id, {
          status: current.status,
          results: { ...current.results, by_subtest: authoritative.by_subtest },
          summary: { ...current.summary, ...authoritative.summaryOverrides },
          started_at: current.started_at,
          completed_at: current.completed_at,
        });
        console.log('  -> results/summary recomputed and saved');
      }
    }
    console.log();
  }

  if (!anyDiff) {
    console.log('No discrepancies found — every score already matches the real answers.');
  } else if (!APPLY) {
    console.log('Dry run only — re-run with --apply to write these corrections.');
  }
}

run()
  .then(() => getDb().end())
  .catch(async (err) => {
    console.error('Backfill failed:', err.message);
    await getDb().end().catch(() => {});
    process.exit(1);
  });

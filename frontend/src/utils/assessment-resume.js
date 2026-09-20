// Shared helpers for rehydrating an in-progress subtest from
// GET /portal-assessment/:hash/progress — { answers: [{question_id, answer, ...}],
// scores: [{subtest_id, score, ...}] } — after a refresh, instead of always
// restarting the current subtest from question 1. Used by every battery's
// candidate Test components (TKTest, SJTTest, and the untimed single-subtest
// tests) in portal mode only; standalone/staff mode never has a resultId to
// resume from.

// subtest_id -> already-saved score JSONB (or null if that subtest hasn't been
// scored yet). A hit here means the candidate finished this subtest before
// whatever interrupted them — the caller should skip straight to onComplete.
export function findExistingScore(scores, subtestId) {
  if (!subtestId) return null;
  const row = (scores || []).find((r) => r.subtest_id === subtestId);
  return row ? row.score : null;
}

// question_id -> saved answer row, scoped to one subtest's question list.
export function answersByQuestionId(answers, questionIds) {
  const idSet = new Set(questionIds);
  const map = new Map();
  (answers || []).forEach((r) => {
    if (idSet.has(r.question_id)) map.set(r.question_id, r);
  });
  return map;
}

// Earliest answered_at among a subtest's saved answers, as a proxy for when the
// candidate started it (answers save immediately on pick, so this undercounts
// the true start by at most a few seconds). Null when no answers exist yet —
// callers treat that as "not started," giving the full time limit.
export function earliestAnsweredAt(answers, questionIds) {
  const idSet = new Set(questionIds);
  const times = (answers || [])
    .filter((r) => idSet.has(r.question_id))
    .map((r) => new Date(r.answered_at).getTime())
    .filter((t) => !Number.isNaN(t));
  return times.length ? Math.min(...times) : null;
}

// Remaining seconds for a timed subtest, given its saved answers. Returns the
// full limit if nothing's been answered yet (can't distinguish "hasn't started"
// from "spent a long time on question 1" without a start timestamp, so the
// generous read wins), otherwise clamps to 0 if time has already run out.
export function resumeTimeLeft(answers, questionIds, timeLimitSeconds) {
  const startedAt = earliestAnsweredAt(answers, questionIds);
  if (startedAt == null) return timeLimitSeconds;
  const elapsed = (Date.now() - startedAt) / 1000;
  return Math.max(0, Math.round(timeLimitSeconds - elapsed));
}

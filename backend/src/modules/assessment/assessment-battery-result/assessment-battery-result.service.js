import AssessmentBatteryResult from './assessment-battery-result.model.js';
import getDb from '../../../config/postgres.js';

function scoreCognitive(items, answers) {
  const graded = answers.map((a) => {
    const q = items[a.index];
    if (!q) return { ...a, is_correct: false, points_earned: 0 };
    const is_correct = q.correct === a.selected;
    return {
      index: a.index,
      selected: a.selected,
      is_correct,
      points_earned: is_correct ? (q.points ?? 0) : 0,
    };
  });
  const points = graded.reduce((s, g) => s + g.points_earned, 0);
  const max    = answers.reduce((s, a) => s + (items[a.index]?.points ?? 0), 0);
  return { graded, points, max, percent: max ? Math.round((points / max) * 100) : 0 };
}

function scoreBigFive(items, answers) {
  const traits = { E: 0, A: 0, C: 0, N: 0, O: 0 };
  const counts = { E: 0, A: 0, C: 0, N: 0, O: 0 };
  for (const a of answers) {
    const q = items[a.index];
    if (!q || !traits.hasOwnProperty(q.trait)) continue;
    const likert = Number(a.selected);
    if (!Number.isFinite(likert)) continue;
    const value = q.reversed ? (6 - likert) : likert;
    traits[q.trait] += value;
    counts[q.trait] += 1;
  }
  const avg = {};
  for (const t of Object.keys(traits)) avg[t] = counts[t] ? +(traits[t] / counts[t]).toFixed(2) : 0;
  return { traits, counts, avg };
}

function scoreDISC(groups, answers) {
  const most  = { D: 0, I: 0, S: 0, C: 0 };
  const least = { D: 0, I: 0, S: 0, C: 0 };
  for (const a of answers) {
    const g = groups[a.index];
    if (!g) continue;
    const m = a.selected?.most;
    const l = a.selected?.least;
    if (Number.isInteger(m) && g.options[m]) {
      const dim = g.options[m].primary;
      if (dim && dim !== '*') most[dim] += 1;
    }
    if (Number.isInteger(l) && g.options[l]) {
      const dim = g.options[l].secondary;
      if (dim && dim !== '*') least[dim] += 1;
    }
  }
  const dominant = Object.entries(most).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return { most, least, dominant };
}

function scoreHolland(items, answers) {
  const counts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  for (const a of answers) {
    const q = items[a.index];
    if (!q || !counts.hasOwnProperty(q.category)) continue;
    if (a.selected === true || a.selected === 1) counts[q.category] += 1;
  }
  const code3 = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k).join('');
  return { counts, code3 };
}

function buildResults(questions, answersBySubtest) {
  const by_subtest = {};
  let total_points = 0;
  let total_max    = 0;

  if (questions?.GI && answersBySubtest.GI?.length) {
    const r = scoreCognitive(questions.GI, answersBySubtest.GI);
    by_subtest.GI = { points: r.points, max: r.max, percent: r.percent, graded: r.graded };
    total_points += r.points;
    total_max    += r.max;
  }
  if (questions?.KA && answersBySubtest.KA?.length) {
    const r = scoreCognitive(questions.KA, answersBySubtest.KA);
    by_subtest.KA = { points: r.points, max: r.max, percent: r.percent, graded: r.graded };
    total_points += r.points;
    total_max    += r.max;
  }
  if (questions?.BigFive && answersBySubtest.BigFive?.length) {
    by_subtest.BigFive = scoreBigFive(questions.BigFive, answersBySubtest.BigFive);
  }
  if (questions?.DISC && answersBySubtest.DISC?.length) {
    by_subtest.DISC = scoreDISC(questions.DISC, answersBySubtest.DISC);
  }
  if (questions?.Holland && answersBySubtest.Holland?.length) {
    by_subtest.Holland = scoreHolland(questions.Holland, answersBySubtest.Holland);
  }

  return { answers: answersBySubtest, by_subtest, total_points, total_max };
}

const TK_WEIGHTS = { GI: 0.30, KA: 0.175 };

const PILLAR_THRESHOLDS = {
  cognitive:     70,
  personality:   65,
  work_attitude: 70,
  overall:       70,
};

function pctToScore10(pct) {
  return Math.max(1, Math.min(10, Math.round(pct / 10)));
}

function computeTkComposite(by_subtest) {
  const subs = ['GI', 'KA'].filter((k) => by_subtest[k]);
  if (subs.length === 0) return null;

  let weighted = 0;
  let weightSum = 0;
  for (const k of subs) {
    const score10 = pctToScore10(by_subtest[k].percent ?? 0);
    weighted  += score10 * TK_WEIGHTS[k];
    weightSum += TK_WEIGHTS[k];
  }
  return weightSum ? Math.round((weighted / weightSum) * 10) / 10 : null;
}

function bigfiveAvgToPct(avg) {
  // avg on 1-5 Likert → 0-100. (avg-1)/4 × 100.
  const out = {};
  for (const [k, v] of Object.entries(avg || {})) {
    out[k] = v ? Math.round(((v - 1) / 4) * 100) : null;
  }
  return out;
}

function computePersonalityPillar(bigfive_pct) {
  if (!bigfive_pct) return null;
  const C = bigfive_pct.C;
  const N = bigfive_pct.N;
  const A = bigfive_pct.A;
  if (C == null || N == null || A == null) return null;
  // Battery A formula: high C, low N, high A = good for operational.
  return Math.round(C * 0.4 + (100 - N) * 0.3 + A * 0.3);
}

function computeWorkAttitudePillar(by_subtest) {
  const disc    = by_subtest.DISC;
  const holland = by_subtest.Holland;
  if (!disc && !holland) return null;

  let discFit = 60;
  if (disc?.dominant === 'S')      discFit = 100;
  else if (disc?.dominant === 'C') discFit = 85;
  else if (disc?.dominant === 'D' || disc?.dominant === 'I') discFit = 55;

  let holFit = 60;
  if (holland?.code3) {
    const code = holland.code3;
    if (code.includes('C') || code.includes('S')) holFit = 95;
    else if (code.includes('R')) holFit = 80;
    else holFit = 55;
  }
  return Math.round(discFit * 0.5 + holFit * 0.5);
}

function buildSummary(results) {
  const by_subtest = results.by_subtest ?? {};
  const cog    = (by_subtest.GI?.points ?? 0) + (by_subtest.KA?.points ?? 0);
  const cogMax = (by_subtest.GI?.max    ?? 0) + (by_subtest.KA?.max    ?? 0);

  const tk_composite = computeTkComposite(by_subtest);
  const bigfive_pct  = by_subtest.BigFive?.avg ? bigfiveAvgToPct(by_subtest.BigFive.avg) : null;

  const cognitive     = tk_composite != null ? Math.round(tk_composite * 10) : null;
  const personality   = computePersonalityPillar(bigfive_pct);
  const work_attitude = computeWorkAttitudePillar(by_subtest);

  const presentPillars = [cognitive, personality, work_attitude].filter((v) => v != null);
  const overall = presentPillars.length
    ? Math.round(presentPillars.reduce((a, b) => a + b, 0) / presentPillars.length)
    : null;

  return {
    overall_percent: cogMax ? Math.round((cog / cogMax) * 100) : null,
    cognitive_points: cog,
    cognitive_max: cogMax,
    bigfive_avg: by_subtest.BigFive?.avg ?? null,
    bigfive_pct,
    disc_dominant: by_subtest.DISC?.dominant ?? null,
    holland_code3: by_subtest.Holland?.code3 ?? null,
    tk_composite,
    pillars: { cognitive, personality, work_attitude, overall },
    pillar_thresholds: PILLAR_THRESHOLDS,
  };
}

function mergeBySubtest(existing, fresh) {
  const merged = { ...(existing || {}) };
  for (const [k, v] of Object.entries(fresh || {})) {
    if (merged[k]) continue;
    merged[k] = v;
  }
  return merged;
}

function sumPoints(by_subtest) {
  let total_points = 0;
  let total_max    = 0;
  for (const v of Object.values(by_subtest)) {
    if (v?.points != null) total_points += v.points;
    if (v?.max    != null) total_max    += v.max;
  }
  return { total_points, total_max };
}

function groupAnswersBySubtest(answers) {
  const grouped = {};
  for (const a of answers || []) {
    if (!a?.subtest) continue;
    (grouped[a.subtest] ||= []).push({ index: a.index, selected: a.selected });
  }
  return grouped;
}

class AssessmentBatteryResultService {
  async getAll() {
    return await AssessmentBatteryResult.getAll();
  }

  async getById(id) {
    const row = await AssessmentBatteryResult.getById(id);
    if (!row) throw { status: 404, message: 'Assessment result not found' };
    return row;
  }

  async getByParticipantId(participant_id) {
    if (!participant_id) throw { status: 400, message: 'participant_id is required' };
    return await AssessmentBatteryResult.getByParticipantId(participant_id);
  }

  async submit({ participant_id, assessment_id, answers, started_at, results: bodyResults, summary: bodySummary }) {
    if (!participant_id) throw { status: 400, message: 'participant_id is required' };
    if (!assessment_id || !Number.isInteger(Number(assessment_id))) {
      throw { status: 400, message: 'integer assessment_id is required' };
    }

    // Two submission modes:
    //   - server-scored: client sends `answers`, server runs buildResults + buildSummary (Battery A path).
    //   - client-scored: client sends pre-computed `results.by_subtest` + `summary` JSONB (Battery B path,
    //     because the server doesn't know B's scoring math). `answers` is optional in this mode.
    const hasPrecomputed = !!(bodyResults?.by_subtest && bodySummary);
    if (!hasPrecomputed && (!Array.isArray(answers) || answers.length === 0)) {
      throw { status: 400, message: 'answers must be a non-empty array (or pre-computed results+summary)' };
    }

    const pid = Number(participant_id);
    const aid = Number(assessment_id);

    const assessmentRow = await getDb().query(
      `SELECT options FROM master_assessment WHERE id = $1`,
      [aid]
    );
    if (!assessmentRow.rows[0]) throw { status: 404, message: 'Assessment not found' };
    const options          = assessmentRow.rows[0].options ?? {};
    const questions        = options.questions ?? {};
    const expectedSubtests = Array.isArray(options.subtests) ? options.subtests : Object.keys(questions);

    const client = await getDb().connect();
    try {
      await client.query('BEGIN');

      const existing = await AssessmentBatteryResult.getForUpdate(client, pid, aid);
      if (existing?.status === 'completed') {
        throw { status: 409, message: 'Assessment already completed for this participant' };
      }

      let mergedResults;
      let summary;

      if (hasPrecomputed) {
        // Trust client-supplied JSONB. Merge with any existing partial results (skip already-present subtests).
        const existingSubtest = existing?.results?.by_subtest ?? {};
        const existingAnswers = existing?.results?.answers    ?? {};
        const mergedBySubtest = mergeBySubtest(existingSubtest, bodyResults.by_subtest);
        const mergedAnswers   = { ...existingAnswers, ...(bodyResults.answers || {}) };
        mergedResults = { answers: mergedAnswers, by_subtest: mergedBySubtest };
        summary       = bodySummary;
      } else {
        // Server-side scoring path (Battery A).
        const grouped      = groupAnswersBySubtest(answers);
        const freshResults = buildResults(questions, grouped);

        const existingSubtest = existing?.results?.by_subtest ?? {};
        const existingAnswers = existing?.results?.answers    ?? {};

        const mergedBySubtest = mergeBySubtest(existingSubtest, freshResults.by_subtest);
        const mergedAnswers   = { ...existingAnswers };
        for (const [k, v] of Object.entries(freshResults.answers || {})) {
          if (!mergedAnswers[k]) mergedAnswers[k] = v;
        }

        const { total_points, total_max } = sumPoints(mergedBySubtest);
        mergedResults = {
          answers:    mergedAnswers,
          by_subtest: mergedBySubtest,
          total_points,
          total_max,
        };
        summary = buildSummary(mergedResults);
      }

      const allDone = expectedSubtests.length > 0
        && expectedSubtests.every((k) => mergedResults.by_subtest[k]);
      const status       = allDone ? 'completed' : 'in_progress';
      const completed_at = allDone ? new Date().toISOString() : null;

      const row = existing
        ? await AssessmentBatteryResult.update(client, existing.id, {
            status,
            results: mergedResults,
            summary,
            started_at: existing.started_at || started_at || null,
            completed_at,
          })
        : await AssessmentBatteryResult.create(client, {
            participant_id: pid,
            assessment_id:  aid,
            status,
            results: mergedResults,
            summary,
            started_at: started_at || null,
            completed_at,
          });

      await client.query('COMMIT');
      return row;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getActiveProgress(participant_id, assessment_id) {
    if (!participant_id) throw { status: 400, message: 'participant_id is required' };
    if (!assessment_id)  throw { status: 400, message: 'assessment_id is required' };
    const row = await AssessmentBatteryResult.getActiveByParticipantAssessment(
      Number(participant_id),
      Number(assessment_id),
    );
    if (!row) {
      return { id: null, status: null, completed_subtests: [], summary: null };
    }
    return {
      id: row.id,
      status: row.status,
      completed_subtests: Object.keys(row.results?.by_subtest ?? {}),
      summary: row.summary ?? null,
    };
  }

  async updateReport(id, fields) {
    const existing = await AssessmentBatteryResult.getById(id);
    if (!existing) throw { status: 404, message: 'Assessment result not found' };
    return await AssessmentBatteryResult.updateReport(id, fields);
  }

  async delete(id) {
    const existing = await AssessmentBatteryResult.getById(id);
    if (!existing) throw { status: 404, message: 'Assessment result not found' };
    await AssessmentBatteryResult.delete(id);
    return existing;
  }
}

export default new AssessmentBatteryResultService();

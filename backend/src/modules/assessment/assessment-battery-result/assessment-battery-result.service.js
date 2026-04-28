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

function buildSummary(results) {
  const cog = (results.by_subtest.GI?.points ?? 0) + (results.by_subtest.KA?.points ?? 0);
  const cogMax = (results.by_subtest.GI?.max ?? 0) + (results.by_subtest.KA?.max ?? 0);
  return {
    overall_percent: cogMax ? Math.round((cog / cogMax) * 100) : null,
    cognitive_points: cog,
    cognitive_max: cogMax,
    bigfive_avg: results.by_subtest.BigFive?.avg ?? null,
    disc_dominant: results.by_subtest.DISC?.dominant ?? null,
    holland_code3: results.by_subtest.Holland?.code3 ?? null,
  };
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

  async submit({ participant_id, assessment_id, answers, started_at }) {
    if (!participant_id) throw { status: 400, message: 'participant_id is required' };
    if (!assessment_id || !Number.isInteger(Number(assessment_id))) {
      throw { status: 400, message: 'integer assessment_id is required' };
    }
    if (!Array.isArray(answers) || answers.length === 0) {
      throw { status: 400, message: 'answers must be a non-empty array' };
    }

    const assessmentRow = await getDb().query(
      `SELECT options FROM master_assessment WHERE id = $1`,
      [Number(assessment_id)]
    );
    if (!assessmentRow.rows[0]) throw { status: 404, message: 'Assessment not found' };
    const questions = assessmentRow.rows[0].options?.questions ?? {};

    const grouped = groupAnswersBySubtest(answers);
    const results = buildResults(questions, grouped);
    const summary = buildSummary(results);

    return await AssessmentBatteryResult.upsertByDay({
      participant_id: Number(participant_id),
      assessment_id: Number(assessment_id),
      status: 'completed',
      results,
      summary,
      started_at: started_at || null,
      completed_at: new Date().toISOString(),
    });
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

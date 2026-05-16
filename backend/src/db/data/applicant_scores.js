// Synthetic AI-Matching results — deterministic, no LLM call.
// Mimics the shape ai.service.scoreWithRubric() returns and
// screeningModel.upsertScore() writes. overall_score is computed via the
// same formula as ScreeningService.computeOverall().

import applicantsData from './applicants.js';
import candidatesData from './candidate.js';
import { coreJobs }   from './job_sourcing.js';

const lower = (s) => String(s || '').toLowerCase();

const intersectCI = (have = [], target = []) => {
  const set = new Set(have.map(lower));
  return target.filter((x) => set.has(lower(x)));
};

const diffCI = (required = [], have = []) => {
  const set = new Set(have.map(lower));
  return required.filter((x) => !set.has(lower(x)));
};

// --- sub-score formulas ---

function scoreSkills(info, job) {
  const haveSkills  = info.skills           || [];
  const required    = job.required_skills   || [];
  const preferred   = job.preferred_skills  || [];
  const matchedReq  = intersectCI(haveSkills, required);
  const matchedPref = intersectCI(haveSkills, preferred);
  const reqCount    = required.length || 1;
  const base  = Math.round((100 * matchedReq.length) / reqCount);
  const bonus = 5 * matchedPref.length;
  return {
    score: Math.max(0, Math.min(100, base + bonus)),
    matched_skills: [...matchedReq, ...matchedPref],
    missing_skills: diffCI(required, haveSkills),
  };
}

function scoreExperience(info) {
  const y = Number(info.experience?.years_total) || 0;
  if (y >= 8) return 92;
  if (y >= 6) return 88;
  if (y >= 4) return 80;
  if (y >= 2) return 65;
  return 45;
}

function scoreCareerTrajectory(info) {
  const positions = info.experience?.positions || [];
  if (positions.length === 0) return 40;
  if (positions.length === 1) return 55;
  if (positions.length === 2) return 70;
  const top = String(positions[0]?.title || '').toLowerCase();
  const climbed = /senior|lead|principal|staff|head/.test(top);
  return climbed ? 88 : 78;
}

function scoreEducation(info) {
  const edus = info.education || [];
  if (edus.length === 0) return 50;
  const tierRank = { top: 90, mid: 70 };
  const best = edus.reduce((acc, e) => Math.max(acc, tierRank[e.tier] ?? 55), 0);
  const masters = edus.some((e) => /master/i.test(e.degree || ''));
  return Math.min(100, best + (masters ? 5 : 0));
}

function computeOverall(rubric, sub) {
  const fx = rubric.fixed_criteria;
  const weightedSum =
    sub.skills            * fx.skills.weight +
    sub.experience        * fx.experience.weight +
    sub.career_trajectory * fx.career_trajectory.weight +
    sub.education         * fx.education.weight;
  return Math.max(0, Math.min(100, Math.round(weightedSum / 100)));
}

function roleProfileFor(info) {
  const y = Number(info.experience?.years_total) || 0;
  return y < 2 ? 'fresh_graduate' : 'experienced';
}

function summaryFor(applicant, job, matched, missing) {
  const reqCount = job.required_skills?.length || 0;
  const matchedReqCount = (job.required_skills || []).filter((r) =>
    matched.some((m) => lower(m) === lower(r))
  ).length;
  const years     = applicant.information.experience?.years_total ?? 0;
  const positions = applicant.information.experience?.positions || [];
  const companies = positions.slice(0, 2).map((p) => p.company).filter(Boolean).join(' / ');
  const matchedDisplay = matched.slice(0, 4).join(', ') || '—';
  const missingDisplay = missing.slice(0, 3).join(', ');
  const missingTail = missingDisplay ? ` Gaps: ${missingDisplay}.` : '';
  const expTail     = companies ? ` at ${companies}` : '';
  return `Matched ${matchedReqCount}/${reqCount} required (${matchedDisplay}). ${years}y exp${expTail}.${missingTail}`;
}

// --- build outputs ---

const jobsById       = new Map(coreJobs.map((j) => [j.id, j]));
const applicantsById = new Map(applicantsData.map((a) => [a.id, a]));

// Pre-decided demo rows on Job 2 (keyed by master_candidate.id).
// Exercises the L3 "already decided" surface without leaving Job 1's
// calibration cohort short.
const PRE_DECIDED = {
  10: { decision: 'advance', decision_reason: 'Strong senior candidate, schedule R1 ASAP.',     decided_by: 1 },
  11: { decision: 'reject',  decision_reason: 'Below required experience bar for this role.',   decided_by: 1 },
};

const scoredRows = candidatesData
  .map((c) => {
    const job = jobsById.get(c.job_id);
    if (!job || !job.rubric) return null;
    const applicant = applicantsById.get(c.applicant_id);
    if (!applicant) return null;
    const info = applicant.information;
    // Skip rows whose facets aren't in Layer 1 shape (e.g. email-tester applicants).
    if (!info || !info.experience || !Array.isArray(info.skills)) return null;

    const sk  = scoreSkills(info, job);
    const sub = {
      skills:            sk.score,
      experience:        scoreExperience(info),
      career_trajectory: scoreCareerTrajectory(info),
      education:         scoreEducation(info),
    };
    const overall = computeOverall(job.rubric, sub);

    return {
      candidate_id: c.id,
      applicant_id: applicant.id,
      job_id: job.id,
      company_id: job.company_id ?? null,
      overall_score: overall,
      skills_score: sub.skills,
      experience_score: sub.experience,
      career_trajectory_score: sub.career_trajectory,
      education_score: sub.education,
      matched_skills: sk.matched_skills,
      missing_skills: sk.missing_skills,
      custom_criteria_results: [],
      rubric_snapshot: job.rubric,
      role_profile: roleProfileFor(info),
      summary: summaryFor(applicant, job, sk.matched_skills, sk.missing_skills),
    };
  })
  .filter(Boolean);

// Self-test: catch CHECK-constraint violations at JS level before the SQL trip.
for (const s of scoredRows) {
  for (const k of ['overall_score', 'skills_score', 'experience_score', 'career_trajectory_score', 'education_score']) {
    const v = s[k];
    if (!Number.isInteger(v) || v < 0 || v > 100) {
      throw new Error(`applicant_scores: ${k}=${v} out of [0,100] for applicant ${s.applicant_id}/job ${s.job_id}`);
    }
  }
}

export const applicantScores = scoredRows.map((s) => ({
  applicant_id: s.applicant_id,
  job_id: s.job_id,
  overall_score: s.overall_score,
  skills_score: s.skills_score,
  experience_score: s.experience_score,
  career_trajectory_score: s.career_trajectory_score,
  education_score: s.education_score,
  matched_skills: s.matched_skills,
  missing_skills: s.missing_skills,
  custom_criteria_results: s.custom_criteria_results,
  rubric_snapshot: s.rubric_snapshot,
  role_profile: s.role_profile,
  summary: s.summary,
}));

export const candidateScreenings = scoredRows.map((s) => {
  const decided = PRE_DECIDED[s.candidate_id];
  return {
    candidate_id: s.candidate_id,
    job_id: s.job_id,
    company_id: s.company_id,
    decision: decided?.decision ?? null,
    decision_reason: decided?.decision_reason ?? null,
    decided_at: decided ? '2026-05-10 03:00:00' : null,
    decided_by: decided?.decided_by ?? null,
  };
});

export default { applicantScores, candidateScreenings };

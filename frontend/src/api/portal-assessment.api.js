import portalApi from './portal-axios';

// Public — fetch invitation summary (no PII).
export const getPortalSession = (hash) =>
  portalApi.get(`/portal-assessment/${hash}`);

// Public — body: { email }. On success returns { portal_token, session: {...} }.
export const verifyPortalEmail = (hash, email) =>
  portalApi.post(`/portal-assessment/${hash}/verify-email`, { email });

// JWT-protected — needs portal_token in localStorage.
export const getPortalForm = (hash) =>
  portalApi.get(`/portal-assessment/${hash}/form`);

// JWT-protected — body: { name, position, department, education, date_birth }.
// Updates the participant bound to this invitation. Email is NOT updatable (verified gate key).
export const updatePortalParticipant = (hash, fields) =>
  portalApi.put(`/portal-assessment/${hash}/participant`, fields);

// JWT-protected — creates (or returns the existing) result row before any
// subtest is answered, so assessment_answer/assessment_score saves have a real
// result_id to point at from the first question. Call once, right after the
// candidate confirms their profile and before the first subtest begins.
export const startPortalAssessment = (hash) =>
  portalApi.post(`/portal-assessment/${hash}/start`);

// JWT-protected — body: { results, summary }. Updates the draft row from
// startAttempt() if one exists (the normal path), otherwise creates one.
// Marks the session 'completed'.
export const submitPortalAssessment = (hash, { results, summary }) =>
  portalApi.post(`/portal-assessment/${hash}/submit`, { results, summary });

// JWT-protected — question bank for this candidate's battery, grouped by
// subtest_key: { questions: { GI: {subtest, items}, KA: {...}, ... } }.
// The staff-facing /api/question routes are unreachable here (different JWT
// scope entirely), so this is the portal-authenticated equivalent.
export const getPortalQuestions = (hash) =>
  portalApi.get(`/portal-assessment/${hash}/questions`);

// JWT-protected — previously saved answers/scores for the current attempt, keyed
// by question_id/subtest_id respectively. Lets a Test component rehydrate its
// in-progress state on mount (resume after a refresh) instead of starting over.
// Returns { result_id, answers: [...], scores: [...] } — empty arrays if no
// attempt has been started yet.
export const getPortalProgress = (hash) =>
  portalApi.get(`/portal-assessment/${hash}/progress`);

// JWT-protected — upsert one answer for the current attempt.
export const savePortalAnswer = (hash, { result_id, question_id, answer, is_correct, score_earned }) =>
  portalApi.post(`/portal-assessment/${hash}/answer`, { result_id, question_id, answer, is_correct, score_earned });

// JWT-protected — upsert one subtest's score for the current attempt.
export const savePortalSubtestScore = (hash, { result_id, subtest_id, score }) =>
  portalApi.post(`/portal-assessment/${hash}/score`, { result_id, subtest_id, score });

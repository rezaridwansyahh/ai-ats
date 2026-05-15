import api from './axios.js';

export const searchScreening = (params = {}) => {
  const query = { ...params };
  if (Array.isArray(query.skills)) {
    query.skills = query.skills.join(',');
  }
  Object.keys(query).forEach((k) => {
    if (query[k] === null || query[k] === undefined || query[k] === '') {
      delete query[k];
    }
  });
  return api.get('/screening/search', { params: query });
};

export const getScreeningResult = (applicant_id, job_id) =>
  api.get('/screening/result', { params: { applicant_id, job_id } });

export const scoreCandidate = (applicant_id, job_id) =>
  api.post('/screening/score', { applicant_id, job_id });

export const scoreBulkForJob = (job_id) =>
  api.post(`/screening/score-bulk/${job_id}`);

export const extractFacetsFromFile = (applicant_id, file) => {
  const form = new FormData();
  form.append('cv', file);
  return api.post(`/screening/extract-facets/${applicant_id}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const extractFacetsFromText = (applicant_id, cv_text) =>
  api.post(`/screening/extract-facets/${applicant_id}`, { cv_text });

// AI Matching (rubric flow)
export const getRubric = (job_id) =>
  api.get(`/screening/rubric/${job_id}`);

export const saveRubric = (job_id, rubric) =>
  api.put(`/screening/rubric/${job_id}`, { rubric });

export const runMatching = (job_id, { rubric, role_profile } = {}) =>
  api.post(`/screening/match/${job_id}`, { rubric, role_profile });

export const getMatchingResults = (job_id) =>
  api.get(`/screening/match/${job_id}/results`);

// L1 Workboard + bulk lane actions (Phase 2)
export const getWorkboard = () =>
  api.get('/screening/workboard');

export const getLaneCandidates = (job_id, engine) =>
  api.get(`/screening/job/${job_id}/lane`, { params: engine ? { engine } : {} });

export const parseBulk = (applicant_ids) =>
  api.post('/screening/parse-bulk', { applicant_ids });

export const matchBulk = (job_id, applicant_ids, { force } = {}) =>
  api.post(`/screening/job/${job_id}/match-bulk`, { applicant_ids, force: !!force });

// L3 Candidate detail (Phase 3)
export const getScreening = (screening_id) =>
  api.get(`/screening/screening/${screening_id}`);

export const getScreeningByCandidate = (candidate_id) =>
  api.get(`/screening/by-candidate/${candidate_id}`);

export const setScreeningDecision = (screening_id, { decision, decision_reason }) =>
  api.patch(`/screening/screening/${screening_id}/decision`, { decision, decision_reason });

// L4 Calibration (Phase 4)
export const getCalibration = (job_id) =>
  api.get(`/screening/job/${job_id}/calibration`);

export const advanceBulk = (job_id, screening_ids, { decision_reason } = {}) =>
  api.post(`/screening/job/${job_id}/advance-bulk`, { screening_ids, decision_reason });

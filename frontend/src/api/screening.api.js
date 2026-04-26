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

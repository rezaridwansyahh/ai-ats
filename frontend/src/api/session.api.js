import api from './axios';

export const generateSessionFromCandidate = ({ candidate_id, job_id, battery }) =>
  api.post('/session/from-candidate', { candidate_id, job_id, battery });

export const getSessionsFromCandidate = ({ candidate_id, job_id }) =>
  api.get('/session/from-candidate', { params: { candidate_id, job_id } });

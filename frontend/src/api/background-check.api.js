import api from './axios.js';

export const getWorkboard = () => api.get('/background-check/workboard');

export const getBgChecksByJob = (job_id) => api.get(`/background-check/job/${job_id}`);

export const getBgCheck = (bg_id) => api.get(`/background-check/${bg_id}`);

export const getBgCheckByCandidate = (candidate_id) => api.get(`/background-check/by-candidate/${candidate_id}`);

export const updateBgStatus = (bg_id, status) => api.patch(`/background-check/${bg_id}/status`, { status });

export const saveVerdict = (bg_id, { verdict, verdict_note }) => api.post(`/background-check/${bg_id}/verdict`, { verdict, verdict_note });

export const archiveBgCheck = (bg_id, archived_reason) => api.patch(`/background-check/${bg_id}/archive`, { archived_reason });
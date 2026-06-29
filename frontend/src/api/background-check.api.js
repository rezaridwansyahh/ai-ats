import api from './axios.js';

export const getWorkboard = () => api.get('/background-check/workboard');

export const getBgChecksByJob = (job_id) => api.get(`/background-check/job/${job_id}`);

export const getBgCheck = (bg_id) => api.get(`/background-check/${bg_id}`);

export const getBgCheckByCandidate = (candidate_id) => api.get(`/background-check/by-candidate/${candidate_id}`);

export const updateBgStatus = (bg_id, status) => api.patch(`/background-check/${bg_id}/status`, { status });

export const saveVerdict = (bg_id, { verdict, verdict_note }) => api.post(`/background-check/${bg_id}/verdict`, { verdict, verdict_note });

export const archiveBgCheck = (bg_id, archived_reason) => api.patch(`/background-check/${bg_id}/archive`, { archived_reason });

export const getClaims = (bg_id) => api.get(`/background-check/${bg_id}/claims`);

export const extractClaims = (bg_id) => api.post(`/background-check/${bg_id}/claims/extract`);

export const confirmClaims = (bg_id) => api.post(`/background-check/${bg_id}/claims/confirm`);

export const addClaim = (bg_id, { claim_text, claim_detail, lane_type }) => api.post(`/background-check/${bg_id}/claims`, { claim_text, claim_detail, lane_type });

export const updateClaim = (claim_id, { claim_text, claim_detail, lane_type }) => api.put(`/background-check/claims/${claim_id}`, { claim_text, claim_detail, lane_type });

export const toggleClaim = (claim_id, selected) => api.patch(`/background-check/claims/${claim_id}/selected`, { selected });

export const deleteClaim = (claim_id) => api.delete(`/background-check/claims/${claim_id}`);

export const getConsent = (bg_id) => api.get(`/background-check/${bg_id}/consent`);

export const generateConsentLink = (bg_id) => api.post(`/background-check/${bg_id}/consent/generate-link`);

export const revokeConsent = (bg_id, revocation_reason) => api.post(`/background-check/${bg_id}/consent/revoke`, { revocation_reason });
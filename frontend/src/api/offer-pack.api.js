import api from './axios';

export const getApprovalStatus   = (offerId) => api.get(`/offer-pack/${offerId}`);
export const decideApproval      = (offerId, decision, note) => api.post(`/offer-pack/${offerId}/decide`, { decision, note });
export const generateApprovalViewLink = (offerId, expiryDays) => api.post(`/offer-pack/${offerId}/view-link`, { expiry_days: expiryDays });
export const getApprovalStatusesByJob = (jobId) => api.get(`/offer-pack/job/${jobId}`);

export const getApprovalViewLinkBasic = (token) => api.get(`/offer-pack/portal/${token}`);
export const verifyApprovalViewEmail  = (token, email) => api.post(`/offer-pack/portal/${token}/verify-email`, { email });
export const getApprovalViewSummary   = (token, approvalViewToken) => api.get(`/offer-pack/portal/${token}/summary`, {  headers: { Authorization: `Bearer ${approvalViewToken}` }, });
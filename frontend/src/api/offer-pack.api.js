import api from './axios';

export const createOfferApproval = (offerId, approverName) => api.post(`/offer-pack/${offerId}`, { approver_name: approverName });
export const getOfferApproval = (offerId) => api.get(`/offer-pack/${offerId}`);
export const decideOfferApproval = (offerId, decision, note) => api.put(`/offer-pack/${offerId}/decide`, { decision, note });
export const revokeOfferApproval = (offerId, reason) => api.post(`/offer-pack/${offerId}/revoke`, { reason });
export const resendOfferApproval = (offerId, approverName) => api.post(`/offer-pack/${offerId}/resend`, { approver_name: approverName });
export const getOfferApprovalsByJob = (jobId) => api.get(`/offer-pack/job/${jobId}`);

export const getOfferApprovalByToken    = (token) => api.get(`/offer-pack/portal/${token}`);
export const decideOfferApprovalByToken = (token, decision, note) => api.put(`/offer-pack/portal/${token}/decide`, { decision, note });
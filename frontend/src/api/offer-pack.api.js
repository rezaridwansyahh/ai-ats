import api from './axios';

export const startApprovalChain    = (offerId, steps) => api.post(`/offer-pack/${offerId}/setup`, { steps });
export const reviseApprovalChain   = (offerId, steps) => api.put(`/offer-pack/${offerId}/revise`, { steps });
export const getApprovalChain      = (offerId) => api.get(`/offer-pack/${offerId}`);
export const finalizeApprovalChain = (offerId) => api.post(`/offer-pack/${offerId}/finalize`);
export const decideApprovalStep    = (offerId, stepId, decision, note) => api.put(`/offer-pack/${offerId}/step/${stepId}/decide`, { decision, note });
export const getApprovalChainsByJob = (jobId) => api.get(`/offer-pack/job/${jobId}`);

export const getApprovalChainByToken    = (token) => api.get(`/offer-pack/portal/${token}`);
export const decideApprovalStepByToken  = (token, stepId, decision, note) =>api.put(`/offer-pack/portal/${token}/step/${stepId}/decide`, { decision, note });
export const downloadApprovalLetterDocx = (token) => api.get(`/offer-pack/portal/${token}/letter/docx`, { responseType: 'blob' });
export const downloadApprovalLetterPdf  = (token) => api.get(`/offer-pack/portal/${token}/letter/pdf`, { responseType: 'blob' });
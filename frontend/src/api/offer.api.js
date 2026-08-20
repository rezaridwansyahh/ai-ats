import api from './axios';

// L1 Workboard - get all offers
export const getWorkboard = () => api.get('/offer/workboard');

// L2 Position - get offers by job
export const getOffersByJob = (jobId) => api.get(`/offer/job/${jobId}`);

// L3 Candidate - get single offer
export const getOfferById = (offerId) => api.get(`/offer/${offerId}`);

// Create new offer
export const createOffer = (data) => api.post('/offer/create', data);

// Update compensation
export const updateCompensation = (offerId, data) => api.put(`/offer/${offerId}/compensation`, data);

export const sendOffer = (offerId) => api.post(`/offer/${offerId}/send`);

// Revoke — revokes the active send without issuing a new one
export const revokeOffer = (offerId, reason) => api.post(`/offer/${offerId}/revoke`, { reason });

export const getSendHistory = (offerId) => api.get(`/offer/${offerId}/send-history`);

// Recruiter responds to negotiation
export const respondToNegotiation = (offerId, responseType, message, revisedCompensation = null) =>
  api.post(`/offer/${offerId}/negotiate/respond`, {
    response_type: responseType,
    response_message: message,
    revised_compensation: revisedCompensation
  });

// Approval chain
export const getApproval = (offerId) => api.get(`/offer/${offerId}/approval`);

export const submitApproval = (offerId, decision, note) => api.post(`/offer/${offerId}/approval/decide`, { decision, note });

export const setupApprovalChain = (offerId, steps) => api.post(`/offer/${offerId}/approval/chain`, { steps });

export const decideApprovalStep = (offerId, stepIndex, decision, note) => api.post(`/offer/${offerId}/approval/chain/${stepIndex}/decide`, { decision, note });

// L4 Calibration - bulk advance
export const bulkAdvanceToOnboarding = (jobId, candidateIds) =>
  api.post(`/offer/calibrate/${jobId}/advance`, { candidate_ids: candidateIds });

// Statistics
export const getOfferStats = (jobId) => api.get(`/offer/stats/${jobId}`);

export const getSlipGaji = (offerId) => api.get(`/offer/${offerId}/slip-gaji`);

export const recordSlipGaji = (offerId, lineItems, expectedSalary = null) =>
  api.post(`/offer/${offerId}/slip-gaji/record`, { line_items: lineItems, expected_salary: expectedSalary });

export const skipSlipGaji = (offerId, reason) => api.post(`/offer/${offerId}/slip-gaji/skip`, { reason });

export const reviewSlipGaji = (offerId, note) => api.post(`/offer/${offerId}/slip-gaji/review`, { note });

export const getOfferLetterFields = (offerId) => api.get(`/offer/${offerId}/offer-letter/fields`);

export const saveOfferLetterData = (offerId, data) => api.put(`/offer/${offerId}/offer-letter/data`, data);

export const generateOfferLetterPreview = (offerId) => api.post(`/offer/${offerId}/offer-letter/preview`);

export const getOfferLetterFinal = (offerId) => api.get(`/offer/${offerId}/offer-letter/final`);

export const downloadOfferLetterDocx = (offerId) => api.get(`/offer/${offerId}/offer-letter/download/docx`, { responseType: 'blob' });

export const saveOfferLetterFinal = (offerId, html) => api.put(`/offer/${offerId}/offer-letter/final`, { html });

export const downloadOfferLetterPdf = (offerId) => api.get(`/offer/${offerId}/offer-letter/download/pdf`, { responseType: 'blob' });

export const getOfferDocument = (offerId) => api.get(`/offer/${offerId}/document`);

export const uploadOfferDocument = (offerId, formData) => api.post(`/offer/${offerId}/document/upload`, formData, {  headers: { 'Content-Type': 'multipart/form-data' }, });

export const downloadCandidateFile = (offerId) => api.get(`/offer/${offerId}/candidate-file/download`, { responseType: 'blob' });

export const getContractDocument = (offerId) => api.get(`/offer/${offerId}/contract/document`);

export const uploadContractDocument = (offerId, formData) => api.post(`/offer/${offerId}/contract/document/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, });

export const sendContractDocument = (offerId) => api.post(`/offer/${offerId}/contract/document/send`);

export const revokeContractDocument = (offerId, reason) => api.post(`/offer/${offerId}/contract/document/revoke`, { reason });

export const getContractSendHistory = (offerId) => api.get(`/offer/${offerId}/contract/send-history`);

export const downloadContractCandidateFile = (offerId) => api.get(`/offer/${offerId}/contract/candidate-file/download`, { responseType: 'blob' });

export const uploadContractExecutedDocument = (offerId, formData) => api.post(`/offer/${offerId}/contract/executed/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, });

export const getContractExecutedDocument = (offerId) => api.get(`/offer/${offerId}/contract/executed`);

export const downloadContractExecutedDocument = (offerId) => api.get(`/offer/${offerId}/contract/executed/download`, { responseType: 'blob' });
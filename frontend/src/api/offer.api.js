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

// Send offer letter (first send — creates the offer_send token)
export const sendOfferLetter = (offerId) => api.post(`/offer/${offerId}/send`);

// Resend — revokes the active send and issues a fresh token
export const resendOffer = (offerId) => api.post(`/offer/${offerId}/resend`);

// Send history — every offer_send row for this offer (sent/resent/revoked/signed)
export const getSendHistory = (offerId) => api.get(`/offer/${offerId}/send-history`);

// Send options — reply-to, portal expiry, auto-reminder policy
export const getDispatchSettings = (offerId) => api.get(`/offer/${offerId}/dispatch-settings`);

// settings: { reply_to, portal_expiry_days, reminder_policy }
export const saveDispatchSettings = (offerId, settings) => api.put(`/offer/${offerId}/dispatch-settings`, settings);

// Track sub-stage — combined sends + negotiations + approval timeline
export const getTrackTimeline = (offerId) => api.get(`/offer/${offerId}/track`);

// Candidate actions (portal - public endpoints)
export const acceptOffer = (offerId, acceptanceNote) => api.post(`/offer/${offerId}/accept`, { acceptance_note: acceptanceNote });

export const rejectOffer = (offerId, rejectionReason) => api.post(`/offer/${offerId}/reject`, { rejection_reason: rejectionReason });

export const negotiateOffer = (offerId, message, requestedSalary) => api.post(`/offer/${offerId}/negotiate`, {  negotiation_message: message,  requested_salary: requestedSalary });

// Recruiter responds to negotiation
export const respondToNegotiation = (offerId, responseType, message, revisedCompensation = null) =>
 api.post(`/offer/${offerId}/negotiate/respond`, {
    response_type: responseType,
    response_message: message,
    revised_compensation: revisedCompensation
  });

// Contract management
export const generateContract = (offerId, contractType, startDate, endDate = null) =>
  api.post(`/offer/${offerId}/contract/generate`, {
    contract_type: contractType,
    start_date: startDate,
    end_date: endDate
  });

export const sendContract = (offerId) => api.post(`/offer/${offerId}/contract/send`);

export const signContract = (offerId, signatureData) =>
  api.post(`/offer/${offerId}/contract/sign`, { signature_data: signatureData });

// L4 Calibration - bulk advance
export const bulkAdvanceToOnboarding = (jobId, candidateIds) =>
  api.post(`/offer/calibrate/${jobId}/advance`, { candidate_ids: candidateIds });

// Statistics
export const getOfferStats = (jobId) => api.get(`/offer/stats/${jobId}`);

export const getSlipGaji = (offerId) => api.get(`/offer/${offerId}/slip-gaji`);

export const recordSlipGaji = (offerId, lineItems) => api.post(`/offer/${offerId}/slip-gaji/record`, { line_items: lineItems });

export const skipSlipGaji = (offerId, reason) => api.post(`/offer/${offerId}/slip-gaji/skip`, { reason });

export const reviewSlipGaji = (offerId, note) => api.post(`/offer/${offerId}/slip-gaji/review`, { note });

export const getApproval = (offerId) => api.get(`/offer/${offerId}/approval`);

export const submitApproval = (offerId, decision, note) => api.post(`/offer/${offerId}/approval`, { decision, note });

export const setupApprovalChain = (offerId, steps) => api.post(`/offer/${offerId}/approval/setup`, { steps });

export const decideApprovalStep = (offerId, stepIndex, decision, note) => api.post(`/offer/${offerId}/approval/${stepIndex}/decide`, { decision, note });

export const revokeOffer = (offerId, reason) => api.post(`/offer/${offerId}/revoke`, { reason });
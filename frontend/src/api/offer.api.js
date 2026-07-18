import api from './axios';

const offerAPI = {
  // L1 Workboard - get all offers
  getWorkboard: () => api.get('/offer/workboard'),

  // L2 Position - get offers by job
  getOffersByJob: (jobId) => api.get(`/offer/job/${jobId}`),

  // L3 Candidate - get single offer
  getOfferById: (offerId) => api.get(`/offer/${offerId}`),

  // Create new offer
  createOffer: (data) => api.post('/offer/create', data),

  // Update compensation
  updateCompensation: (offerId, data) => api.put(`/offer/${offerId}/compensation`, data),

  // Send offer letter
  sendOfferLetter: (offerId) => api.post(`/offer/${offerId}/send`),

  // Candidate actions (portal - public endpoints)
  acceptOffer: (offerId, acceptanceNote) =>
    api.post(`/offer/${offerId}/accept`, { acceptance_note: acceptanceNote }),

  rejectOffer: (offerId, rejectionReason) =>
    api.post(`/offer/${offerId}/reject`, { rejection_reason: rejectionReason }),

  negotiateOffer: (offerId, message, requestedSalary) =>
    api.post(`/offer/${offerId}/negotiate`, {
      negotiation_message: message,
      requested_salary: requestedSalary
    }),

  // Recruiter responds to negotiation
  respondToNegotiation: (offerId, responseType, message, revisedCompensation = null) =>
    api.post(`/offer/${offerId}/negotiate/respond`, {
      response_type: responseType,
      response_message: message,
      revised_compensation: revisedCompensation
    }),

  // Contract management
  generateContract: (offerId, contractType, startDate, endDate = null) =>
    api.post(`/offer/${offerId}/contract/generate`, {
      contract_type: contractType,
      start_date: startDate,
      end_date: endDate
    }),

  sendContract: (offerId) => api.post(`/offer/${offerId}/contract/send`),

  signContract: (offerId, signatureData) =>
    api.post(`/offer/${offerId}/contract/sign`, { signature_data: signatureData }),

  // L4 Calibration - bulk advance
  bulkAdvanceToOnboarding: (jobId, candidateIds) =>
    api.post(`/offer/calibrate/${jobId}/advance`, { candidate_ids: candidateIds }),

  // Statistics
  getOfferStats: (jobId) => api.get(`/offer/stats/${jobId}`),

  getSlipGaji: (offerId) => api.get(`/offer/${offerId}/slip-gaji`),
 
  recordSlipGaji: (offerId, lineItems) => api.post(`/offer/${offerId}/slip-gaji/record`, { line_items: lineItems }),

  skipSlipGaji: (offerId, reason) => api.post(`/offer/${offerId}/slip-gaji/skip`, { reason }),

  reviewSlipGaji: (offerId, note) => api.post(`/offer/${offerId}/slip-gaji/review`, { note }),

  getApproval: (offerId) => api.get(`/offer/${offerId}/approval`),
  
  submitApproval: (offerId, decision, note) => api.post(`/offer/${offerId}/approval`, { decision, note }),  

  setupApprovalChain: (offerId, steps) => api.post(`/offer/${offerId}/approval/setup`, { steps }),
  
  decideApprovalStep: (offerId, stepIndex, decision, note) => api.post(`/offer/${offerId}/approval/${stepIndex}/decide`, { decision, note }),

};

export default offerAPI;

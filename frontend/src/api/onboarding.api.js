import api from './axios';

// Get onboarding detail by ID
export const getOnboarding = (onboarding_id) => {
  return api.get(`/onboarding/${onboarding_id}`);
};

// Get all onboarding records (workboard)
export const getOnboardingWorkboard = () => {
  return api.get('/onboarding/workboard');
};

// Get onboarding by job
export const getOnboardingByJob = (job_id) => {
  return api.get(`/onboarding/job/${job_id}`);
};

// Create new onboarding
export const createOnboarding = (data) => {
  return api.post('/onboarding/create', data);
};

// Update checklist item
export const updateChecklistItem = (onboarding_id, item_id, data) => {
  return api.put(`/onboarding/${onboarding_id}/checklist/${item_id}`, data);
};

// Update milestone
export const updateMilestone = (onboarding_id, milestone_id, data) => {
  return api.put(`/onboarding/${onboarding_id}/milestone/${milestone_id}`, data);
};

// Update probation check-in
export const updateProbationCheckin = (onboarding_id, checkin_id, data) => {
  return api.put(`/onboarding/${onboarding_id}/probation/${checkin_id}`, data);
};

// Set welcome message
export const setWelcomeMessage = (onboarding_id, data) => {
  return api.post(`/onboarding/${onboarding_id}/welcome`, data);
};

// Advance to next stage
export const advanceStage = (onboarding_id, new_stage) => {
  return api.put(`/onboarding/${onboarding_id}/advance`, { new_stage });
};

// Confirm employee (complete probation)
export const confirmEmployee = (onboarding_id) => {
  return api.post(`/onboarding/${onboarding_id}/confirm`);
};

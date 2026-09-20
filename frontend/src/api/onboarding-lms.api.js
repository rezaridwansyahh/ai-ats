import api from './axios';

export const getPhases = () => { return api.get('/onboarding-lms/phases'); };

export const createPhase = (data) => { return api.post('/onboarding-lms/phases', data); };

export const updatePhase = (phase_id, data) => { return api.put(`/onboarding-lms/phases/${phase_id}`, data); };

export const getModulesByPhase = (phase_id) => { return api.get(`/onboarding-lms/phases/${phase_id}/modules`); };

export const createModule = (phase_id, data) => { return api.post(`/onboarding-lms/phases/${phase_id}/modules`, data); };

export const getModuleById = (module_id) => { return api.get(`/onboarding-lms/modules/${module_id}`); };

export const updateModule = (module_id, data) => { return api.put(`/onboarding-lms/modules/${module_id}`, data); };

export const getContent = (module_id) => { return api.get(`/onboarding-lms/modules/${module_id}/content`); };

export const createContent = (module_id, data) => { return api.post(`/onboarding-lms/modules/${module_id}/content`, data); };

export const uploadContent = (module_id, file, data = {}) => {
  const form = new FormData();
  form.append('file', file);
  if (data.title) form.append('title', data.title);
  if (data.seq !== undefined) form.append('seq', data.seq);
  return api.post(`/onboarding-lms/modules/${module_id}/content/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateContent = (content_id, data) => { return api.put(`/onboarding-lms/content/${content_id}`, data); };

export const downloadContentFile = (content_id) => { return api.get(`/onboarding-lms/content/${content_id}/file`, { responseType: 'blob' });};

export const getHireCurriculum = (candidate_onboarding_id) => { return api.get(`/onboarding-lms/hire/${candidate_onboarding_id}/curriculum`); };

export const updateHireProgress = (candidate_onboarding_id, module_id, data) => { return api.patch(`/onboarding-lms/hire/${candidate_onboarding_id}/module/${module_id}/progress`, data); };

export const reorderPhases = (orderedPhaseIds) => { return api.put('/onboarding-lms/phases/reorder', { orderedPhaseIds });};
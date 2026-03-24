import api from './axios';

export const getRecruiters    = ()         => api.get('/recruiter');
export const getRecruiterById = (id)       => api.get(`/recruiter/${id}`);
export const createRecruiter  = (data)     => api.post('/recruiter', data);
export const updateRecruiter  = (id, data) => api.put(`/recruiter/${id}`, data);
export const deleteRecruiter  = (id)       => api.delete(`/recruiter/${id}`);

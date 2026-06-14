import api from './axios.js';

export const getWorkboard = () => api.get('/interview/workboard');
export const getInterviewsByJob = (job_id) => api.get(`/interview/job/${job_id}`);

export const getInterview = (interview_id) => api.get(`/interview/${interview_id}`);

export const getInterviewByCandidate = (candidate_id, round = 1) => api.get(`/interview/by-candidate/${candidate_id}`, { params: { round } });

export const updateInterviewStatus = (interview_id, status) => api.patch(`/interview/${interview_id}/status`, { status });

export const scheduleInterview = (interview_id, scheduled_at) => api.patch(`/interview/${interview_id}/schedule`, { scheduled_at });

export const getPrepsByJob = (job_id) => api.get(`/interview/job/${job_id}/prep`);

export const getPrep = (job_id) => api.get(`/interview/job/${job_id}/prep`);
 
export const generateQuestions = (job_id, { num_questions, language } = {}) => api.post(`/interview/job/${job_id}/prep/questions/generate`, { num_questions, language });
 
export const updateQuestions = (job_id, questions) =>  api.put(`/interview/job/${job_id}/prep/questions`, { questions });
 
export const updateRubric = (job_id, rubric_items) => api.put(`/interview/job/${job_id}/prep/rubric`, { rubric_items });
 
export const lockRubric = (job_id) => api.post(`/interview/job/${job_id}/prep/rubric/lock`);
 
export const unlockRubric = (job_id) => api.post(`/interview/job/${job_id}/prep/rubric/unlock`);
 
export const getSchedules = (interview_id) => api.get(`/interview/${interview_id}/schedules`);
 
export const createSchedule = (interview_id, { title, description, scheduled_at }) => api.post(`/interview/${interview_id}/schedules`, { title, description, scheduled_at });
 
export const updateSchedule = (schedule_id, fields) => api.put(`/interview/schedules/${schedule_id}`, fields);
 
export const confirmSchedule = (schedule_id, { confirmation_note } = {}) => api.post(`/interview/schedules/${schedule_id}/confirm`, { confirmation_note });
 
export const unconfirmSchedule = (schedule_id) => api.post(`/interview/schedules/${schedule_id}/unconfirm`);
 
export const deleteSchedule = (schedule_id) => api.delete(`/interview/schedules/${schedule_id}`);

export const recordOutcome = (schedule_id, { status, outcome_note } = {}) => api.post(`/interview/schedules/${schedule_id}/outcome`, { status, outcome_note });

export const clearOutcome = (schedule_id) => api.delete(`/interview/schedules/${schedule_id}/outcome`);
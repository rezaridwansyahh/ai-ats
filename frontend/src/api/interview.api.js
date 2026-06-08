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
 
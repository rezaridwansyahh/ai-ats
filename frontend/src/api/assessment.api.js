import api from './axios.js';

// L1 Workboard — position list + setup/take/decide counts for the
// Assessment stage. Same response shape as screening/interview/background-check:
// { message, counts: { setup, take, decide }, positions: [...] }
export const getWorkboard = () => api.get('/assessment/workboard');

// L2 Position — candidates currently in Assessment for one job.
export const getByJobId = (job_id) => api.get(`/assessment/job/${job_id}`);
import api from '@/api/axios'

export const getCompanyForm = () => api.get('/form/company').then(res => res.data);
export const updateCompanyForm = (schema) => api.put('/form/company', { schema }).then(res => res.data);
export const getJobForm = (jobId) => api.get(`/form/job/${jobId}`).then(res => res.data);
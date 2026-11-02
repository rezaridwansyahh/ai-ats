import api from '@/api/axios'

export const getCompanyForm = () => api.get('/form/company').then(res => res.data);
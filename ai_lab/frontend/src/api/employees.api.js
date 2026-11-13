import api from './axios';

export const getEmployees = () => api.get('/employee');
export const getEmployeeById = (id) => api.get(`/employee/${id}`);
export const createEmployee = (data) => api.post('/employee', data);
export const updateEmployee = (id, data) => api.put(`/employee/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/employee/${id}`);
export const getEmployeeSummary = (id) => api.get(`/employee/${id}/summary`);
export const generateEmployeeSummary = (id) => api.post(`/employee/${id}/summary`);
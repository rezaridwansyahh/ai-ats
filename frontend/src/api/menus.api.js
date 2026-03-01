import api from './axios'; 

export const getMenus = () => api.get('/menu');
export const getMenuById = (id) => api.get(`/menu/${id}`);
export const getMenusByModule = (module_id) => api.get(`/menu/module/${module_id}`);
export const createMenu = (data) => api.post('/menu', data);
export const updateMenu = (id, data) => api.put(`/menu/${id}`, data);
export const deleteMenu = (id) => api.delete(`/menu/${id}`);

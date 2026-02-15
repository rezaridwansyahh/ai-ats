import api from './axios'; 

export const getMenus = () => api.get('/menus');
export const getMenuById = (id) => api.get(`/menus/${id}`);
export const getMenusByModule = (module_id) => api.get(`/menus/module/${module_id}`);
export const createMenu = (data) => api.post('/menus', data);
export const updateMenu = (id, data) => api.put(`/menus/${id}`, data);
export const deleteMenu = (id) => api.delete(`/menus/${id}`);

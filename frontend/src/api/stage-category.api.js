import api from './axios';

export const getStageCategories = () => api.get('/stage-category');

import api from './axios';

export const getOfferTemplate = () => api.get('/offer-template');

export const uploadOfferTemplate = (file) => { const formData = new FormData(); formData.append('file', file);
 return api.post('/offer-template/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
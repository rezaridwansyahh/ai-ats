import api from './axios';

export const getEmailTemplates = () => api.get('/email-template');

export const saveEmailTemplate = (stage_type_id, template_key, payload) => api.put(`/email-template/${stage_type_id}/${template_key}`, payload);
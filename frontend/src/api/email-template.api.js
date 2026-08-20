import api from './axios';

export const getEmailTemplates = () => api.get('/email-template');

export const saveEmailTemplate = (moduleKey, templateKey, { subject, body }) => api.put(`/email-template/${moduleKey}/${templateKey}`, { subject, body });
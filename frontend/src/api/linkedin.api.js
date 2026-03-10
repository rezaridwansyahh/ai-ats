import api from './axios';

export const recruiteSearch = (data) =>
  api.post('/linkedin/recruite-search/rpa/create', data);

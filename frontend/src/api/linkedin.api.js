import api from './axios';

export const recruiteSearch = (data) =>
  api.post('/linkedin/recruite-search/rpa/create', data);

export const extractLinkedinApplicants = (data) =>
  api.post('/linkedin/extract-applicant/rpa', data);

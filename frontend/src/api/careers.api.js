import portalApi from './portal-axios';

// Fully public career page — no auth token ever needed, just reuses the
// no-redirect portal axios instance so a stale admin session elsewhere in
// the browser can't interfere with a visiting candidate.
export const getCompanyCareers = (slug) =>
  portalApi.get(`/portal-careers/${slug}`);

export const getJobDetail = (slug, jobId) =>
  portalApi.get(`/portal-careers/${slug}/jobs/${jobId}`);

export const submitApplication = (slug, jobId, formData) =>
  portalApi.post(`/portal-careers/${slug}/jobs/${jobId}/apply`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// { enabled, siteKey } — enabled is false (siteKey null) on any deployment
// that hasn't set up RECAPTCHA_SITE_KEY/RECAPTCHA_SECRET_KEY yet.
export const getRecaptchaConfig = () =>
  portalApi.get('/portal-careers/recaptcha-config');

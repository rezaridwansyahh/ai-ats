import portalApi from './portal-axios';

// Public — fetch invitation summary (no PII).
export const getPortalSession = (hash) =>
  portalApi.get(`/portal-assessment/${hash}`);

// Public — body: { email }. On success returns { portal_token, session: {...} }.
export const verifyPortalEmail = (hash, email) =>
  portalApi.post(`/portal-assessment/${hash}/verify-email`, { email });

// JWT-protected — needs portal_token in localStorage.
export const getPortalForm = (hash) =>
  portalApi.get(`/portal-assessment/${hash}/form`);

// JWT-protected — body: { results, summary }. Inserts a new result row each call,
// marks the session 'completed'. Always allows re-take.
export const submitPortalAssessment = (hash, { results, summary }) =>
  portalApi.post(`/portal-assessment/${hash}/submit`, { results, summary });

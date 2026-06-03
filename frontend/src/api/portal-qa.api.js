import portalApi, { PORTAL_TOKEN_KEY } from './portal-axios';

// Public — landing summary (job_title, status, expired_at, num_questions). No PII.
export const getQaSummary = (token) =>
  portalApi.get(`/portal-qa/${token}`);

// Public — body: { email }. On success the backend returns
// { qa_token: JWT(48h, scope='qa'), qa: { job_title, status, questions, answers, expired_at } }.
// We persist the JWT to the same localStorage key the assessment portal uses, so portalApi
// auto-attaches it on the JWT-protected calls below.
export const verifyQaEmail = async (token, email) => {
  const res = await portalApi.post(`/portal-qa/${token}/verify-email`, { email });
  const qaToken = res.data?.qa_token;
  if (qaToken) localStorage.setItem(PORTAL_TOKEN_KEY, qaToken);
  return res;
};

// JWT-protected (scope='qa') — full qa with questions.
export const getQaFull = (token) =>
  portalApi.get(`/portal-qa/${token}/questions`);

// JWT-protected (scope='qa') — body: { answers: string[], application_form: object }.
// Marks status 'responded'. application_form is the candidate's filled standard form.
export const submitQa = (token, answers, application_form = null) =>
  portalApi.post(`/portal-qa/${token}/submit`, { answers, application_form });

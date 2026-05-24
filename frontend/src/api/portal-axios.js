// Separate axios instance for the public assessment portal.
// - Same baseURL as the recruiter app, different token storage key (portal_token).
// - 401 does NOT redirect to /portal/login (that's the recruiter page).
//   Instead the page state machine drops the portal_token and re-opens the email gate.
import axios from 'axios';

const portalApi = axios.create({
  baseURL: 'http://localhost:3000/portal/api',
});

export const PORTAL_TOKEN_KEY = 'portal_token';

portalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(PORTAL_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

portalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem(PORTAL_TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export default portalApi;

import axios from 'axios';

const portalApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/portal/api`,
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
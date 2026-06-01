// src/api/axios.js
import axios from "axios"

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/portal/api`,
})

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function handleExpired() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/portal/login';
}

// Request interceptor — check token before every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      if (isTokenExpired(token)) {
        handleExpired();
        return Promise.reject(new Error('Token expired'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
)

// Response interceptor — catch 401 from backend (token invalid/expired)
// Task 6.12: Handle 402 budget exceeded
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handleExpired();
    }

    // Task 6.12: Budget exceeded error (Payment Required)
    if (error.response?.status === 402) {
      const { budget, spent } = error.response.data;
      const budgetStr = budget?.toFixed?.(2) || '?';
      const spentStr = spent?.toFixed?.(2) || '?';

      // Show toast notification (if toast library is available)
      // Otherwise, the error will be caught by individual components
      if (typeof window !== 'undefined' && window.alert) {
        alert(
          `AI budget exceeded: $${spentStr} / $${budgetStr} used this month.\n\n` +
          `Contact your administrator to increase the budget limit.`
        );
      }
    }

    return Promise.reject(error);
  }
)

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export default api
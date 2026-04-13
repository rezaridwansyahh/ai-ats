// src/api/axios.js
import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:3000/portal/api",
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handleExpired();
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
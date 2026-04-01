// client/src/lib/api.js
import axios from 'axios';

// baseURL = "" (empty string)
// - In development: Vite proxy forwards /api/* → http://localhost:3001/api/*
// - In production (Vercel): same domain, /api/* routes to serverless function
// DO NOT set baseURL to "/api" — all call paths already include "/api/..."
// which would result in "/api/api/..." — a guaranteed 404 on every request.
const api = axios.create({
  baseURL: '',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url    = err.config?.url || '';
    const isAuthEndpoint =
      url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

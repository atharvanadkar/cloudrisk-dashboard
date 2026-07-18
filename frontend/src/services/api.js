import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/login', { email, password }),
};

// User API
export const userAPI = {
  getAll: () => api.get('/users'),
  seed: () => api.post('/seed-users'),
};

// AI API
export const aiAPI = {
  analyze: (username) => api.get(`/analyze/${username}`),
  fix: (username) => api.post(`/fix/${username}`),
};

// Health API
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
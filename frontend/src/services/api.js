import axios from 'axios';

// ✅ CORRECT - Live Render backend
const API_BASE_URL = 'https://cloudrisk-dashboard.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export const authAPI = {
  login: (email, password) => api.post('/login', { email, password }),
};

export const userAPI = {
  getAll: () => api.get('/users'),
  seed: () => api.post('/seed-users'),
};

export const aiAPI = {
  analyze: (username) => api.get(`/analyze/${username}`),
  fix: (username) => api.post(`/fix/${username}`),
};

export default api;
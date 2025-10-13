import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // key used below when storing login
  if (token) {
    
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // simple logout behavior on token expiry/invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user'); // if you store user
      window.location.href = '/login'; // adjust as needed
    }
    return Promise.reject(err);
  }
);

export default api;
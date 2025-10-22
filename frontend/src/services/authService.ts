import api from './api';

export const createAdmin = async (name: string, email: string, password: string) => {
  const res = await api.post('/api/auth/create-admin', { name, email, password });
  const token = res.data?.data?.token || res.data?.token;
  if (token) {
    sessionStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(res.data?.data || res.data));
  }
  return res.data;
};

export const login = async (email: string, password: string) => {
  const res = await api.post('/api/auth/login', { email, password });
  const token = res.data?.data?.token || res.data?.token;
  if (token) {
    sessionStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(res.data?.data || res.data));
  }
  return res.data;
};

export const logout = () => {
  sessionStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

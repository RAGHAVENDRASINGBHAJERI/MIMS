// new file or integrate into existing login
import api from './api';

export const login = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  const token = res.data?.data?.token || res.data?.token;
  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(res.data?.data || res.data));
  }
  return res.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://mims-1.onrender.com';

export const refreshToken = async (): Promise<string | null> => {
  try {
    const token = sessionStorage.getItem('token');
    if (!token) return null;

    const response = await axios.post(`${API_URL}/auth/refresh-token`, { token });
    
    if (response.data.success) {
      const newToken = response.data.data.token;
      sessionStorage.setItem('token', newToken);
      return newToken;
    }
    return null;
  } catch (error) {
    sessionStorage.removeItem('token');
    window.location.href = '/login';
    return null;
  }
};

export const setupTokenRefresh = () => {
  const token = sessionStorage.getItem('token');
  if (!token) return;

  // Refresh token every 6 days (before 7-day expiry)
  setInterval(async () => {
    await refreshToken();
  }, 6 * 24 * 60 * 60 * 1000);
};
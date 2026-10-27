import axios from 'axios';

// In dev, Vite proxies /api -> http://localhost:8080 (see vite.config.js).
// In production, set VITE_API_BASE_URL to the deployed backend origin.
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const client = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('janseva_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res.data, // controllers wrap everything in ApiResponse<T> -> { success, message, data }
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('janseva_token');
      localStorage.removeItem('janseva_user');
    }
    const message = err.response?.data?.message || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default client;

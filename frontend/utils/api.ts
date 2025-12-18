// src/utils/api.ts
import axios from 'axios';

// create an axios Instance
const api = axios.create({
  baseURL: 'http://localhost:3000', // backend address
  headers: {
    'Content-Type': 'application/json',
  },
});

// set Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
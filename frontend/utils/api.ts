// src/utils/api.ts
import axios from 'axios';

// create an axios Instance
const api = axios.create({
  // Logic: Use the environment variable if it exists (Cloud), otherwise use localhost (Local)
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
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
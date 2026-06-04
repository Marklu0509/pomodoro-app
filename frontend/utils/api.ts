// src/utils/api.ts
import axios, { AxiosError } from 'axios';

// create an axios Instance
const api = axios.create({
  // Use the env var in the cloud; default to same-origin '/api' so it works behind
  // the Nginx reverse proxy (no hardcoded localhost, no mixed-content in production).
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // P0.1: fail fast instead of hanging forever when the backend is unreachable.
  timeout: 10000,
});

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * P0.1: normalize errors so the UI always has a human-readable message
 * (timeouts / network failures / server errors) instead of a stuck spinner.
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string | string[] }>;
    if (axiosError.code === 'ECONNABORTED') {
      return 'The request timed out. Please check your connection and try again.';
    }
    if (!axiosError.response) {
      return 'Cannot reach the server. Please try again later.';
    }
    const data = axiosError.response.data;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
    return `Request failed (${axiosError.response.status}).`;
  }
  return 'An unexpected error occurred.';
}

export default api;
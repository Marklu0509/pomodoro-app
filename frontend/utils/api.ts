// src/utils/api.ts
import axios, { AxiosError, type AxiosInstance } from 'axios';

// Attach the JWT (same token works for both NestJS and the Go stats service).
function attachAuthInterceptor(instance: AxiosInstance): AxiosInstance {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  return instance;
}

// Main API -> NestJS, behind Nginx at the same-origin '/api'.
const api = attachAuthInterceptor(
  axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
    headers: { 'Content-Type': 'application/json' },
    // P0.1: fail fast instead of hanging forever when the backend is unreachable.
    timeout: 10000,
  }),
);

// Stats API -> Go microservice, behind Nginx at the same-origin '/stats-api'.
export const statsApi = attachAuthInterceptor(
  axios.create({
    baseURL: process.env.NEXT_PUBLIC_STATS_API_URL || '/stats-api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  }),
);

// The browser's IANA timezone (e.g. "Asia/Taipei"); sent so the Go service
// buckets sessions by the user's local day, not the server's.
export function getClientTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

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
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '../store/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL
  || (Capacitor.getPlatform() === 'android' ? 'http://10.0.2.2:3000/api' : '/api');

type ApiRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthHeader?: boolean;
  skipAuthRefresh?: boolean;
};

const PUBLIC_AUTH_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/activate',
]);

function isPublicAuthRequest(url?: string) {
  if (!url) {
    return false;
  }

  const normalizedUrl = url.startsWith('http')
    ? new URL(url).pathname
    : url;

  return PUBLIC_AUTH_PATHS.has(normalizedUrl.replace(/\/+$/, ''));
}

export function publicRequestConfig(extraConfig: Record<string, unknown> = {}) {
  return {
    ...extraConfig,
    skipAuthHeader: true,
    skipAuthRefresh: true,
  } as any;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token
api.interceptors.request.use((config) => {
  const requestConfig = config as ApiRequestConfig;

  if (requestConfig.skipAuthHeader || isPublicAuthRequest(requestConfig.url)) {
    return requestConfig;
  }

  const token = useAuthStore.getState().accessToken;
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }

  return requestConfig;
});

// Handle 401 → try refresh
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as ApiRequestConfig | undefined;

    if (
      !original
      || original._retry
      || original.skipAuthRefresh
      || error.response?.status !== 401
      || isPublicAuthRequest(original.url)
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    const { refreshToken, setTokens, logout } = useAuthStore.getState();

    if (!refreshToken) {
      logout();
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { timeout: 10000 },
      );

      setTokens(data.accessToken, data.refreshToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch {
      logout();
    }

    return Promise.reject(error);
  },
);

export default api;

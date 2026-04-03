import axios from 'axios';
import api, { publicRequestConfig } from './api';
import type { AuthResponse } from '../types';

const ADMIN_LOGIN_ALIAS = 'admin';
const LEGACY_ADMIN_EMAIL = 'admin@roadix.cl';

function normalizeLoginIdentifier(identifier: string) {
  return identifier.trim();
}

function isAdminAlias(identifier: string) {
  return normalizeLoginIdentifier(identifier).toLowerCase() === ADMIN_LOGIN_ALIAS;
}

function loginRequest(identifier: string, password: string) {
  return api
    .post<AuthResponse>('/auth/login', { email: identifier, password }, publicRequestConfig())
    .then((r) => r.data);
}

export const authService = {
  login: async (email: string, password: string) => {
    const normalizedIdentifier = normalizeLoginIdentifier(email);

    try {
      return await loginRequest(normalizedIdentifier, password);
    } catch (error) {
      if (
        isAdminAlias(normalizedIdentifier)
        && axios.isAxiosError(error)
        && error.response?.status === 401
      ) {
        return loginRequest(LEGACY_ADMIN_EMAIL, password);
      }

      throw error;
    }
  },

  register: (data: {
    nombre: string;
    email: string;
    password: string;
    telefono?: string;
    taller_nombre: string;
    taller_rut?: string;
  }) => api.post<AuthResponse>('/auth/register', data, publicRequestConfig()).then((r) => r.data),

  me: () => api.get('/auth/me').then((r) => r.data),

  logout: () => api.post('/auth/logout'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }, publicRequestConfig()).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }, publicRequestConfig()).then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),

  inviteUser: (data: { nombre: string; email: string; rol: string; telefono?: string }) =>
    api.post('/auth/invite', data).then((r) => r.data),

  activateAccount: (token: string, password: string) =>
    api.post<AuthResponse>('/auth/activate', { token, password }, publicRequestConfig()).then((r) => r.data),
};

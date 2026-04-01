import api from './api';
import type { AuthResponse } from '../types';

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  register: (data: {
    nombre: string;
    email: string;
    password: string;
    telefono?: string;
    taller_nombre: string;
    taller_rut?: string;
  }) => api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  me: () => api.get('/auth/me').then((r) => r.data),

  logout: () => api.post('/auth/logout'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }).then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),

  inviteUser: (data: { nombre: string; email: string; rol: string; telefono?: string }) =>
    api.post('/auth/invite', data).then((r) => r.data),

  activateAccount: (token: string, password: string) =>
    api.post<AuthResponse>('/auth/activate', { token, password }).then((r) => r.data),
};

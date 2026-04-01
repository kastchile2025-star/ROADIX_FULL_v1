import api from './api';
import type { User } from '../types';

export const usuariosService = {
  list: () => api.get<User[]>('/usuarios').then((r) => r.data),

  get: (id: number) => api.get<User>(`/usuarios/${id}`).then((r) => r.data),

  create: (data: { nombre: string; email: string; password: string; rol: string; telefono?: string }) =>
    api.post<User>('/usuarios', data).then((r) => r.data),

  update: (id: number, data: Partial<User>) =>
    api.put<User>(`/usuarios/${id}`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/usuarios/${id}`),
};

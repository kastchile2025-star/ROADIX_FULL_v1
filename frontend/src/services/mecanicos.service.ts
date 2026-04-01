import api from './api';
import type { Mecanico } from '../types';

export const mecanicosService = {
  getAll: () => api.get<Mecanico[]>('/mecanicos').then((r) => r.data),
  getActive: () => api.get<Mecanico[]>('/mecanicos/activos').then((r) => r.data),
  getOne: (id: number) => api.get<Mecanico>(`/mecanicos/${id}`).then((r) => r.data),
  create: (data: Partial<Mecanico>) => api.post<Mecanico>('/mecanicos', data).then((r) => r.data),
  update: (id: number, data: Partial<Mecanico>) => api.put<Mecanico>(`/mecanicos/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/mecanicos/${id}`).then((r) => r.data),
};

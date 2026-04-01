import api from './api';
import type { Cliente } from '../types';

export const clientesService = {
  list: (search?: string) =>
    api.get<Cliente[]>('/clientes', { params: { search } }).then((r) => r.data),

  get: (id: number) =>
    api.get<Cliente>(`/clientes/${id}`).then((r) => r.data),

  create: (data: Partial<Cliente>) =>
    api.post<Cliente>('/clientes', data).then((r) => r.data),

  update: (id: number, data: Partial<Cliente>) =>
    api.put<Cliente>(`/clientes/${id}`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/clientes/${id}`),
};

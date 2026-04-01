import api from './api';
import type { Vehiculo } from '../types';

export const vehiculosService = {
  list: (search?: string) =>
    api.get<Vehiculo[]>('/vehiculos', { params: { search } }).then((r) => r.data),

  get: (id: number) =>
    api.get<Vehiculo>(`/vehiculos/${id}`).then((r) => r.data),

  create: (data: Partial<Vehiculo>) =>
    api.post<Vehiculo>('/vehiculos', data).then((r) => r.data),

  update: (id: number, data: Partial<Vehiculo>) =>
    api.put<Vehiculo>(`/vehiculos/${id}`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/vehiculos/${id}`),
};

import api from './api';
import type { Proveedor } from '../types';

export const proveedoresService = {
  getAll: (search?: string) =>
    api.get<Proveedor[]>('/proveedores', { params: search ? { search } : {} }).then((r) => r.data),
  getOne: (id: number) =>
    api.get<Proveedor>(`/proveedores/${id}`).then((r) => r.data),
  create: (data: Partial<Proveedor>) =>
    api.post<Proveedor>('/proveedores', data).then((r) => r.data),
  update: (id: number, data: Partial<Proveedor>) =>
    api.put<Proveedor>(`/proveedores/${id}`, data).then((r) => r.data),
  remove: (id: number) =>
    api.delete(`/proveedores/${id}`).then((r) => r.data),
};

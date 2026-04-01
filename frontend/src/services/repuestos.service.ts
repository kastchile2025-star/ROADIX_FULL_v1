import api from './api';
import type { Repuesto } from '../types';

export const repuestosService = {
  getAll: (params?: { search?: string; categoria?: string }) =>
    api.get<Repuesto[]>('/repuestos', { params }).then((r) => r.data),
  getOne: (id: number) =>
    api.get<Repuesto>(`/repuestos/${id}`).then((r) => r.data),
  getStockBajo: () =>
    api.get<Repuesto[]>('/repuestos/stock-bajo').then((r) => r.data),
  getCategorias: () =>
    api.get<string[]>('/repuestos/categorias').then((r) => r.data),
  create: (data: Partial<Repuesto>) =>
    api.post<Repuesto>('/repuestos', data).then((r) => r.data),
  update: (id: number, data: Partial<Repuesto>) =>
    api.put<Repuesto>(`/repuestos/${id}`, data).then((r) => r.data),
  remove: (id: number) =>
    api.delete(`/repuestos/${id}`).then((r) => r.data),
};

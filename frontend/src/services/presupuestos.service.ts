import api from './api';
import type { Presupuesto } from '../types';

export const presupuestosService = {
  getByOt: (otId: number) =>
    api.get<Presupuesto[]>('/presupuestos', { params: { ot_id: otId } }).then((r) => r.data),

  getOne: (id: number) =>
    api.get<Presupuesto>(`/presupuestos/${id}`).then((r) => r.data),

  create: (data: { ot_id: number; items_json?: { tipo: string; descripcion: string; cantidad: number; precio_unit: number; descuento?: number }[] }) =>
    api.post<Presupuesto>('/presupuestos', data).then((r) => r.data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<Presupuesto>(`/presupuestos/${id}`, data).then((r) => r.data),

  enviar: (id: number) =>
    api.patch<Presupuesto>(`/presupuestos/${id}/enviar`).then((r) => r.data),
};

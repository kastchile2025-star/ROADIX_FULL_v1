import api from './api';
import type { OrdenTrabajo } from '../types';

export const ordenesTrabajoService = {
  getAll: (params?: { search?: string; estado?: string }) =>
    api.get<OrdenTrabajo[]>('/ordenes-trabajo', { params }).then((r) => r.data),

  getKanban: () =>
    api.get<Record<string, OrdenTrabajo[]>>('/ordenes-trabajo/kanban').then((r) => r.data),

  getOne: (id: number) =>
    api.get<OrdenTrabajo>(`/ordenes-trabajo/${id}`).then((r) => r.data),

  create: (data: {
    vehiculo_id: number;
    cliente_id: number;
    mecanico_id?: number;
    tipo_servicio?: string;
    km_ingreso?: number;
    combustible_ing?: string;
    diagnostico?: string;
    observaciones?: string;
    fecha_prometida?: string;
    prioridad?: string;
    checklist?: { zona_vehiculo: string; estado: string; foto_url?: string; notas?: string }[];
    firma_base64?: string;
  }) => api.post<OrdenTrabajo>('/ordenes-trabajo', data).then((r) => r.data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<OrdenTrabajo>(`/ordenes-trabajo/${id}`, data).then((r) => r.data),

  cambiarEstado: (id: number, estado: string) =>
    api.patch<OrdenTrabajo>(`/ordenes-trabajo/${id}/estado`, { estado }).then((r) => r.data),

  asignarMecanico: (id: number, mecanicoId: number) =>
    api.patch<OrdenTrabajo>(`/ordenes-trabajo/${id}/mecanico/${mecanicoId}`).then((r) => r.data),

  addDetalle: (id: number, data: { tipo: string; descripcion: string; cantidad?: number; precio_unit?: number; descuento?: number; repuesto_id?: number }) =>
    api.post<OrdenTrabajo>(`/ordenes-trabajo/${id}/detalles`, data).then((r) => r.data),

  removeDetalle: (id: number, detalleId: number) =>
    api.delete<OrdenTrabajo>(`/ordenes-trabajo/${id}/detalles/${detalleId}`).then((r) => r.data),

  addFoto: (id: number, data: { url: string; tipo: string; descripcion?: string }) =>
    api.post(`/ordenes-trabajo/${id}/fotos`, data).then((r) => r.data),

  removeFoto: (id: number, fotoId: number) =>
    api.delete(`/ordenes-trabajo/${id}/fotos/${fotoId}`).then((r) => r.data),

  updateChecklist: (id: number, items: { zona_vehiculo: string; estado: string; foto_url?: string; notas?: string }[]) =>
    api.put<OrdenTrabajo>(`/ordenes-trabajo/${id}/checklist`, items).then((r) => r.data),

  guardarFirma: (id: number, firma_base64: string) =>
    api.patch<OrdenTrabajo>(`/ordenes-trabajo/${id}/firma`, { firma_base64 }).then((r) => r.data),
};

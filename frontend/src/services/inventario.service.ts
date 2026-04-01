import api from './api';
import type { MovimientoStock } from '../types';

export const inventarioService = {
  registrarMovimiento: (data: { repuesto_id: number; tipo: string; cantidad: number; motivo?: string; ot_detalle_id?: number }) =>
    api.post<MovimientoStock>('/inventario/movimiento', data).then((r) => r.data),
  getMovimientos: (repuestoId: number) =>
    api.get<MovimientoStock[]>(`/inventario/movimientos/${repuestoId}`).then((r) => r.data),
  getRecientes: () =>
    api.get<MovimientoStock[]>('/inventario/movimientos').then((r) => r.data),
};

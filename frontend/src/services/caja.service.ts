import api from './api';
import type { Pago, CierreDiario } from '../types';

export const cajaService = {
  cobrar: (data: { ot_id: number; monto: number; metodo_pago: string; referencia?: string }) =>
    api.post<Pago>('/caja/cobrar', data).then((r) => r.data),
  getMovimientos: (fecha?: string) =>
    api.get<Pago[]>('/caja/movimientos', { params: fecha ? { fecha } : {} }).then((r) => r.data),
  getCierreDiario: (fecha?: string) =>
    api.get<CierreDiario>('/caja/cierre-diario', { params: fecha ? { fecha } : {} }).then((r) => r.data),
};

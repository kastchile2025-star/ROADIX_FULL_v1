import api from './api';
import type { Factura } from '../types';

export const facturacionService = {
  getAll: () => api.get<Factura[]>('/facturacion').then((r) => r.data),
  getOne: (id: number) => api.get<Factura>(`/facturacion/${id}`).then((r) => r.data),
  emitir: (data: { ot_id: number; tipo_dte: string; razon_social: string; rut: string; direccion?: string; giro?: string }) =>
    api.post<Factura>('/facturacion/emitir', data).then((r) => r.data),
  anular: (id: number) => api.patch<Factura>(`/facturacion/${id}/anular`).then((r) => r.data),
  downloadPdf: async (id: number) => {
    const resp = await api.get(`/facturacion/${id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `factura-${id}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
  enviarEmail: (id: number) =>
    api.post<{ message: string }>(`/facturacion/${id}/enviar-email`).then((r) => r.data),
};

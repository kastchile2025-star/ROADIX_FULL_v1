import api from './api';
import type { OrdenTrabajo, OtFoto, Presupuesto, Factura } from '../types';

const portalApi = {
  getOt: (token: string) =>
    api.get<OrdenTrabajo>(`/portal/${token}`).then((r) => r.data),
  getFotos: (token: string) =>
    api.get<OtFoto[]>(`/portal/${token}/fotos`).then((r) => r.data),
  getPresupuesto: (token: string) =>
    api.get<Presupuesto | null>(`/portal/${token}/presupuesto`).then((r) => r.data),
  aprobarPresupuesto: (token: string, firmaBase64?: string) =>
    api.patch(`/portal/${token}/presupuesto/aprobar`, { firma_base64: firmaBase64 }).then((r) => r.data),
  getFactura: (token: string) =>
    api.get<Factura | null>(`/portal/${token}/factura`).then((r) => r.data),
};

export default portalApi;

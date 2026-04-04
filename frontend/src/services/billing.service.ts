import api from './api';
import type {
  Plan,
  Suscripcion,
  PagoSuscripcion,
  BillingUsage,
  BillingPlanChangeResult,
  FlowStatusResult,
  EnterpriseContactRequest,
} from '../types';

export const billingService = {
  getPlanes: () => api.get<Plan[]>('/planes').then((r) => r.data),

  getMiSuscripcion: () =>
    api.get<Suscripcion>('/suscripciones/mi-suscripcion').then((r) => r.data),

  getUsage: () =>
    api.get<BillingUsage>('/suscripciones/uso').then((r) => r.data),

  getHistorialPagos: () =>
    api.get<PagoSuscripcion[]>('/suscripciones/historial-pagos').then((r) => r.data),

  cambiarPlan: (plan_id: number, periodo: 'mensual' | 'anual', billing_email?: string) =>
    api.post<Suscripcion | BillingPlanChangeResult>('/suscripciones/cambiar-plan', { plan_id, periodo, billing_email }).then((r) => r.data),

  getFlowStatus: (token: string) =>
    api.get<FlowStatusResult>('/billing/flow/status', { params: { token } }).then((r) => r.data),

  solicitarEnterprise: (payload: EnterpriseContactRequest) =>
    api.post<{ ok: boolean }>('/suscripciones/enterprise-contact', payload).then((r) => r.data),

  cancelar: () =>
    api.post<Suscripcion>('/suscripciones/cancelar').then((r) => r.data),

  reactivar: () =>
    api.post<Suscripcion>('/suscripciones/reactivar').then((r) => r.data),
};

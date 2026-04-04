// ── User & Auth ──
export const UserRole = {
  SUPERADMIN: 'superadmin',
  ADMIN_TALLER: 'admin_taller',
  RECEPCIONISTA: 'recepcionista',
  MECANICO: 'mecanico',
  BODEGUERO: 'bodeguero',
  CAJERO: 'cajero',
  VIEWER: 'viewer',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
  taller_id: number;
  telefono?: string;
  activo?: boolean;
  avatar_url?: string;
  taller?: Taller;
  created_at?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Pick<User, 'id' | 'nombre' | 'email' | 'rol' | 'taller_id'>;
}

// ── Taller ──
export interface Taller {
  id: number;
  nombre: string;
  rut?: string;
  direccion?: string;
  telefono?: string;
  logo_url?: string;
  config_json?: Record<string, unknown>;
  created_at?: string;
}

// ── Plan & Suscripcion ──
export interface Plan {
  id: number;
  nombre: string;
  precio_mensual: number;
  precio_anual: number;
  max_usuarios: number;
  max_ots_mes: number;
  max_vehiculos: number;
  max_storage_mb: number;
  tiene_facturacion: boolean;
  tiene_whatsapp: boolean;
  tiene_portal: boolean;
  tiene_reportes: boolean;
  tiene_api: boolean;
  activo: boolean;
}

export interface Suscripcion {
  id: number;
  taller_id: number;
  plan_id: number;
  plan?: Plan;
  periodo: 'mensual' | 'anual';
  estado: 'activa' | 'trial' | 'vencida' | 'cancelada' | 'suspendida';
  fecha_inicio: string;
  fecha_fin?: string;
  trial_hasta?: string;
  proximo_cobro?: string;
  metodo_pago?: string;
  monto_pagado?: number;
  descuento_pct?: number;
  auto_renovar?: boolean;
  cancelado_at?: string;
}

export interface BillingPlanChangeResult {
  requiresPayment: true;
  provider: 'flow';
  checkoutUrl: string;
  token?: string;
  flowOrder?: string;
  commerceOrder: string;
  amount: number;
  planId: number;
  periodo: 'mensual' | 'anual';
}

export interface FlowStatusResult {
  ok?: boolean;
  token: string;
  statusPayload?: {
    response?: {
      status?: string | number;
      [key: string]: unknown;
    };
  };
  conciliation?: {
    matched: boolean;
    estado?: 'paid' | 'failed' | 'pending';
    statusCode?: string;
    appliedPlanId?: number;
    [key: string]: unknown;
  };
  error?: string;
}

export interface PagoSuscripcion {
  id: number;
  suscripcion_id: number;
  monto: number;
  metodo_pago: string;
  referencia?: string;
  estado: 'exitoso' | 'fallido' | 'pendiente' | 'reembolsado';
  fecha_pago: string;
  periodo_desde?: string;
  periodo_hasta?: string;
  created_at: string;
}

export interface UsageMetric {
  usado: number;
  limite: number;
}

export interface BillingUsage {
  usuarios: UsageMetric;
  vehiculos: UsageMetric;
  ots_mes: UsageMetric;
  storage_mb: UsageMetric;
}

export interface EnterpriseContactRequest {
  nombre: string;
  taller_nombre: string;
  email: string;
  telefono?: string;
  periodo: 'mensual' | 'anual';
  mensaje?: string;
}

// ── Cliente ──
export interface Cliente {
  id: number;
  taller_id: number;
  nombre: string;
  rut?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  tipo: 'persona' | 'empresa';
  created_at?: string;
  vehiculos?: Vehiculo[];
}

// ── Vehiculo ──
export interface Vehiculo {
  id: number;
  cliente_id: number;
  taller_id: number;
  patente: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  color?: string;
  vin?: string;
  tipo_vehiculo: string;
  km_actual: number;
  combustible?: string;
  rev_tecnica?: string;
  permiso_circ?: string;
  soap_vence?: string;
  foto_url?: string;
  notas?: string;
  created_at?: string;
  cliente?: Cliente;
}

// ── Mecánico ──
export interface Mecanico {
  id: number;
  taller_id: number;
  usuario_id?: number;
  nombre: string;
  especialidad?: string;
  tarifa_hora?: number;
  activo: boolean;
  usuario?: User;
  created_at?: string;
}

// ── Orden de Trabajo ──
export const OtEstado = {
  RECEPCION: 'recepcion',
  DIAGNOSTICO: 'diagnostico',
  PRESUPUESTO: 'presupuesto',
  ESPERANDO_APROBACION: 'esperando_aprobacion',
  ESPERANDO_REPUESTOS: 'esperando_repuestos',
  EN_REPARACION: 'en_reparacion',
  CONTROL_CALIDAD: 'control_calidad',
  LISTO: 'listo',
  ENTREGADO: 'entregado',
  FACTURADO: 'facturado',
  CANCELADO: 'cancelado',
} as const;

export type OtEstado = (typeof OtEstado)[keyof typeof OtEstado];

export const Prioridad = {
  BAJA: 'baja',
  MEDIA: 'media',
  ALTA: 'alta',
  URGENTE: 'urgente',
} as const;

export type Prioridad = (typeof Prioridad)[keyof typeof Prioridad];

export interface OrdenTrabajo {
  id: number;
  taller_id: number;
  vehiculo_id: number;
  cliente_id: number;
  mecanico_id?: number;
  numero_ot: string;
  estado: OtEstado;
  tipo_servicio?: string;
  km_ingreso?: number;
  combustible_ing?: string;
  diagnostico?: string;
  observaciones?: string;
  fecha_ingreso: string;
  fecha_prometida?: string;
  fecha_entrega?: string;
  prioridad: Prioridad;
  token_portal?: string;
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
  firma_cliente_url?: string;
  vehiculo?: Vehiculo;
  cliente?: Cliente;
  mecanico?: Mecanico;
  detalles?: OtDetalle[];
  fotos?: OtFoto[];
  checklist?: ChecklistRecepcion[];
  taller?: Taller;
  created_at?: string;
}

export interface OtDetalle {
  id: number;
  ot_id: number;
  tipo: 'mano_obra' | 'repuesto';
  repuesto_id?: number;
  descripcion: string;
  cantidad: number;
  precio_unit: number;
  descuento: number;
  subtotal: number;
}

export interface OtFoto {
  id: number;
  ot_id: number;
  url: string;
  tipo: 'ingreso' | 'proceso' | 'entrega' | 'dano';
  descripcion?: string;
  created_at?: string;
}

export interface ChecklistRecepcion {
  id: number;
  ot_id: number;
  zona_vehiculo: string;
  estado: 'ok' | 'danio_prev' | 'danio_nuevo';
  foto_url?: string;
  notas?: string;
}

// ── Presupuesto ──
export const PresupuestoEstado = {
  BORRADOR: 'borrador',
  ENVIADO: 'enviado',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
} as const;

export type PresupuestoEstado = (typeof PresupuestoEstado)[keyof typeof PresupuestoEstado];

export interface PresupuestoItem {
  tipo: string;
  descripcion: string;
  cantidad: number;
  precio_unit: number;
  descuento?: number;
}

export interface Presupuesto {
  id: number;
  ot_id: number;
  taller_id: number;
  numero: string;
  estado: PresupuestoEstado;
  items_json: PresupuestoItem[];
  subtotal: number;
  iva: number;
  total: number;
  pdf_url?: string;
  enviado_email: boolean;
  enviado_wsp: boolean;
  aprobado_at?: string;
  firma_url?: string;
  orden_trabajo?: OrdenTrabajo;
  created_at?: string;
}

// ── Repuesto ──
export interface Repuesto {
  id: number;
  taller_id: number;
  proveedor_id?: number;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  precio_compra: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  ubicacion_bodega?: string;
  proveedor?: Proveedor;
  created_at?: string;
}

// ── Proveedor ──
export interface Proveedor {
  id: number;
  taller_id: number;
  razon_social: string;
  rut?: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  created_at?: string;
}

// ── Movimiento Stock ──
export const TipoMovimiento = {
  ENTRADA: 'entrada',
  SALIDA: 'salida',
  AJUSTE: 'ajuste',
} as const;

export type TipoMovimiento = (typeof TipoMovimiento)[keyof typeof TipoMovimiento];

export interface MovimientoStock {
  id: number;
  repuesto_id: number;
  ot_detalle_id?: number;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo?: string;
  usuario_id?: number;
  repuesto?: Repuesto;
  usuario?: { id: number; nombre: string };
  created_at?: string;
}

// ── Pago ──
export const MetodoPago = {
  EFECTIVO: 'efectivo',
  TARJETA_DEBITO: 'tarjeta_debito',
  TARJETA_CREDITO: 'tarjeta_credito',
  TRANSFERENCIA: 'transferencia',
  CHEQUE: 'cheque',
  CREDITO: 'credito',
} as const;

export type MetodoPago = (typeof MetodoPago)[keyof typeof MetodoPago];

export interface Pago {
  id: number;
  ot_id: number;
  taller_id: number;
  monto: number;
  metodo_pago: MetodoPago;
  referencia?: string;
  fecha_pago: string;
  orden_trabajo?: OrdenTrabajo;
  created_at?: string;
}

// ── Factura ──
export const TipoDte = {
  BOLETA: 'boleta',
  FACTURA: 'factura',
  NOTA_CREDITO: 'nota_credito',
} as const;

export type TipoDte = (typeof TipoDte)[keyof typeof TipoDte];

export interface Factura {
  id: number;
  ot_id: number;
  taller_id: number;
  numero_dte?: string;
  tipo_dte: TipoDte;
  rut_receptor?: string;
  estado_sii?: string;
  monto_neto: number;
  iva: number;
  monto_total: number;
  pdf_url?: string;
  orden_trabajo?: OrdenTrabajo;
  created_at?: string;
}

// ── Cierre de Caja ──
export interface CierreDiario {
  fecha: string;
  total_dia: number;
  cantidad_pagos: number;
  por_metodo: Record<string, number>;
  pagos: Pago[];
}

// ── Historial Email ──
export interface HistorialEmail {
  id: number;
  taller_id: number;
  destinatario: string;
  asunto: string;
  tipo: string;
  template_usado?: string;
  estado: string;
  sendgrid_id?: string;
  abierto_at?: string;
  created_at?: string;
}

// ── Recordatorio ──
export const TipoRecordatorio = {
  REV_TECNICA: 'rev_tecnica',
  PERMISO_CIRCULACION: 'permiso_circ',
  SOAP: 'soap',
  MANTENCION: 'mantencion',
  SEGUIMIENTO: 'seguimiento',
} as const;

export type TipoRecordatorio = (typeof TipoRecordatorio)[keyof typeof TipoRecordatorio];

export interface RecordatorioType {
  id: number;
  taller_id: number;
  cliente_id?: number;
  vehiculo_id?: number;
  tipo: TipoRecordatorio;
  mensaje?: string;
  fecha_envio: string;
  canal: string;
  estado: string;
  enviado_at?: string;
  created_at?: string;
  cliente?: Cliente;
  vehiculo?: Vehiculo;
}

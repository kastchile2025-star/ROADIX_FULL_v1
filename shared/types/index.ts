// ─── Roles & Auth ─────────────────────────────────────────
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

// ─── OT ───────────────────────────────────────────────────
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

// ─── Vehículo ─────────────────────────────────────────────
export const TipoVehiculo = {
  AUTOMOVIL: 'automovil',
  CAMIONETA: 'camioneta',
  SUV: 'suv',
  VAN: 'van',
  CAMION: 'camion',
  MOTO: 'moto',
  BUS: 'bus',
  MAQUINARIA: 'maquinaria',
  OTRO: 'otro',
} as const;
export type TipoVehiculo = (typeof TipoVehiculo)[keyof typeof TipoVehiculo];

// ─── Pagos ────────────────────────────────────────────────
export const MetodoPago = {
  EFECTIVO: 'efectivo',
  TARJETA_DEBITO: 'tarjeta_debito',
  TARJETA_CREDITO: 'tarjeta_credito',
  TRANSFERENCIA: 'transferencia',
  CHEQUE: 'cheque',
  CREDITO: 'credito',
} as const;
export type MetodoPago = (typeof MetodoPago)[keyof typeof MetodoPago];

// ─── Suscripciones ────────────────────────────────────────
export const SuscripcionEstado = {
  ACTIVA: 'activa',
  TRIAL: 'trial',
  VENCIDA: 'vencida',
  CANCELADA: 'cancelada',
  SUSPENDIDA: 'suspendida',
} as const;
export type SuscripcionEstado = (typeof SuscripcionEstado)[keyof typeof SuscripcionEstado];

export const SuscripcionPeriodo = {
  MENSUAL: 'mensual',
  ANUAL: 'anual',
} as const;
export type SuscripcionPeriodo = (typeof SuscripcionPeriodo)[keyof typeof SuscripcionPeriodo];

// ─── Presupuesto ──────────────────────────────────────────
export const PresupuestoEstado = {
  BORRADOR: 'borrador',
  ENVIADO: 'enviado',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
} as const;
export type PresupuestoEstado = (typeof PresupuestoEstado)[keyof typeof PresupuestoEstado];

// ─── Inventario ───────────────────────────────────────────
export const TipoMovimientoStock = {
  ENTRADA: 'entrada',
  SALIDA: 'salida',
  AJUSTE: 'ajuste',
} as const;
export type TipoMovimientoStock = (typeof TipoMovimientoStock)[keyof typeof TipoMovimientoStock];

// ─── Facturación ──────────────────────────────────────────
export const TipoDte = {
  BOLETA: 'boleta',
  FACTURA: 'factura',
  NOTA_CREDITO: 'nota_credito',
} as const;
export type TipoDte = (typeof TipoDte)[keyof typeof TipoDte];

// ─── OT Detalles ─────────────────────────────────────────
export const TipoOtDetalle = {
  MANO_OBRA: 'mano_obra',
  REPUESTO: 'repuesto',
} as const;
export type TipoOtDetalle = (typeof TipoOtDetalle)[keyof typeof TipoOtDetalle];

// ─── Recordatorios ────────────────────────────────────────
export const TipoRecordatorio = {
  REV_TECNICA: 'rev_tecnica',
  PERMISO_CIRCULACION: 'permiso_circ',
  SOAP: 'soap',
  MANTENCION: 'mantencion',
  SEGUIMIENTO: 'seguimiento',
} as const;
export type TipoRecordatorio = (typeof TipoRecordatorio)[keyof typeof TipoRecordatorio];

// ─── Interfaces ───────────────────────────────────────────
export interface Taller {
  id: number;
  nombre: string;
  rut?: string;
  direccion?: string;
  telefono?: string;
  logo_url?: string;
  config_json?: Record<string, unknown>;
  created_at: string;
}

export interface User {
  id: number;
  taller_id: number;
  nombre: string;
  email: string;
  rol: UserRole;
  telefono?: string;
  avatar_url?: string;
  activo: boolean;
  created_at: string;
  taller?: Taller;
}

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

export interface Cliente {
  id: number;
  taller_id: number;
  nombre: string;
  rut?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  tipo?: string;
  created_at: string;
}

export interface Vehiculo {
  id: number;
  cliente_id: number;
  taller_id: number;
  patente: string;
  marca: string;
  modelo: string;
  anio?: number;
  color?: string;
  vin?: string;
  tipo_vehiculo?: TipoVehiculo;
  km_actual?: number;
  combustible?: string;
  rev_tecnica?: string;
  permiso_circ?: string;
  soap_vence?: string;
  foto_url?: string;
  notas?: string;
  created_at: string;
  cliente?: Cliente;
}

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
  created_at: string;
  updated_at: string;
  vehiculo?: Vehiculo;
  cliente?: Cliente;
  mecanico?: Mecanico;
  taller?: Taller;
}

export interface Mecanico {
  id: number;
  usuario_id?: number;
  taller_id: number;
  especialidad?: string;
  tarifa_hora?: number;
  activo: boolean;
  created_at: string;
  usuario?: User;
}

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
  created_at: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

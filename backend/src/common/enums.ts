export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN_TALLER = 'admin_taller',
  RECEPCIONISTA = 'recepcionista',
  MECANICO = 'mecanico',
  BODEGUERO = 'bodeguero',
  CAJERO = 'cajero',
  VIEWER = 'viewer',
}

export enum OtEstado {
  RECEPCION = 'recepcion',
  DIAGNOSTICO = 'diagnostico',
  PRESUPUESTO = 'presupuesto',
  ESPERANDO_APROBACION = 'esperando_aprobacion',
  ESPERANDO_REPUESTOS = 'esperando_repuestos',
  EN_REPARACION = 'en_reparacion',
  CONTROL_CALIDAD = 'control_calidad',
  LISTO = 'listo',
  ENTREGADO = 'entregado',
  FACTURADO = 'facturado',
  CANCELADO = 'cancelado',
}

export enum Prioridad {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

export enum TipoVehiculo {
  AUTOMOVIL = 'automovil',
  CAMIONETA = 'camioneta',
  SUV = 'suv',
  VAN = 'van',
  CAMION = 'camion',
  MOTO = 'moto',
  BUS = 'bus',
  MAQUINARIA = 'maquinaria',
  OTRO = 'otro',
}

export enum MetodoPago {
  EFECTIVO = 'efectivo',
  TARJETA_DEBITO = 'tarjeta_debito',
  TARJETA_CREDITO = 'tarjeta_credito',
  TRANSFERENCIA = 'transferencia',
  CHEQUE = 'cheque',
  CREDITO = 'credito',
}

export enum SuscripcionEstado {
  ACTIVA = 'activa',
  TRIAL = 'trial',
  VENCIDA = 'vencida',
  CANCELADA = 'cancelada',
  SUSPENDIDA = 'suspendida',
}

export enum SuscripcionPeriodo {
  MENSUAL = 'mensual',
  ANUAL = 'anual',
}

export enum PagoSuscripcionEstado {
  EXITOSO = 'exitoso',
  FALLIDO = 'fallido',
  PENDIENTE = 'pendiente',
  REEMBOLSADO = 'reembolsado',
}

export enum PresupuestoEstado {
  BORRADOR = 'borrador',
  ENVIADO = 'enviado',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
}

export enum TipoMovimientoStock {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  AJUSTE = 'ajuste',
}

export enum TipoDte {
  BOLETA = 'boleta',
  FACTURA = 'factura',
  NOTA_CREDITO = 'nota_credito',
}

export enum TipoFotoOt {
  INGRESO = 'ingreso',
  PROCESO = 'proceso',
  ENTREGA = 'entrega',
  DANO = 'dano',
}

export enum EstadoChecklist {
  OK = 'ok',
  DANIO_PREVIO = 'danio_prev',
  DANIO_NUEVO = 'danio_nuevo',
}

export enum ZonaVehiculo {
  FRENTE = 'frente',
  TRASERA = 'trasera',
  LATERAL_IZQUIERDO = 'lat_izq',
  LATERAL_DERECHO = 'lat_der',
  TECHO = 'techo',
  INTERIOR = 'interior',
}

export enum TipoRecordatorio {
  REV_TECNICA = 'rev_tecnica',
  PERMISO_CIRCULACION = 'permiso_circ',
  SOAP = 'soap',
  MANTENCION = 'mantencion',
  SEGUIMIENTO = 'seguimiento',
}

export enum CanalRecordatorio {
  EMAIL = 'email',
  WSP = 'wsp',
  AMBOS = 'ambos',
}

export enum EstadoRecordatorio {
  PENDIENTE = 'pendiente',
  ENVIADO = 'enviado',
  FALLIDO = 'fallido',
}

export enum TipoEmail {
  FACTURA = 'factura',
  PRESUPUESTO = 'presupuesto',
  OT_FINALIZADA = 'ot_finalizada',
  RECORDATORIO = 'recordatorio',
  REV_TECNICA = 'rev_tecnica',
  BIENVENIDA = 'bienvenida',
  MARKETING = 'marketing',
  RESET_PASSWORD = 'reset_password',
  INVITACION = 'invitacion',
  TRIAL_EXPIRING = 'trial_expiring',
  SUSCRIPCION_ACTIVA = 'suscripcion_activa',
  PAGO_FALLIDO = 'pago_fallido',
  CUENTA_SUSPENDIDA = 'cuenta_suspendida',
}

export enum EstadoEmail {
  ENVIADO = 'enviado',
  ENTREGADO = 'entregado',
  FALLIDO = 'fallido',
  ABIERTO = 'abierto',
}

export enum TipoOtDetalle {
  MANO_OBRA = 'mano_obra',
  REPUESTO = 'repuesto',
}

export enum TipoCliente {
  PERSONA = 'persona',
  EMPRESA = 'empresa',
}

export enum Combustible {
  BENCINA = 'bencina',
  DIESEL = 'diesel',
  ELECTRICO = 'electrico',
  HIBRIDO = 'hibrido',
  GAS = 'gas',
}

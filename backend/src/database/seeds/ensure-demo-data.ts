import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Usuario } from '../entities/usuario.entity.js';
import { Taller } from '../entities/taller.entity.js';
import { Plan } from '../entities/plan.entity.js';
import { Suscripcion } from '../entities/suscripcion.entity.js';
import { HistorialPagoSuscripcion } from '../entities/historial-pago-suscripcion.entity.js';
import { HistorialEmail } from '../entities/historial-email.entity.js';
import { Recordatorio } from '../entities/recordatorio.entity.js';
import { Cliente } from '../entities/cliente.entity.js';
import { Vehiculo } from '../entities/vehiculo.entity.js';
import {
  SuscripcionEstado,
  SuscripcionPeriodo,
  PagoSuscripcionEstado,
  TipoEmail,
  EstadoEmail,
  TipoRecordatorio,
  CanalRecordatorio,
  EstadoRecordatorio,
} from '../../common/enums.js';

const logger = new Logger('EnsureDemoData');
const ADMIN_LOGIN = 'admin';
const ADMIN_EMAIL = 'admin@roadix.cl';
const DEFAULT_NOTIFICATION_EMAIL = 'contacto@roadix.cl';

const DEMO_PLANS: Array<Omit<Plan, 'id' | 'created_at' | 'suscripciones'>> = [
  {
    nombre: 'free',
    precio_mensual: 0,
    precio_anual: 0,
    max_usuarios: 2,
    max_ots_mes: 15,
    max_vehiculos: 10,
    max_storage_mb: 1024,
    tiene_facturacion: false,
    tiene_whatsapp: false,
    tiene_portal: false,
    tiene_reportes: false,
    tiene_api: false,
    activo: true,
  },
  {
    nombre: 'starter',
    precio_mensual: 500,
    precio_anual: 5400,
    max_usuarios: 3,
    max_ots_mes: 100,
    max_vehiculos: 200,
    max_storage_mb: 2048,
    tiene_facturacion: true,
    tiene_whatsapp: false,
    tiene_portal: true,
    tiene_reportes: true,
    tiene_api: false,
    activo: true,
  },
  {
    nombre: 'pro',
    precio_mensual: 59990,
    precio_anual: 647892,
    max_usuarios: 15,
    max_ots_mes: 999999,
    max_vehiculos: 999999,
    max_storage_mb: 51200,
    tiene_facturacion: true,
    tiene_whatsapp: true,
    tiene_portal: true,
    tiene_reportes: true,
    tiene_api: true,
    activo: true,
  },
  {
    nombre: 'enterprise',
    precio_mensual: 129990,
    precio_anual: 1249900,
    max_usuarios: 999999,
    max_ots_mes: 999999,
    max_vehiculos: 999999,
    max_storage_mb: 102400,
    tiene_facturacion: true,
    tiene_whatsapp: true,
    tiene_portal: true,
    tiene_reportes: true,
    tiene_api: true,
    activo: true,
  },
];

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function monthWindow(monthsAgo: number) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1, 9, 0, 0, 0);
  const paymentDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 5, 10, 30, 0, 0);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 18, 0, 0, 0);
  return { periodStart, paymentDate, periodEnd };
}

async function resolveTargetTallerId(dataSource: DataSource) {
  const usuarioRepo = dataSource.getRepository(Usuario);
  const tallerRepo = dataSource.getRepository(Taller);

  const admin =
    (await usuarioRepo.findOne({ where: { email: ADMIN_LOGIN, activo: true } }))
    ?? (await usuarioRepo.findOne({ where: { email: ADMIN_EMAIL, activo: true } }));
  if (admin?.taller_id) {
    return admin.taller_id;
  }

  const [firstTaller] = await tallerRepo.find({ order: { id: 'ASC' }, take: 1 });
  return firstTaller?.id ?? null;
}

async function ensurePlans(dataSource: DataSource) {
  const planRepo = dataSource.getRepository(Plan);
  const plansByName = new Map<string, Plan>();

  for (const planSeed of DEMO_PLANS) {
    const existing = await planRepo.findOne({ where: { nombre: planSeed.nombre } });
    const saved = await planRepo.save(
      planRepo.create({
        id: existing?.id,
        ...planSeed,
      }),
    );
    plansByName.set(saved.nombre, saved);
  }

  return plansByName;
}

async function ensureSubscription(dataSource: DataSource, tallerId: number, plan: Plan) {
  const suscripcionRepo = dataSource.getRepository(Suscripcion);
  let suscripcion = await suscripcionRepo.findOne({
    where: { taller_id: tallerId },
    relations: ['plan'],
    order: { created_at: 'DESC' },
  });

  if (!suscripcion) {
    const now = new Date();
    const fechaInicio = new Date(now.getFullYear(), now.getMonth() - 2, 1, 9, 0, 0, 0);
    const proximoCobro = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0, 0);

    suscripcion = await suscripcionRepo.save(
      suscripcionRepo.create({
        taller_id: tallerId,
        plan_id: plan.id,
        periodo: SuscripcionPeriodo.MENSUAL,
        estado: SuscripcionEstado.ACTIVA,
        fecha_inicio: fechaInicio,
        fecha_fin: proximoCobro,
        proximo_cobro: proximoCobro,
        metodo_pago: 'flow',
        referencia_pago: `demo-sub-${tallerId}`,
        referencia_pago_externa: `FLOW-DEMO-${tallerId}`,
        monto_pagado: plan.precio_mensual,
        descuento_pct: 0,
        auto_renovar: true,
      }),
    );
    logger.log(`Created demo subscription for taller ${tallerId}`);
  }

  return suscripcion;
}

async function ensurePaymentHistory(dataSource: DataSource, suscripcion: Suscripcion, plan: Plan) {
  const historialRepo = dataSource.getRepository(HistorialPagoSuscripcion);
  const paymentCount = await historialRepo.count({ where: { suscripcion_id: suscripcion.id } });
  if (paymentCount > 0) {
    return;
  }

  for (const monthsAgo of [2, 1, 0]) {
    const { periodStart, paymentDate, periodEnd } = monthWindow(monthsAgo);
    await historialRepo.save(
      historialRepo.create({
        suscripcion_id: suscripcion.id,
        monto: plan.precio_mensual,
        metodo_pago: 'flow',
        referencia: `FLOW-DEMO-${suscripcion.id}-${monthsAgo}`,
        referencia_externa: `FLOW-ORDER-${suscripcion.id}-${monthsAgo}`,
        codigo_respuesta: 'APPROVED',
        detalle_respuesta: 'Pago demo confirmado automáticamente',
        estado: PagoSuscripcionEstado.EXITOSO,
        fecha_pago: paymentDate,
        periodo_desde: periodStart,
        periodo_hasta: periodEnd,
        created_at: paymentDate,
      }),
    );
  }

  logger.log(`Created demo billing history for subscription ${suscripcion.id}`);
}

async function ensureNotificationVehicles(dataSource: DataSource, vehiculos: Vehiculo[]) {
  const vehiculoRepo = dataSource.getRepository(Vehiculo);

  if (vehiculos[0]) {
    await vehiculoRepo.update(vehiculos[0].id, { rev_tecnica: daysFromNow(9) });
  }
  if (vehiculos[1]) {
    await vehiculoRepo.update(vehiculos[1].id, { permiso_circ: daysFromNow(14) });
  }
  if (vehiculos[2]) {
    await vehiculoRepo.update(vehiculos[2].id, { soap_vence: daysFromNow(18) });
  }
}

async function ensureEmailHistory(dataSource: DataSource, tallerId: number, clientes: Cliente[], vehiculos: Vehiculo[]) {
  const emailRepo = dataSource.getRepository(HistorialEmail);
  const emailCount = await emailRepo.count({ where: { taller_id: tallerId } });
  if (emailCount > 0) {
    return;
  }

  const defaultEmail = clientes.find((cliente) => cliente.email)?.email ?? DEFAULT_NOTIFICATION_EMAIL;
  const pairedVehiculos = vehiculos.slice(0, 4);
  const emailSeeds = [
    {
      destinatario: pairedVehiculos[0]?.cliente?.email ?? defaultEmail,
      asunto: 'Factura emitida OT RDX-2026-041',
      tipo: TipoEmail.FACTURA,
      template_usado: 'factura_emitida',
      variables_json: {
        numero_ot: 'RDX-2026-041',
        patente: pairedVehiculos[0]?.patente,
        total: 73423,
      },
      estado: EstadoEmail.ENTREGADO,
      sendgrid_id: 'demo-factura-001',
      created_at: daysAgo(7),
    },
    {
      destinatario: pairedVehiculos[1]?.cliente?.email ?? defaultEmail,
      asunto: 'Presupuesto enviado para revisión de frenos',
      tipo: TipoEmail.PRESUPUESTO,
      template_usado: 'presupuesto_enviado',
      variables_json: {
        servicio: 'Revisión de frenos delanteros',
        patente: pairedVehiculos[1]?.patente,
      },
      estado: EstadoEmail.ABIERTO,
      sendgrid_id: 'demo-presupuesto-002',
      abierto_at: daysAgo(5),
      created_at: daysAgo(6),
    },
    {
      destinatario: pairedVehiculos[2]?.cliente?.email ?? defaultEmail,
      asunto: 'Recordatorio de mantención preventiva',
      tipo: TipoEmail.RECORDATORIO,
      template_usado: 'recordatorio_mantencion',
      variables_json: {
        km_sugerido: 90000,
        patente: pairedVehiculos[2]?.patente,
      },
      estado: EstadoEmail.ENVIADO,
      sendgrid_id: 'demo-recordatorio-003',
      created_at: daysAgo(4),
    },
    {
      destinatario: defaultEmail,
      asunto: 'Suscripción PRO activa en ROADIX',
      tipo: TipoEmail.SUSCRIPCION_ACTIVA,
      template_usado: 'suscripcion_activa',
      variables_json: {
        plan: 'pro',
        ejecutivo: 'Camila Torres',
      },
      estado: EstadoEmail.ENTREGADO,
      sendgrid_id: 'demo-suscripcion-004',
      created_at: daysAgo(3),
    },
    {
      destinatario: defaultEmail,
      asunto: 'Bienvenida al panel operativo ROADIX',
      tipo: TipoEmail.BIENVENIDA,
      template_usado: 'bienvenida',
      variables_json: {
        modulo_destacado: 'Dashboard y OT',
      },
      estado: EstadoEmail.ABIERTO,
      sendgrid_id: 'demo-bienvenida-005',
      abierto_at: daysAgo(1),
      created_at: daysAgo(2),
    },
  ];

  for (const emailSeed of emailSeeds) {
    await emailRepo.save(emailRepo.create({ taller_id: tallerId, ...emailSeed }));
  }

  logger.log(`Created demo email history for taller ${tallerId}`);
}

async function ensureRecordatorios(dataSource: DataSource, tallerId: number, vehiculos: Vehiculo[]) {
  const recordatorioRepo = dataSource.getRepository(Recordatorio);
  const recordatorioCount = await recordatorioRepo.count({ where: { taller_id: tallerId } });
  if (recordatorioCount > 0 || vehiculos.length === 0) {
    return;
  }

  const reminderSeeds = [
    {
      vehiculo: vehiculos[0],
      tipo: TipoRecordatorio.REV_TECNICA,
      mensaje: 'Revisión técnica próxima a vencer, coordinar inspección esta semana.',
      fecha_envio: daysFromNow(7),
      canal: CanalRecordatorio.EMAIL,
      estado: EstadoRecordatorio.ENVIADO,
      enviado_at: daysAgo(1),
      created_at: daysAgo(1),
    },
    {
      vehiculo: vehiculos[1] ?? vehiculos[0],
      tipo: TipoRecordatorio.PERMISO_CIRCULACION,
      mensaje: 'Permiso de circulación pendiente de renovación antes del cierre de mes.',
      fecha_envio: daysFromNow(10),
      canal: CanalRecordatorio.AMBOS,
      estado: EstadoRecordatorio.PENDIENTE,
      created_at: new Date(),
    },
    {
      vehiculo: vehiculos[2] ?? vehiculos[0],
      tipo: TipoRecordatorio.SOAP,
      mensaje: 'SOAP por vencer, sugerimos regularizar para mantener cobertura activa.',
      fecha_envio: daysFromNow(14),
      canal: CanalRecordatorio.EMAIL,
      estado: EstadoRecordatorio.PENDIENTE,
      created_at: new Date(),
    },
    {
      vehiculo: vehiculos[3] ?? vehiculos[0],
      tipo: TipoRecordatorio.MANTENCION,
      mensaje: 'Mantención preventiva sugerida por kilometraje y última visita.',
      fecha_envio: daysFromNow(21),
      canal: CanalRecordatorio.EMAIL,
      estado: EstadoRecordatorio.ENVIADO,
      enviado_at: daysAgo(2),
      created_at: daysAgo(2),
    },
    {
      vehiculo: vehiculos[4] ?? vehiculos[0],
      tipo: TipoRecordatorio.SEGUIMIENTO,
      mensaje: 'Seguimiento post servicio para confirmar satisfacción del cliente.',
      fecha_envio: daysFromNow(4),
      canal: CanalRecordatorio.WSP,
      estado: EstadoRecordatorio.PENDIENTE,
      created_at: new Date(),
    },
  ];

  for (const reminderSeed of reminderSeeds) {
    if (!reminderSeed.vehiculo) {
      continue;
    }

    await recordatorioRepo.save(
      recordatorioRepo.create({
        taller_id: tallerId,
        cliente_id: reminderSeed.vehiculo.cliente_id,
        vehiculo_id: reminderSeed.vehiculo.id,
        tipo: reminderSeed.tipo,
        mensaje: reminderSeed.mensaje,
        fecha_envio: reminderSeed.fecha_envio,
        canal: reminderSeed.canal,
        estado: reminderSeed.estado,
        enviado_at: reminderSeed.enviado_at,
        created_at: reminderSeed.created_at,
      }),
    );
  }

  logger.log(`Created demo reminders for taller ${tallerId}`);
}

export async function ensureDemoData(dataSource: DataSource) {
  const tallerId = await resolveTargetTallerId(dataSource);
  if (!tallerId) {
    logger.warn('Skipping demo seed: no taller found');
    return;
  }

  const clienteRepo = dataSource.getRepository(Cliente);
  const vehiculoRepo = dataSource.getRepository(Vehiculo);

  const [plansByName, clientes, vehiculos] = await Promise.all([
    ensurePlans(dataSource),
    clienteRepo.find({ where: { taller_id: tallerId }, order: { id: 'ASC' }, take: 8 }),
    vehiculoRepo.find({
      where: { taller_id: tallerId },
      relations: ['cliente'],
      order: { id: 'ASC' },
      take: 8,
    }),
  ]);

  const proPlan = plansByName.get('pro');
  if (!proPlan) {
    logger.warn('Skipping demo seed: pro plan unavailable');
    return;
  }

  const suscripcion = await ensureSubscription(dataSource, tallerId, proPlan);

  await Promise.all([
    ensurePaymentHistory(dataSource, suscripcion, proPlan),
    ensureNotificationVehicles(dataSource, vehiculos),
  ]);

  await Promise.all([
    ensureEmailHistory(dataSource, tallerId, clientes, vehiculos),
    ensureRecordatorios(dataSource, tallerId, vehiculos),
  ]);
}
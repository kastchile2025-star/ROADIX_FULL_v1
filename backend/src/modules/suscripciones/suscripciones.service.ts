import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, LessThan } from 'typeorm';
import { Suscripcion } from '../../database/entities/suscripcion.entity.js';
import { Plan } from '../../database/entities/plan.entity.js';
import { HistorialPagoSuscripcion } from '../../database/entities/historial-pago-suscripcion.entity.js';
import { Usuario } from '../../database/entities/usuario.entity.js';
import { Vehiculo } from '../../database/entities/vehiculo.entity.js';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { Taller } from '../../database/entities/taller.entity.js';
import {
  SuscripcionEstado,
  SuscripcionPeriodo,
  PagoSuscripcionEstado,
  UserRole,
  TipoEmail,
} from '../../common/enums.js';
import { CambiarPlanDto } from './dto/cambiar-plan.dto.js';
import { EnterpriseContactDto } from './dto/enterprise-contact.dto.js';
import { CreateFlowPaymentDto } from '../flow/dto/create-flow-payment.dto.js';
import { FlowService } from '../flow/flow.service.js';
import { EmailService } from '../email/email.service.js';

type FlowPaymentResponse = {
  commerceOrder?: string;
  token?: string;
  flowOrder?: number | string;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
};

type PendingPlanChange = {
  planId: number;
  periodo: SuscripcionPeriodo;
  amount: number;
  currentPlanId: number;
  initiatedAt: string;
  initiatedByEmail?: string;
};

type FlowPlanChangeCheckout = {
  requiresPayment: true;
  provider: 'flow';
  checkoutUrl: string;
  token?: string;
  flowOrder?: string;
  commerceOrder: string;
  amount: number;
  planId: number;
  periodo: SuscripcionPeriodo;
};

@Injectable()
export class SuscripcionesService {
  private readonly logger = new Logger(SuscripcionesService.name);

  constructor(
    @InjectRepository(Suscripcion)
    private readonly suscripcionRepo: Repository<Suscripcion>,
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    @InjectRepository(HistorialPagoSuscripcion)
    private readonly historialPagoRepo: Repository<HistorialPagoSuscripcion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepo: Repository<Vehiculo>,
    @InjectRepository(OrdenTrabajo)
    private readonly otRepo: Repository<OrdenTrabajo>,
    @InjectRepository(Taller)
    private readonly tallerRepo: Repository<Taller>,
    @Inject(forwardRef(() => FlowService))
    private readonly flowService: FlowService,
    private readonly emailService: EmailService,
  ) {}

  private async cargarSuscripcionPorTaller(tallerId: number) {
    return this.suscripcionRepo.findOne({
      where: { taller_id: tallerId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
  }

  async findByTaller(tallerId: number) {
    const suscripcion = await this.cargarSuscripcionPorTaller(tallerId);
    if (!suscripcion) return null;

    await this.conciliarPagosPendientesFlow(suscripcion);
    return this.cargarSuscripcionPorTaller(tallerId);
  }

  async getActivePlan(tallerId: number) {
    const suscripcion = await this.findByTaller(tallerId);
    if (!suscripcion) throw new NotFoundException('Sin suscripción activa');
    return suscripcion;
  }

  async prepararPagoFlow(suscripcionId: number, dto: CreateFlowPaymentDto) {
    const suscripcion = await this.suscripcionRepo.findOne({
      where: { id: suscripcionId },
      relations: ['plan', 'taller'],
    });

    if (!suscripcion) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    const amount = dto.amount || this.obtenerMontoSuscripcion(suscripcion);
    const externalId = dto.externalId || `sub-${suscripcion.id}-${Date.now()}`;
    const subject = dto.subject || `ROADIX ${(suscripcion.plan?.nombre ?? 'Suscripcion').toUpperCase()}`;

    const historialPago = await this.registrarPago(
      suscripcion,
      amount,
      PagoSuscripcionEstado.PENDIENTE,
      externalId,
      undefined,
      undefined,
      undefined,
      'PENDING_CREATE',
      'Pago Flow creado en backend y pendiente de confirmación por webhook',
      'flow',
    );

    suscripcion.referencia_pago = externalId;
    suscripcion.referencia_pago_externa = externalId;
    await this.suscripcionRepo.save(suscripcion);

    return {
      suscripcionId: suscripcion.id,
      suscripcion,
      historialPago,
      dto: {
        ...dto,
        amount,
        externalId,
        subject,
        email: dto.email,
      },
    };
  }

  async registrarPagoFlowCreado(suscripcionId: number, payment: FlowPaymentResponse) {
    const suscripcion = await this.suscripcionRepo.findOne({
      where: { id: suscripcionId },
      relations: ['plan', 'taller'],
    });

    if (!suscripcion) {
      throw new NotFoundException('Suscripción no encontrada para registrar Flow');
    }

    const flowRef = this.extraerFlowReferencia(payment);
    suscripcion.referencia_pago = payment.commerceOrder ?? suscripcion.referencia_pago;
    suscripcion.referencia_pago_externa = flowRef ?? suscripcion.referencia_pago_externa;
    await this.suscripcionRepo.save(suscripcion);

    await this.actualizarPagoPendientePorReferencia(
      suscripcion.id,
      payment.commerceOrder,
      {
        referencia_externa: flowRef,
        codigo_respuesta: 'FLOW_CREATED',
        detalle_respuesta: this.safeJson({
          request: payment.request,
          response: payment.response,
        }),
      },
    );

    return {
      suscripcionId: suscripcion.id,
      commerceOrder: payment.commerceOrder,
      flowRef,
    };
  }

  async conciliarPagoFlowDesdeWebhook(token: string, statusPayload: { response?: Record<string, unknown> }) {
    const response = statusPayload.response ?? {};
    const commerceOrder = this.asString(response['commerceOrder']);
    const flowOrder = this.asString(response['flowOrder']);
    const statusCode = this.asString(response['status']) ?? 'UNKNOWN';
    const pago = await this.buscarPagoPorReferencia(commerceOrder, token, flowOrder);
    const pendingPlanChange = this.extraerCambioPlanPendiente(pago?.detalle_respuesta);
    const isPlanChangeCheckout = Boolean(pendingPlanChange);

    const suscripcion = await this.buscarSuscripcionPorReferencia(commerceOrder, token, flowOrder);
    if (!suscripcion) {
      this.logger.warn(`Webhook Flow sin suscripción asociada token=${token} commerceOrder=${commerceOrder}`);
      return {
        matched: false,
        token,
        commerceOrder,
        flowOrder,
        statusCode,
      };
    }

    const amount = Number(
      response['amount']
      ?? pendingPlanChange?.amount
      ?? suscripcion.monto_pagado
      ?? this.obtenerMontoSuscripcion(suscripcion),
    );
    const paid = this.flowStatusEsExitoso(response);
    const rejected = this.flowStatusEsFallido(response);

    const referenciaInterna = commerceOrder ?? suscripcion.referencia_pago ?? token;
    const referenciaExterna = flowOrder ?? token;

    if (paid) {
      const periodoDesde = new Date();

      if (pendingPlanChange) {
        suscripcion.plan_id = pendingPlanChange.planId;
        suscripcion.periodo = pendingPlanChange.periodo;
        const targetPlan = await this.planRepo.findOneBy({ id: pendingPlanChange.planId });
        if (targetPlan) {
          suscripcion.plan = targetPlan;
        }
      }

      suscripcion.estado = SuscripcionEstado.ACTIVA;
      suscripcion.proximo_cobro = this.calcularProximoCobro(suscripcion.periodo, periodoDesde);
      suscripcion.fecha_fin = suscripcion.proximo_cobro;
      suscripcion.fecha_inicio = periodoDesde;
      suscripcion.trial_hasta = null as unknown as Date;
      suscripcion.cancelado_at = null as unknown as Date;
      suscripcion.monto_pagado = amount;
      suscripcion.metodo_pago = 'flow';
      suscripcion.referencia_pago = referenciaInterna;
      suscripcion.referencia_pago_externa = referenciaExterna;
      suscripcion.billing_retry_count = 0;
      suscripcion.billing_last_retry_at = null as unknown as Date;
      suscripcion.billing_next_retry_at = null as unknown as Date;
      await this.suscripcionRepo.save(suscripcion);

      await this.upsertHistorialFlow(
        suscripcion,
        amount,
        PagoSuscripcionEstado.EXITOSO,
        referenciaInterna,
        referenciaExterna,
        statusCode,
        this.safeJson(response),
        periodoDesde,
        suscripcion.proximo_cobro,
      );

      return {
        matched: true,
        suscripcionId: suscripcion.id,
        estado: 'paid',
        statusCode,
        appliedPlanId: pendingPlanChange?.planId,
      };
    }

    if (isPlanChangeCheckout) {
      await this.upsertHistorialFlow(
        suscripcion,
        amount,
        rejected ? PagoSuscripcionEstado.FALLIDO : PagoSuscripcionEstado.PENDIENTE,
        referenciaInterna,
        referenciaExterna,
        statusCode,
        this.safeJson({ response }),
      );

      return {
        matched: true,
        suscripcionId: suscripcion.id,
        estado: rejected ? 'failed' : 'pending',
        statusCode,
      };
    }

    const nextRetryCount = (suscripcion.billing_retry_count ?? 0) + 1;
    suscripcion.referencia_pago = referenciaInterna;
    suscripcion.referencia_pago_externa = referenciaExterna;
    suscripcion.billing_retry_count = nextRetryCount;
    suscripcion.billing_last_retry_at = new Date();
    suscripcion.billing_next_retry_at = this.calcularProximoRetry(nextRetryCount, new Date()) as Date;

    if (rejected && nextRetryCount >= 3) {
      suscripcion.estado = SuscripcionEstado.SUSPENDIDA;
      suscripcion.billing_next_retry_at = null as unknown as Date;
    }

    await this.suscripcionRepo.save(suscripcion);

    await this.upsertHistorialFlow(
      suscripcion,
      amount,
      rejected ? PagoSuscripcionEstado.FALLIDO : PagoSuscripcionEstado.PENDIENTE,
      referenciaInterna,
      referenciaExterna,
      statusCode,
      this.safeJson(response),
    );

    return {
      matched: true,
      suscripcionId: suscripcion.id,
      estado: rejected ? 'failed' : 'pending',
      statusCode,
      retryCount: suscripcion.billing_retry_count,
      nextRetryAt: suscripcion.billing_next_retry_at,
    };
  }

  /** Returns current resource usage vs plan limits */
  async getUsage(tallerId: number) {
    const suscripcion = await this.getActivePlan(tallerId);
    const plan = suscripcion.plan;

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const [usuarios, vehiculos, otsMes] = await Promise.all([
      this.usuarioRepo.count({ where: { taller_id: tallerId, activo: true } }),
      this.vehiculoRepo.count({ where: { taller_id: tallerId } }),
      this.otRepo
        .createQueryBuilder('ot')
        .where('ot.taller_id = :tallerId', { tallerId })
        .andWhere('ot.created_at >= :desde', { desde: inicioMes })
        .getCount(),
    ]);

    return {
      usuarios: { usado: usuarios, limite: plan.max_usuarios },
      vehiculos: { usado: vehiculos, limite: plan.max_vehiculos },
      ots_mes: { usado: otsMes, limite: plan.max_ots_mes },
      storage_mb: { usado: 0, limite: plan.max_storage_mb },
    };
  }

  async getHistorialPagos(tallerId: number) {
    const suscripcion = await this.findByTaller(tallerId);
    if (!suscripcion) return [];
    return this.historialPagoRepo.find({
      where: { suscripcion_id: suscripcion.id },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async solicitarContactoEnterprise(
    tallerId: number,
    dto: EnterpriseContactDto,
    fallbackEmail?: string,
  ) {
    const destinatario = 'jorge.castro@qcore.com';
    const asunto = `Solicitud Enterprise ROADIX - ${dto.taller_nombre}`;
    const contactoEmail = dto.email?.trim() || fallbackEmail?.trim() || 'sin-email';
    const mensaje = (dto.mensaje ?? '').trim() || 'Sin mensaje adicional';

    const html = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #1a56db;">Nueva solicitud Enterprise ROADIX</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Nombre</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${dto.nombre}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Taller</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${dto.taller_nombre}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${contactoEmail}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Teléfono</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${dto.telefono?.trim() || 'No informado'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Periodo</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${dto.periodo}</td></tr>
        </table>
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-top: 12px;">
          <strong>Mensaje:</strong><br/>
          <p style="white-space: pre-wrap;">${mensaje}</p>
        </div>
        <hr style="margin-top: 24px; border: none; border-top: 1px solid #eee;" />
        <p style="color: #888; font-size: 12px;">Roadix — Sistema de Gestión de Taller</p>
      </div>
    `;

    // Send directly bypassing Bull/Redis queue
    this.emailService
      .enviarDirecto(tallerId, TipoEmail.MARKETING, destinatario, asunto, html)
      .catch((err) =>
        this.logger.error(`Enterprise contact email failed: ${err.message}`),
      );

    return {
      ok: true,
      destinatario,
      asunto,
    };
  }

  async cambiarPlan(tallerId: number, dto: CambiarPlanDto, billingEmail?: string) {
    const suscripcion = await this.getActivePlan(tallerId);
    const nuevoPlan = await this.planRepo.findOneBy({ id: dto.plan_id, activo: true });
    if (!nuevoPlan) throw new NotFoundException('Plan no encontrado');

    if (suscripcion.plan_id === dto.plan_id && suscripcion.periodo === dto.periodo) {
      throw new BadRequestException('Ya estás en este plan y período');
    }

    const monto =
      dto.periodo === SuscripcionPeriodo.ANUAL
        ? nuevoPlan.precio_anual
        : nuevoPlan.precio_mensual;

    const ahora = new Date();
    const proximoCobro = new Date(ahora);
    if (dto.periodo === SuscripcionPeriodo.ANUAL) {
      proximoCobro.setFullYear(proximoCobro.getFullYear() + 1);
    } else {
      proximoCobro.setMonth(proximoCobro.getMonth() + 1);
    }

    if (monto === 0) {
      suscripcion.plan_id = dto.plan_id;
      suscripcion.periodo = dto.periodo;
      suscripcion.estado = SuscripcionEstado.ACTIVA;
      suscripcion.proximo_cobro = null as unknown as Date;
      suscripcion.monto_pagado = 0;
      return this.suscripcionRepo.save(suscripcion);
    }

    if (this.flowService.isConfigured()) {
      return this.crearCheckoutCambioPlan(
        suscripcion,
        nuevoPlan,
        dto,
        monto,
        dto.billing_email ?? billingEmail,
      );
    }

    const pagoExitoso = await this.procesarPagoGateway(
      monto,
      suscripcion,
      dto.billing_email ?? billingEmail,
    );

    if (!pagoExitoso.success) {
      await this.registrarPago(suscripcion, monto, PagoSuscripcionEstado.FALLIDO, pagoExitoso.referencia);
      throw new BadRequestException('El pago no pudo ser procesado. Intenta con otro método de pago.');
    }

    suscripcion.plan_id = dto.plan_id;
    suscripcion.periodo = dto.periodo;
    suscripcion.estado = SuscripcionEstado.ACTIVA;
    suscripcion.fecha_fin = proximoCobro;
    suscripcion.proximo_cobro = proximoCobro;
    suscripcion.monto_pagado = monto;
    suscripcion.metodo_pago = pagoExitoso.metodo ?? 'tarjeta';

    const saved = await this.suscripcionRepo.save(suscripcion);

    await this.registrarPago(
      suscripcion,
      monto,
      PagoSuscripcionEstado.EXITOSO,
      pagoExitoso.referencia,
      ahora,
      proximoCobro,
    );

    return saved;
  }

  async cancelar(tallerId: number) {
    const suscripcion = await this.getActivePlan(tallerId);

    if (suscripcion.estado === SuscripcionEstado.CANCELADA) {
      throw new BadRequestException('La suscripción ya está cancelada');
    }

    suscripcion.auto_renovar = false;
    suscripcion.cancelado_at = new Date();

    if (
      suscripcion.estado === SuscripcionEstado.TRIAL ||
      suscripcion.plan.precio_mensual === 0
    ) {
      suscripcion.estado = SuscripcionEstado.CANCELADA;
    }

    return this.suscripcionRepo.save(suscripcion);
  }

  async reactivar(tallerId: number) {
    const suscripcion = await this.getActivePlan(tallerId);

    if (suscripcion.estado === SuscripcionEstado.ACTIVA) {
      throw new BadRequestException('La suscripción ya está activa');
    }

    suscripcion.auto_renovar = true;
    suscripcion.cancelado_at = null as unknown as Date;
    suscripcion.estado = SuscripcionEstado.ACTIVA;
    suscripcion.proximo_cobro = new Date();

    return this.suscripcionRepo.save(suscripcion);
  }

  async editarSuscripcion(
    tallerId: number,
    dto: { periodo?: string; fecha_fin?: string },
  ) {
    const suscripcion = await this.getActivePlan(tallerId);

    if (dto.periodo && ['mensual', 'anual'].includes(dto.periodo)) {
      suscripcion.periodo = dto.periodo as SuscripcionPeriodo;
    }

    if (dto.fecha_fin) {
      suscripcion.fecha_fin = new Date(dto.fecha_fin);
    }

    return this.suscripcionRepo.save(suscripcion);
  }

  /** Superadmin: list all talleres with users and subscription info */
  async getAllTalleresAdmin() {
    const talleres = await this.tallerRepo.find({
      relations: ['usuarios', 'suscripciones', 'suscripciones.plan'],
      order: { created_at: 'DESC' },
    });

    return talleres.map((t) => {
      const sub = t.suscripciones
        ?.sort(
          (a: Suscripcion, b: Suscripcion) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0] ?? null;

      return {
        id: t.id,
        nombre: t.nombre,
        rut: t.rut,
        telefono: t.telefono,
        created_at: t.created_at,
        usuarios: (t.usuarios ?? []).map((u: Usuario) => ({
          id: u.id,
          nombre: u.nombre,
          email: u.email,
          rol: u.rol,
          telefono: u.telefono,
          activo: u.activo,
          created_at: u.created_at,
        })),
        suscripcion: sub
          ? {
              id: sub.id,
              plan_id: sub.plan?.id ?? null,
              plan_nombre: sub.plan?.nombre ?? 'sin-plan',
              periodo: sub.periodo,
              estado: sub.estado,
              fecha_inicio: sub.fecha_inicio,
              fecha_fin: sub.fecha_fin,
              trial_hasta: sub.trial_hasta,
              proximo_cobro: sub.proximo_cobro,
              auto_renovar: sub.auto_renovar,
              cancelado_at: sub.cancelado_at,
            }
          : null,
      };
    });
  }

  /** Superadmin: edit any taller's subscription */
  async editarSuscripcionAdmin(
    tallerId: number,
    dto: { periodo?: string; fecha_fin?: string; estado?: string; plan_id?: number },
  ) {
    const suscripcion = await this.suscripcionRepo.findOne({
      where: { taller_id: tallerId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
    if (!suscripcion) throw new NotFoundException('Suscripción no encontrada para este taller');

    let autoActivated = false;

    if (dto.plan_id) {
      const plan = await this.planRepo.findOneBy({ id: dto.plan_id });
      if (plan) {
        suscripcion.plan_id = plan.id;
        suscripcion.plan = plan;
        // If upgrading to a paid plan, auto-activate with mensual + 1 month
        if (['starter', 'pro', 'enterprise'].includes(plan.nombre)) {
          suscripcion.estado = SuscripcionEstado.ACTIVA;
          suscripcion.periodo = 'mensual' as SuscripcionPeriodo;
          const enUnMes = new Date();
          enUnMes.setMonth(enUnMes.getMonth() + 1);
          suscripcion.fecha_fin = enUnMes;
          suscripcion.proximo_cobro = enUnMes;
          autoActivated = true;
        }
      }
    }
    // Only apply manual overrides if no auto-activation happened
    if (!autoActivated) {
      if (dto.periodo && ['mensual', 'anual'].includes(dto.periodo)) {
        suscripcion.periodo = dto.periodo as SuscripcionPeriodo;
      }
      if (dto.fecha_fin) {
        suscripcion.fecha_fin = new Date(dto.fecha_fin);
      }
      if (dto.estado) {
        const validStates = Object.values(SuscripcionEstado) as string[];
        if (validStates.includes(dto.estado)) {
          suscripcion.estado = dto.estado as SuscripcionEstado;
        }
      }
    }

    return this.suscripcionRepo.save(suscripcion);
  }

  async procesarCobrosRecurrentes() {
    const hoy = new Date();

    const suscripciones = await this.suscripcionRepo.find({
      where: {
        proximo_cobro: LessThanOrEqual(hoy),
        estado: SuscripcionEstado.ACTIVA,
        auto_renovar: true,
      },
      relations: ['plan', 'taller'],
    });

    for (const s of suscripciones) {
      await this.procesarIntentoCobro(s, hoy, 'renovacion');
    }
  }

  async procesarReintentosCobro() {
    const hoy = new Date();

    const suscripciones = await this.suscripcionRepo.find({
      where: {
        billing_next_retry_at: LessThanOrEqual(hoy),
        estado: SuscripcionEstado.ACTIVA,
        auto_renovar: true,
      },
      relations: ['plan', 'taller'],
    });

    for (const s of suscripciones) {
      if ((s.billing_retry_count ?? 0) >= 3) {
        s.estado = SuscripcionEstado.SUSPENDIDA;
        s.billing_next_retry_at = null as unknown as Date;
        await this.suscripcionRepo.save(s);
        this.logger.warn(`Suscripción suspendida por retries agotados taller=${s.taller_id}`);
        continue;
      }

      await this.procesarIntentoCobro(s, hoy, 'retry');
    }
  }

  async procesarTrialsVencidos() {
    const hoy = new Date();

    const trialsVencidos = await this.suscripcionRepo.find({
      where: {
        estado: SuscripcionEstado.TRIAL,
        trial_hasta: LessThan(hoy),
      },
    });

    for (const s of trialsVencidos) {
      s.estado = SuscripcionEstado.VENCIDA;
      await this.suscripcionRepo.save(s);
      this.logger.log(`Trial vencido taller=${s.taller_id}`);
    }
  }

  private obtenerMontoSuscripcion(suscripcion: Suscripcion): number {
    return suscripcion.periodo === SuscripcionPeriodo.ANUAL
      ? Number(suscripcion.plan?.precio_anual ?? 0)
      : Number(suscripcion.plan?.precio_mensual ?? 0);
  }

  private calcularProximoCobro(periodo: SuscripcionPeriodo, desde = new Date()): Date {
    const fecha = new Date(desde);
    if (periodo === SuscripcionPeriodo.ANUAL) {
      fecha.setFullYear(fecha.getFullYear() + 1);
    } else {
      fecha.setMonth(fecha.getMonth() + 1);
    }
    return fecha;
  }

  private calcularProximoRetry(intentos: number, desde: Date): Date | null {
    if (intentos <= 1) {
      const fecha = new Date(desde);
      fecha.setDate(fecha.getDate() + 1);
      return fecha;
    }

    if (intentos === 2) {
      const fecha = new Date(desde);
      fecha.setDate(fecha.getDate() + 3);
      return fecha;
    }

    return null;
  }

  private flowStatusEsExitoso(response: Record<string, unknown>) {
    const status = this.asString(response['status']);
    return status === '2' || status?.toLowerCase() === 'paid';
  }

  private flowStatusEsFallido(response: Record<string, unknown>) {
    const status = this.asString(response['status']);
    return ['3', '4', '5', 'rejected', 'canceled', 'failed'].includes((status ?? '').toLowerCase());
  }

  private extraerFlowReferencia(payment: FlowPaymentResponse) {
    const response = payment.response ?? {};
    return this.asString(response['flowOrder']) ?? this.asString(response['token']) ?? payment.token;
  }

  private asString(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    return String(value);
  }

  private safeJson(value: unknown) {
    try {
      return JSON.stringify(value);
    } catch {
      return 'unserializable_payload';
    }
  }

  private parseJsonObject(value?: string) {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null
        ? parsed as Record<string, unknown>
        : null;
    } catch {
      return null;
    }
  }

  private mergeDetalleRespuesta(actual?: string, patch?: string) {
    if (!patch) return actual;

    const currentPayload = this.parseJsonObject(actual);
    const patchPayload = this.parseJsonObject(patch);

    if (currentPayload && patchPayload) {
      return this.safeJson({
        ...currentPayload,
        ...patchPayload,
      });
    }

    return patch;
  }

  private extraerCambioPlanPendiente(detalle?: string): PendingPlanChange | null {
    const payload = this.parseJsonObject(detalle);
    const pendingPlan = payload?.pendingPlan;
    if (!pendingPlan || typeof pendingPlan !== 'object') {
      return null;
    }

    const planId = Number((pendingPlan as Record<string, unknown>).planId);
    const periodo = this.asString((pendingPlan as Record<string, unknown>).periodo) as SuscripcionPeriodo | undefined;
    const amount = Number((pendingPlan as Record<string, unknown>).amount);
    const currentPlanId = Number((pendingPlan as Record<string, unknown>).currentPlanId ?? 0);
    const initiatedAt = this.asString((pendingPlan as Record<string, unknown>).initiatedAt) ?? new Date().toISOString();
    const initiatedByEmail = this.asString((pendingPlan as Record<string, unknown>).initiatedByEmail);

    if (!Number.isFinite(planId) || !Number.isFinite(amount)) {
      return null;
    }

    if (periodo !== SuscripcionPeriodo.MENSUAL && periodo !== SuscripcionPeriodo.ANUAL) {
      return null;
    }

    return {
      planId,
      periodo,
      amount,
      currentPlanId,
      initiatedAt,
      initiatedByEmail,
    };
  }

  private extraerFlowCheckoutUrl(response: Record<string, unknown>) {
    const baseUrl = this.asString(response['url'])
      ?? this.asString(response['paymentUrl'])
      ?? this.asString(response['redirectUrl']);
    const token = this.asString(response['token']);

    if (!baseUrl) return undefined;
    if (token && !/[?&]token=/.test(baseUrl)) {
      return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
    }
    return baseUrl;
  }

  private extraerTokenFlowDesdeDetalle(detalle?: string) {
    const payload = this.parseJsonObject(detalle);
    if (!payload) return undefined;

    const response = payload.response;
    if (response && typeof response === 'object') {
      const nestedToken = this.asString((response as Record<string, unknown>).token);
      if (nestedToken) return nestedToken;
    }

    return this.asString(payload.token);
  }

  private extraerTokenFlowDesdePago(pago: HistorialPagoSuscripcion) {
    const referenciaExterna = this.asString(pago.referencia_externa);
    if (referenciaExterna && !/^\d+$/.test(referenciaExterna) && !referenciaExterna.startsWith('sub-')) {
      return referenciaExterna;
    }

    return this.extraerTokenFlowDesdeDetalle(pago.detalle_respuesta);
  }

  private esPagoPendienteDeFlow(pago: HistorialPagoSuscripcion) {
    if (pago.estado !== PagoSuscripcionEstado.PENDIENTE) {
      return false;
    }

    if (pago.metodo_pago === 'flow') {
      return true;
    }

    const codigo = this.asString(pago.codigo_respuesta) ?? '';
    if (codigo.startsWith('PENDING_') || codigo === 'FLOW_CREATED') {
      return true;
    }

    const detalle = this.parseJsonObject(pago.detalle_respuesta);
    return Boolean(detalle?.pendingPlan || detalle?.response || pago.referencia?.startsWith('sub-'));
  }

  private async conciliarPagosPendientesFlow(suscripcion: Suscripcion) {
    if (!this.flowService.isConfigured()) {
      return;
    }

    const pagosPendientes = await this.historialPagoRepo.find({
      where: {
        suscripcion_id: suscripcion.id,
        estado: PagoSuscripcionEstado.PENDIENTE,
      },
      order: { created_at: 'DESC' },
      take: 10,
    });

    const processedTokens = new Set<string>();

    for (const pago of pagosPendientes) {
      if (!this.esPagoPendienteDeFlow(pago)) {
        continue;
      }

      const token = this.extraerTokenFlowDesdePago(pago);
      if (!token || processedTokens.has(token)) {
        continue;
      }

      processedTokens.add(token);

      try {
        const statusPayload = await this.flowService.getPaymentStatus(token);
        const statusResponse = (statusPayload.response ?? {}) as Record<string, unknown>;
        await this.conciliarPagoFlowDesdeWebhook(token, { response: statusResponse });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown Flow reconciliation error';
        this.logger.warn(`No se pudo conciliar pago Flow pendiente ${pago.referencia ?? pago.id}: ${message}`);
      }
    }
  }

  private isValidBillingEmail(email?: string) {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  private async resolveBillingEmail(tallerId: number, preferredEmail?: string) {
    if (this.isValidBillingEmail(preferredEmail)) {
      return preferredEmail!.trim();
    }

    const candidates = await this.usuarioRepo.find({
      where: [
        { taller_id: tallerId, rol: UserRole.ADMIN_TALLER, activo: true },
        { taller_id: tallerId, rol: UserRole.SUPERADMIN, activo: true },
      ],
      order: { created_at: 'ASC' },
      take: 5,
    });

    const validUser = candidates.find((user) => this.isValidBillingEmail(user.email));
    if (validUser) {
      return validUser.email.trim();
    }

    throw new BadRequestException('Se requiere un correo valido para continuar con el pago en Flow. Actualiza el email del administrador.');
  }

  private async buscarPagoPorReferencia(
    commerceOrder?: string,
    token?: string,
    flowOrder?: string,
  ) {
    if (commerceOrder) {
      const byOrder = await this.historialPagoRepo.findOne({
        where: { referencia: commerceOrder },
        order: { created_at: 'DESC' },
      });
      if (byOrder) return byOrder;
    }

    if (flowOrder) {
      const byFlowOrder = await this.historialPagoRepo.findOne({
        where: { referencia_externa: flowOrder },
        order: { created_at: 'DESC' },
      });
      if (byFlowOrder) return byFlowOrder;
    }

    if (token) {
      return this.historialPagoRepo.findOne({
        where: { referencia_externa: token },
        order: { created_at: 'DESC' },
      });
    }

    return null;
  }

  private async buscarSuscripcionPorReferencia(
    commerceOrder?: string,
    token?: string,
    flowOrder?: string,
  ) {
    if (commerceOrder) {
      const byOrder = await this.suscripcionRepo.findOne({
        where: [{ referencia_pago: commerceOrder }, { referencia_pago_externa: commerceOrder }],
        relations: ['plan', 'taller'],
      });
      if (byOrder) return byOrder;
    }

    if (flowOrder) {
      const byFlowOrder = await this.suscripcionRepo.findOne({
        where: { referencia_pago_externa: flowOrder },
        relations: ['plan', 'taller'],
      });
      if (byFlowOrder) return byFlowOrder;
    }

    if (token) {
      const byToken = await this.historialPagoRepo.findOne({
        where: { referencia_externa: token },
        order: { created_at: 'DESC' },
      });
      if (byToken) {
        return this.suscripcionRepo.findOne({
          where: { id: byToken.suscripcion_id },
          relations: ['plan', 'taller'],
        });
      }
    }

    return null;
  }

  private async actualizarPagoPendientePorReferencia(
    suscripcionId: number,
    referencia?: string,
    patch?: Partial<HistorialPagoSuscripcion>,
  ) {
    if (!referencia) return null;

    const pago = await this.historialPagoRepo.findOne({
      where: {
        suscripcion_id: suscripcionId,
        referencia,
      },
      order: { created_at: 'DESC' },
    });

    if (!pago) return null;

    const nextPatch = { ...(patch ?? {}) };
    if (Object.prototype.hasOwnProperty.call(nextPatch, 'detalle_respuesta')) {
      nextPatch.detalle_respuesta = this.mergeDetalleRespuesta(
        pago.detalle_respuesta,
        nextPatch.detalle_respuesta,
      );
    }

    Object.assign(pago, nextPatch);
    return this.historialPagoRepo.save(pago);
  }

  private async upsertHistorialFlow(
    suscripcion: Suscripcion,
    monto: number,
    estado: PagoSuscripcionEstado,
    referencia: string,
    referenciaExterna: string,
    codigoRespuesta: string,
    detalleRespuesta: string,
    periodoDesde?: Date,
    periodoHasta?: Date,
  ) {
    let pago = await this.historialPagoRepo.findOne({
      where: { suscripcion_id: suscripcion.id, referencia },
      order: { created_at: 'DESC' },
    });

    if (!pago) {
      pago = this.historialPagoRepo.create({
        suscripcion_id: suscripcion.id,
        monto,
        metodo_pago: 'flow',
        referencia,
        referencia_externa: referenciaExterna,
        codigo_respuesta: codigoRespuesta,
        detalle_respuesta: detalleRespuesta,
        estado,
        fecha_pago: new Date(),
        periodo_desde: periodoDesde,
        periodo_hasta: periodoHasta,
      });
    } else {
      pago.monto = monto;
      pago.metodo_pago = 'flow';
      pago.referencia_externa = referenciaExterna;
      pago.codigo_respuesta = codigoRespuesta;
      pago.detalle_respuesta = this.mergeDetalleRespuesta(
        pago.detalle_respuesta,
        detalleRespuesta,
      ) ?? pago.detalle_respuesta;
      pago.estado = estado;
      pago.fecha_pago = new Date();
      pago.periodo_desde = periodoDesde ?? pago.periodo_desde;
      pago.periodo_hasta = periodoHasta ?? pago.periodo_hasta;
    }

    return this.historialPagoRepo.save(pago);
  }

  private async crearCheckoutCambioPlan(
    suscripcion: Suscripcion,
    nuevoPlan: Plan,
    dto: CambiarPlanDto,
    monto: number,
    billingEmail?: string,
  ): Promise<FlowPlanChangeCheckout> {
    const resolvedEmail = await this.resolveBillingEmail(suscripcion.taller_id, billingEmail);
    const prepared = await this.prepararPagoFlow(
      suscripcion.id,
      {
        amount: monto,
        externalId: `sub-${suscripcion.id}-${Date.now()}`,
        subject: `ROADIX ${nuevoPlan.nombre.toUpperCase()}`,
        email: resolvedEmail,
      } as CreateFlowPaymentDto,
    );

    await this.actualizarPagoPendientePorReferencia(suscripcion.id, prepared.dto.externalId, {
      codigo_respuesta: 'PENDING_FLOW_CHECKOUT',
      detalle_respuesta: this.safeJson({
        reason: 'plan_change',
        pendingPlan: {
          planId: dto.plan_id,
          periodo: dto.periodo,
          amount: monto,
          currentPlanId: suscripcion.plan_id,
          initiatedAt: new Date().toISOString(),
          initiatedByEmail: resolvedEmail,
        },
      }),
    });

    const created = await this.flowService.createPayment(prepared.dto);
    const flowResponse = (created.response ?? {}) as Record<string, unknown>;
    const checkoutUrl = this.extraerFlowCheckoutUrl(flowResponse);

    if (!checkoutUrl) {
      throw new BadRequestException('Flow no devolvio una URL de pago valida');
    }

    await this.registrarPagoFlowCreado(suscripcion.id, {
      commerceOrder: prepared.dto.externalId,
      token: this.asString(flowResponse['token']),
      flowOrder: this.asString(flowResponse['flowOrder']),
      request: created.payload,
      response: flowResponse,
    });

    return {
      requiresPayment: true,
      provider: 'flow',
      checkoutUrl,
      token: this.asString(flowResponse['token']),
      flowOrder: this.asString(flowResponse['flowOrder']),
      commerceOrder: prepared.dto.externalId,
      amount: monto,
      planId: dto.plan_id,
      periodo: dto.periodo,
    };
  }

  private async procesarIntentoCobro(
    suscripcion: Suscripcion,
    fechaBase: Date,
    origen: 'renovacion' | 'retry',
  ) {
    const monto =
      suscripcion.periodo === SuscripcionPeriodo.ANUAL
        ? suscripcion.plan.precio_anual
        : suscripcion.plan.precio_mensual;

    if (monto === 0) {
      suscripcion.proximo_cobro = this.calcularProximoCobro(suscripcion.periodo);
      suscripcion.fecha_fin = suscripcion.proximo_cobro;
      suscripcion.billing_retry_count = 0;
      suscripcion.billing_last_retry_at = null as unknown as Date;
      suscripcion.billing_next_retry_at = null as unknown as Date;
      await this.suscripcionRepo.save(suscripcion);
      return;
    }

    const resultado = await this.procesarPagoGateway(monto, suscripcion);

    if (resultado.success) {
      suscripcion.estado = SuscripcionEstado.ACTIVA;
      suscripcion.proximo_cobro = this.calcularProximoCobro(suscripcion.periodo);
      suscripcion.fecha_fin = suscripcion.proximo_cobro;
      suscripcion.monto_pagado = monto;
      suscripcion.metodo_pago = resultado.metodo ?? suscripcion.metodo_pago ?? 'flow';
      suscripcion.referencia_pago = resultado.referencia ?? suscripcion.referencia_pago;
      suscripcion.referencia_pago_externa = resultado.referencia ?? suscripcion.referencia_pago_externa;
      suscripcion.billing_retry_count = 0;
      suscripcion.billing_last_retry_at = null as unknown as Date;
      suscripcion.billing_next_retry_at = null as unknown as Date;

      await this.suscripcionRepo.save(suscripcion);
      await this.registrarPago(
        suscripcion,
        monto,
        PagoSuscripcionEstado.EXITOSO,
        resultado.referencia,
        fechaBase,
        suscripcion.proximo_cobro,
        resultado.referencia,
        '200',
        `Cobro ${origen} exitoso`,
      );
      this.logger.log(`Cobro ${origen} exitoso taller=${suscripcion.taller_id} monto=${monto}`);
      return;
    }

    const nuevoRetryCount = (suscripcion.billing_retry_count ?? 0) + 1;
    suscripcion.billing_retry_count = nuevoRetryCount;
    suscripcion.billing_last_retry_at = fechaBase;
    suscripcion.referencia_pago = resultado.referencia ?? suscripcion.referencia_pago;
    suscripcion.referencia_pago_externa = resultado.referencia ?? suscripcion.referencia_pago_externa;

    const proximoRetry = this.calcularProximoRetry(nuevoRetryCount, fechaBase);
    suscripcion.billing_next_retry_at = proximoRetry as Date;

    if (nuevoRetryCount >= 3) {
      suscripcion.estado = SuscripcionEstado.SUSPENDIDA;
      suscripcion.billing_next_retry_at = null as unknown as Date;
    }

    await this.suscripcionRepo.save(suscripcion);
    await this.registrarPago(
      suscripcion,
      monto,
      PagoSuscripcionEstado.FALLIDO,
      resultado.referencia,
      undefined,
      undefined,
      resultado.referencia,
      '402',
      `Cobro ${origen} fallido. Retry ${nuevoRetryCount}`,
    );

    if (suscripcion.estado === SuscripcionEstado.SUSPENDIDA) {
      this.logger.warn(`Suscripción suspendida taller=${suscripcion.taller_id} tras ${nuevoRetryCount} intentos fallidos`);
    } else {
      this.logger.warn(`Cobro ${origen} fallido taller=${suscripcion.taller_id}. Retry ${nuevoRetryCount}`);
    }
  }

  private async registrarPago(
    suscripcion: Suscripcion,
    monto: number,
    estado: PagoSuscripcionEstado,
    referencia?: string,
    periodoDesde?: Date,
    periodoHasta?: Date,
    referenciaExterna?: string,
    codigoRespuesta?: string,
    detalleRespuesta?: string,
    metodoPagoOverride?: string,
  ) {
    const pago = this.historialPagoRepo.create({
      suscripcion_id: suscripcion.id,
      monto,
      metodo_pago: metodoPagoOverride ?? suscripcion.metodo_pago ?? 'pendiente',
      referencia: referencia ?? undefined,
      referencia_externa: referenciaExterna ?? undefined,
      codigo_respuesta: codigoRespuesta ?? undefined,
      detalle_respuesta: detalleRespuesta ?? undefined,
      estado,
      fecha_pago: new Date(),
      periodo_desde: periodoDesde ?? undefined,
      periodo_hasta: periodoHasta ?? undefined,
    } as Partial<HistorialPagoSuscripcion>);
    return this.historialPagoRepo.save(pago);
  }

  private async procesarPagoGateway(
    monto: number,
    suscripcion: Suscripcion,
    preferredEmail?: string,
  ): Promise<{ success: boolean; referencia?: string; metodo?: string }> {
    if (!this.flowService.isConfigured()) {
      const referencia = `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return { success: true, referencia, metodo: 'simulado' };
    }

    const billingEmail = await this.resolveBillingEmail(suscripcion.taller_id, preferredEmail);

    const prepared = await this.prepararPagoFlow(
      suscripcion.id,
      {
        amount: monto,
        externalId: `sub-${suscripcion.id}-${Date.now()}`,
        subject: `ROADIX ${(suscripcion.plan?.nombre ?? 'Suscripcion').toUpperCase()}`,
        email: billingEmail,
      } as CreateFlowPaymentDto,
    );

    const created = await this.flowService.createPayment(prepared.dto);
    await this.registrarPagoFlowCreado(suscripcion.id, {
      commerceOrder: prepared.dto.externalId,
      token: this.asString((created.response as Record<string, unknown> | undefined)?.['token']),
      flowOrder: this.asString((created.response as Record<string, unknown> | undefined)?.['flowOrder']),
      request: created.payload,
      response: (created.response ?? {}) as Record<string, unknown>,
    });

    return {
      success: true,
      referencia: prepared.dto.externalId,
      metodo: 'flow',
    };
  }
}
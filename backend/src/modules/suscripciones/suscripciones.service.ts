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
import {
  SuscripcionEstado,
  SuscripcionPeriodo,
  PagoSuscripcionEstado,
} from '../../common/enums.js';
import { CambiarPlanDto } from './dto/cambiar-plan.dto.js';
import { CreateFlowPaymentDto } from '../flow/dto/create-flow-payment.dto.js';
import { FlowService } from '../flow/flow.service.js';

type FlowPaymentResponse = {
  commerceOrder?: string;
  token?: string;
  flowOrder?: number | string;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
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
    @Inject(forwardRef(() => FlowService))
    private readonly flowService: FlowService,
  ) {}

  async findByTaller(tallerId: number) {
    return this.suscripcionRepo.findOne({
      where: { taller_id: tallerId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
  }

  async getActivePlan(tallerId: number) {
    const suscripcion = await this.suscripcionRepo.findOne({
      where: { taller_id: tallerId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
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
    const subject = dto.subject || `ROADIX ${suscripcion.plan?.nombre ?? 'Suscripción'}`;

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

    const amount = Number(response['amount'] ?? suscripcion.monto_pagado ?? this.obtenerMontoSuscripcion(suscripcion));
    const paid = this.flowStatusEsExitoso(response);
    const rejected = this.flowStatusEsFallido(response);

    const referenciaInterna = commerceOrder ?? suscripcion.referencia_pago ?? token;
    const referenciaExterna = flowOrder ?? token;

    if (paid) {
      suscripcion.estado = SuscripcionEstado.ACTIVA;
      suscripcion.proximo_cobro = this.calcularProximoCobro(suscripcion.periodo);
      suscripcion.fecha_fin = suscripcion.proximo_cobro;
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
      );

      return {
        matched: true,
        suscripcionId: suscripcion.id,
        estado: 'paid',
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

  async cambiarPlan(tallerId: number, dto: CambiarPlanDto) {
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

    const pagoExitoso = await this.procesarPagoGateway(monto, suscripcion);

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

  private calcularProximoCobro(periodo: SuscripcionPeriodo): Date {
    const fecha = new Date();
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

    Object.assign(pago, patch ?? {});
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
      });
    } else {
      pago.monto = monto;
      pago.metodo_pago = 'flow';
      pago.referencia_externa = referenciaExterna;
      pago.codigo_respuesta = codigoRespuesta;
      pago.detalle_respuesta = detalleRespuesta;
      pago.estado = estado;
      pago.fecha_pago = new Date();
    }

    return this.historialPagoRepo.save(pago);
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
  ) {
    const pago = this.historialPagoRepo.create({
      suscripcion_id: suscripcion.id,
      monto,
      metodo_pago: suscripcion.metodo_pago ?? 'pendiente',
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
  ): Promise<{ success: boolean; referencia?: string; metodo?: string }> {
    if (!this.flowService.isConfigured()) {
      const referencia = `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return { success: true, referencia, metodo: 'simulado' };
    }

    const prepared = await this.prepararPagoFlow(
      suscripcion.id,
      {
        amount: monto,
        externalId: `sub-${suscripcion.id}-${Date.now()}`,
        subject: `ROADIX ${suscripcion.plan?.nombre ?? 'Suscripción'}`,
        email: (suscripcion.taller as any)?.email,
      } as CreateFlowPaymentDto,
    );

    const created = await this.flowService.createPayment(prepared.dto);
    await this.registrarPagoFlowCreado(suscripcion.id, {
      commerceOrder: prepared.dto.externalId,
      token: undefined,
      flowOrder: undefined,
      request: created.payload,
      response: { signature: created.signature },
    });

    return {
      success: true,
      referencia: prepared.dto.externalId,
      metodo: 'flow',
    };
  }
}
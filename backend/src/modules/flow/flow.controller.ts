import { Body, Controller, Get, Inject, Post, Query, forwardRef } from '@nestjs/common';
import { FlowService } from './flow.service.js';
import { CreateFlowPaymentDto } from './dto/create-flow-payment.dto.js';
import { FlowWebhookDto } from './dto/flow-webhook.dto.js';
import { SuscripcionesService } from '../suscripciones/suscripciones.service.js';

@Controller('billing/flow')
export class FlowController {
  constructor(
    private readonly flowService: FlowService,
    @Inject(forwardRef(() => SuscripcionesService))
    private readonly suscripcionesService: SuscripcionesService,
  ) {}

  @Get('health')
  health() {
    return {
      ok: true,
      configured: this.flowService.isConfigured(),
      config: this.flowService.getConfig(),
    };
  }

  @Post('create')
  createPayment(@Body() dto: CreateFlowPaymentDto) {
    return this.flowService.createPayment(dto);
  }

  @Get('status')
  getStatus(@Query('token') token: string) {
    return this.flowService.getPaymentStatus(token);
  }

  @Post('webhook')
  async webhook(@Body() dto: FlowWebhookDto) {
    const token = dto.token ?? '';
    const statusPayload = token ? await this.flowService.getPaymentStatus(token) : { response: {} as Record<string, unknown> };
    const statusResponse = (statusPayload.response ?? {}) as Record<string, unknown>;
    const conciliation = token
      ? await this.suscripcionesService.conciliarPagoFlowDesdeWebhook(token, { response: statusResponse })
      : { matched: false, token, note: 'missing token' };

    return {
      received: true,
      token,
      statusPayload,
      conciliation,
    };
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Query,
  forwardRef,
} from '@nestjs/common';
import { FlowService } from './flow.service.js';
import { CreateFlowPaymentDto } from './dto/create-flow-payment.dto.js';
import { SuscripcionesService } from '../suscripciones/suscripciones.service.js';

@Controller('billing/flow')
export class FlowController {
  private readonly logger = new Logger(FlowController.name);

  constructor(
    private readonly flowService: FlowService,
    @Inject(forwardRef(() => SuscripcionesService))
    private readonly suscripcionesService: SuscripcionesService,
  ) {}

  private getTokenFromPayload(payload: Record<string, unknown>, tokenQuery?: string) {
    const tokenValue = payload.token;
    if (typeof tokenValue === 'string' && tokenValue.trim().length > 0) {
      return tokenValue.trim();
    }

    return tokenQuery?.trim() ?? '';
  }

  @Get('health')
  health() {
    const config = this.flowService.getConfig();
    return {
      ok: true,
      configured: this.flowService.isConfigured(),
      config: {
        env: config.env,
        baseUrl: config.baseUrl,
        commerceId: config.commerceId,
        returnUrl: config.returnUrl,
        confirmUrl: config.confirmUrl,
        hasApiKey: Boolean(config.apiKey),
        hasSecretKey: Boolean(config.secretKey),
      },
    };
  }

  @Post('create')
  createPayment(@Body() dto: CreateFlowPaymentDto) {
    return this.flowService.createPayment(dto);
  }

  @Get('status')
  async getStatus(@Query('token') token: string) {
    if (!token) {
      return {
        ok: false,
        token,
        statusPayload: { response: {} as Record<string, unknown> },
        conciliation: { matched: false, token, note: 'missing token' },
      };
    }

    try {
      const statusPayload = await this.flowService.getPaymentStatus(token);
      const statusResponse = (statusPayload.response ?? {}) as Record<string, unknown>;
      const conciliation = await this.suscripcionesService.conciliarPagoFlowDesdeWebhook(token, { response: statusResponse });

      return {
        ok: true,
        token,
        statusPayload,
        conciliation,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Flow status lookup failed';
      this.logger.error(`Flow status endpoint failed token=${token}: ${message}`);
      return {
        ok: false,
        token,
        statusPayload: { response: {} as Record<string, unknown> },
        conciliation: { matched: false, token, estado: 'pending', note: 'status lookup failed' },
        error: message,
      };
    }
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Body() payload: Record<string, unknown> = {},
    @Query('token') tokenQuery?: string,
  ) {
    const token = this.getTokenFromPayload(payload, tokenQuery);

    if (!token) {
      this.logger.warn('Flow webhook received without token');
      return {
        received: true,
        ok: false,
        token,
        note: 'missing token',
      };
    }

    try {
      const statusPayload = await this.flowService.getPaymentStatus(token);
      const statusResponse = (statusPayload.response ?? {}) as Record<string, unknown>;
      const conciliation = await this.suscripcionesService.conciliarPagoFlowDesdeWebhook(token, { response: statusResponse });

      return {
        received: true,
        ok: true,
        token,
        statusPayload,
        conciliation,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Flow webhook processing failed';
      this.logger.error(`Flow webhook failed token=${token}: ${message}`);
      return {
        received: true,
        ok: false,
        token,
        error: message,
      };
    }
  }
}

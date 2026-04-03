import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { CreateFlowPaymentDto } from './dto/create-flow-payment.dto.js';

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);

  constructor(private readonly configService: ConfigService) {}

  private normalizeUrl(url?: string) {
    return url?.trim().replace(/\/+$/, '');
  }

  private resolveAppUrl() {
    const configured = this.normalizeUrl(this.configService.get<string>('APP_URL'));
    if (configured?.includes('app.roadix.cl')) {
      return 'https://roadix.cl/app';
    }
    const base = configured && configured.length > 0 ? configured : 'https://roadix.cl/app';
    return /\/app$/i.test(base) ? base : `${base}/app`;
  }

  private resolveBackendUrl() {
    return this.normalizeUrl(
      this.configService.get<string>('BACKEND_PUBLIC_URL')
      ?? this.configService.get<string>('API_PUBLIC_URL')
      ?? this.configService.get<string>('RENDER_EXTERNAL_URL'),
    ) ?? 'https://roadix-full-v2.onrender.com';
  }

  private resolveReturnUrl() {
    const configured = this.normalizeUrl(this.configService.get<string>('FLOW_RETURN_URL'));
    if (configured && !configured.includes('app.roadix.cl')) {
      return configured;
    }
    return `${this.resolveAppUrl()}/billing/return`;
  }

  private resolveConfirmUrl() {
    const configured = this.normalizeUrl(this.configService.get<string>('FLOW_CONFIRM_URL'));
    if (configured && !configured.includes('roadix-backend.onrender.com')) {
      return configured;
    }
    return `${this.resolveBackendUrl()}/api/billing/flow/webhook`;
  }

  getConfig() {
    return {
      env: this.configService.get<string>('FLOW_ENV', 'sandbox'),
      apiKey: this.configService.get<string>('FLOW_API_KEY'),
      secretKey: this.configService.get<string>('FLOW_SECRET_KEY'),
      baseUrl: this.normalizeUrl(this.configService.get<string>('FLOW_BASE_URL')) ?? 'https://sandbox.flow.cl/api',
      commerceId: this.configService.get<string>('FLOW_COMMERCE_ID'),
      returnUrl: this.resolveReturnUrl(),
      confirmUrl: this.resolveConfirmUrl(),
    };
  }

  isConfigured() {
    const cfg = this.getConfig();
    return Boolean(cfg.apiKey && cfg.secretKey && cfg.baseUrl);
  }

  buildCreatePaymentPayload(dto: CreateFlowPaymentDto) {
    const cfg = this.getConfig();
    return {
      apiKey: cfg.apiKey,
      commerceOrder: dto.externalId,
      subject: dto.subject,
      currency: dto.currency ?? 'CLP',
      amount: dto.amount,
      email: dto.email,
      urlConfirmation: dto.confirmUrl ?? cfg.confirmUrl,
      urlReturn: dto.returnUrl ?? cfg.returnUrl,
    };
  }

  private buildStatusPayload(token: string) {
    const cfg = this.getConfig();
    return {
      apiKey: cfg.apiKey,
      token,
    };
  }

  signPayload(payload: Record<string, unknown>) {
    const cfg = this.getConfig();
    if (!cfg.secretKey) {
      throw new BadRequestException('FLOW_SECRET_KEY not configured');
    }

    const normalized = Object.keys(payload)
      .filter((key) => payload[key] !== undefined && payload[key] !== null)
      .sort()
      .map((key) => `${key}${payload[key]}`)
      .join('');

    return createHmac('sha256', cfg.secretKey).update(normalized).digest('hex');
  }

  private toFormBody(payload: Record<string, unknown>, signature: string) {
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    params.append('s', signature);
    return params;
  }

  private async postForm(endpoint: string, payload: Record<string, unknown>) {
    if (!this.isConfigured()) {
      throw new BadRequestException('Flow is not configured');
    }

    const signature = this.signPayload(payload);
    const body = this.toFormBody(payload, signature);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const text = await response.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      // keep raw text
    }

    if (!response.ok) {
      const providerMessage =
        typeof parsed === 'object'
        && parsed !== null
        && 'message' in parsed
        && typeof (parsed as { message?: unknown }).message === 'string'
          ? String((parsed as { message: string }).message)
          : undefined;

      this.logger.error(`Flow request failed ${response.status} endpoint=${endpoint}`);
      throw new BadRequestException({
        message: providerMessage ? `Flow: ${providerMessage}` : 'Flow request failed',
        endpoint,
        status: response.status,
        response: parsed,
      });
    }

    return {
      endpoint,
      payload,
      signature,
      response: parsed,
    };
  }

  async createPayment(dto: CreateFlowPaymentDto) {
    const payload = this.buildCreatePaymentPayload(dto);
    const endpoint = `${this.getConfig().baseUrl}/payment/create`;

    this.logger.log(`Flow createPayment order=${dto.externalId}`);
    return this.postForm(endpoint, payload);
  }

  async getPaymentStatus(token: string) {
    const payload = this.buildStatusPayload(token);
    const endpoint = `${this.getConfig().baseUrl}/payment/getStatus`;

    this.logger.log(`Flow getPaymentStatus token=${token}`);
    return this.postForm(endpoint, payload);
  }
}

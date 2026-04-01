import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { CreateFlowPaymentDto } from './dto/create-flow-payment.dto.js';

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);

  constructor(private readonly configService: ConfigService) {}

  getConfig() {
    return {
      env: this.configService.get<string>('FLOW_ENV', 'sandbox'),
      apiKey: this.configService.get<string>('FLOW_API_KEY'),
      secretKey: this.configService.get<string>('FLOW_SECRET_KEY'),
      baseUrl: this.configService.get<string>('FLOW_BASE_URL', 'https://sandbox.flow.cl/api'),
      commerceId: this.configService.get<string>('FLOW_COMMERCE_ID'),
      returnUrl: this.configService.get<string>('FLOW_RETURN_URL'),
      confirmUrl: this.configService.get<string>('FLOW_CONFIRM_URL'),
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
      this.logger.error(`Flow request failed ${response.status} endpoint=${endpoint}`);
      throw new BadRequestException({
        message: 'Flow request failed',
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

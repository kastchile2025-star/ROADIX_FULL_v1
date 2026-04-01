import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { CreateFlowPaymentDto } from './dto/create-flow-payment.dto.js';

@Injectable()
export class FlowProvider {
  private readonly logger = new Logger(FlowProvider.name);

  constructor(private readonly configService: ConfigService) {}

  private get apiKey(): string {
    return this.configService.get<string>('FLOW_API_KEY') || '';
  }

  private get secretKey(): string {
    return this.configService.get<string>('FLOW_SECRET_KEY') || '';
  }

  private get baseUrl(): string {
    return this.configService.get<string>('FLOW_BASE_URL') || 'https://sandbox.flow.cl/api';
  }

  private ensureCredentials() {
    if (!this.apiKey || !this.secretKey) {
      throw new InternalServerErrorException(
        'Flow no está configurado. Faltan FLOW_API_KEY y/o FLOW_SECRET_KEY.',
      );
    }
  }

  sign(params: Record<string, string | number | undefined>) {
    const filtered = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}${value}`)
      .join('');

    return createHmac('sha256', this.secretKey).update(filtered).digest('hex');
  }

  private async post<T>(path: string, params: Record<string, string | number | undefined>) {
    this.ensureCredentials();

    const signature = this.sign(params);
    const body = new URLSearchParams();

    for (const [key, value] of Object.entries({ ...params, s: signature })) {
      if (value !== undefined && value !== null && value !== '') {
        body.append(key, String(value));
      }
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const text = await response.text();
    let data: unknown = text;

    try {
      data = JSON.parse(text);
    } catch {
      // Flow suele responder JSON; si no, preservamos el raw text.
    }

    if (!response.ok) {
      this.logger.error(`Flow ${path} HTTP ${response.status}: ${text}`);
      throw new InternalServerErrorException(`Flow respondió HTTP ${response.status}`);
    }

    return {
      request: { ...params, s: signature },
      response: data as T,
    };
  }

  async createPayment(payload: CreateFlowPaymentDto) {
    const commerceOrder = payload.externalId || `roadix-${Date.now()}`;
    const params = {
      apiKey: this.apiKey,
      commerceOrder,
      subject: payload.subject,
      currency: 'CLP',
      amount: payload.amount,
      email: payload.email,
      urlConfirmation: payload.confirmUrl,
      urlReturn: payload.returnUrl,
    };

    const result = await this.post<Record<string, unknown>>('/payment/create', params);

    this.logger.log(`Flow createPayment ejecutado para order ${commerceOrder}`);

    return {
      provider: 'flow',
      mode: 'live',
      baseUrl: this.baseUrl,
      commerceOrder,
      ...result,
    };
  }

  async getPaymentStatus(token: string) {
    const params = { apiKey: this.apiKey, token };
    const result = await this.post<Record<string, unknown>>('/payment/getStatus', params);

    this.logger.log(`Flow status consultado para token ${token}`);

    return {
      provider: 'flow',
      mode: 'live',
      token,
      ...result,
    };
  }
}
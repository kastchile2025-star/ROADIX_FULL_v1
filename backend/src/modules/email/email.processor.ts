import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Bull from 'bull';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import { EmailService } from './email.service.js';
import { EstadoEmail } from '../../common/enums.js';

interface EmailJobData {
  historialId: number;
  destinatario: string;
  asunto: string;
  template: string;
  variables: Record<string, unknown>;
}

@Processor('email-queue')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  private templateCache = new Map<string, Handlebars.TemplateDelegate>();

  constructor(
    private config: ConfigService,
    private emailService: EmailService,
  ) {}

  @Process('send-email')
  async handleSendEmail(job: Bull.Job<EmailJobData>) {
    const { historialId, destinatario, asunto, template, variables } = job.data;
    this.logger.log(`Processing email job ${historialId}: ${template} → ${destinatario}`);

    try {
      const html = this.renderTemplate(template, variables);
      await this.sendWithProvider(destinatario, asunto, html);
      await this.emailService.marcarEstado(historialId, EstadoEmail.ENTREGADO);
      this.logger.log(`Email sent successfully: ${historialId}`);
    } catch (error) {
      this.logger.error(`Email failed: ${historialId}`, (error as Error).stack);
      await this.emailService.marcarEstado(historialId, EstadoEmail.FALLIDO);
      throw error;
    }
  }

  private renderTemplate(templateName: string, variables: Record<string, unknown>): string {
    let compiled = this.templateCache.get(templateName);

    if (!compiled) {
      const templatesDir = path.join(__dirname, 'templates');
      const filePath = path.join(templatesDir, `${templateName}.hbs`);

      if (!fs.existsSync(filePath)) {
        this.logger.warn(`Template not found: ${filePath}, using fallback`);
        return this.fallbackTemplate(variables);
      }

      // Load base layout
      const layoutPath = path.join(templatesDir, 'layouts', 'base.hbs');
      if (fs.existsSync(layoutPath)) {
        const layoutSource = fs.readFileSync(layoutPath, 'utf-8');
        Handlebars.registerPartial('layout', layoutSource);
      }

      const source = fs.readFileSync(filePath, 'utf-8');
      compiled = Handlebars.compile(source);
      this.templateCache.set(templateName, compiled);
    }

    return compiled(variables);
  }

  private fallbackTemplate(variables: Record<string, unknown>): string {
    return `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>${String(variables['titulo'] ?? 'Notificación Roadix')}</h2>
        <p>${String(variables['mensaje'] ?? '')}</p>
        <hr />
        <p style="color: #888; font-size: 12px;">Roadix — Sistema de Gestión de Taller</p>
      </div>
    `;
  }

  private async sendWithProvider(to: string, subject: string, html: string) {
    const sendgridKey = this.config.get<string>('SENDGRID_API_KEY');

    if (sendgridKey) {
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(sendgridKey);
      await sgMail.default.send({
        to,
        from: this.config.get<string>('EMAIL_FROM', 'noreply@roadix.cl'),
        subject,
        html,
      });
    } else {
      // Dev fallback: use nodemailer with Ethereal or SMTP
      const nodemailer = await import('nodemailer');
      const transport = nodemailer.default.createTransport({
        host: this.config.get<string>('SMTP_HOST', 'localhost'),
        port: this.config.get<number>('SMTP_PORT', 1025),
        ignoreTLS: true,
      });
      await transport.sendMail({
        from: this.config.get<string>('EMAIL_FROM', 'noreply@roadix.cl'),
        to,
        subject,
        html,
      });
      this.logger.log(`[DEV] Email sent via SMTP to ${to}`);
    }
  }
}

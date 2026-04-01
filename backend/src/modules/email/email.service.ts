import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import * as Bull from 'bull';
import { HistorialEmail } from '../../database/entities/historial-email.entity.js';
import { TipoEmail, EstadoEmail } from '../../common/enums.js';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectQueue('email-queue') private emailQueue: Bull.Queue,
    @InjectRepository(HistorialEmail)
    private historialRepo: Repository<HistorialEmail>,
    private config: ConfigService,
  ) {}

  async enviar(
    tallerId: number,
    tipo: TipoEmail,
    destinatario: string,
    asunto: string,
    template: string,
    variables: Record<string, unknown>,
  ) {
    const registro = this.historialRepo.create({
      taller_id: tallerId,
      destinatario,
      asunto,
      tipo,
      template_usado: template,
      variables_json: variables,
      estado: EstadoEmail.ENVIADO,
    });
    const saved = await this.historialRepo.save(registro);

    await this.emailQueue.add(
      'send-email',
      {
        historialId: saved.id,
        destinatario,
        asunto,
        template,
        variables,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    this.logger.log(`Email enqueued: ${tipo} → ${destinatario}`);
    return saved;
  }

  async marcarEstado(id: number, estado: EstadoEmail, sendgridId?: string) {
    await this.historialRepo.update(id, {
      estado,
      ...(sendgridId ? { sendgrid_id: sendgridId } : {}),
      ...(estado === EstadoEmail.ABIERTO ? { abierto_at: new Date() } : {}),
    });
  }

  async getHistorial(tallerId: number, limit = 50) {
    return this.historialRepo.find({
      where: { taller_id: tallerId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}

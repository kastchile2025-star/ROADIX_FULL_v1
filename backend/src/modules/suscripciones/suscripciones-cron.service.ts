import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SuscripcionesService } from './suscripciones.service.js';

@Injectable()
export class SuscripcionesCronService {
  private readonly logger = new Logger(SuscripcionesCronService.name);

  constructor(private readonly suscripcionesService: SuscripcionesService) {}

  /** Runs daily at 3 AM — process recurring billing, retries and trial expiry */
  @Cron('0 3 * * *')
  async procesarBilling() {
    this.logger.log('Iniciando verificación de trials vencidos...');
    await this.suscripcionesService.procesarTrialsVencidos();
    this.logger.log('Verificación de trials finalizada');

    this.logger.log('Iniciando cobros recurrentes de suscripciones...');
    await this.suscripcionesService.procesarCobrosRecurrentes();
    this.logger.log('Cobros recurrentes finalizados');

    this.logger.log('Iniciando procesamiento de reintentos de cobro...');
    await this.suscripcionesService.procesarReintentosCobro();
    this.logger.log('Procesamiento de reintentos finalizado');
  }
}

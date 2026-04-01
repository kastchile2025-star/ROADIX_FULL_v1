import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { Vehiculo } from '../../database/entities/vehiculo.entity.js';
import { Recordatorio } from '../../database/entities/recordatorio.entity.js';
import { EmailService } from '../email/email.service.js';
import {
  TipoRecordatorio,
  CanalRecordatorio,
  EstadoRecordatorio,
  TipoEmail,
} from '../../common/enums.js';

@Injectable()
export class RecordatoriosService {
  private readonly logger = new Logger(RecordatoriosService.name);

  constructor(
    @InjectRepository(Vehiculo)
    private vehiculoRepo: Repository<Vehiculo>,
    @InjectRepository(Recordatorio)
    private recordatorioRepo: Repository<Recordatorio>,
    private emailService: EmailService,
  ) {}

  // Runs daily at 9 AM — check for upcoming document expirations
  @Cron('0 9 * * *')
  async checkDocumentosVencimiento() {
    this.logger.log('Running document expiration check...');

    const diasAntelacion = 30;
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + diasAntelacion);

    await this.checkRevTecnica(hoy, limite);
    await this.checkSoap(hoy, limite);
    await this.checkPermisoCirculacion(hoy, limite);
  }

  private async checkRevTecnica(desde: Date, hasta: Date) {
    const vehiculos = await this.vehiculoRepo.find({
      where: { rev_tecnica: Between(desde, hasta) },
      relations: ['cliente', 'taller'],
    });

    for (const v of vehiculos) {
      if (!v.cliente?.email) continue;
      const yaEnviado = await this.yaExisteRecordatorio(v.taller_id, v.id, TipoRecordatorio.REV_TECNICA);
      if (yaEnviado) continue;

      await this.crearYEnviar(v, TipoRecordatorio.REV_TECNICA, 'recordatorio_rev_tecnica', {
        cliente_nombre: v.cliente.nombre,
        vehiculo_marca: v.marca,
        vehiculo_modelo: v.modelo,
        vehiculo_patente: v.patente,
        fecha_vencimiento: v.rev_tecnica?.toLocaleDateString('es-CL'),
        taller_nombre: v.taller?.nombre,
      });
    }
  }

  private async checkSoap(desde: Date, hasta: Date) {
    const vehiculos = await this.vehiculoRepo.find({
      where: { soap_vence: Between(desde, hasta) },
      relations: ['cliente', 'taller'],
    });

    for (const v of vehiculos) {
      if (!v.cliente?.email) continue;
      const yaEnviado = await this.yaExisteRecordatorio(v.taller_id, v.id, TipoRecordatorio.SOAP);
      if (yaEnviado) continue;

      await this.crearYEnviar(v, TipoRecordatorio.SOAP, 'recordatorio_soap', {
        cliente_nombre: v.cliente.nombre,
        vehiculo_marca: v.marca,
        vehiculo_modelo: v.modelo,
        vehiculo_patente: v.patente,
        fecha_vencimiento: v.soap_vence?.toLocaleDateString('es-CL'),
        taller_nombre: v.taller?.nombre,
      });
    }
  }

  private async checkPermisoCirculacion(desde: Date, hasta: Date) {
    const vehiculos = await this.vehiculoRepo.find({
      where: { permiso_circ: Between(desde, hasta) },
      relations: ['cliente', 'taller'],
    });

    for (const v of vehiculos) {
      if (!v.cliente?.email) continue;
      const yaEnviado = await this.yaExisteRecordatorio(v.taller_id, v.id, TipoRecordatorio.PERMISO_CIRCULACION);
      if (yaEnviado) continue;

      await this.crearYEnviar(v, TipoRecordatorio.PERMISO_CIRCULACION, 'recordatorio_permiso', {
        cliente_nombre: v.cliente.nombre,
        vehiculo_marca: v.marca,
        vehiculo_modelo: v.modelo,
        vehiculo_patente: v.patente,
        fecha_vencimiento: v.permiso_circ?.toLocaleDateString('es-CL'),
        taller_nombre: v.taller?.nombre,
      });
    }
  }

  private async yaExisteRecordatorio(tallerId: number, vehiculoId: number, tipo: TipoRecordatorio): Promise<boolean> {
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

    const count = await this.recordatorioRepo.count({
      where: {
        taller_id: tallerId,
        vehiculo_id: vehiculoId,
        tipo,
        created_at: MoreThanOrEqual(treintaDiasAtras),
      },
    });
    return count > 0;
  }

  private async crearYEnviar(
    vehiculo: Vehiculo,
    tipo: TipoRecordatorio,
    template: string,
    variables: Record<string, unknown>,
  ) {
    const recordatorio = this.recordatorioRepo.create({
      taller_id: vehiculo.taller_id,
      cliente_id: vehiculo.cliente_id,
      vehiculo_id: vehiculo.id,
      tipo,
      mensaje: `Recordatorio: ${tipo}`,
      fecha_envio: new Date(),
      canal: CanalRecordatorio.EMAIL,
      estado: EstadoRecordatorio.PENDIENTE,
    });
    const saved = await this.recordatorioRepo.save(recordatorio);

    try {
      const asuntoMap: Record<string, string> = {
        [TipoRecordatorio.REV_TECNICA]: 'Recordatorio: Revisión Técnica próxima a vencer',
        [TipoRecordatorio.SOAP]: 'Recordatorio: SOAP próximo a vencer',
        [TipoRecordatorio.PERMISO_CIRCULACION]: 'Recordatorio: Permiso de Circulación próximo a vencer',
        [TipoRecordatorio.MANTENCION]: 'Recordatorio: Mantención Preventiva',
      };

      await this.emailService.enviar(
        vehiculo.taller_id,
        TipoEmail.RECORDATORIO,
        vehiculo.cliente.email,
        asuntoMap[tipo] ?? 'Recordatorio Roadix',
        template,
        variables,
      );

      await this.recordatorioRepo.update(saved.id, {
        estado: EstadoRecordatorio.ENVIADO,
        enviado_at: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to send reminder ${saved.id}`, (error as Error).stack);
      await this.recordatorioRepo.update(saved.id, { estado: EstadoRecordatorio.FALLIDO });
    }
  }

  // API: list recordatorios for a taller
  async getRecordatorios(tallerId: number, limit = 50) {
    return this.recordatorioRepo.find({
      where: { taller_id: tallerId },
      relations: ['cliente', 'vehiculo'],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}

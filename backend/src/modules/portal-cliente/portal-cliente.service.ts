import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { Presupuesto } from '../../database/entities/presupuesto.entity.js';
import { OtFoto } from '../../database/entities/ot-foto.entity.js';
import { Factura } from '../../database/entities/factura.entity.js';
import { PresupuestoEstado } from '../../common/enums.js';
import { ArchivosService } from '../archivos/archivos.service.js';

@Injectable()
export class PortalClienteService {
  constructor(
    @InjectRepository(OrdenTrabajo)
    private otRepo: Repository<OrdenTrabajo>,
    @InjectRepository(Presupuesto)
    private presupuestoRepo: Repository<Presupuesto>,
    @InjectRepository(OtFoto)
    private fotoRepo: Repository<OtFoto>,
    @InjectRepository(Factura)
    private facturaRepo: Repository<Factura>,
    private archivosService: ArchivosService,
  ) {}

  async getOtByToken(token: string) {
    const ot = await this.otRepo.findOne({
      where: { token_portal: token },
      relations: ['vehiculo', 'vehiculo.cliente', 'mecanico', 'taller', 'detalles'],
    });
    if (!ot) throw new NotFoundException('Orden de trabajo no encontrada');
    return ot;
  }

  async getFotos(token: string) {
    const ot = await this.getOtByToken(token);
    return this.fotoRepo.find({
      where: { ot_id: ot.id },
      order: { created_at: 'ASC' },
    });
  }

  async getPresupuesto(token: string) {
    const ot = await this.getOtByToken(token);
    return this.presupuestoRepo.findOne({
      where: { ot_id: ot.id },
      order: { created_at: 'DESC' },
    });
  }

  async aprobarPresupuesto(token: string, firmaBase64?: string) {
    const ot = await this.getOtByToken(token);
    const presupuesto = await this.presupuestoRepo.findOne({
      where: { ot_id: ot.id },
      order: { created_at: 'DESC' },
    });
    if (!presupuesto) throw new NotFoundException('Presupuesto no encontrado');

    presupuesto.estado = PresupuestoEstado.APROBADO;
    presupuesto.aprobado_at = new Date();

    if (firmaBase64) {
      const firmaUrl = this.archivosService.saveBase64(firmaBase64, 'firma-aprobacion');
      presupuesto.firma_url = firmaUrl;
      ot.firma_cliente_url = firmaUrl;
      await this.otRepo.save(ot);
    }

    await this.presupuestoRepo.save(presupuesto);
    return { message: 'Presupuesto aprobado' };
  }

  async getFactura(token: string) {
    const ot = await this.getOtByToken(token);
    return this.facturaRepo.findOne({
      where: { ot_id: ot.id },
      order: { created_at: 'DESC' },
    });
  }
}

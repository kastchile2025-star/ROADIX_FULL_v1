import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Presupuesto } from '../../database/entities/presupuesto.entity.js';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { CreatePresupuestoDto, UpdatePresupuestoDto } from './dto/presupuesto.dto.js';
import { PresupuestoEstado, OtEstado } from '../../common/enums.js';

@Injectable()
export class PresupuestosService {
  constructor(
    @InjectRepository(Presupuesto)
    private readonly presupuestoRepo: Repository<Presupuesto>,
    @InjectRepository(OrdenTrabajo)
    private readonly otRepo: Repository<OrdenTrabajo>,
  ) {}

  async findByOt(otId: number, tallerId: number) {
    return this.presupuestoRepo.find({
      where: { ot_id: otId, taller_id: tallerId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number, tallerId: number) {
    const p = await this.presupuestoRepo.findOne({
      where: { id, taller_id: tallerId },
      relations: ['orden_trabajo'],
    });
    if (!p) throw new NotFoundException('Presupuesto no encontrado');
    return p;
  }

  async create(tallerId: number, dto: CreatePresupuestoDto) {
    const ot = await this.otRepo.findOne({
      where: { id: dto.ot_id, taller_id: tallerId },
    });
    if (!ot) throw new NotFoundException('Orden de trabajo no encontrada');

    const count = await this.presupuestoRepo.count({
      where: { taller_id: tallerId },
    });
    const numero = `PRES-${(count + 1).toString().padStart(6, '0')}`;

    const { subtotal, iva, total } = this.calcularTotales(dto.items_json ?? []);

    const presupuesto = this.presupuestoRepo.create({
      ot_id: dto.ot_id,
      taller_id: tallerId,
      numero,
      items_json: dto.items_json ?? [],
      subtotal,
      iva,
      total,
    });

    return this.presupuestoRepo.save(presupuesto);
  }

  async update(id: number, tallerId: number, dto: UpdatePresupuestoDto) {
    const presupuesto = await this.findOne(id, tallerId);

    if (dto.items_json) {
      presupuesto.items_json = dto.items_json;
      const totales = this.calcularTotales(dto.items_json);
      presupuesto.subtotal = totales.subtotal;
      presupuesto.iva = totales.iva;
      presupuesto.total = totales.total;
    }

    if (dto.estado) {
      presupuesto.estado = dto.estado;
      if (dto.estado === PresupuestoEstado.APROBADO) {
        presupuesto.aprobado_at = new Date();
        await this.otRepo.update(presupuesto.ot_id, {
          estado: OtEstado.ESPERANDO_REPUESTOS,
        });
      }
    }

    return this.presupuestoRepo.save(presupuesto);
  }

  async enviar(id: number, tallerId: number) {
    const presupuesto = await this.findOne(id, tallerId);
    presupuesto.estado = PresupuestoEstado.ENVIADO;
    presupuesto.enviado_email = true;

    await this.otRepo.update(presupuesto.ot_id, {
      estado: OtEstado.ESPERANDO_APROBACION,
    });

    return this.presupuestoRepo.save(presupuesto);
  }

  private calcularTotales(items: any[]) {
    const subtotal = items.reduce((sum, item) => {
      const lineTotal = (item.cantidad ?? 1) * (item.precio_unit ?? 0);
      const desc = lineTotal * ((item.descuento ?? 0) / 100);
      return sum + lineTotal - desc;
    }, 0);
    const iva = Math.round(subtotal * 0.19);
    const total = subtotal + iva;
    return { subtotal, iva, total };
  }
}

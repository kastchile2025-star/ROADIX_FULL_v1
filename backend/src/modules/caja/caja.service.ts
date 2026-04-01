import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Pago } from '../../database/entities/pago.entity.js';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { RegistrarPagoDto } from './dto/caja.dto.js';

@Injectable()
export class CajaService {
  constructor(
    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,
    @InjectRepository(OrdenTrabajo)
    private readonly otRepo: Repository<OrdenTrabajo>,
  ) {}

  async registrarPago(tallerId: number, dto: RegistrarPagoDto) {
    const ot = await this.otRepo.findOne({
      where: { id: dto.ot_id, taller_id: tallerId },
    });
    if (!ot) throw new NotFoundException('Orden de trabajo no encontrada');

    const pago = this.pagoRepo.create({
      ot_id: dto.ot_id,
      taller_id: tallerId,
      monto: dto.monto,
      metodo_pago: dto.metodo_pago,
      referencia: dto.referencia,
    });
    return this.pagoRepo.save(pago);
  }

  async getMovimientosDia(tallerId: number, fecha?: string) {
    const target = fecha ? new Date(fecha) : new Date();
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    return this.pagoRepo.find({
      where: {
        taller_id: tallerId,
        fecha_pago: Between(start, end),
      },
      relations: ['orden_trabajo'],
      order: { fecha_pago: 'DESC' },
    });
  }

  async getCierreDiario(tallerId: number, fecha?: string) {
    const pagos = await this.getMovimientosDia(tallerId, fecha);

    const totalesPorMetodo: Record<string, number> = {};
    let totalDia = 0;

    for (const pago of pagos) {
      const monto = Number(pago.monto);
      totalesPorMetodo[pago.metodo_pago] = (totalesPorMetodo[pago.metodo_pago] ?? 0) + monto;
      totalDia += monto;
    }

    return {
      fecha: fecha ?? new Date().toISOString().split('T')[0],
      total_dia: totalDia,
      cantidad_pagos: pagos.length,
      por_metodo: totalesPorMetodo,
      pagos,
    };
  }

  async getPagosByOt(otId: number, tallerId: number) {
    return this.pagoRepo.find({
      where: { ot_id: otId, taller_id: tallerId },
      order: { fecha_pago: 'DESC' },
    });
  }
}

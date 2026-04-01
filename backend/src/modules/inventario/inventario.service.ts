import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovimientoStock } from '../../database/entities/movimiento-stock.entity.js';
import { Repuesto } from '../../database/entities/repuesto.entity.js';
import { MovimientoStockDto } from './dto/movimiento-stock.dto.js';
import { TipoMovimientoStock } from '../../common/enums.js';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(MovimientoStock)
    private readonly movRepo: Repository<MovimientoStock>,
    @InjectRepository(Repuesto)
    private readonly repuestoRepo: Repository<Repuesto>,
  ) {}

  async registrarMovimiento(dto: MovimientoStockDto, usuarioId: number, tallerId: number) {
    const repuesto = await this.repuestoRepo.findOne({
      where: { id: dto.repuesto_id, taller_id: tallerId },
    });
    if (!repuesto) throw new NotFoundException('Repuesto no encontrado');

    if (dto.tipo === TipoMovimientoStock.SALIDA && repuesto.stock_actual < dto.cantidad) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${repuesto.stock_actual}, solicitado: ${dto.cantidad}`,
      );
    }

    // Update stock
    if (dto.tipo === TipoMovimientoStock.ENTRADA) {
      repuesto.stock_actual += dto.cantidad;
    } else if (dto.tipo === TipoMovimientoStock.SALIDA) {
      repuesto.stock_actual -= dto.cantidad;
    } else {
      // Ajuste: la cantidad es el nuevo stock
      repuesto.stock_actual = dto.cantidad;
    }
    await this.repuestoRepo.save(repuesto);

    // Record movement
    const mov = this.movRepo.create({
      repuesto_id: dto.repuesto_id,
      tipo: dto.tipo,
      cantidad: dto.cantidad,
      motivo: dto.motivo,
      ot_detalle_id: dto.ot_detalle_id,
      usuario_id: usuarioId,
    });
    return this.movRepo.save(mov);
  }

  async getMovimientos(repuestoId: number, tallerId: number) {
    // Verify repuesto belongs to taller
    const repuesto = await this.repuestoRepo.findOne({
      where: { id: repuestoId, taller_id: tallerId },
    });
    if (!repuesto) throw new NotFoundException('Repuesto no encontrado');

    return this.movRepo.find({
      where: { repuesto_id: repuestoId },
      relations: ['usuario', 'ot_detalle'],
      order: { created_at: 'DESC' },
    });
  }

  async getMovimientosRecientes(tallerId: number, limit = 50) {
    return this.movRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.repuesto', 'repuesto')
      .leftJoinAndSelect('m.usuario', 'usuario')
      .where('repuesto.taller_id = :tallerId', { tallerId })
      .orderBy('m.created_at', 'DESC')
      .limit(limit)
      .getMany();
  }
}

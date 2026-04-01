import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, LessThanOrEqual } from 'typeorm';
import { Repuesto } from '../../database/entities/repuesto.entity.js';
import { CreateRepuestoDto, UpdateRepuestoDto } from './dto/repuesto.dto.js';

@Injectable()
export class RepuestosService {
  constructor(
    @InjectRepository(Repuesto)
    private readonly repo: Repository<Repuesto>,
  ) {}

  async findAll(tallerId: number, search?: string, categoria?: string) {
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.proveedor', 'proveedor')
      .where('r.taller_id = :tallerId', { tallerId })
      .orderBy('r.nombre', 'ASC');

    if (search) {
      qb.andWhere(
        '(r.nombre ILIKE :search OR r.codigo ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (categoria) {
      qb.andWhere('r.categoria = :categoria', { categoria });
    }
    return qb.getMany();
  }

  async findOne(id: number, tallerId: number) {
    const r = await this.repo.findOne({
      where: { id, taller_id: tallerId },
      relations: ['proveedor'],
    });
    if (!r) throw new NotFoundException('Repuesto no encontrado');
    return r;
  }

  async findStockBajo(tallerId: number) {
    return this.repo
      .createQueryBuilder('r')
      .where('r.taller_id = :tallerId', { tallerId })
      .andWhere('r.stock_actual <= r.stock_minimo')
      .andWhere('r.stock_minimo > 0')
      .orderBy('r.stock_actual', 'ASC')
      .getMany();
  }

  async create(tallerId: number, dto: CreateRepuestoDto) {
    const repuesto = this.repo.create({ ...dto, taller_id: tallerId });
    return this.repo.save(repuesto);
  }

  async update(id: number, tallerId: number, dto: UpdateRepuestoDto) {
    const repuesto = await this.findOne(id, tallerId);
    Object.assign(repuesto, dto);
    return this.repo.save(repuesto);
  }

  async remove(id: number, tallerId: number) {
    const repuesto = await this.findOne(id, tallerId);
    return this.repo.remove(repuesto);
  }

  async getCategorias(tallerId: number): Promise<string[]> {
    const result = await this.repo
      .createQueryBuilder('r')
      .select('DISTINCT r.categoria', 'categoria')
      .where('r.taller_id = :tallerId', { tallerId })
      .andWhere('r.categoria IS NOT NULL')
      .getRawMany();
    return result.map((r: { categoria: string }) => r.categoria);
  }
}

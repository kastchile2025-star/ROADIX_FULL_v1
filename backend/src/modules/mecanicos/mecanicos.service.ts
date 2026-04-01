import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mecanico } from '../../database/entities/mecanico.entity.js';
import { CreateMecanicoDto, UpdateMecanicoDto } from './dto/mecanico.dto.js';

@Injectable()
export class MecanicosService {
  constructor(
    @InjectRepository(Mecanico)
    private readonly mecanicoRepo: Repository<Mecanico>,
  ) {}

  async findAll(tallerId: number) {
    return this.mecanicoRepo.find({
      where: { taller_id: tallerId },
      relations: ['usuario'],
      order: { created_at: 'DESC' },
    });
  }

  async findActive(tallerId: number) {
    return this.mecanicoRepo.find({
      where: { taller_id: tallerId, activo: true },
      relations: ['usuario'],
    });
  }

  async findOne(id: number, tallerId: number) {
    const mecanico = await this.mecanicoRepo.findOne({
      where: { id, taller_id: tallerId },
      relations: ['usuario'],
    });
    if (!mecanico) throw new NotFoundException('Mecánico no encontrado');
    return mecanico;
  }

  async create(tallerId: number, dto: CreateMecanicoDto) {
    const mecanico = this.mecanicoRepo.create({ ...dto, taller_id: tallerId });
    return this.mecanicoRepo.save(mecanico);
  }

  async update(id: number, tallerId: number, dto: UpdateMecanicoDto) {
    const mecanico = await this.findOne(id, tallerId);
    Object.assign(mecanico, dto);
    return this.mecanicoRepo.save(mecanico);
  }

  async remove(id: number, tallerId: number) {
    const mecanico = await this.findOne(id, tallerId);
    mecanico.activo = false;
    return this.mecanicoRepo.save(mecanico);
  }
}

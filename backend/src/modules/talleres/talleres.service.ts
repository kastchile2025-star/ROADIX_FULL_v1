import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Taller } from '../../database/entities/taller.entity.js';
import { UpdateTallerDto } from './dto/update-taller.dto.js';

@Injectable()
export class TalleresService {
  constructor(
    @InjectRepository(Taller)
    private readonly tallerRepo: Repository<Taller>,
  ) {}

  async findOne(id: number) {
    const taller = await this.tallerRepo.findOneBy({ id });
    if (!taller) throw new NotFoundException('Taller no encontrado');
    return taller;
  }

  async update(id: number, dto: UpdateTallerDto) {
    const taller = await this.findOne(id);
    Object.assign(taller, dto);
    return this.tallerRepo.save(taller);
  }
}

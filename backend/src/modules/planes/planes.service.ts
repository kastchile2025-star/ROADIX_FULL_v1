import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../../database/entities/plan.entity.js';

@Injectable()
export class PlanesService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
  ) {}

  async findAll() {
    return this.planRepo.find({
      where: { activo: true },
      order: { precio_mensual: 'ASC' },
    });
  }

  async findOne(id: number) {
    return this.planRepo.findOneByOrFail({ id });
  }
}

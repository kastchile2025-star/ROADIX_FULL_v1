import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Vehiculo } from '../../database/entities/vehiculo.entity.js';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto.js';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto.js';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepo: Repository<Vehiculo>,
  ) {}

  async findAll(tallerId: number, search?: string) {
    if (search) {
      return this.vehiculoRepo.find({
        where: [
          { taller_id: tallerId, patente: ILike(`%${search}%`) },
          { taller_id: tallerId, marca: ILike(`%${search}%`) },
          { taller_id: tallerId, modelo: ILike(`%${search}%`) },
        ],
        relations: ['cliente'],
        order: { created_at: 'DESC' },
      });
    }
    return this.vehiculoRepo.find({
      where: { taller_id: tallerId },
      relations: ['cliente'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number, tallerId: number) {
    const vehiculo = await this.vehiculoRepo.findOne({
      where: { id, taller_id: tallerId },
      relations: ['cliente', 'ordenes_trabajo'],
    });
    if (!vehiculo) throw new NotFoundException('Vehículo no encontrado');
    return vehiculo;
  }

  async findByPatente(patente: string, tallerId: number) {
    return this.vehiculoRepo.findOne({
      where: { patente: ILike(patente), taller_id: tallerId },
      relations: ['cliente'],
    });
  }

  async create(tallerId: number, dto: CreateVehiculoDto) {
    const vehiculo = this.vehiculoRepo.create({
      ...dto,
      taller_id: tallerId,
    });
    return this.vehiculoRepo.save(vehiculo);
  }

  async update(id: number, tallerId: number, dto: UpdateVehiculoDto) {
    const vehiculo = await this.findOne(id, tallerId);
    Object.assign(vehiculo, dto);
    return this.vehiculoRepo.save(vehiculo);
  }

  async remove(id: number, tallerId: number) {
    const vehiculo = await this.findOne(id, tallerId);
    return this.vehiculoRepo.remove(vehiculo);
  }
}

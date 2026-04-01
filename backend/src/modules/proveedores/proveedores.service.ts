import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Proveedor } from '../../database/entities/proveedor.entity.js';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto.js';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly repo: Repository<Proveedor>,
  ) {}

  async findAll(tallerId: number, search?: string) {
    if (search) {
      return this.repo.find({
        where: [
          { taller_id: tallerId, razon_social: ILike(`%${search}%`) },
          { taller_id: tallerId, rut: ILike(`%${search}%`) },
        ],
        order: { razon_social: 'ASC' },
      });
    }
    return this.repo.find({
      where: { taller_id: tallerId },
      order: { razon_social: 'ASC' },
    });
  }

  async findOne(id: number, tallerId: number) {
    const p = await this.repo.findOne({ where: { id, taller_id: tallerId } });
    if (!p) throw new NotFoundException('Proveedor no encontrado');
    return p;
  }

  async create(tallerId: number, dto: CreateProveedorDto) {
    const proveedor = this.repo.create({ ...dto, taller_id: tallerId });
    return this.repo.save(proveedor);
  }

  async update(id: number, tallerId: number, dto: UpdateProveedorDto) {
    const proveedor = await this.findOne(id, tallerId);
    Object.assign(proveedor, dto);
    return this.repo.save(proveedor);
  }

  async remove(id: number, tallerId: number) {
    const proveedor = await this.findOne(id, tallerId);
    return this.repo.remove(proveedor);
  }
}

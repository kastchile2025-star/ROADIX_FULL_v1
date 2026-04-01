import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Cliente } from '../../database/entities/cliente.entity.js';
import { CreateClienteDto } from './dto/create-cliente.dto.js';
import { UpdateClienteDto } from './dto/update-cliente.dto.js';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
  ) {}

  async findAll(tallerId: number, search?: string) {
    const where: any = { taller_id: tallerId };
    if (search) {
      return this.clienteRepo.find({
        where: [
          { taller_id: tallerId, nombre: ILike(`%${search}%`) },
          { taller_id: tallerId, rut: ILike(`%${search}%`) },
          { taller_id: tallerId, email: ILike(`%${search}%`) },
        ],
        order: { nombre: 'ASC' },
      });
    }
    return this.clienteRepo.find({ where, order: { nombre: 'ASC' } });
  }

  async findOne(id: number, tallerId: number) {
    const cliente = await this.clienteRepo.findOne({
      where: { id, taller_id: tallerId },
      relations: ['vehiculos'],
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return cliente;
  }

  async create(tallerId: number, dto: CreateClienteDto) {
    const cliente = this.clienteRepo.create({ ...dto, taller_id: tallerId });
    return this.clienteRepo.save(cliente);
  }

  async update(id: number, tallerId: number, dto: UpdateClienteDto) {
    const cliente = await this.findOne(id, tallerId);
    Object.assign(cliente, dto);
    return this.clienteRepo.save(cliente);
  }

  async remove(id: number, tallerId: number) {
    const cliente = await this.findOne(id, tallerId);
    return this.clienteRepo.remove(cliente);
  }
}

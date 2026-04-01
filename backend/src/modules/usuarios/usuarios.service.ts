import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../database/entities/usuario.entity.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async findAll(tallerId: number) {
    return this.usuarioRepo.find({
      where: { taller_id: tallerId },
      select: ['id', 'nombre', 'email', 'rol', 'telefono', 'activo', 'created_at'],
    });
  }

  async findOne(id: number, tallerId: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id, taller_id: tallerId },
      select: ['id', 'nombre', 'email', 'rol', 'telefono', 'activo', 'avatar_url', 'created_at'],
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async create(tallerId: number, dto: CreateUsuarioDto) {
    const exists = await this.usuarioRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El email ya está registrado');

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const usuario = this.usuarioRepo.create({
      ...dto,
      password: hashedPassword,
      taller_id: tallerId,
    });
    const saved = await this.usuarioRepo.save(usuario);
    const { password, refresh_token, ...result } = saved;
    return result;
  }

  async update(id: number, tallerId: number, dto: UpdateUsuarioDto) {
    const usuario = await this.findOne(id, tallerId);
    Object.assign(usuario, dto);
    return this.usuarioRepo.save(usuario);
  }

  async remove(id: number, tallerId: number) {
    const usuario = await this.findOne(id, tallerId);
    usuario.activo = false;
    return this.usuarioRepo.save(usuario);
  }
}

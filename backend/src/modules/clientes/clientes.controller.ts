import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ClientesService } from './clientes.service.js';
import { CreateClienteDto } from './dto/create-cliente.dto.js';
import { UpdateClienteDto } from './dto/update-cliente.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../../common/enums.js';

@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA, UserRole.CAJERO, UserRole.VIEWER)
  findAll(
    @CurrentUser('taller_id') tallerId: number,
    @Query('search') search?: string,
  ) {
    return this.clientesService.findAll(tallerId, search);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA, UserRole.CAJERO, UserRole.VIEWER)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.clientesService.findOne(id, tallerId);
  }

  @Post()
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA)
  create(
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: CreateClienteDto,
  ) {
    return this.clientesService.create(tallerId, dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA)
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clientesService.update(id, tallerId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.clientesService.remove(id, tallerId);
  }
}

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
import { VehiculosService } from './vehiculos.service.js';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto.js';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PlanLimitGuard } from '../../common/guards/plan-limit.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { PlanLimit } from '../../common/decorators/plan-limit.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../../common/enums.js';

@Controller('vehiculos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Get()
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA, UserRole.VIEWER)
  findAll(
    @CurrentUser('taller_id') tallerId: number,
    @Query('search') search?: string,
  ) {
    return this.vehiculosService.findAll(tallerId, search);
  }

  @Get('buscar/:patente')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA)
  findByPatente(
    @Param('patente') patente: string,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.vehiculosService.findByPatente(patente, tallerId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA, UserRole.VIEWER)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.vehiculosService.findOne(id, tallerId);
  }

  @Post()
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA)
  @UseGuards(PlanLimitGuard)
  @PlanLimit('vehiculos')
  create(
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: CreateVehiculoDto,
  ) {
    return this.vehiculosService.create(tallerId, dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA)
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: UpdateVehiculoDto,
  ) {
    return this.vehiculosService.update(id, tallerId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.vehiculosService.remove(id, tallerId);
  }
}

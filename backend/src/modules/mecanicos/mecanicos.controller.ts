import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MecanicosService } from './mecanicos.service.js';
import { CreateMecanicoDto, UpdateMecanicoDto } from './dto/mecanico.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../../common/enums.js';

@Controller('mecanicos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MecanicosController {
  constructor(private readonly mecanicosService: MecanicosService) {}

  @Get()
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA, UserRole.VIEWER)
  findAll(@CurrentUser('taller_id') tallerId: number) {
    return this.mecanicosService.findAll(tallerId);
  }

  @Get('activos')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA)
  findActive(@CurrentUser('taller_id') tallerId: number) {
    return this.mecanicosService.findActive(tallerId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.mecanicosService.findOne(id, tallerId);
  }

  @Post()
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  create(
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: CreateMecanicoDto,
  ) {
    return this.mecanicosService.create(tallerId, dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: UpdateMecanicoDto,
  ) {
    return this.mecanicosService.update(id, tallerId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.mecanicosService.remove(id, tallerId);
  }
}

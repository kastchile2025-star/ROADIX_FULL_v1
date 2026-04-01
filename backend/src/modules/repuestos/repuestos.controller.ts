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
import { RepuestosService } from './repuestos.service.js';
import { CreateRepuestoDto, UpdateRepuestoDto } from './dto/repuesto.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../../common/enums.js';

@Controller('repuestos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RepuestosController {
  constructor(private readonly repuestosService: RepuestosService) {}

  @Get()
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.BODEGUERO, UserRole.RECEPCIONISTA, UserRole.VIEWER)
  findAll(
    @CurrentUser('taller_id') tallerId: number,
    @Query('search') search?: string,
    @Query('categoria') categoria?: string,
  ) {
    return this.repuestosService.findAll(tallerId, search, categoria);
  }

  @Get('stock-bajo')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.BODEGUERO)
  stockBajo(@CurrentUser('taller_id') tallerId: number) {
    return this.repuestosService.findStockBajo(tallerId);
  }

  @Get('categorias')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.BODEGUERO, UserRole.RECEPCIONISTA)
  categorias(@CurrentUser('taller_id') tallerId: number) {
    return this.repuestosService.getCategorias(tallerId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.BODEGUERO, UserRole.RECEPCIONISTA)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.repuestosService.findOne(id, tallerId);
  }

  @Post()
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.BODEGUERO)
  create(
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: CreateRepuestoDto,
  ) {
    return this.repuestosService.create(tallerId, dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.BODEGUERO)
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: UpdateRepuestoDto,
  ) {
    return this.repuestosService.update(id, tallerId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.repuestosService.remove(id, tallerId);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { InventarioService } from './inventario.service.js';
import { MovimientoStockDto } from './dto/movimiento-stock.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../../common/enums.js';

@Controller('inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Post('movimiento')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.BODEGUERO)
  registrarMovimiento(
    @Body() dto: MovimientoStockDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.inventarioService.registrarMovimiento(dto, userId, tallerId);
  }

  @Get('movimientos/:repuestoId')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.BODEGUERO)
  getMovimientos(
    @Param('repuestoId', ParseIntPipe) repuestoId: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.inventarioService.getMovimientos(repuestoId, tallerId);
  }

  @Get('movimientos')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.BODEGUERO, UserRole.VIEWER)
  getMovimientosRecientes(@CurrentUser('taller_id') tallerId: number) {
    return this.inventarioService.getMovimientosRecientes(tallerId);
  }
}

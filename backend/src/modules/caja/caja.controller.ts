import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CajaService } from './caja.service.js';
import { RegistrarPagoDto } from './dto/caja.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../../common/enums.js';

@Controller('caja')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  @Post('cobrar')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.CAJERO, UserRole.RECEPCIONISTA)
  cobrar(
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: RegistrarPagoDto,
  ) {
    return this.cajaService.registrarPago(tallerId, dto);
  }

  @Get('movimientos')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.CAJERO, UserRole.VIEWER)
  movimientos(
    @CurrentUser('taller_id') tallerId: number,
    @Query('fecha') fecha?: string,
  ) {
    return this.cajaService.getMovimientosDia(tallerId, fecha);
  }

  @Get('cierre-diario')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.CAJERO)
  cierreDiario(
    @CurrentUser('taller_id') tallerId: number,
    @Query('fecha') fecha?: string,
  ) {
    return this.cajaService.getCierreDiario(tallerId, fecha);
  }
}

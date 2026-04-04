import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SuscripcionesService } from './suscripciones.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../../common/enums.js';
import { CambiarPlanDto } from './dto/cambiar-plan.dto.js';
import { EnterpriseContactDto } from './dto/enterprise-contact.dto.js';

@Controller('suscripciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuscripcionesController {
  constructor(private readonly suscripcionesService: SuscripcionesService) {}

  @Get('mi-suscripcion')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  findMySuscripcion(@CurrentUser('taller_id') tallerId: number) {
    return this.suscripcionesService.findByTaller(tallerId);
  }

  @Get('uso')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  getUsage(@CurrentUser('taller_id') tallerId: number) {
    return this.suscripcionesService.getUsage(tallerId);
  }

  @Get('historial-pagos')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  getHistorialPagos(@CurrentUser('taller_id') tallerId: number) {
    return this.suscripcionesService.getHistorialPagos(tallerId);
  }

  @Post('cambiar-plan')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  cambiarPlan(
    @CurrentUser('taller_id') tallerId: number,
    @CurrentUser('email') billingEmail: string,
    @Body() dto: CambiarPlanDto,
  ) {
    return this.suscripcionesService.cambiarPlan(tallerId, dto, billingEmail);
  }

  @Post('cancelar')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  cancelar(@CurrentUser('taller_id') tallerId: number) {
    return this.suscripcionesService.cancelar(tallerId);
  }

  @Post('enterprise-contact')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  solicitarContactoEnterprise(
    @CurrentUser('taller_id') tallerId: number,
    @CurrentUser('email') email: string,
    @Body() dto: EnterpriseContactDto,
  ) {
    return this.suscripcionesService.solicitarContactoEnterprise(tallerId, dto, email);
  }

  @Post('reactivar')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  reactivar(@CurrentUser('taller_id') tallerId: number) {
    return this.suscripcionesService.reactivar(tallerId);
  }

  @Put('editar')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  editar(
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: { periodo?: string; fecha_fin?: string },
  ) {
    return this.suscripcionesService.editarSuscripcion(tallerId, dto);
  }

  // ── Superadmin: global management ──

  @Get('admin/talleres')
  @Roles(UserRole.SUPERADMIN)
  getAllTalleres() {
    return this.suscripcionesService.getAllTalleresAdmin();
  }

  @Put('admin/suscripcion/:tallerId')
  @Roles(UserRole.SUPERADMIN)
  editarSuscripcionAdmin(
    @Param('tallerId', ParseIntPipe) tallerId: number,
    @Body() dto: { periodo?: string; fecha_fin?: string; estado?: string; plan_id?: number },
  ) {
    return this.suscripcionesService.editarSuscripcionAdmin(tallerId, dto);
  }
}
